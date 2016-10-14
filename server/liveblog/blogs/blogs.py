#!/usr/bin/env python
# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.notification import push_notification
from superdesk.utc import utcnow
from superdesk.services import BaseService
from liveblog.common import get_user, update_dates_for
from superdesk.metadata.item import metadata_schema
from superdesk.celery_app import celery
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.activity import add_activity
from flask import current_app as app, render_template
from superdesk.emails import send_email
import liveblog.embed
from bson.objectid import ObjectId
import superdesk
from superdesk.users.services import is_admin
from superdesk.errors import SuperdeskApiError
import logging


logger = logging.getLogger('superdesk')

blogs_schema = {
    'title': metadata_schema['headline'],
    'description': metadata_schema['description_text'],
    'picture_url': {
        'type': 'string',
        'nullable': True
    },
    'picture': Resource.rel('archive', embeddable=True, nullable=True, type='string'),
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'versioncreated': metadata_schema['versioncreated'],
    'posts_order_sequence': {
        'type': 'float',
        'default': 0.00
    },
    'blog_status': {
        'type': 'string',
        'allowed': ['open', 'closed'],
        'default': 'open'
    },
    'members': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'user': Resource.rel('users', True)
            }
        }
    },
    'blog_preferences': {
        'type': 'dict'
    },
    'theme_settings': {
        'type': 'dict'
    },
    'public_url': {
        'type': 'string'
    },
    'syndication_enabled': {
        'type': 'boolean',
        'default': False
    }
}


class BlogsResource(Resource):
    datasource = {
        'source': 'blogs',
        'search_backend': 'elastic',
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'blogs', 'PATCH': 'blogs', 'PUT': 'blogs', 'DELETE': 'blogs'}

    schema = blogs_schema


def notify_members(blog, origin, recipients):
    add_activity('notify', 'you have been added as a member', resource=None, item=blog, notify=recipients)
    send_email_to_added_members(blog, recipients, origin)


def send_email_to_added_members(blog, recipients, origin):
    prefs_service = get_resource_service('preferences')
    recipients_email = []
    for user in recipients:
        # if user want to receive email notification, we add him as recipient
        if prefs_service.email_notification_is_enabled(user_id=user):
            if isinstance(user, ObjectId):
                user_doc = get_resource_service('users').find_one(req=None, _id=ObjectId(user))
            else:
                user_doc = get_resource_service('users').find_one(req=None, _id=ObjectId(user['user']))
            recipients_email.append(user_doc['email'])
    if recipients_email:
        # send emails
        url = '{}/#/liveblog/edit/{}'.format(origin, blog['_id'])
        title = blog['title']
        admins = app.config['ADMINS']
        app_name = app.config['APPLICATION_NAME']
        subject = render_template("invited_members_subject.txt", app_name=app_name)
        text_body = render_template("invited_members.txt", app_name=app_name, link=url, title=title)
        html_body = render_template("invited_members.html", app_name=app_name, link=url, title=title)
        send_email.delay(subject=subject, sender=admins[0], recipients=recipients_email,
                         text_body=text_body, html_body=html_body)


@celery.task(soft_time_limit=1800)
def publish_blog_embed_on_s3(blog_id, safe=True):
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if blog['blog_preferences'].get('theme', False):
        try:
            public_url = liveblog.embed.publish_embed(blog_id, '//%s/' % (app.config['SERVER_NAME']))
            get_resource_service('blogs').system_update(blog['_id'], {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=str(blog.get('_id')), public_url=public_url)
            return public_url
        except liveblog.embed.MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e

            public_url = '{}://{}/embed/{}'.format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'],
                                                   blog.get('_id'))
            get_resource_service('blogs').system_update(blog['_id'], {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=str(blog.get('_id')), public_url=public_url)
            return public_url


@celery.task(soft_time_limit=1800)
def delete_blog_embed_on_s3(blog_id, safe=True):
        try:
            liveblog.embed.delete_embed(blog_id)
        except liveblog.embed.MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e


class BlogService(BaseService):
    notification_key = 'blog'

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            # set the blog_preferences by merging given preferences with global_prefs
            global_prefs = get_resource_service('global_preferences').get_global_prefs()
            prefs = global_prefs.copy()
            prefs.update(doc.get('blog_preferences', {}))
            doc['blog_preferences'] = prefs
            # find the theme that is assigned to the blog
            my_theme = get_resource_service('themes').find_one(req=None, name=doc['blog_preferences']['theme'])
            # retrieve the default settings of the theme
            default_theme_settings = get_resource_service('themes').get_default_settings(my_theme)
            # save the theme settings on the blog level
            doc['theme_settings'] = default_theme_settings

    def on_created(self, docs):
        for blog in docs:
            # Publish on s3 if possible and save the public_url in the blog
            publish_blog_embed_on_s3.delay(str(blog['_id']))
            # notify client with websocket
            push_notification(self.notification_key, created=1, blog_id=str(blog.get('_id')))
            # and members with emails
            members = blog.get('members', {})
            recipients = []
            for user in members:
                if isinstance(user, ObjectId):
                    recipients.append(user)
                else:
                    recipients.append(user['user'])
            notify_members(blog, app.config['CLIENT_URL'], recipients)

    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        # check if the current user has permission to open a blog
        if not is_admin(get_user()):
            # get members ids
            members = [str(m['user']) for m in doc.get('members', [])]
            # add owner id to members
            members.append(doc.get('original_creator'))
            # check if current user belongs to members, and raise an exeption if not
            if str(get_user().get('_id')) not in members:
                roles = get_resource_service('roles').find_one(req=None, _id=get_user().get('role'))
                if not roles:
                    raise SuperdeskApiError.forbiddenError(message='you do not have permission to open this blog')
        return doc

    def on_update(self, updates, original):
        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(get_user().get('_id'))

    def on_updated(self, updates, original):
        publish_blog_embed_on_s3.delay(str(original['_id']))
        # invalidate cache for updated blog
        app.blog_cache.invalidate(original.get('_id'))
        # send notifications
        push_notification('blogs', updated=1)
        # notify newly added members
        blog = original.copy()
        blog.update(updates)
        members = updates.get('members', {})
        recipients = []
        for user in members:
            if user not in original.get('members', []):
                if isinstance(user, ObjectId):
                    recipients.append(user)
                else:
                    recipients.append(user['user'])
        notify_members(blog, app.config['CLIENT_URL'], recipients)

    def on_delete(self, doc):
        delete_blog_embed_on_s3.delay(doc.get('_id'))

    def on_deleted(self, doc):
        # invalidate cache for updated blog
        app.blog_cache.invalidate(doc.get('_id'))
        # send notifications
        push_notification('blogs', deleted=1)


class UserBlogsResource(Resource):
    url = 'users/<regex("[a-f0-9]{24}"):user_id>/blogs'
    schema = blogs_schema
    datasource = {
        'source': 'blogs',
        'default_sort': [('title', 1)]
    }
    resource_methods = ['GET']


class UserBlogsService(BaseService):
    def get(self, req, lookup):
        if lookup.get('user_id'):
            lookup['members.user'] = ObjectId(lookup['user_id'])
            del lookup['user_id']
        return super().get(req, lookup)


class PublishBlogsCommand(superdesk.Command):
    """
    Republish blogs on s3 with the right theme
    """

    def run(self):
        # retrieves all opened blogs
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup=dict(blog_status='open'))
        # republish on s3
        print('\n* Republishing blogs:\n')
        for blog in blogs:
            url = publish_blog_embed_on_s3(blog_id=str(blog['_id']), safe=False)
            print('  - Blog "%s" republished: %s' % (blog['title'], url))

superdesk.command('publish_blogs', PublishBlogsCommand())

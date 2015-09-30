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
from apps.content import metadata_schema
from superdesk.celery_app import celery
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.activity import add_activity
from flask.globals import g
from flask import current_app as app, render_template
from superdesk.emails import send_email
import liveblog.embed
from bson.objectid import ObjectId
import superdesk
import eve.io.base

blogs_schema = {
    'title': metadata_schema['headline'],
    'description': metadata_schema['description'],
    'theme': {
        'type': 'dict'
    },
    'picture_url': {
        'type': 'string',
        'nullable': True
    },
    'picture': Resource.rel('upload', embeddable=True, nullable=True),
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'versioncreated': metadata_schema['versioncreated'],
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
    'public_url': {
        'type': 'string'
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


def notify_members(docs, origin):
    for doc in docs:
        members = doc.get('members', {})
        add_activity('notify', 'you have been added as a member', resource=None, item=doc, notify=members)
        send_email_to_added_members(doc, members, origin)


def send_email_to_added_members(doc, members, origin):
    prefs_service = get_resource_service('preferences')
    recipients = []
    for user in members:
        send_email = prefs_service.email_notification_is_enabled(user_id=user['user'])
        if send_email:
            user_doc = get_resource_service('users').find_one(req=None, _id=user['user'])
            recipients.append(user_doc['email'])
    if recipients:
        username = g.user.get('display_name') or g.user.get('username')
        url = '{}/#/liveblog/edit/{}'.format(origin, doc['_id'])
        title = doc['title']
        send_members_email(recipients, username, doc, title, url)


def send_members_email(recipients, user_name, doc, title, url):
    admins = app.config['ADMINS']
    app_name = app.config['APPLICATION_NAME']
    subject = render_template("invited_members_subject.txt", app_name=app_name)
    text_body = render_template("invited_members.txt", link=url, title=title)
    html_body = render_template("invited_members.html", link=url, title=title)
    send_email.delay(subject=subject, sender=admins[0], recipients=recipients,
                     text_body=text_body, html_body=html_body)


@celery.task(soft_time_limit=1800)
def publish_blog_embed_on_s3(blog_id, safe=True):
    blog = get_resource_service('blogs').find_one(req=None, _id=blog_id)
    if blog.get('theme', False):
        try:
            public_url = liveblog.embed.publish_embed(blog_id, '//%s/' % (app.config['SERVER_NAME']))
            get_resource_service('blogs').system_update(blog['_id'], {'public_url': public_url}, blog)
            return public_url
        except liveblog.embed.MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e


class BlogService(BaseService):
    notification_key = 'blog'

    def get_theme_snapshot(self, theme_name):
        theme = get_resource_service('themes').find_one(req=None, name=theme_name)
        if theme is not None:
            theme['_id'] = str(theme['_id'])
        return theme

    def on_create(self, docs):
        for doc in docs:
            update_dates_for(doc)
            doc['original_creator'] = str(get_user().get('_id'))
            # set the blog_preferences by merging given preferences with global_prefs
            global_prefs = get_resource_service('global_preferences').get_global_prefs()
            prefs = global_prefs.copy()
            prefs.update(doc.get('blog_preferences', {}))
            doc['blog_preferences'] = prefs
            # save a snapshot of the theme in the `theme` field
            if 'theme' in prefs:
                doc['theme'] = self.get_theme_snapshot(prefs['theme'])

    def on_created(self, docs):
        # Publish on s3 if possible and save the public_url in the blog
        for blog in docs:
            publish_blog_embed_on_s3.delay(str(blog['_id']))
        # notify client with websocket
        for doc in docs:
            push_notification(self.notification_key, created=1, blog_id=str(doc.get('_id')))
        # and members with emails
        notify_members(docs, app.config['CLIENT_URL'])

    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        return doc

    def on_update(self, updates, original):
        # if the theme changed, we republish the blog with the new one
        if 'blog_preferences' in updates and 'theme' in updates['blog_preferences']:
            if updates['blog_preferences']['theme'] != original['blog_preferences'].get('theme'):
                new_theme = self.get_theme_snapshot(updates['blog_preferences']['theme'])
                if new_theme:
                    if 'theme' in original:
                        updates['theme'] = original.get('theme')
                        for key in original['theme'].keys():
                            if key not in new_theme:
                                # remove fields that are not in new_theme
                                updates['theme'][key] = None
                        for key, value in new_theme.items():
                            # add or update fields that are new
                            updates['theme'][key] = value
                    else:
                        updates['theme'] = new_theme

        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(get_user().get('_id'))

    def on_updated(self, updates, original):
        publish_blog_embed_on_s3.delay(str(original['_id']))
        # invalidate cache for updated blog
        app.blog_cache.invalidate(original.get('_id'))
        # send notifications
        push_notification('blogs', updated=1)

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


class UpdateThemesBlogsCommand(superdesk.Command):
    """
    Update the themes from local files in database, set the new value to blogs and
    republish theme on s3 if --republish is given.
    """
    option_list = [
        superdesk.Option('--republish', dest='republish', action='store_true',
                         default=False, help='Republish the blog on S3')
    ]

    def run(self, republish):
        # update themes
        theme_service = get_resource_service('themes')
        created, updated = theme_service.update_registered_theme_with_local_files()
        print('\n* %d themes updated from local files\n' % (len(created) + len(updated)))
        # retrieves all opened blogs
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup=dict(blog_status='open'))
        print('* Update the theme for every blog\n')
        for blog in blogs:
            theme = blogs_service.get_theme_snapshot(blog['blog_preferences']['theme'])
            try:
                blogs_service.system_update(ObjectId(blog['_id']), {'theme': theme}, blog)
            except eve.io.base.DataLayer.OriginalChangedError:
                print(u'! an error occured during saving blog "%s".' % (blog['title']),
                      'Can be a broken relationship (with user for instance)')
            else:
                print('- Blog "%s"\'s theme was updated to %s %s' % (
                    blog['title'], theme['name'], theme['version']))
        # republish on s3
        if republish:
            print('\n* Republishing blogs:\n')
            for blog in blogs:
                url = publish_blog_embed_on_s3(blog_id=str(blog['_id']), safe=False)
                print('  - Blog "%s" republished: %s' % (blog['title'], url))


superdesk.command('update_blogs_themes', UpdateThemesBlogsCommand())

# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.resource import Resource
from liveblog.common import get_user
import logging
from superdesk.activity import add_activity
from superdesk import get_resource_service
from flask import g
from flask import current_app as app, render_template
from superdesk.emails import send_email
from liveblog.blogs.blogs import BlogService
from bson.objectid import ObjectId
from superdesk.notification import push_notification

logger = logging.getLogger('superdesk')


def notify_the_owner(doc, origin):
    if not get_user():
        logger.info('there is no logged in user so no membership is allowed')
    else:
        for d in doc:
            owner = d.get('original_creator')
            add_activity('notify', 'one user requested liveblog membership', resource=None, item=d, notify=owner)
            send_email_to_owner(d, owner, origin)


def send_email_to_owner(doc, owner, origin):
    l = doc.get('_links').get('self').get('href')
    parts = l.split('/')
    blog = get_resource_service('blogs').find_one(req=None, _id=parts[1])
    prefs_service = get_resource_service('preferences')
    send_email = prefs_service.email_notification_is_enabled(user_id=doc['original_creator'])
    if send_email:
            user_doc = get_resource_service('users').find_one(req=None, _id=doc['original_creator'])
            recipients = user_doc['email']
    if recipients:
        username = g.user.get('display_name') or g.user.get('username')
        url = '{}/#/liveblog/settings/{}'.format(origin, doc['_id'])
        title = blog['title']
        send_owner_email(recipients, username, doc, title, url)


def send_owner_email(recipients, user_name, doc, title, url):
    admins = app.config['ADMINS']
    app_name = app.config['APPLICATION_NAME']
    subject = render_template("owner_email_subject.txt", app_name=app_name)
    text_body = render_template("owner_request.txt", app_name=app_name, link=url, name_of_user=user_name, title=title)
    html_body = render_template("owner_request.html", app_name=app_name, link=url, name_of_user=user_name, title=title)
    send_email.delay(subject=subject, sender=admins[0], recipients=recipients,
                     text_body=text_body, html_body=html_body)

request_schema = {
    'original_creator': Resource.rel('users', True),
    'blog': Resource.rel('blogs', True),
    'message': {
        'type': 'string'
    }
}


class MembershipResource(Resource):
    url = 'blogs/<regex("[a-f0-9]{24}"):blog_id>/request_membership'
    schema = request_schema
    datasource = {
        'source': 'request_membership',
        'default_sort': [('_updated', -1)]
    }
    resource_methods = ['GET', 'POST']
    privileges = {'GET': 'blogs', 'POST': 'blogs'}


class MembershipService(BlogService):
    notification_key = 'request'

    def on_create(self, docs):
        for doc in docs:
            doc['message'] = "Please add me as a contributor to your blog"
        super().on_create(docs)

    def on_created(self, docs):
        for doc in docs:
            push_notification(self.notification_key, created=1, request_id=str(doc.get('_id')))
        # and members with emails
        notify_the_owner(docs, app.config['CLIENT_URL'])

    def get(self, req, lookup):
        if lookup.get('blog_id'):
            lookup['blog'] = ObjectId(lookup['blog_id'])
            del lookup['blog_id']
        docs = super().get(req, lookup)
        return docs

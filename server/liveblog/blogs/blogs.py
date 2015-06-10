from superdesk.notification import push_notification
from superdesk.utc import utcnow
from eve.utils import ParsedRequest
from apps.archive.archive import ArchiveResource, ArchiveService
from superdesk.services import BaseService
from apps.archive.archive import ArchiveVersionsResource
from liveblog.common import get_user, update_dates_for
from apps.content import metadata_schema
from apps.archive.common import generate_guid, GUID_TAG
from superdesk import get_resource_service
from superdesk.resource import Resource
from bson.objectid import ObjectId
from superdesk.activity import add_activity
from settings import CLIENT_URL
from flask.globals import g
from flask import current_app as app, render_template
from superdesk.emails import send_email


blogs_schema = {
    'guid': metadata_schema['guid'],
    'title': metadata_schema['headline'],
    'description': metadata_schema['description'],
    'theme': {
        'type': 'dict'
    },
    'settings': {'type': 'dict'},
    'picture_url': {
        'type': 'string',
    },
    'picture': Resource.rel('upload', True),
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'versioncreated': metadata_schema['versioncreated'],
    'blog_status': {
        'type': 'string',
        'allowed': ['open', 'closed'],
        'default': 'open'
    },
    'particular_type': {
        'type': 'string',
        'allowed': ['blog'],
        'default': 'blog'
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
    }
}


class BlogsVersionsResource(ArchiveVersionsResource):
    """
    Resource class for versions of archive_media
    """

    datasource = {
        'source': 'archive' + '_versions',
        'filter': {'type': 'composite'}
    }


class BlogsVersionsService(BaseService):
    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('archive_versions', req=req, lookup=lookup)


class BlogsResource(ArchiveResource):
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}

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
        url = 'archive/<{0}:blog_id>'.format(origin, doc['_id'])
        send_members_email(recipients, username, doc, url)


def send_members_email(recipients, user_name, doc, url):
    print('sending notification email to:', recipients)
    admins = app.config['ADMINS']
    app_name = app.config['APPLICATION_NAME']
    subject = render_template("invited_members_subject.txt", username=user_name)
    text_body = render_template("invited_members.txt", username=user_name, app_name=app_name)
    html_body = render_template("invited_members.html", username=user_name, app_name=app_name)
    send_email.delay(subject=subject, sender=admins[0], recipients=recipients,
                     text_body=text_body, html_body=html_body)


class BlogService(ArchiveService):
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
            doc['guid'] = generate_guid(type=GUID_TAG)
            # set the blog_preferences by merging given preferences with global_prefs
            global_prefs = get_resource_service('global_preferences').get_global_prefs()
            prefs = global_prefs.copy()
            prefs.update(doc.get('blog_preferences', {}))
            doc['blog_preferences'] = prefs
            # save a snapshot of the theme in the `theme` field
            if 'theme' in prefs:
                doc['theme'] = self.get_theme_snapshot(prefs['theme'])

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def find_one(self, req, **lookup):
        doc = super().find_one(req, **lookup)
        return doc

    def on_created(self, docs):
        for doc in docs:
            push_notification(self.notification_key, created=1, blog_id=str(doc.get('_id')))

        notify_members(docs, CLIENT_URL)

    def on_update(self, updates, original):
        # if the theme changed, we republish the blog with the new one
        if 'blog_preferences' in updates and 'theme' in updates['blog_preferences']:
            if updates['blog_preferences']['theme'] != original['blog_preferences'].get('theme'):
                updates['theme'] = original.get('theme')
                new_theme = self.get_theme_snapshot(updates['blog_preferences']['theme'])
                if new_theme:
                    for key in original['theme'].keys():
                        if key not in new_theme:
                            # remove fields that are not in new_theme
                            updates['theme'][key] = None
                    for key, value in new_theme.items():
                        # add or update fields that are new
                        updates['theme'][key] = value

        updates['versioncreated'] = utcnow()
        updates['version_creator'] = str(get_user().get('_id'))

    def on_updated(self, updates, original):
        push_notification('blogs', updated=1)

    def on_deleted(self, doc):
        push_notification('blogs', deleted=1)


class UserBlogsResource(Resource):
    url = 'users/<regex("[a-f0-9]{24}"):user_id>/blogs'
    schema = blogs_schema
    datasource = {
        'source': 'archive',
        'elastic_filter': {'term': {'particular_type': 'blog'}},
        'default_sort': [('title', 1)]
    }

    resource_methods = ['GET']


class UserBlogsService(BaseService):
    def get(self, req, lookup):
        if lookup.get('user_id'):
            lookup['members.user'] = ObjectId(lookup['user_id'])
            del lookup['user_id']
        return super().get(req, lookup)

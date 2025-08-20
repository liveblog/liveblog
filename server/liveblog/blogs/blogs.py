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

import logging
import datetime

from bson.objectid import ObjectId
from flask import current_app as app
from flask import render_template
from superdesk import get_resource_service
from superdesk.activity import add_activity
from superdesk.emails import send_email
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.users.services import is_admin
from superdesk.utc import utcnow
from liveblog.syndication.exceptions import ProducerAPIError

from liveblog.core.constants import GENERAL_JSON_LD_TIMEZONE_OFFSET
from liveblog.common import get_user, update_dates_for
from settings import (
    DAYS_REMOVE_DELETED_BLOGS,
    TRIGGER_HOOK_URLS,
)

from .schema import blogs_schema
from .utils import can_delete_blog
from .tasks import (
    delete_blog_embeds_on_s3,
    publish_blog_embed_on_s3,
    publish_blog_embeds_on_s3,
    post_auto_output_creation,
)

from liveblog.utils.hooks import trigger_hooks, build_hook_data, events

logger = logging.getLogger("superdesk")


class BlogsResource(Resource):
    datasource = {
        "source": "blogs",
        "search_backend": "elastic",
        "default_sort": [("_updated", -1)],
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {"POST": "blogs", "PATCH": "blogs", "PUT": "blogs", "DELETE": "blogs"}

    schema = blogs_schema


def notify_members(blog, blog_url, recipients):
    add_activity(
        "liveblog:add",
        "you have been added as a member",
        resource=None,
        item=blog,
        item_slugline=blog.get("title"),
        notify=recipients,
    )
    send_email_to_added_members(blog, recipients, blog_url)


def send_email_to_added_members(blog, recipients, blog_url):
    prefs_service = get_resource_service("preferences")
    recipients_email = []
    for user in recipients:
        # If user want to receive email notification, we add him as recipient.
        if prefs_service.email_notification_is_enabled(user_id=user):
            user_id = user if isinstance(user, ObjectId) else user["user"]
            user_doc = get_resource_service("users").find_one(
                req=None, _id=ObjectId(user_id)
            )
            recipients_email.append(user_doc["email"])

    if recipients_email:
        title = blog["title"]
        admins = app.config["ADMINS"]
        app_name = app.config["APPLICATION_NAME"]
        subject = render_template("invited_members_subject.txt", app_name=app_name)
        text_body = render_template(
            "invited_members.txt", app_name=app_name, link=blog_url, title=title
        )
        html_body = render_template(
            "invited_members.html", app_name=app_name, link=blog_url, title=title
        )

        if not app.config.get("SUPERDESK_TESTING", False):
            send_email.delay(
                subject=subject,
                sender=admins[0],
                recipients=recipients_email,
                text_body=text_body,
                html_body=html_body,
            )


class BlogService(BaseService):
    notification_key = "blog"

    def _update_theme_settings(self, doc, theme_name):
        theme = get_resource_service("themes").find_one(req=None, name=theme_name)
        if theme:
            # retrieve the default settings of the theme
            default_theme_settings = get_resource_service(
                "themes"
            ).get_default_settings(theme)
            # save the theme settings on the blog level
            doc["theme_settings"] = default_theme_settings

    def on_create(self, docs):
        self._check_max_active(len(docs))
        for doc in docs:
            update_dates_for(doc)
            doc["original_creator"] = str(get_user().get("_id"))

            # Set the blog_preferences by merging given preferences with global_prefs.
            global_prefs = get_resource_service("global_preferences").get_global_prefs()
            preferences = global_prefs.copy()
            preferences.update(doc.get("blog_preferences", {}))

            doc["blog_preferences"] = preferences

            # find the theme that is assigned to the blog
            theme_name = doc["blog_preferences"].get("theme")
            if theme_name:
                self._update_theme_settings(doc, theme_name)

            embed_height_key = "embed_height_responsive_default"
            if embed_height_key not in preferences:
                doc["blog_preferences"][embed_height_key] = True

            # If "start_date" is set to None, change the value to utcnow().
            if doc["start_date"] is None:
                doc["start_date"] = utcnow()

            # Set blog JSON-LD timezone offset based on initial global_preferences
            doc["json_ld_timezone_offset"] = global_prefs.get(
                GENERAL_JSON_LD_TIMEZONE_OFFSET, 0
            )

    def on_created(self, docs):
        for blog in docs:
            blog_id = str(blog["_id"])
            # Publish on s3 if possible and save the public_url in the blog.
            publish_blog_embed_on_s3.apply_async(args=[blog], countdown=2)
            # Notify client with websocket.
            push_notification(self.notification_key, created=1, blog_id=blog_id)
            # And with member emails
            members = blog.get("members", {})
            recipients = []
            for user in members:
                if isinstance(user, ObjectId):
                    recipients.append(user)
                else:
                    recipients.append(user["user"])
            self._auto_create_output(blog)
            blog_url = self._blog_url(blog["_id"])
            notify_members(blog, blog_url, recipients)

            # trigger hooks if there are any hook configured
            if TRIGGER_HOOK_URLS:
                author = get_resource_service("users").find_one(
                    req=None, _id=ObjectId(blog["original_creator"])
                )
                hook_data = build_hook_data(
                    events.BLOG_CREATED,
                    blog_url=blog_url,
                    user_email=author.get("email", ""),
                )
                trigger_hooks(hook_data)

    def find_one(self, req, checkUser=True, **lookup):
        doc = super().find_one(req, **lookup)
        # check if the current user has permission to open a blog
        if checkUser and not is_admin(get_user()):
            # get members ids
            members = [str(m["user"]) for m in doc.get("members", [])]
            # add owner id to members
            members.append(doc.get("original_creator"))
            # check if current user belongs to members, and raise an exeption if not
            if str(get_user().get("_id")) not in members:
                roles = get_resource_service("roles").find_one(
                    req=None, _id=get_user().get("role")
                )
                if not roles:
                    raise SuperdeskApiError.forbiddenError(
                        message="you do not have permission to open this blog"
                    )
        return doc

    def on_update(self, updates, original):
        blog_status = updates.get("blog_status")
        if blog_status == "open" and original["blog_status"] == "closed":
            self._check_max_active(1)

        updates["versioncreated"] = utcnow()
        updates["version_creator"] = str(get_user().get("_id"))
        syndication_enabled = updates.get("syndication_enabled")
        out = get_resource_service("syndication_out").find({"blog_id": original["_id"]})

        if syndication_enabled is False and out.count():
            raise SuperdeskApiError.forbiddenError(
                message="Cannot disable syndication: blog has active consumers."
            )

        # If archiving a blog, remove any syndication in records
        if blog_status == "closed":
            self.stop_blog_syndication(original["_id"])
            self.make_embed_unavailable_if_needed(original)

        # we mark the time to later remove it with celery beat if status is deleted
        # use this below for local devel purposes
        # remove_not_before = utcnow() + datetime.timedelta(seconds=DAYS_REMOVE_DELETED_BLOGS)
        remove_not_before = utcnow() + datetime.timedelta(
            days=DAYS_REMOVE_DELETED_BLOGS
        )
        updates["delete_not_before"] = (
            remove_not_before if blog_status == "deleted" else None
        )

        # If missing, set "start_date" to original post "_created" value.
        if not updates.get("start_date") and original["start_date"] is None:
            updates["start_date"] = original["_created"]

        if "blog_preferences" in updates:
            theme_name = updates["blog_preferences"].get("theme")
            if theme_name:
                self._update_theme_settings(updates, theme_name)

    def on_updated(self, updates, original):
        original_id = str(original["_id"])
        # Invalidate cache for updated blog.
        app.blog_cache.invalidate(original_id)
        # Send notifications,
        push_notification("blogs", updated=1)
        # Notify newly added members.
        blog = original.copy()
        blog.update(updates)

        if "blog_preferences" in updates:
            # Update blog embed
            theme_name = updates["blog_preferences"].get("theme")
            if theme_name:
                publish_blog_embeds_on_s3.apply_async(
                    args=[blog], kwargs={"save": True}, countdown=2
                )

        members = updates.get("members", {})
        recipients = []
        for user in members:
            if user not in original.get("members", []):
                if isinstance(user, ObjectId):
                    recipients.append(user)
                else:
                    recipients.append(user["user"])

        url = self._blog_url(blog["_id"])
        notify_members(blog, url, recipients)

    def on_delete(self, doc):
        # Prevent delete of blog if blog has consumers
        if not can_delete_blog(doc):
            raise SuperdeskApiError.forbiddenError(
                message="Cannot delete syndication: blog has active consumers."
            )

        blog = get_resource_service("client_blogs").find_one(req=None, _id=doc["_id"])
        delete_blog_embeds_on_s3.apply_async(args=[blog], countdown=2)

    def on_deleted(self, doc):
        # Invalidate cache for updated blog.
        blog_id = str(doc["_id"])
        app.blog_cache.invalidate(blog_id)

        # Remove syndication on blog post delete.
        syndication_out = get_resource_service("syndication_out")
        lookup = {"blog_id": blog_id}
        syndication_out.delete_action(lookup)

        self.stop_blog_syndication(blog_id)

        # Send notifications.
        push_notification("blogs", deleted=1)

    def _blog_url(self, blog_id):
        return "{}/#/liveblog/edit/{}".format(app.config["CLIENT_URL"], blog_id)

    def _check_max_active(self, increment):
        active = self.find({"blog_status": "open"})
        current_blogs = active.count() + increment

        if app.features.is_limit_reached("blogs", current_blogs):
            raise SuperdeskApiError.forbiddenError(
                message="Cannot add another active blog."
            )

    def make_embed_unavailable_if_needed(self, blog):
        """
        Triggers the publishing of the blog's embed which will render an 'not available'
        message if the subscription plan is limited and the blog is archived or deleted.
        """
        if app.config.get("SUPERDESK_TESTING"):
            return

        if not app.features.is_enabled("archived_blogs_available"):
            publish_blog_embeds_on_s3.apply_async(args=[blog], countdown=2)

    def stop_blog_syndication(self, blog_id):
        """
        Stop syndication when archiving or deleting a blog
        """

        syndication_in_service = get_resource_service("syndication_in")
        syndication_ins = syndication_in_service.find({"blog_id": blog_id})
        producers = get_resource_service("producers")
        for syndication_in in syndication_ins:
            producer_id = syndication_in["producer_id"]
            producer_blog_id = syndication_in["producer_blog_id"]
            try:
                response = producers.unsyndicate(
                    producer_id,
                    producer_blog_id,
                    syndication_in["blog_id"],
                    json_loads=False,
                )
            except ProducerAPIError:
                logger.warning(
                    'Producer "{}" responded with error when deleting syndication blog "{}"'.format(
                        producer_id, producer_blog_id
                    )
                )

            if response.status_code != 204:
                logger.warning(
                    'Producer "{}" responded with code "{}" when deleting blog "{}"'.format(
                        producer_id, response.status_code, producer_blog_id
                    )
                )
            else:
                syndication_in_service.delete_action(
                    lookup={"_id": syndication_in["_id"]}
                )

    def _auto_create_output(self, blog):
        # Create output channel automatically
        blog_theme = blog.get("theme_settings")
        if blog_theme and blog_theme.get("outputChannel"):
            output_name = blog_theme.get("outputChannelName", "Default output")
            output_data = [
                {
                    "name": output_name,
                    "blog": ObjectId(str(blog["_id"])),
                    "theme": blog_theme.get("outputChannelTheme", "amp"),
                }
            ]

            post_auto_output_creation.apply_async(args=[output_data], countdown=3)


class UserBlogsResource(Resource):
    url = 'users/<regex("[a-f0-9]{24}"):user_id>/blogs'
    schema = blogs_schema
    datasource = {"source": "blogs", "default_sort": [("title", 1)]}
    resource_methods = ["GET"]


class UserBlogsService(BaseService):
    def get(self, req, lookup):
        if lookup.get("user_id"):
            lookup["members.user"] = ObjectId(lookup["user_id"])
            del lookup["user_id"]
        return super().get(req, lookup)

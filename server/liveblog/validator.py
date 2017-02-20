import urllib.parse

from flask import current_app as app
from liveblog.syndication.exceptions import APIConnectionError
from liveblog.syndication.utils import send_api_request, trailing_slash, validate_secure_url
from superdesk.validator import SuperdeskValidator


class LiveblogValidator(SuperdeskValidator):
    def _validate_maxmembers(self, meta, field, value):
        subscription = app.config.get('SUBSCRIPTION_LEVEL')
        members = app.config.get('SUBSCRIPTION_MAX_BLOG_MEMBERS', {})
        if subscription in members:
            if len(value) > members[subscription]:
                return self._error(
                    field,
                    'Maximum of {} allowed on this blog'.format(members[subscription])
                )

    def _validate_uniqueurl(self, unique, field, value):
        value = trailing_slash(value)
        self._validate_unique(unique, field, value)

    def _validate_httpsurl(self, httpsurl, field, value):
        if httpsurl:
            if not validate_secure_url(value):
                return self._error(field, "The provided url is not safe.")

            key_field = httpsurl.get('key_field')
            check_auth = httpsurl.get('check_auth')
            webhook = httpsurl.get('webhook')
            chech_auth_enabled = app.config.get('SYNDICATION_VALIDATE_AUTH', False)

            if webhook:
                url_path = urllib.parse.urlparse(value).path.rstrip('/')
                if not url_path.endswith('syndication/webhook'):
                    return self._error(field, "The provided webhook url doesn't ends with 'syndication/webhook'")
                else:
                    api_url = value

            original = self._original_document or {}
            document = original.copy()
            updates = self.document or {}
            document.update(updates)

            if check_auth and key_field:
                api_key = document.get(key_field)
                if not api_key:
                    return self._error(field, "Unable to find '{}' for the given resource url.".format(key_field))

                if chech_auth_enabled:
                    if not webhook:
                        api_url = urllib.parse.urljoin(value, 'syndication/blogs')
                    try:
                        response = send_api_request(api_url, api_key, json_loads=False, timeout=5)
                    except APIConnectionError:
                        return self._error(field, "Unable to connect to the the given url.")
                    if response.status_code != 200:
                        return self._error(field, "Unable to authenticate to the the given url.")

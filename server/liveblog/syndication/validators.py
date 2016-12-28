import urllib.parse
from eve.io.mongo import Validator
from superdesk import get_resource_service
from .utils import send_api_request, validate_secure_url
from .exceptions import APIConnectionError

# TODO: add validation for webhook url.


class APIUrlValidator(Validator):
    def _validate_httpsurl(self, httpsurl, field, value):
        if httpsurl:
            if not validate_secure_url(value):
                return self._error(field, "The provided url is not safe.")

            key_field = httpsurl.get('key_field')
            url_field = httpsurl.get('url_field', field)
            resource = httpsurl.get('resource')
            check_auth = httpsurl.get('check_auth')

            if check_auth and resource and key_field:
                try:
                    api_key = get_resource_service(resource).find_one(**{url_field: value})[key_field]
                except KeyError:
                    return self._error(field, "Unable to find api_key for the given resource url.")
                if not api_key:
                    return self._error(field, "Unable to find resource for the given url.")

                api_url = urllib.parse.urljoin(value, 'syndication/blogs')
                try:
                    response = send_api_request(api_url, api_key, json_loads=True, timeout=2)
                except APIConnectionError:
                    return self._error(field, "Unable to connect to the the given url.")
                if response.status != 200:
                    return self._error(field, "Unable to authenticate to the the given url.")

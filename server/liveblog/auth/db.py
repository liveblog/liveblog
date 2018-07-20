from flask import request
from apps.auth.db import DbAuthService
from settings import SUBSCRIPTION_LEVEL, ACCESS_SUBSCRIPTIONS_MOBILE
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service
from apps.auth.errors import CredentialsAuthError

AGENT_MOBILE_ANDROID = "okhttp/"
AGENT_MODILE_IOS = "org.sourcefabric.LiveBlogReporter"


class AccessAuthService(DbAuthService):

    def authenticate(self, credentials):
        self._check_subscription_level()
        self.disable_sd_desktop_notification(credentials)
        return super().authenticate(credentials)

    def _check_subscription_level(self):
        subscription = SUBSCRIPTION_LEVEL

        # get user agent information to detect if request comes from mobile app
        user_agent = request.user_agent.string
        is_mobile_agent = any([
            (AGENT_MODILE_IOS in user_agent),
            (AGENT_MOBILE_ANDROID in user_agent)
        ])

        if subscription not in ACCESS_SUBSCRIPTIONS_MOBILE and is_mobile_agent:
            raise SuperdeskApiError.forbiddenError(message='Liveblog mobile can not access on this subscription')

    def disable_sd_desktop_notification(self, credentials):
        user = get_resource_service('users').find_one(req=None, username=credentials.get('username'))
        if not user:
            raise CredentialsAuthError(credentials)
        user_updates = user
        user_preferences = user_updates.get('user_preferences')
        if user_preferences:
            desktop_notification = user_preferences.get('desktop:notification')
            if desktop_notification:
                enabled = desktop_notification.get('enabled')
                if enabled:
                    user_updates['user_preferences']['desktop:notification']['enabled'] = False
        get_resource_service('users').system_update(user['_id'], user_updates, user)

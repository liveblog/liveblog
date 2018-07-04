from apps.auth.db import DbAuthService
from settings import SUBSCRIPTION_LEVEL, ACCESS_SUBSCRIPTIONS_MOBILE
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service
from apps.auth.errors import CredentialsAuthError


class AccessAuthService(DbAuthService):

    def authenticate(self, credentials):
        self._check_subscription_level()
        self.disable_sd_desktop_notification(credentials)
        return super().authenticate(credentials)

    def _check_subscription_level(self):
        subscription = SUBSCRIPTION_LEVEL
        if subscription not in ACCESS_SUBSCRIPTIONS_MOBILE:
            raise SuperdeskApiError.forbiddenError(message='Liveblog mobile can not access on this subscription')

    def disable_sd_desktop_notification(self, credentials):
        user = get_resource_service('users').find_one(req=None, username=credentials.get('username'))
        if not user:
            raise CredentialsAuthError(credentials)
        user_updates = user
        user_updates['user_preferences']['desktop:notification']['enabled'] = False
        get_resource_service('users').system_update(user['_id'], user_updates, user)

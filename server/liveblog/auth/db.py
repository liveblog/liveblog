from apps.auth.db import DbAuthService
from settings import SUBSCRIPTION_LEVEL, ACCESS_SUBSCRIPTIONS_MOBILE
from superdesk.errors import SuperdeskApiError


class AccessAuthService(DbAuthService):

    def authenticate(self, credentials):
        self._check_subscription_level()
        DbAuthService.authenticate(self, credentials)

    def _check_subscription_level(self):
        subscription = SUBSCRIPTION_LEVEL
        if subscription not in ACCESS_SUBSCRIPTIONS_MOBILE:
            raise SuperdeskApiError.forbiddenError(message='Liveblog mobile can not access on this subscription')

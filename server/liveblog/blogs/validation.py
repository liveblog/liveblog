from superdesk.validator import SuperdeskValidator
from settings import (SUBSCRIPTION_LEVEL, SUBSCRIPTION_MAX_BLOG_MEMBERS)

class BlogValidator(SuperdeskValidator):
    def _validate_maxmembers(self, meta, field, value):
        subscription = SUBSCRIPTION_LEVEL
        if subscription in SUBSCRIPTION_MAX_BLOG_MEMBERS:
            if (len(value) > SUBSCRIPTION_MAX_BLOG_MEMBERS[subscription]):
                return self._error(field, 'Maximum of {} allowed on this blog'.format(SUBSCRIPTION_MAX_BLOG_MEMBERS[subscription]))

import superdesk
from apps.auth.db.reset_password import ResetPasswordService
from liveblog.utils.hooks import trigger_hooks, events, build_hook_data


class LiveBlogResetPasswordService(ResetPasswordService):
    """Overrides default Superdesk Reset Password Service in
    order to be able to trigger hooks when user has activated account"""

    def reset_password(self, doc):
        key = doc.get('token')
        users_service = superdesk.get_resource_service('users')
        reset_request = self.check_if_valid_token(key)
        user = users_service.find_one(req=None, _id=reset_request['user'])

        # let's store the activation status before completing request
        awaiting_activation = users_service.user_is_waiting_activation(user)

        # now run default logic on password reset
        response = super().reset_password(doc)

        # then reload user and check if it's been activated. Then trigger hook
        user = users_service.find_one(req=None, _id=reset_request['user'])
        now_active = not users_service.user_is_waiting_activation(user)

        if awaiting_activation and now_active:
            hook_data = build_hook_data(events.USER_ACTIVATION, email=user['email'])
            trigger_hooks(hook_data)

        return response

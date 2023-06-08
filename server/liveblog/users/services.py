import flask
from flask import current_app as app
from superdesk.users.services import DBUsersService


class LiveBlogUserService(DBUsersService):
    """
    Extends superdesk.users default app to add some additional functionality
    only concerning Live Blog, like hiding users' sensitive information for users
    that do not have enough permissions to do so.
    """

    def on_fetched(self, document):
        super().on_fetched(document)

        for doc in document['_items']:
            self.__hide_sensitive_data(doc)

    def on_fetched_item(self, doc):
        super().on_fetched_item(doc)
        self.__hide_sensitive_data(doc)

    def __hide_sensitive_data(self, doc):
        """Set default fields for users"""

        if flask.g.user['_id'] == doc['_id']:
            return

        if app.config['HIDE_USERS_SENSITIVE_DATA']:
            doc['email'] = 'hidden'
            doc['first_name'] = 'hidden'

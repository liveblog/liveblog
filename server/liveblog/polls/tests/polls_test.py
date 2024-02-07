# flake8: noqa
import liveblog.polls as polls
from superdesk.tests import TestCase
from superdesk import get_resource_service
from liveblog.items.items import drag_and_drop_blueprint
from bson import ObjectId
import datetime
import flask


class Foo:
    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call


foo = Foo()


class PollsTest(TestCase):
    def setUp(self):
        if not foo.setup_call:
            polls.init_app(self.app)
            test_config = {
                "LIVEBLOG_DEBUG": True,
                "EMBED_PROTOCOL": "http://",
                "DEBUG": False,
            }
            foo.setup_called()
            self.app.config.update(test_config)
            self.archive_service = get_resource_service("archive")
            self.polls_service = get_resource_service("polls")
            self.app.register_blueprint(drag_and_drop_blueprint)


class ClientModuleTest(TestCase):
    def setUp(self):
        polls.init_app(self.app)
        test_config = {"LIVEBLOG_DEBUG": True, "EMBED_PROTOCOL": "http://"}
        self.app.config.update(test_config)
        self.client = self.app.test_client()
        self.polls_service = get_resource_service("polls")
        self.users_service = get_resource_service("users")
        self.app.register_blueprint(drag_and_drop_blueprint)

        self.poll_doc = [
            {
                "blog": ObjectId("65bb5f908531ef64e85c801f"),
                "poll_body": {
                    "question": "Do you think Liveblog is the best ?",
                    "answers": [
                        {"option": "Yes", "votes": 0},
                        {"option": "No", "votes": 0},
                    ],
                    "active_until": datetime.datetime(2024, 2, 12, 12, 40, 44),
                },
                "text": "Sample poll",
            }
        ]

        self.user_list = [
            {
                "username": "admin",
                "display_name": "Edwin the admin",
                "first_name": "Edwin",
                "is_active": True,
                "is_enabled": True,
                "last_name": "the admin",
                "sign_off": "off",
                "byline": "by",
                "email": "abc@other.com",
            }
        ]

        self.app.data.insert("users", self.user_list)

    def test_a_item_on_create(self):
        flask.g.user = get_resource_service("users").find_one(
            req=None, username="admin"
        )
        self.assertIsNone(self.poll_doc[0].get("original_creator"), True)
        self.assertIsNone(self.poll_doc[0].get("firstcreated"), True)
        self.assertIsNone(self.poll_doc[0].get("versioncreated"), True)
        self.assertIsNotNone(self.poll_doc[0].get("poll_body"), True)
        response = self.polls_service.on_create(self.poll_doc)
        self.assertIsNotNone(response.get("original_creator"), True)
        self.assertIsNotNone(response.get("firstcreated"), True)
        self.assertIsNotNone(response.get("versioncreated"), True)
        self.assertIsNotNone(response.get("poll_body"), True)

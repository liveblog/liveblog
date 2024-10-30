from bson import ObjectId
from superdesk import get_resource_service
from superdesk.tests import TestCase
from liveblog.polls.polls import poll_calculations
import datetime
import flask
import liveblog.polls as polls


class PollsTest(TestCase):
    def setUp(self):
        polls.init_app(self.app)
        test_config = {
            "LIVEBLOG_DEBUG": True,
            "EMBED_PROTOCOL": "http://",
            "DEBUG": False,
        }
        self.app.config.update(test_config)
        self.client = self.app.test_client()
        self.polls_service = get_resource_service("polls")
        self.users_service = get_resource_service("users")

        self.blogId = ObjectId("65bb5f908531ef64e85c801f")

        self.poll_doc = [
            {
                "blog": self.blogId,
                "poll_body": {
                    "question": "Do you think Liveblog is the best ?",
                    "answers": [
                        {"option": "Yes", "votes": 57},
                        {"option": "No", "votes": 30},
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

    def test_poll_create_with_valid_data(self):
        flask.g.user = get_resource_service("users").find_one(
            req=None, username="admin"
        )
        response = self.polls_service.on_create(self.poll_doc)
        self.assertIsNotNone(response.get("original_creator"), True)
        self.assertIsNotNone(response.get("firstcreated"), True)
        self.assertIsNotNone(response.get("versioncreated"), True)
        self.assertEqual(response.get("blog"), self.blogId)
        self.assertIsNotNone(response.get("poll_body"), True)
        response_poll_body = response.get("poll_body")
        self.assertEqual(
            response_poll_body.get("question"),
            self.poll_doc[0]["poll_body"]["question"],
        )
        self.assertEqual(
            response_poll_body.get("answers"), self.poll_doc[0]["poll_body"]["answers"]
        )
        self.assertEqual(
            response_poll_body.get("active_until"),
            self.poll_doc[0]["poll_body"]["active_until"],
        )

    def test_poll_calculations(self):
        result = poll_calculations(self.poll_doc[0]["poll_body"])
        self.assertEqual(result["answers"][0]["percentage"], 66)
        self.assertEqual(result["answers"][1]["percentage"], 34)

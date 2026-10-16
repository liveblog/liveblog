import datetime
from bson import ObjectId
from superdesk import get_resource_service
from liveblog.polls.polls import poll_calculations
from liveblog.tests.tenant_test_case import TenantAwareTestCase
from liveblog.common import run_once
import liveblog.polls as polls
import liveblog.tenants as tenants_app
import liveblog.liveblog_users as liveblog_users_app


class PollsTest(TenantAwareTestCase):
    @run_once
    def setup_test_case(self):
        self.app.config.update(
            {"LIVEBLOG_DEBUG": True, "EMBED_PROTOCOL": "http://", "DEBUG": False}
        )
        for app in [tenants_app, liveblog_users_app, polls]:
            app.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.setup_tenant_and_user()
        self.polls_service = get_resource_service("polls")
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

    def test_poll_create_with_valid_data(self):
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

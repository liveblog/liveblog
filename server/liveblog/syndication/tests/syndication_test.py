from unittest import TestCase
from unittest.mock import MagicMock, patch

from liveblog.syndication.syndication import SyndicationOutService


class SyndicationOutServiceTest(TestCase):
    @patch("liveblog.syndication.syndication.send_post_to_consumer")
    def test_send_syndication_post_skips_invalid_blog_id(self, mock_send):
        service = SyndicationOutService("syndication_out", backend=MagicMock())
        post = {
            "_id": "post_1",
            "blog": "-id blog one-",
            "groups": [],
        }

        with patch.object(
            service, "_is_repeat_syndication", return_value=True
        ), patch.object(
            service,
            "get_blog_syndication",
            side_effect=AssertionError("should not run"),
        ):
            service.send_syndication_post(post, action="created")

        mock_send.delay.assert_not_called()

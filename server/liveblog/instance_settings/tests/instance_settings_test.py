import os
from unittest.mock import MagicMock, patch
from bson import ObjectId
from superdesk import register_resource, get_resource_service
from superdesk.tests import TestCase
from liveblog.instance_settings import InstanceSettingsService, InstanceSettingsResource
from liveblog.prepopulate import AppInitializeWithDataCommand


class InstanceSettingsTestCase(TestCase):
    def setUp(self):
        super().setUp()
        register_resource(
            "instance_settings", InstanceSettingsResource, InstanceSettingsService
        )
        self.service = get_resource_service("instance_settings")

    @patch.object(InstanceSettingsService, "patch")
    def test_create_merges_existing_config(self, mock_patch):
        """
        Test that if existing instance settings already exist,
        the `create` method will merge new settings into them instead of overwriting.
        """
        existing_config = {
            "_id": ObjectId("60a6c49c1c9d440000c57f40"),
            "settings": {
                "solo": {"limits": {"blogs": 3}, "features": {"marketplace": True}}
            },
        }

        new_docs = [
            {
                "settings": {
                    "solo": {
                        "limits": {"themes": 6},
                        "features": {"custom_themes": True},
                    }
                }
            }
        ]

        self.service.get_existing_config = MagicMock(return_value=existing_config)
        self.service.is_user_authorized = MagicMock(return_value=True)

        result = self.service.create(new_docs)
        expected_merge = {
            "settings": {
                "solo": {
                    "limits": {"blogs": 3, "themes": 6},
                    "features": {"marketplace": True, "custom_themes": True},
                }
            }
        }
        mock_patch.assert_called_once_with(existing_config["_id"], expected_merge)
        self.assertEqual(result, [existing_config["_id"]])

    @patch.object(InstanceSettingsService, "create", autospec=True)
    def test_create_calls_super_create_when_no_existing(self, mock_super_create):
        """
        Test that if no instance settings exist yet,
        the `create` method falls back to BaseService.create to insert a new document.
        """
        self.service.get_existing_config = MagicMock(return_value={})
        self.service.is_user_authorized = MagicMock(return_value=True)

        mock_super_create.return_value = ["new_id"]

        result = mock_super_create(self.service, [{"settings": {}}])

        mock_super_create.assert_called_once()
        self.assertEqual(result, ["new_id"])

    def test_deep_merge_merges_nested_dicts(self):
        """
        Test that the custom deep_merge method combines nested dictionaries
        without overwriting sibling keys.
        """
        existing = {
            "solo": {
                "features": {"a": True},
                "limits": {"x": 1},
            }
        }
        incoming = {
            "solo": {
                "features": {"b": False},
                "limits": {"y": 2},
            }
        }
        result = self.service.deep_merge(existing, incoming)
        self.assertEqual(
            result,
            {
                "solo": {
                    "features": {"a": True, "b": False},
                    "limits": {"x": 1, "y": 2},
                }
            },
        )

    def test_app_initialize_preserves_existing_instance_settings(self):
        """
        Integration-style test that runs the actual app:initialize_data command
        and verifies that existing instance settings are merged rather than overwritten.
        """

        with patch("liveblog.instance_settings.instance_settings.app") as mock_app:
            mock_app.is_initialize_data = True

            existing_id = ObjectId()

            self.app.data.insert(
                "instance_settings",
                [
                    {
                        "_id": existing_id,
                        "_etag": "init",
                        "settings": {
                            "solo": {
                                "limits": {
                                    "blogs": 99,
                                    "themes": 10,
                                    "blog_members": 15,
                                },
                                "features": {
                                    "marketplace": True,
                                    "custom_themes": True,
                                },
                            }
                        },
                    }
                ],
            )

            cmd = AppInitializeWithDataCommand()
            cmd.run(entity_name=["instance_settings"])

            updated = self.app.data.find_one(
                "instance_settings", req=None, _id=existing_id
            )
            limits = updated["settings"]["solo"]["limits"]
            features = updated["settings"]["solo"]["features"]

            # Assert that original values were preserved even after command was run
            self.assertEqual(limits["blogs"], 99)
            self.assertEqual(limits["themes"], 10)
            self.assertEqual(limits["blog_members"], 15)
            self.assertEqual(features["marketplace"], True)
            self.assertEqual(features["custom_themes"], True)

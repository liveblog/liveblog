"""
Unit tests for Elasticsearch tenant filters.

Tests the elastic filter callbacks that ensure tenant isolation at the
search/query layer.
"""

import flask
from bson import ObjectId

from superdesk.tests import TestCase
from liveblog.tenancy.filters import tenant_elastic_filter, combine_elastic_filters


class TenantElasticFiltersTestCase(TestCase):
    """Test Elasticsearch tenant filter callbacks."""

    def setUp(self):
        """Set up test fixtures."""
        self.tenant_id = ObjectId()
        self.user_with_tenant = {
            "_id": ObjectId(),
            "username": "testuser",
            "email": "test@example.com",
            "tenant_id": self.tenant_id,
        }

    def test_tenant_elastic_filter_with_tenant(self):
        """Test tenant_elastic_filter returns term filter when tenant exists."""
        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            result = tenant_elastic_filter()

            self.assertIsInstance(result, dict)
            self.assertIn("term", result)
            self.assertIn("tenant_id", result["term"])
            self.assertEqual(result["term"]["tenant_id"], str(self.tenant_id))

    def test_tenant_elastic_filter_without_tenant(self):
        """Test tenant_elastic_filter returns match_none when no tenant."""
        with self.app.app_context():
            if hasattr(flask.g, "user"):
                delattr(flask.g, "user")

            result = tenant_elastic_filter()

            self.assertIsInstance(result, dict)
            self.assertIn("match_none", result)
            self.assertEqual(result, {"match_none": {}})

    def test_tenant_elastic_filter_converts_objectid_to_string(self):
        """Test tenant_elastic_filter converts ObjectId to string for Elasticsearch."""
        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            result = tenant_elastic_filter()

            # Elasticsearch requires string tenant_id
            self.assertIsInstance(result["term"]["tenant_id"], str)
            self.assertEqual(result["term"]["tenant_id"], str(self.tenant_id))

    def test_combine_elastic_filters_with_no_filters(self):
        """Test combine_elastic_filters returns empty dict when no filters."""
        combined = combine_elastic_filters()

        with self.app.app_context():
            result = combined()

            self.assertEqual(result, {})

    def test_combine_elastic_filters_with_single_filter(self):
        """Test combine_elastic_filters returns single filter directly."""

        def filter1():
            return {"term": {"status": "active"}}

        combined = combine_elastic_filters(filter1)

        with self.app.app_context():
            result = combined()

            self.assertEqual(result, {"term": {"status": "active"}})

    def test_combine_elastic_filters_with_multiple_filters(self):
        """Test combine_elastic_filters combines multiple filters with AND logic."""

        def filter1():
            return {"term": {"status": "active"}}

        def filter2():
            return {"term": {"type": "blog"}}

        combined = combine_elastic_filters(filter1, filter2)

        with self.app.app_context():
            result = combined()

            self.assertIn("bool", result)
            self.assertIn("must", result["bool"])
            self.assertEqual(len(result["bool"]["must"]), 2)
            self.assertIn({"term": {"status": "active"}}, result["bool"]["must"])
            self.assertIn({"term": {"type": "blog"}}, result["bool"]["must"])

    def test_combine_elastic_filters_with_tenant_filter(self):
        """Test combine_elastic_filters works with tenant_elastic_filter."""

        def custom_filter():
            return {"term": {"status": "open"}}

        combined = combine_elastic_filters(tenant_elastic_filter, custom_filter)

        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            result = combined()

            self.assertIn("bool", result)
            self.assertIn("must", result["bool"])
            self.assertEqual(len(result["bool"]["must"]), 2)

            # Check tenant filter is present
            tenant_filter = {"term": {"tenant_id": str(self.tenant_id)}}
            self.assertIn(tenant_filter, result["bool"]["must"])

            # Check custom filter is present
            custom = {"term": {"status": "open"}}
            self.assertIn(custom, result["bool"]["must"])

    def test_combine_elastic_filters_skips_none_results(self):
        """Test combine_elastic_filters skips filters that return None."""

        def filter1():
            return {"term": {"status": "active"}}

        def filter2():
            return None

        def filter3():
            return {"term": {"type": "blog"}}

        combined = combine_elastic_filters(filter1, filter2, filter3)

        with self.app.app_context():
            result = combined()

            # Should only have 2 filters (filter2 returns None)
            self.assertIn("bool", result)
            self.assertIn("must", result["bool"])
            self.assertEqual(len(result["bool"]["must"]), 2)

    def test_combine_elastic_filters_skips_empty_dict_results(self):
        """Test combine_elastic_filters skips filters that return empty dict."""

        def filter1():
            return {"term": {"status": "active"}}

        def filter2():
            return {}

        def filter3():
            return {"term": {"type": "blog"}}

        combined = combine_elastic_filters(filter1, filter2, filter3)

        with self.app.app_context():
            result = combined()

            # Should only have 2 filters (filter2 returns {})
            self.assertIn("bool", result)
            self.assertIn("must", result["bool"])
            self.assertEqual(len(result["bool"]["must"]), 2)

    def test_combine_elastic_filters_with_non_callable(self):
        """Test combine_elastic_filters handles non-callable items gracefully."""

        def filter1():
            return {"term": {"status": "active"}}

        combined = combine_elastic_filters(filter1, "not_a_function", None)

        with self.app.app_context():
            result = combined()

            # Should only have 1 filter (non-callables are skipped)
            self.assertEqual(result, {"term": {"status": "active"}})

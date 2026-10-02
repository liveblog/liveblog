"""
User registration endpoint for multi-tenant LiveBlog.

This module provides a public REST API endpoint for user registration that
automatically creates a tenant for each new user.
"""

from flask import Blueprint, request
from flask_cors import cross_origin
from liveblog.tenancy.registration import RegistrationService
from liveblog.utils.api import api_response, api_error
from superdesk.errors import SuperdeskApiError
import logging

logger = logging.getLogger(__name__)

registration_blueprint = Blueprint("registration", __name__)


@registration_blueprint.route("/api/register", methods=["POST", "OPTIONS"])
@cross_origin()
def register():
    """
    Public registration endpoint for new users.

    This endpoint allows unauthenticated users to register for a new
    LiveBlog account. It automatically creates a tenant for the user,
    establishing a one-to-one relationship between user and tenant.

    Request:
        POST /api/register
        Content-Type: application/json

        Body:
        {
            "username": "john",
            "email": "john@example.com",
            "password": "secret123",
            "first_name": "John",
            "last_name": "Doe"
        }

    Response (201 Created):
        {
            "message": "Registration successful",
            "user_id": "507f1f77bcf86cd799439011",
            "tenant_id": "507f1f77bcf86cd799439012",
            "tenant_name": "John's LiveBlog"
        }

    Response (400 Bad Request):
        {
            "error": "Username already exists"
        }

    Response (500 Internal Server Error):
        {
            "error": "Internal server error"
        }

    Security:
        - No authentication required (public endpoint)
        - Password is hashed by Superdesk before storage
        - Username and email uniqueness enforced
        - Rollback mechanism ensures consistency
    """
    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict) or not data:
        return api_error("Request body must be a non-empty JSON object", 400)

    # Validate required fields
    required = ["username", "email", "password", "first_name", "last_name"]
    missing = [field for field in required if field not in data]

    if missing:
        return api_error(f'Missing required fields: {", ".join(missing)}', 400)

    # Basic validation
    if len(data["password"]) < 6:
        return api_error("Password must be at least 6 characters", 400)

    # Email format validation
    from email_validator import validate_email, EmailNotValidError

    try:
        validate_email(data["email"], check_deliverability=False)
    except EmailNotValidError as e:
        return api_error(str(e), 400)

    # Username validation (alphanumeric, underscore, hyphen, dot)
    username = data["username"]
    if not username.replace("_", "").replace("-", "").replace(".", "").isalnum():
        return api_error(
            "Username can only contain letters, numbers, underscore, and hyphen", 400
        )

    if len(username) < 3:
        return api_error("Username must be at least 3 characters", 400)

    registration_service = RegistrationService()

    try:
        result = registration_service.register_new_user(data)

        logger.info(
            f"Successfully registered user {result['user_id']} "
            f"with tenant {result['tenant_id']}"
        )

        return api_response(
            {
                "_id": str(result["user_id"]),
                "_status": "OK",
                "message": "Registration successful",
                "user_id": str(result["user_id"]),
                "tenant_id": str(result["tenant_id"]),
                "tenant_name": result["tenant_name"],
            },
            201,
        )

    except SuperdeskApiError as e:
        logger.warning(f"Registration failed: {e}")
        return api_error(str(e), e.status_code or 400)

    except Exception as e:
        logger.error(f"Registration error: {e}", exc_info=True)
        return api_error("Internal server error", 500)


__all__ = ["registration_blueprint"]

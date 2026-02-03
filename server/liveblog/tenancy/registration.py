"""
User registration service with automatic tenant creation.

This module handles the user-first signup flow where registering a new user
automatically creates their personal tenant, establishing a one-to-one
relationship between users and tenants.
"""

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from bson.objectid import ObjectId
import logging

logger = logging.getLogger(__name__)


class RegistrationService:
    """
    Handle user registration with automatic tenant creation.

    This service implements the user-first signup flow:
    1. Validate user data (username, email uniqueness)
    2. Create tenant (with name based on user)
    3. Create user (with tenant_id reference)
    4. Link tenant to user (owner_user_id)
    5. Return both user and tenant info

    The process includes rollback capability - if user creation fails,
    the tenant is automatically deleted to maintain consistency.

    Example:
        registration_service = RegistrationService()
        result = registration_service.register_new_user({
            'username': 'john',
            'email': 'john@example.com',
            'password': 'password123',
            'first_name': 'John',
            'last_name': 'Doe'
        })
    """

    def register_new_user(self, user_data):
        """
        Register new user and create their personal tenant.

        This method orchestrates the complete registration flow, including
        validation, tenant creation, user creation, and linking. It includes
        automatic rollback if any step fails.

        Args:
            user_data (dict): User registration data containing:
                - username (str, required): Unique username
                - email (str, required): Unique email address
                - password (str, required): Plain-text password (will be hashed)
                - first_name (str, required): User's first name
                - last_name (str, required): User's last name

        Returns:
            dict: Registration result containing:
                - user_id (ObjectId): ID of created user
                - tenant_id (ObjectId): ID of created tenant
                - tenant_name (str): Name of tenant

        Raises:
            SuperdeskApiError: If username or email already exists,
                              or if validation fails

        Example:
            try:
                result = service.register_new_user({
                    'username': 'john',
                    'email': 'john@example.com',
                    'password': 'secret',
                    'first_name': 'John',
                    'last_name': 'Doe'
                })
                print(f"User created: {result['user_id']}")
                print(f"Tenant created: {result['tenant_id']}")
            except SuperdeskApiError as e:
                print(f"Registration failed: {e}")
        """
        users_service = get_resource_service("users")
        tenants_service = get_resource_service("tenants")


        # TODO: think carefully if we want uniqueness across all tenants
        # Check for duplicate username across all tenants
        existing = users_service.system_find_one(req=None, username=user_data["username"])
        if existing:
            raise SuperdeskApiError.badRequestError(message="Username already exists")

        # Check for duplicate email across all tenants
        existing_email = users_service.system_find_one(req=None, email=user_data["email"])
        if existing_email:
            raise SuperdeskApiError.badRequestError(message="Email already exists")

        tenant_name = self._generate_tenant_name(user_data)
        tenant_data = {
            "name": tenant_name,
            "subscription_level": "solo",
            "settings": {},
        }

        tenant_ids = tenants_service.post([tenant_data])
        tenant_id = tenant_ids[0]

        logger.info(f"Created tenant {tenant_id} for new user registration")

        user_data["tenant_id"] = ObjectId(tenant_id)
        user_data["user_type"] = "administrator"

        try:
            user_ids = users_service.post([user_data])
            user_id = user_ids[0]

            logger.info(f"Created user {user_id} for tenant {tenant_id}")

            tenants_service.patch(tenant_id, {"owner_user_id": ObjectId(user_id)})

            return {
                "user_id": user_id,
                "tenant_id": tenant_id,
                "tenant_name": tenant_name,
            }

        except Exception as e:
            logger.error(
                f"User creation failed for tenant {tenant_id}, "
                f"rolling back tenant. Error: {e}"
            )
            try:
                tenants_service.delete_action({"_id": tenant_id})
                logger.info(f"Successfully rolled back tenant {tenant_id}")
            except Exception as rollback_error:
                logger.error(f"Failed to rollback tenant {tenant_id}: {rollback_error}")
            raise e

    def _generate_tenant_name(self, user_data):
        """
        Generate a friendly tenant name from user data.

        Args:
            user_data (dict): User registration data

        Returns:
            str: Generated tenant name

        Example:
            {'first_name': 'John', 'last_name': 'Doe', 'username': 'john'}
            -> "John's LiveBlog"
        """
        first_name = user_data.get("first_name", user_data["username"])
        return f"{first_name}'s LiveBlog"


__all__ = ["RegistrationService"]

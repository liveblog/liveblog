import uuid
import hmac
from hashlib import sha1


def generate_api_key():
    """Generate a new API Key."""
    random_uuid = uuid.uuid4()
    return hmac.new(random_uuid.bytes, digestmod=sha1).hexdigest()

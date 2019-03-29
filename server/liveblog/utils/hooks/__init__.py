import requests
import logging
from settings import TRIGGER_HOOK_URLS

logger = logging.getLogger(__name__)


def build_hook_data(event_name, **kwargs):
    """Prepares hook request data"""
    # NOTE: validate if allowed event?

    return dict(event=event_name, data=kwargs)


def trigger_hooks(hook_data):
    """Trigger hooks configured in settings or ENV var"""

    for url in TRIGGER_HOOK_URLS:
        logger.info('Trying hook request to {0}. Sent data {1}'.format(url, hook_data))
        try:
            resp = requests.post(url, json=hook_data)
            logger.info('Hook triggered successfully to {0}. Response {1}'.format(url, resp.content))
        except Exception:
            logger.exception('Error while sending request hook {0}'.format(url))

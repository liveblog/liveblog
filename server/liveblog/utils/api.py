import json
from flask import make_response
from eve.io.mongo import MongoJSONEncoder


def api_response(data, status_code, json_dumps=True):
    """Make json response for blueprints."""
    if json_dumps:
        data = json.dumps(data, cls=MongoJSONEncoder)
    response = make_response(data)
    response.status_code = status_code
    response.mimetype = 'application/json'
    return response


def api_error(error_message, status_code):
    """Make error for blueprints."""
    return api_response({
        '_status': 'ERR',
        '_error': error_message
    }, status_code)

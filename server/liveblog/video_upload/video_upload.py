from flask import Blueprint, request
from flask_cors import CORS
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import current_app as app
from flask import make_response
import logging
import json
import requests

logger = logging.getLogger('superdesk')

video_upload_blueprint = Blueprint('video_upload', __name__)
CORS(video_upload_blueprint)

video_upload_schema = {
    'client_id': {
        'type': 'string',
    },
    'client_secret': {
        'type': 'string',
    },
    'refresh_token': {
        'type': 'string',
    },
}


class VideoUploadResource(Resource):
    datasource = {
        'source': 'video_upload'
    }

    public_methods = ['POST']
    privileges = {'POST': 'video_upload'}

    schema = video_upload_schema


class VideoUploadService(BaseService):
    notification_key = 'video_upload'


@video_upload_blueprint.route('/api/video_upload/token', methods=['GET'])
def get_token():
    client = get_resource_service('video_upload')
    credential = client.find_one(req=None)
    if credential:
        url = "https://www.googleapis.com/oauth2/v4/token"

        querystring = {
            "client_id": credential['client_id'],
            "client_secret": credential['client_secret'],
            "refresh_token": credential['refresh_token'],
            "grant_type": "refresh_token"
        }
        response = requests.request("POST", url, params=querystring)
        if response:
            response_data = json.loads(response.text)['access_token']
    else:
        response_data = 'Not Found'
    return make_response(response_data, 200)


@video_upload_blueprint.route('/api/video_upload/credential', methods=['POST'])
def find_one_and_update():
    doc = request.get_json()
    client = app.data.mongo.pymongo('video_upload').db['video_upload']
    client.update({}, {'client_id': doc['client_id'], 'client_secret': doc['client_secret'],
                       'refresh_token': doc['refresh_token']}, True)
    return make_response('success', 200)

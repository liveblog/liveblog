import json
import logging
import os

import flask
import httplib2
from oauth2client import _helpers
from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials

from flask import current_app as app
from flask import Blueprint, make_response, request
from flask_cors import CORS

from superdesk.resource import Resource
from superdesk.services import BaseService

from liveblog.blogs.utils import is_s3_storage_enabled
from liveblog.utils.api import api_error, api_response

logger = logging.getLogger('superdesk')

video_upload_blueprint = Blueprint('video_upload', __name__)
CORS(video_upload_blueprint)

dir_path = os.path.dirname(os.path.realpath(__file__))
# set this only when in local server
# os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
CLIENT_SECRETS_FILE = 'youtube/client-secret.json'

SCOPES = ['https://www.googleapis.com/auth/youtube']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'

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
    'current_url': {
        'type': 'string',
    }
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


def getFileContent(filename):
    if is_s3_storage_enabled():
        return app.media.get(filename)

    # in case it's grifs system, we need to work a bit more
    return app.media.fs().get_last_version(filename)


def fileExists(filename):
    if is_s3_storage_enabled():
        return app.media.exists(filename)

    return app.media.exists({'filename': filename})


@video_upload_blueprint.route('/api/video_upload/token', methods=['GET'])
def get_token():
    if (fileExists(CLIENT_SECRETS_FILE)):
        secrets_content = getFileContent(CLIENT_SECRETS_FILE).read()
        json_data = json.loads(_helpers._from_bytes(secrets_content))
        credentials = ServiceAccountCredentials.from_json_keyfile_dict(
            json_data, scopes=["https://www.googleapis.com/auth/youtube"])

        http = httplib2.Http()
        credentials.authorize(http)
        build("youtube", "v3", http=http, cache_discovery=False)

        return api_response(credentials.access_token, 200)
    else:
        return api_error('Missing youtube credentials', 501)


@video_upload_blueprint.route('/api/video_upload/credential', methods=['POST', 'GET'])
def get_refresh_token():
    # TODO: add condition, file must be provided
    secrets = request.files['secretsFile']

    secrets.seek(0)
    file_content = secrets.read()

    secrets_file = app.media.put(
        file_content, filename=CLIENT_SECRETS_FILE, content_type='application/json', version=False)

    return api_response({'_id': secrets_file}, 200)


@video_upload_blueprint.route('/api/video_upload/oauth2callback', methods=['GET', 'POST'])
def oauth2callback():
    # flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
    #     CLIENT_SECRETS_FILE, scopes=SCOPES)
    # flow.redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')

    # # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    # authorization_response = flask.request.url
    # authorization_response = authorization_response.replace('http', 'https')
    # flow.fetch_token(authorization_response=authorization_response)

    # credentials = flow.credentials
    # client = app.data.mongo.pymongo('video_upload').db['video_upload']
    # current_url_data = client.find_one()
    # current_url = current_url_data['current_url']
    # client.update({}, {'client_id': credentials.client_id, 'client_secret': credentials.client_secret,
    #                    'refresh_token': credentials.refresh_token}, True)
    return ""
    # return flask.redirect(current_url)


@video_upload_blueprint.route('/api/video_upload/callback_url', methods=['GET'])
def callback_url():
    current_url = request.args.get('currentUrl')
    client = app.data.mongo.pymongo('video_upload').db['video_upload']
    client.update({}, {'$set': {'current_url': current_url}}, True)
    redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')
    return make_response(redirect_uri, 200)

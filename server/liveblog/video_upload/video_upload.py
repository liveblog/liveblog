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
import os
import flask
import requests
import google_auth_oauthlib.flow
import urllib.request

logger = logging.getLogger('superdesk')

video_upload_blueprint = Blueprint('video_upload', __name__)
CORS(video_upload_blueprint)

dir_path = os.path.dirname(os.path.realpath(__file__))
# set this only when in local server
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
CLIENT_SECRETS_FILE = dir_path + '/client-secret.json'
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
    else:
        response_data = 'Not Found'
    return make_response(response_data, 200)


@video_upload_blueprint.route('/api/video_upload/credential', methods=['POST', 'GET'])
def get_refresh_token():
    doc = request.get_json()
    with urllib.request.urlopen(doc['file']) as response, open(dir_path + '/client-secret.json', 'wb') as out_file:
        data = response.read()
        out_file.write(data)

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)

    flow.redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')

    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        access_type='offline',
        prompt='consent',
        include_granted_scopes='true')
    return make_response(authorization_url, 200)


@video_upload_blueprint.route('/api/video_upload/oauth2callback', methods=['GET', 'POST'])
def oauth2callback():
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)
    flow.redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    authorization_response = flask.request.url
    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials
    client = app.data.mongo.pymongo('video_upload').db['video_upload']
    current_url_data = client.find_one()
    current_url = current_url_data['current_url']
    client.update({}, {'client_id': credentials.client_id, 'client_secret': credentials.client_secret,
                       'refresh_token': credentials.refresh_token}, True)
    return flask.redirect(current_url)


@video_upload_blueprint.route('/api/video_upload/callback_url', methods=['GET'])
def callback_url():
    current_url = request.args.get('currentUrl')
    client = app.data.mongo.pymongo('video_upload').db['video_upload']
    client.update({}, {'$set': {'current_url': current_url}}, True)
    redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')
    return make_response(redirect_uri, 200)

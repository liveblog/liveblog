import json
import logging
import os

import six
import flask
import httplib2

from google_auth_oauthlib.flow import Flow

from oauth2client import _helpers
from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials

from flask import current_app as app
from flask import Blueprint, make_response, request, session
from flask_cors import CORS

from superdesk import get_resource_service
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
YT_KEY = 'youtube_secrets'
YT_CREDENTIALS = 'youtube_credentials'

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


def bytes2string(value):
    """Converts bytes to a string value, if necessary.
    Args:
        value: The string/bytes value to be converted.
    Returns:
        The original value converted to unicode (if bytes) or as passed in
        if it started out as unicode.
    Raises:
        ValueError if the value could not be converted to unicode.
    """
    result = value.decode('utf-8') if isinstance(value, six.binary_type) else value

    if isinstance(result, six.text_type):
        return result
    else:
        raise ValueError(
            '{0!r} could not be converted to unicode'.format(value))


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


@video_upload_blueprint.route('/api/video_upload/credential', methods=['POST'])
def get_refresh_token():
    # let's save current url to later redirect
    session['current_url'] = request.values['currentUrl']

    secrets = request.files['secretsFile']
    secrets.seek(0)
    file_content = secrets.read()
    yt_data = json.loads(bytes2string(file_content))

    if 'web' not in yt_data:
        return api_error('OAuth project has to be configured as web in google console', 400)

    # let's save secrets file content in db for future usage
    global_serv = get_resource_service('global_preferences')
    global_serv.save_preference(YT_KEY, yt_data)

    redirect_uri = flask.url_for(
        'video_upload.oauth2callback', _external=True, _scheme='https')

    flow = Flow.from_client_config(
        yt_data, scopes=SCOPES, redirect_uri=redirect_uri)
    auth_url, _ = flow.authorization_url(
        prompt='consent', access_type='offline', include_granted_scopes='true')

    return make_response(auth_url, 200)


@video_upload_blueprint.route('/api/video_upload/oauth2callback', methods=['GET', 'POST'])
def oauth2callback():

    yt_prefs = get_resource_service('global_preferences').get_global_prefs()[YT_KEY]
    yt_data = yt_prefs['value']

    redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')
    flow = Flow.from_client_config(yt_data, scopes=SCOPES, redirect_uri=redirect_uri)

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    authorization_response = flask.request.url
    authorization_response = authorization_response.replace('http', 'https')
    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials
    global_serv = get_resource_service('global_preferences')
    global_serv.save_preference(YT_CREDENTIALS, {
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'refresh_token': credentials.refresh_token
    })

    return flask.redirect(session['current_url'])


@video_upload_blueprint.route('/api/video_upload/callback_url', methods=['GET'])
def callback_url():
    current_url = request.args.get('currentUrl')
    client = app.data.mongo.pymongo('video_upload').db['video_upload']
    client.update({}, {'$set': {'current_url': current_url}}, True)
    redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme='https')
    return make_response(redirect_uri, 200)

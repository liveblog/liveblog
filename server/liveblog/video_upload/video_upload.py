import os
import json
import logging

import six
import flask
import requests

from google_auth_oauthlib.flow import Flow

from flask import current_app as app
from flask import make_response, request
from flask_cors import CORS

import superdesk
from superdesk import get_resource_service

from liveblog.core.constants import YOUTUBE_CREDENTIALS, YOUTUBE_SECRETS
from liveblog.blogs.utils import is_s3_storage_enabled
from liveblog.utils.api import api_error, api_response
from settings import LIVEBLOG_DEBUG, CLIENT_URL

logger = logging.getLogger('superdesk')

video_upload_blueprint = superdesk.Blueprint('video_upload', __name__)
CORS(video_upload_blueprint)

YT_KEY = YOUTUBE_SECRETS
YT_CREDENTIALS = YOUTUBE_CREDENTIALS
SCHEME = 'https'
SCOPES = ['https://www.googleapis.com/auth/youtube']

# if we are in local let's handle things http
if LIVEBLOG_DEBUG:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    SCHEME = 'http'


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
    global_serv = get_resource_service('global_preferences').get_global_prefs()
    credentials = global_serv.get(YT_CREDENTIALS)

    if credentials:
        url = 'https://www.googleapis.com/oauth2/v4/token'

        try:
            params = {
                'client_id': credentials['client_id'],
                'client_secret': credentials['client_secret'],
                'refresh_token': credentials['refresh_token'],
                'grant_type': 'refresh_token'
            }
            response = requests.post(url, data=params)
            response = json.loads(response.text)
            return api_response(response['access_token'], 200)
        except Exception as err:
            msg = 'Unexpected error getting youtube access token. {0}'.format(err)
            logger.warning(msg)
            return api_error(msg, 501)
    else:
        return api_error('Youtube credentials not configured yet', 501)


@video_upload_blueprint.route('/api/video_upload/credential', methods=['POST', 'GET'])
def get_refresh_token():
    # as we don't use session from flask, then we save into user registry, at least for now
    if not app.auth.authorized([], 'global_preferences', 'POST'):
        return app.auth.authenticate()

    secrets = request.files.get('secretsFile', None)
    if secrets is None:
        return api_error('Please provide your youtube credentials', 400)

    secrets.seek(0)
    file_content = secrets.read()
    yt_data = json.loads(bytes2string(file_content))

    if 'web' not in yt_data:
        return api_error('OAuth project has to be configured as web in google console', 400)

    # let's save secrets file content in db for future usage
    global_serv = get_resource_service('global_preferences')
    global_serv.save_preference(YT_KEY, yt_data)

    redirect_uri = flask.url_for(
        'video_upload.oauth2callback', _external=True, _scheme=SCHEME)

    flow = Flow.from_client_config(
        yt_data, scopes=SCOPES, redirect_uri=redirect_uri)

    auth_url, _ = flow.authorization_url(
        prompt='consent',
        access_type='offline',
        include_granted_scopes='true')

    return make_response(auth_url, 200)


@video_upload_blueprint.route('/api/video_upload/oauth2callback', methods=['GET', 'POST'])
def oauth2callback():
    global_prefs = get_resource_service('global_preferences').get_global_prefs()
    yt_data = global_prefs.get(YT_KEY, None)

    # check if access was denied
    access_error = request.args.get('error')

    if access_error or yt_data is None:
        logger.warning('Access denied in google auth or missing credentials. Error: "{}"'.format(access_error))
        return flask.redirect(CLIENT_URL)

    redirect_uri = flask.url_for('video_upload.oauth2callback', _external=True, _scheme=SCHEME)
    flow = Flow.from_client_config(yt_data, scopes=SCOPES, redirect_uri=redirect_uri)

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    authorization_response = flask.request.url

    # let's make sure the scheme is https when in production
    if not LIVEBLOG_DEBUG:
        authorization_response = authorization_response.replace('http', 'https')

    flow.fetch_token(authorization_response=authorization_response)

    credentials = flow.credentials
    global_serv = get_resource_service('global_preferences')
    global_serv.save_preference(YT_CREDENTIALS, {
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'refresh_token': credentials.refresh_token
    })

    return flask.redirect(app.config['CLIENT_URL'])

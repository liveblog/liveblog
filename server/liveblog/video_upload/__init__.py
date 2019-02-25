import superdesk
from .video_upload import VideoUploadResource, VideoUploadService


def init_app(app):
    endpoint_name = 'video_upload'
    service = VideoUploadService(endpoint_name, backend=superdesk.get_backend())
    VideoUploadResource(endpoint_name, app=app, service=service)
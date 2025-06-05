from flask import Blueprint, Response, stream_with_context, request
from flask_cors import CORS
from liveblog.bandwidth.utils import send_bandwidth_alerts

dummy_download_blueprint = Blueprint("dummy_download_blueprint", __name__)
dummy_email_blueprint = Blueprint("dummy_email_blueprint", __name__)
CORS(dummy_download_blueprint)
CORS(dummy_email_blueprint)


@dummy_download_blueprint.route("/api/dummy_download", methods=["GET"])
def dummy_download():
    """
    Serve a large dummy file to test bandwidth.
    Default size of 100MB can be adjusted with the `size` query parameter
    """

    size_mb = int(request.args.get("size", 100))  # Default 100MB
    chunk_size = 16 * 1024 * 1024  # 16MB per chunk
    total_chunks = (size_mb * 1024 * 1024) // chunk_size

    def generate():
        chunk = b"0" * chunk_size
        for _ in range(total_chunks):
            yield chunk

    headers = {
        "Content-Disposition": f"attachment; filename=dummy_{size_mb}MB.bin",
        "Content-Type": "application/octet-stream",
    }

    return Response(
        stream_with_context(generate()),
        headers=headers,
    )


@dummy_email_blueprint.route("/api/send_dummy_alerts", methods=["GET"])
def dummy_alert():
    send_bandwidth_alerts(30, 75)
    return Response(response=None, status=200)

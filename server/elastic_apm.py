import re
import flask
from elasticapm.contrib.flask import ElasticAPM


def setup_apm(app: flask.Flask, service: str):
    if app.config.get("APM_SERVER_URL") and app.config.get("APM_SECRET_TOKEN"):
        app.config["ELASTIC_APM"] = {
            "DEBUG": app.debug,
            "ENVIRONMENT": get_environment(app),
            "SERVER_URL": app.config["APM_SERVER_URL"],
            "SECRET_TOKEN": app.config["APM_SECRET_TOKEN"],
            "TRANSACTIONS_IGNORE_PATTERNS": ["^OPTIONS "],
            "SERVICE_NAME": "Liveblog - {service}".format(service=service),
            "SPAN_STACK_TRACE_MIN_DURATION": "-1ms",
        }

        app.apm = ElasticAPM(app)


def get_environment(app):
    if app.config.get("CLIENT_URL"):
        client_url = app.config["CLIENT_URL"]
        if "localhost" in client_url or "127.0.0.1:9000" in client_url or app.debug:
            return "development"
        if re.search(r"-(dev|demo|test|staging)", app.config["CLIENT_URL"]):
            return "staging"
    return "production"

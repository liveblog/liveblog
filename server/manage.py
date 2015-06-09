#!/usr/bin/env python3

"""Liveblog Manager"""

import superdesk
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from app import get_app
import flask_s3

app = get_app()
manager = Manager(app)
manager.add_command("assets", ManageAssets())


@manager.command
def publish():
    flask_s3.create_all(app)


if __name__ == '__main__':
    manager.run(superdesk.COMMANDS)

# EOF

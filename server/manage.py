#!/usr/bin/env python3

"""Liveblog Manager"""

import superdesk
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from app import get_app

app = get_app()
manager = Manager(app)

manager.add_command("assets", ManageAssets())

if __name__ == '__main__':
    manager.run(superdesk.COMMANDS)

# EOF

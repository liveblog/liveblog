import flask
import superdesk


def get_user(required=False):
    user = flask.g.get('user', {})
    if '_id' not in user and required:
        raise superdesk.SuperdeskError(payload='Invalid user.')
    return user


def set_user(doc):
    usr = get_user()
    user = str(usr.get('_id', ''))
    sent_user = doc.get('user', None)
    if sent_user and user and sent_user != user:
        raise superdesk.SuperdeskError()
    doc['user'] = user
    return user

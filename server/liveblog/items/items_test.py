import json
import liveblog.items as items
from superdesk.tests import TestCase
from superdesk import get_resource_service
from liveblog.items.items import drag_and_drop_blueprint
from bson import ObjectId
import datetime
from unittest.mock import patch
import flask


class Foo():

    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call


foo = Foo()


class ItemsTest(TestCase):
    def setUp(self):
        if not foo.setup_call:
            items.init_app(self.app)
            test_config = {
                'LIVEBLOG_DEBUG': True,
                'EMBED_PROTOCOL': 'http://',
                'DEBUG': False,
            }
            foo.setup_called()
            self.app.config.update(test_config)
            self.archive_service = get_resource_service('archive')
            self.items_service = get_resource_service('items')
            self.app.register_blueprint(drag_and_drop_blueprint)

        self.img_regular = '\
            https://raw.githubusercontent.com/liveblog/liveblog/master/client/app/images/lb-logo-about.png'

        self.img_jpeg = 'data:image/jpeg;base64,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'

        self.img_png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAuCAYAAAAcEfjaAAABV0lEQVRIx+2VsW7CQBBEDwT\
            pIkXICMuyJdtfQsGXQUVFlSpVmjTESOn4BAoXLigsueAvaM2MBAht7g6v06ZYwNK8893ezGLatjV5ni9QO2PMC599ZdI0nWdZdgbQ4vsH\
            0NgLQLSn+FZ4/gY0cgJBELxCdHiEUF+AhlaAH9jWG0SleNOnDbr/iON4AlEloA9AAyvAiqIogPAooHcnwIJghqrFmTZOgJUkSQRRI6C1E\
            7huL8GbTmJ7Ky2w/PuWVIcOw3Daua2qi1NZQ20+i723XnurA/QQ0aJTRJ8J/oEuAFvNqcjWPwV4ibzM66Weeck+8YhTUNhm7xIPaUAhPt\
            CoVjGtLdxbMgK/zsCwMDRi5YrhsnaJcRQrHzkNrW1l0MXKNQeCy95rsXLDUeNK3EqsfOIQ8/0DLVWAeku9Du1rK6ehE1BfnNoavcwn7L3\
            tZO9eARIRLW4RvQA0+6DNwTHW6QAAAABJRU5ErkJggg=='

    def test_d_drag_and_drop(self):
        headers = {'content-type': 'application/json'}
        with self.app.test_request_context('drag_and_drop', method='POST'):
            response = self.client.post(
                '/api/archive/draganddrop/',
                data=json.dumps({'image_url': self.img_regular, 'mimetype': 'image/jpeg'}),
                headers=headers)

            self.assertEqual(response.status_code, 201)
            self.assertIsNotNone(response.data, True)

    def test_drag_and_drop_base64(self):
        headers = {'content-type': 'application/json'}
        with self.app.test_request_context('drag_and_drop', method='POST'):
            # test with jpeg base64 image
            response = self.client.post(
                '/api/archive/draganddrop/',
                data=json.dumps({'image_url': self.img_jpeg, 'mimetype': 'image/jpeg'}),
                headers=headers)
            self.assertEqual(response.status_code, 201)
            self.assertIsNotNone(response.data, True)

            # test with png base64 image
            response = self.client.post(
                '/api/archive/draganddrop/',
                data=json.dumps({'image_url': self.img_png, 'mimetype': 'image/png'}),
                headers=headers)
            self.assertEqual(response.status_code, 201)
            self.assertIsNotNone(response.data, True)

    def test_invalid_content(self):
        img_url = 'https://www.sourcefabric.org/'
        headers = {'content-type': 'application/json'}
        with self.app.test_request_context('drag_and_drop', method='POST'):
            response = self.client.post(
                '/api/archive/draganddrop/',
                data=json.dumps({'image_url': img_url, 'mimetype': 'image/jpeg'}),
                headers=headers)
            self.assertEqual(response.status_code, 406)


class ClientModuleTest(TestCase):
    def setUp(self):
        if not foo.setup_call:
            items.init_app(self.app)
            test_config = {
                'LIVEBLOG_DEBUG': True,
                'EMBED_PROTOCOL': 'http://'
            }
            self.app.config.update(test_config)
            self.client = self.app.test_client()
            self.items_service = get_resource_service('items')
            self.users_service = get_resource_service('users')
            self.app.register_blueprint(drag_and_drop_blueprint)

            self.item_meta_doc = {
                'meta': {
                    'provider_url': 'http://www.facebook.com',
                    'description': 'This teacher is amazing at pranking his class! 😂 😂',
                    'title': 'Daily Mail',
                    'author_name': 'Daily Mail',
                    'height': '350',
                    'thumbnail_width': 1080,
                    'width': '350',
                    'html': '<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.facebook.com%2Fplugin\
                    s%2Fvideo.php%3Fhref%3Dhttps%253A%252F%252Fwww.facebook.com%252FDailyMail%252Fvideos%252F2146147295445007%252F%26width%3D1080\
                    &amp;url=https%3A%2F%2Fwww.facebook.com%2FDailyMail%2Fvideos%2F2146147295445007%2F&amp;image=https%3A%2F%2Fscontent-iad3-1.xx.\
                    fbcdn.net%2Fv%2Ft15.0-10%2F17779781_2146151762111227_4585838175095619584_n.jpg%3F_nc_cat%3D0%26oh%3Ded34385514e6d30eac5c5cfe4b0\
                    44f1b%26oe%3D5B2A5C85&amp;key=82645d4daa7742cc891c21506d28235e&amp;type=text%2Fhtml&amp;\
                    schema=facebook" width="350" height="350" scrolling="no" frameborder="0" allowfullscreen="">\
                    </iframe><script>  if(window.FB !== undefined) {    \
                    window.FB.XFBML.parse(document.getElementById("_4x7jtrtep"));  }</script>',
                    'author_url': 'http://facebook.com/164305410295882',
                    'version': '1.0',
                    'provider_name': 'Facebook',
                    'thumbnail_url': 'https://scontent-iad3-1.xx.fbcdn.net/v/t15.0-10/17779781_2146151762111227_\
                    4585838175095619584_n.jpg?_nc_cat=0&oh=ed34385514e6d30eac5c5cfe4b044f1b&oe=5B2A5C85',
                    'type': 'video',
                    'thumbnail_height': 1080,
                    'original_url': 'https://www.facebook.com/DailyMail/videos/2146147295445007/',
                    'credit': 'Facebook | Daily Mail'
                },
                '_id': 'urn:newsml:localhost:2018-04-12T14:33:11.178189:2fe55c2b-399d-488f-a6f7-6c518f01d3f2'
            }

            self.item_doc = [{
                'blog': ObjectId('5ab90249fd16ad1752b39b74'),
                'text': 'Testing post for blog',
                'meta': {},
                'group_type': 'default',
                'item_type': 'text',
                '_updated': datetime.datetime(2018, 4, 12, 12, 40, 44),
                '_created': datetime.datetime(2018, 4, 12, 12, 40, 44),
                'type': 'text',
                'pubstatus': 'usable',
                'flags': {
                    'marked_for_not_publication': False,
                    'marked_for_legal': False,
                    'marked_archived_only': False,
                    'marked_for_sms': False
                },
                'format': 'HTML',
                'particular_type': 'item',
                '_current_version': 1
            }]

            self.user_list = [{
                'username': 'admin',
                'display_name': 'Edwin the admin',
                "first_name": "Edwin",
                "is_active": True,
                "is_enabled": True,
                "last_name": "the admin",
                'sign_off': 'off',
                'byline': 'by',
                "email": "abc@other.com",
            }]

            self.app.data.insert('users', self.user_list)

    def test_a_set_embed_metadata(self):
        result = self.items_service.set_embed_metadata(self.item_meta_doc)
        self.assertIsNotNone(result['meta']['original_id'], True)

    @patch('liveblog.items.items.logger')
    def test_b_set_embed_metadata(self, mock_logger):
        self.item_meta_doc['meta']['original_url'] = None
        self.items_service.set_embed_metadata(self.item_meta_doc)
        self.assertTrue(mock_logger.warning.called)

    def test_c_item_on_create(self):
        flask.g.user = get_resource_service('users').find_one(req=None, username='admin')
        self.assertIsNone(self.item_doc[0].get('original_creator'), True)
        self.assertIsNone(self.item_doc[0].get('firstcreated'), True)
        self.assertIsNone(self.item_doc[0].get('versioncreated'), True)
        response = self.items_service.on_create(self.item_doc)
        self.assertIsNotNone(response.get('original_creator'), True)
        self.assertIsNotNone(response.get('firstcreated'), True)
        self.assertIsNotNone(response.get('versioncreated'), True)

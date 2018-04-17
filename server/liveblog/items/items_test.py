import liveblog.items as items
from superdesk.tests import TestCase
from bson import ObjectId
from superdesk import get_resource_service
import datetime
from mock import patch
from liveblog.items.items import drag_and_drop_blueprint
import flask


class Foo():

    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call

foo = Foo()


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

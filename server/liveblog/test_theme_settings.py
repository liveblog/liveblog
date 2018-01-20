import unittest


class ThemeSettingsTestCase(unittest.TestCase):

    def setUp(self):
        self.default_theme_settings = {
            'datetimeFormat': 'lll', 'showDescription': False, 'showSyndicatedAuthor': False,
            'stickyPosition': 'bottom', 'gaCode': '', 'showGallery': False, 'removeStylesESI': False,
            'postsPerPage': 10, 'language': 'en', 'autoApplyUpdates': True, 'postOrder': 'editorial',
            'showTitle': False, 'blockSearchEngines': True, 'permalinkDelimiter': '?', 'showAuthor':
            True, 'renderForESI': False, 'canComment': False, 'showAuthorAvatar': True, 'showImage':
            False, 'authorNameFormat': 'display_name', 'hasHighlights': False, 'showUpdateDatetime':
            True, 'showLiveblogLogo': True, 'showUpdateDatetimetest': True}
        self.default_prev_theme_settings = {
            'datetimeFormat': '2018-01-18T16:33:24+05:30', 'showDescription': False,
            'showSyndicatedAuthor': False, 'stickyPosition': 'bottom', 'gaCode': '', 'showGallery':
            False, 'removeStylesESI': False, 'postsPerPage': 10, 'language': 'en', 'autoApplyUpdates':
            True, 'postOrder': 'editorial', 'showTitle': False, 'blockSearchEngines': True,
            'permalinkDelimiter': '?', 'showAuthor': True, 'renderForESI': False, 'canComment': False,
            'showAuthorAvatar': True, 'showImage': False, 'authorNameFormat': 'display_name',
            'hasHighlights': False, 'showUpdateDatetime': False, 'showLiveblogLogo': True}
        self.options = [{'name': 'datetimeFormat', 'default': 'lll'}, {'name': 'showUpdateDatetime', 'default':
                        False}, {'name': 'postsPerPage', 'default': 10}, {'name': 'postOrder', 'default':
                        'editorial'}, {'name': 'autoApplyUpdates', 'default': True}, {'name': 'canComment',
                        'default': False}, {'name': 'showImage', 'default': False}, {'name': 'showTitle',
                        'default': False}, {'name': 'showDescription', 'default': False}, {'name':
                        'showLiveblogLogo', 'default': True}, {'name': 'showAuthor', 'default': True}, {'name':
                        'authorNameFormat', 'default': 'display_name'}, {'name': 'showAuthorAvatar', 'default':
                        True}, {'name': 'hasHighlights', 'default': False}, {'name': 'permalinkDelimiter',
                        'default': '?'}, {'name': 'blockSearchEngines', 'default': True}, {'name': 'showGallery',
                        'default': False}, {'name': 'stickyPosition', 'default': 'bottom'}, {'name': 'gaCode',
                        'default': ''}, {'name': 'renderForESI', 'default': False}, {'name': 'removeStylesESI',
                        'default': False}, {'name': 'language', 'default': 'en'}, {'name': 'showSyndicatedAuthor',
                        'default': False}]

    # user settings ( modified values form default ) are kept
    def test_user_settings_kept(self):
        previous_theme = self.default_prev_theme_settings
        default_theme_settings = self.default_theme_settings
        old_theme_settings = {}
        for option in self.options:
            old_theme_settings[option.get('name')] = option.get('default')

        theme_settings = {}
        for key, value in old_theme_settings.items():
            if value == previous_theme[key]:
                theme_settings[key] = value
            else:
                default_theme_settings[key] = previous_theme[key]

        theme_settings.update(default_theme_settings)
        theme_settings.update(previous_theme)
        self.assertEqual(previous_theme.get('datetimeFormat'), theme_settings.get('datetimeFormat'))

    # changes in default override defaulted values
    def test_changes_in_default_override(self):
        default_theme_settings = self.default_theme_settings
        previous_theme = self.default_prev_theme_settings
        self.assertNotEqual(default_theme_settings, previous_theme)
        self.assertNotEqual(default_theme_settings.get('showUpdateDatetime'), previous_theme.get('showUpdateDatetime'))
        self.assertEqual(default_theme_settings.get('showUpdateDatetime'), True)

    # new settings are injected into the settings
    def test_new_settings_are_injected(self):
        previous_theme = self.default_prev_theme_settings
        old_theme_settings = {}
        for option in self.options:
            old_theme_settings[option.get('name')] = option.get('default')

        theme_settings = {}
        for key, value in old_theme_settings.items():
            if value == previous_theme[key]:
                theme_settings[key] = value
            else:
                self.default_theme_settings[key] = previous_theme[key]

        theme_settings.update(self.default_theme_settings)
        theme_settings.update(previous_theme)
        self.assertEqual(previous_theme.get('showUpdateDatetimetest'), None)
        self.assertEqual(self.default_theme_settings.get('showUpdateDatetimetest'), True)
        self.assertEqual(
            self.default_theme_settings.get('showUpdateDatetimetest'),
            theme_settings.get('showUpdateDatetimetest'))

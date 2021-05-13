classic_theme = {
    'name': 'classic',
    'version': '3.3.11',
    'extends': 'angular',
    'options': [
        {
            'name': 'language',
            'label': 'Theme language',
            'type': 'select',
            'options': [
                {
                    'value': 'en',
                    'label': 'English'
                },
                {
                    'value': 'fi',
                    'label': 'Finnish'
                },
                {
                    'value': 'de',
                    'label': 'Deutsch'
                },
                {
                    'value': 'fr',
                    'label': 'Français'
                },
                {
                    'value': 'nl',
                    'label': 'Nederlands'
                },
                {
                    'value': 'no',
                    'label': 'Norsk'
                },
                {
                    'value': 'cs',
                    'label': 'Čeština'
                },
                {
                    'value': 'ro',
                    'label': 'Română'
                }
            ],
            'default': 'en'
        },
        {
            'name': 'postsPerPage',
            'label': 'Number of posts per page',
            'type': 'number',
            'default': 10,
            'help': 'Set the number of posts you want to see per page'
        },
        {
            'name': 'datetimeFormattest',
            'label': 'Date time Format test',
            'type': 'datetimeFormattest',
            'default': 'lll',
            'help': 'Test'
        },
        {
            'name': 'postOrder',
            'label': 'Default posts order of the timeline',
            'type': 'select',
            'options': [
                {
                    'value': 'editorial',
                    'label': 'Editorial'
                },
                {
                    'value': 'newest_first',
                    'label': 'Newest first'
                },
                {
                    'value': 'oldest_first',
                    'label': 'Oldest first'
                }
            ],
            'default': 'editorial'
        },
        {
            'name': 'loadNewPostsManually',
            'label': 'User needs to click a button to retrieve the new posts',
            'type': 'checkbox',
            'default': True,
            'help': 'Otherwise they will be loaded periodically'
        },
        {
            'name': 'infinitScroll',
            'label': 'Use infinite scroll to load more pages',
            'type': 'checkbox',
            'default': True,
            'help': 'if true, more pages are automatically loaded \
            when the bottom of the page is reached. Otherwise a button is added at the bottom of the posts list'
        },
        {
            'name': 'showImage',
            'label': 'Show the blog image',
            'type': 'checkbox',
            'default': True
        },
        {
            'name': 'showTitle',
            'label': 'Show the blog title',
            'type': 'checkbox',
            'default': True
        },
        {
            'name': 'showDescription',
            'label': 'Show the blog description',
            'type': 'checkbox',
            'default': True
        },
        {
            'name': 'showAuthor',
            'label': 'Show author',
            'type': 'checkbox',
            'default': True,
            'help': 'Show the author information on posts'
        },
        {
            'name': 'showAuthorAvatar',
            'label': 'Show author avatar',
            'type': 'checkbox',
            'default': True,
            'dependsOn': {
                'showAuthor': True
            },
            'help': 'Show the author avatar on posts'
        },
        {
            'name': 'authorNameFormat',
            'label': 'Author name format',
            'type': 'select',
            'default': 'display_name',
            'dependsOn': {
                'showAuthor': True
            },
            'options': [
                {
                    'value': 'display_name',
                    'label': 'Full name'
                },
                {
                    'value': 'byline',
                    'label': 'Byline'
                },
                {
                    'value': 'sign_off',
                    'label': 'Sign off'
                }
            ],
            'help': 'How to show the author name'
        },
        {
            'name': 'authorNameLinksToEmail',
            'label': 'The author name links to email',
            'type': 'checkbox',
            'default': False,
            'dependsOn': {
                'showAuthor': True
            },
            'help': 'A click on the author name will create a new email to be sent to the author.'
        },
        {
            'name': 'permalinkDelimiter',
            'label': 'Permalink delimiter',
            'type': 'select',
            'options': [
                {
                    'value': '?',
                    'label': 'Query delimiter (?)'
                },
                {
                    'value': '#',
                    'label': ' Fragment identifier delimiter (#)'
                }
            ],
            'default': '?',
            'help': 'Sets the delimiter used to send the permalink. \
            ex: permalinkHashMark=?, http://example.com/?...'
        },
        {
            'name': 'canComment',
            'label': 'Users can comment',
            'type': 'checkbox',
            'default': False,
            'help': 'If the users can comment on the blog'
        },
        {
            'name': 'hasHighlights',
            'label': 'Display highlights',
            'type': 'checkbox',
            'default': False,
            'help': 'If the users see the highlight button in the blog'
        },
        {
            'name': 'blockSearchEngines',
            'label': 'Block search engines',
            'type': 'checkbox',
            'default': False,
            'help': 'Block search engines from indexing my blogs'
        },
        {
            'name': 'showGallery',
            'label': 'Show slideshow gallery',
            'type': 'checkbox',
            'default': False,
            'help': 'If the users will see the slideshow gallery for multiple images posts'
        },
        {
            'name': 'showSocialShare',
            'label': 'Show social sharing options',
            'type': 'checkbox',
            'default': True,
            'help': 'If the users will see the social sharing options'
        },
        {
            'name': 'livestream',
            'label': 'Pinned post behaviour',
            'type': 'select',
            'options': [
                {
                    'value': False,
                    'label': 'Show below menu bar'
                },
                {
                    'value': True,
                    'label': 'Show above menu bar'
                }
            ],
            'default': False
        },
        {
            'name': 'livestreamAutoplay',
            'label': 'Autoplay for livestream videos',
            'type': 'checkbox',
            'default': False,
            'help': 'if the users will see the video autoplay for livestream'
        },
        {
            'name': 'showSyndicatedAuthor',
            'label': 'Show syndicated author',
            'type': 'checkbox',
            'default': False,
            'help': 'If the users will see the syndicated author'
        }
    ]
}

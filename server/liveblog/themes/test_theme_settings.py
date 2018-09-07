import liveblog.themes as themeapp
import liveblog.blogs as blogapp
from superdesk.tests import TestCase
from bson import ObjectId
from superdesk import get_resource_service
import liveblog.blogs.embeds as embeds
from liveblog.blogs.embeds import embed_blueprint
import liveblog.client_modules as client_modules_app


class Foo():

    def __init__(self):
        self.setup_call = False

    def setup_called(self):
        self.setup_call = True
        return self.setup_call


foo = Foo()


class ThemeSettingsTestCase(TestCase):

    def setUp(self):
        if not foo.setup_call:
            # update configuration
            test_config = {
                'LIVEBLOG_DEBUG': True,
                'EMBED_PROTOCOL': 'http://',
                'CORS_ENABLED': False,
                'DEBUG': False,
            }
            self.app.config.update(test_config)
            foo.setup_called()
            themeapp.init_app(self.app)
            blogapp.init_app(self.app)
            client_modules_app.init_app(self.app)
            self.app.register_blueprint(embed_blueprint)
            self.client = self.app.test_client()

        self.themeservice = get_resource_service('themes')

        self.angular_theme = {
            'name': 'angular',
            'abstract': True,
            'version': '3.3.4',
            'options': [
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 10,
                    'help': 'Set the number of posts you want to see at the initialization'
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
                    'name': 'permalinkDelimiter',
                    'label': 'Permalink Delimiter',
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
                    'name': 'datetimeFormat',
                    'label': 'Date time Format',
                    'type': 'datetimeformat',
                    'default': 'lll',
                    'help': 'Sets the date time format to be used in the embed.\ Please \
                    enter a custom format in valid moment.js format http://momentjs.com/docs/#/parsing/string-format'
                },
                {
                    'name': 'datetimeFormattest',
                    'label': 'Date time Format test',
                    'type': 'datetimeFormattest',
                    'default': 'lll',
                    'help': 'Test'
                }
            ]
        }
        self.classic_theme = {
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
        self.default_theme = {
            'name': 'default',
            'version': '3.3.56',
            'asyncTheme': True,
            'seoTheme': True,
            'contributors': [
                'Paul Solbach <psolbach@dpa-newslab.com>',
                'Massimo Scamarcia <massimo.scamarcia@sourcefabric.org>',
                'Löic Nogues <loic.nogues@sourcefabric.org>',
                'Aleksandar Backo Jelicic <aleksandar.jelicic@sourcefabric.org>'
            ],
            'options': [
                {
                    'name': 'datetimeFormat',
                    'label': 'Date time Format',
                    'type': 'datetimeformat',
                    'default': 'lll',
                    'help': 'Sets the date time format to be used in the \
                    embed. Please enter a custom format in valid moment.js \
                    format http://momentjs.com/docs/#/parsing/string-format'
                },
                {
                    'name': 'showUpdateDatetime',
                    'label': 'Show post update time',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If activated, users will see an additional timestamp, when the post has been updated'
                },
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 20,
                    'help': 'Set the number of posts you initially want to show to your readers'
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
                    'label': 'Default posts order',
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
                    'name': 'autoApplyUpdates',
                    'label': 'All updates are auto-applied periodically',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Turn off to prompt user to load updates'
                },
                {
                    'name': 'canComment',
                    'label': 'Users can comment',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Enables a commenting form for users'
                },
                {
                    'name': 'showImage',
                    'label': 'Show the blog image',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showTitle',
                    'label': 'Show the blog title',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showDescription',
                    'label': 'Show the blog description',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showLiveblogLogo',
                    'label': 'Show Liveblog logo',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Turn off to hide the “powered by Live Blog” logo'
                },
                {
                    'name': 'showAuthor',
                    'label': 'Show the author',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Show the author information on posts'
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
                    'help': 'How to show the author info'
                },
                {
                    'name': 'showAuthorAvatar',
                    'label': 'Show author avatar',
                    'type': 'checkbox',
                    'default': True,
                    'dependsOn': {
                        'showAuthor': True
                    },
                    'help': 'Shows an author image besides the author name'
                },
                {
                    'name': 'hasHighlights',
                    'label': 'Show highlight button',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Introduces a button for the readers to filter the timeline by highlights'
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
                    'name': 'blockSearchEngines',
                    'label': 'Block search engines',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Will block search engines from indexing the blog content'
                },
                {
                    'name': 'showGallery',
                    'label': 'Show slideshow gallery',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Multiple image posts will show up as an image gallery'
                },
                {
                    'name': 'stickyPosition',
                    'label': 'Pinned post behaviour',
                    'type': 'select',
                    'options': [
                        {
                            'value': 'bottom',
                            'label': 'Show below menu bar'
                        },
                        {
                            'value': 'top',
                            'label': 'Show above menu bar'
                        }
                    ],
                    'default': 'bottom',
                    'help': 'Please note: Pinned posts above the menu bar will \
                  not show the author info nor a timestamp. This setting is \
                  especially useful if you want to show a (streaming) video on top of your timeline.'
                },
                {
                    'name': 'gaCode',
                    'label': 'Google analytics code',
                    'type': 'text',
                    'placeholder': 'UA-XXXXX-Y',
                    'default': '',
                    'help': 'Please enter your google analytics account ID.'
                },
                {
                    'name': 'renderForESI',
                    'label': 'Optimise the Live Blog output for ESI',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Strips the head and body tags from the Live Blog \
                    output to publish it using Edge Side Includes'
                },
                {
                    'name': 'removeStylesESI',
                    'label': 'Remove stylesheet from the Live Blog output for ESI',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Removes the link to the stylesheet from the Live \
                    Blog output to publish it using Edge Side Includes '
                },
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
                    'name': 'showSyndicatedAuthor',
                    'label': 'Show syndicated author',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If the users will see the syndicated author'
                },
                {
                    'name': 'clientDatetimeOnly',
                    'label': 'Show datetime only on client',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If the users will see the datetime only on client rendered'
                }
            ],
            'i18n': {
                'cs': {
                    'Highlights': 'Hlavní body',
                    'Comment by': 'Komentář',
                    'Powered by': 'Poháněno',
                    'Advertisement': 'reklama',
                    'Cancel': 'Zrušit',
                    'Comment': 'Váš příspěvek',
                    'Comment *': 'Text *',
                    'Comment should be maximum 300 characters in length': 'Maximální délka textu je 300 znaků',
                    'Editorial': 'redakční',
                    'Load more posts': 'Načíst další',
                    'Loading': 'Načítám',
                    'Name *': 'Jméno *',
                    'Name should be maximum 30 characters in length': 'Maximální délka jména je 30 znaků',
                    'Newest first': 'nejnovější',
                    'No posts for now': 'Žádné příspěvky',
                    'Oldest first': 'nejstarší',
                    'One pinned post': 'Jeden připnutý příspěvek',
                    'pinned posts': 'připnuté příspěvky',
                    'Post a comment': 'Otázka / komentář',
                    'See one new update': 'Zobraz 1 nový příspěvek',
                    'See new updates': 'Zobraz nové příspěvky',
                    'Send': 'Odeslat',
                    'Show all posts': 'Zobrazit všechny',
                    'Show highlighted post only': 'Zobraz jen zvýrazněné příspěvky',
                    'Sort by:': 'Řazení:',
                    'Updated': 'Aktualizace',
                    'Your comment was sent for approval': 'Váš text byl úspěšně odeslán Čeká na schválení',
                    'credit:': ' autor:'
                },
                'de': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Kommentar von',
                    'Powered by': 'Unterstützt von',
                    'Advertisement': 'Werbung',
                    'Cancel': 'Abbrechen',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar',
                    'Comment should be maximum 300 characters in length': 'Kommentar \
                        darf maximal 300 Zeichen lang sein',
                    'Editorial': 'Redaktionell',
                    'Load more posts': 'Weitere Beiträge',
                    'Loading': 'Lade',
                    'Name *': 'Name',
                    'Name should be maximum 30 characters in length': 'Name darf maximal 30 Zeichen lang sein',
                    'Newest first': 'Neueste zuerst',
                    'No posts for now': 'Kein Beitrag vorhanden',
                    'Oldest first': 'Älteste zuerst',
                    'One pinned post': 'Angehefteter Eintrag',
                    'pinned posts': 'Angeheftete Einträge',
                    'Please fill in your Comment': 'Bitte Kommentar hier eintragen',
                    'Please fill in your Name': 'Bitte Namen hier eintragen',
                    'Post a comment': 'Kommentar posten',
                    'See one new update': 'Neuen Beitrag anzeigen',
                    'See new updates': 'Neue Beiträge anzeigen',
                    'Send': 'Abschicken',
                    'Show all posts': 'Alle Beiträge anzeigen',
                    'Show highlighted post only': 'Anzeigen hervorgehoben Beitrag ist nur',
                    'Sort by:': 'Ordnen nach',
                    'Updated': 'Aktualisiert am',
                    'Your comment was sent for approval': 'Ihr Kommentar wartet auf Freischaltung',
                    'credit:': 'Bild:'
                },
                'fi': {
                    'Highlights': 'Kohokohtia',
                    'Comment by': 'Comment by',
                    'Powered by': 'Powered by',
                    'Advertisement': 'Mainos',
                    'Cancel': 'Peruuta',
                    'Comment': 'Kommentoi',
                    'Comment *': 'Kommentti *',
                    'Comment should be maximum 300 characters in length': 'Kommentin enimmäispituus on 300 merkkiä',
                    'Editorial': 'Toimituksellinen',
                    'Load more posts': 'Lataa lisää julkaisuja',
                    'Loading': 'Lataa',
                    'Name *': 'Nimi *',
                    'Name should be maximum 30 characters in length': 'Nimen enimmäispituus on 30 merkkiä',
                    'Newest first': 'Uusimmat ensin',
                    'No posts for now': 'Ei uusia julkaisuja',
                    'Oldest first': 'Vanhimmat ensin',
                    'One pinned post': 'Yksi kiinnitetty julkaisu',
                    'pinned posts': 'kiinnitettyä julkaisua',
                    'Please fill in your Comment': 'Lisää kommenttisi',
                    'Please fill in your Name': 'Lisää nimesi',
                    'Post a comment': 'Lähetä kommentti',
                    'See one new update': 'Lataa yksi uusi julkaisu',
                    'See new updates': 'Lataa uutta julkaisua',
                    'Send': 'Lähetä',
                    'Show all posts': 'Näytä kaikki julkaisut',
                    'Show highlighted post only': 'Näytä vain korostettu julkaisu',
                    'Sort by:': 'Järjestä:',
                    'Updated': 'Päivitetty',
                    'Your comment was sent for approval': 'Kommenttisi lähetettiin hyväksyttäväksi',
                    'credit:': '©'
                },
                'fr': {
                    'Highlights': 'Messages en surbrillance',
                    'Comment by': 'Commentaire de',
                    'Powered by': 'Alimenté par',
                    'Advertisement': 'Publicité',
                    'Cancel': 'Annuler',
                    'Comment': 'Commentaire',
                    'Comment *': 'Commentaire *',
                    'Comment should be maximum 300 characters in length': 'Un commentaire ne peut excéder 300 signes',
                    'Editorial': 'Éditorial',
                    'Load more posts': 'Afficher plus de messages',
                    'Loading': 'Chargement',
                    'Name *': 'Nom *',
                    'Name should be maximum 30 characters in length': 'Le nom ne peut excéder 30 signes',
                    'Newest first': "Le plus récent d'abord",
                    'No posts for now': 'Aucun message pour le moment',
                    'Oldest first': 'Plus ancien en premier',
                    'One pinned post': 'Voir le nouveau message',
                    'pinned posts': 'Voir nouveaux messages',
                    'Please fill in your Comment': 'Votre commentaire',
                    'Please fill in your Name': 'Votre nom',
                    'Post a comment': 'Envoyer un commentaire',
                    'See one new update': 'Voir le nouveau message',
                    'See new updates': 'Voir nouveaux messages',
                    'Send': 'Envoyer',
                    'Show all posts': 'Afficher tous les messages',
                    'Show highlighted post only': 'Afficher uniquement les messages en surbrillance',
                    'Sort by:': 'Trier par:',
                    'Updated': 'Mise à jour',
                    'Your comment was sent for approval': 'Votre commentaire \
                        a été envoyé et est en attente de validation',
                    'credit:': 'crédit:'
                },
                'nl': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Commentaar door',
                    'Powered by': 'Aangedreven door',
                    'Advertisement': 'Advertentie',
                    'Cancel': 'Annuleren',
                    'Comment': 'Reactie',
                    'Comment *': 'Tekst *',
                    'Comment should be maximum 300 characters in length': 'Uw reactie van maximaal 300 tekens',
                    'Editorial': 'Redactioneel',
                    'Load more posts': 'Meer',
                    'Loading': 'Laden',
                    'Name *': 'Naam *',
                    'Name should be maximum 30 characters in length': 'Uw naam kan maximaal 30 tekens lang zijn',
                    'Newest first': 'Toon nieuwste eerst',
                    'No posts for now': 'Nog geen berichten beschikbaar',
                    'Oldest first': 'Toon oudste eerst',
                    'One pinned post': 'Bekijk nieuw bericht',
                    'pinned posts': 'Bekijk nieuwe berichten',
                    'Please fill in your Comment': 'Uw reactie',
                    'Please fill in your Name': 'Vul hier uw naam in',
                    'Post a comment': 'Schrijf een reactie',
                    'See one new update': 'Bekijk nieuw bericht',
                    'See new updates': 'Bekijk nieuwe berichten',
                    'Send': 'Verzenden',
                    'Sort by:': 'Sorteer:',
                    'Your comment was sent for approval': 'Uw reactie is ontvangen ter beoordeling',
                    'credit:': 'credit:'
                },
                'no': {
                    'Highlights': 'Høydepunkter',
                    'Comment by': 'Kommentar av',
                    'Powered by': 'Drevet av',
                    'Advertisement': 'Annonse',
                    'Cancel': 'Avbryt',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar*',
                    'Comment should be maximum 300 characters in length': 'Kommentarer kan være inntil 300 tegn',
                    'Editorial': 'Redaksjonelt',
                    'Load more posts': 'Henter flere poster',
                    'Loading': 'Henter',
                    'Name *': 'Navn*',
                    'Name should be maximum 30 characters in length': 'Navn kan ikke ha mer enn 30 tegn',
                    'Newest first': 'Nyeste først',
                    'No posts for now': 'Ingen poster for øyeblikket',
                    'Oldest first': 'Eldste først',
                    'One pinned post': 'Én post festet til toppen',
                    'pinned posts': 'poster festet til toppen',
                    'Please fill in your Comment': 'Skriv inn din kommentar',
                    'Please fill in your Name': 'Skriv inn navn',
                    'Post a comment': 'Post en kommentar',
                    'See one new update': 'Se én ny oppdatering',
                    'See new updates': 'Se nye oppdateringer',
                    'Send': 'Send',
                    'Show all posts': 'Vis alle poster',
                    'Show highlighted post only': 'Vis bare høydepunkter',
                    'Sort by:': 'Sortér etter:',
                    'Updated': 'Oppdatert',
                    'Your comment was sent for approval': 'Din kommentar er sendt til godkjenning',
                    'credit:': 'credit:'
                },
                'ro': {
                    'Highlights': 'Repere',
                    'Comment by': 'Comentariu de',
                    'Powered by': 'Cu sprijinul',
                    'Advertisement': 'Reclamă',
                    'Cancel': 'Anulează',
                    'Comment': 'Comentează',
                    'Comment *': 'Comentariu *',
                    'Comment should be maximum 300 characters in length': 'Comentariu \
                        nu poate fi mai lung de 300 de caractere',
                    'Editorial': 'Editorial',
                    'Load more posts': 'Încarcă mai multe posturi',
                    'Loading': 'Se încarcă',
                    'Name *': 'Numele *',
                    'Name should be maximum 30 characters in length': 'Numele nu poate fi mai lung de 30 de caractere',
                    'Newest first': 'Cele mai noi',
                    'No posts for now': 'Deocamdata nu sunt articole',
                    'Oldest first': 'Cele mai vechi',
                    'One pinned post': 'Vezi un articol nou',
                    'pinned posts': 'Vezi articole noi',
                    'Please fill in your Comment': 'Completează comentariu',
                    'Please fill in your Name': 'Completează numele',
                    'Post a comment': 'Scrie un comentariu',
                    'See one new update': 'Vezi un articol nou',
                    'See new updates': 'Vezi articole noi',
                    'Send': 'Trimite',
                    'Sort by:': 'Ordonează după:',
                    'Your comment was sent for approval': 'Comentariul tău a fost trimis spre aprobare',
                    'credit:': 'credit:'
                }
            }
        }
        self.amp_theme = {
            'name': 'amp',
            'version': '3.3.22',
            'seoTheme': True,
            'ampTheme': True,
            'extends': 'default',
            'onlyOwnCss': 'true',
            'contributors': [
                'Massimo Scamarcia <massimo.scamarcia@sourcefabric.org>',
                'Aleksandar Backo Jelicic <aleksandar.jelicic@sourcefabric.org>',
                'Tomasz Rondio <tomasz.rondio@sourcefabric.org>'
            ],
            'options': [
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 110,
                    'help': 'Be aware that paging is not yet available for the Liveblog 3 AMP theme'
                },
                {
                    'name': 'datetimeFormattest',
                    'label': 'Date time Format test',
                    'type': 'datetimeFormattest',
                    'default': 'lll',
                    'help': 'Test'
                },
                {
                    'name': 'canComment',
                    'type': None
                },
                {
                    'name': 'autoApplyUpdates',
                    'type': None
                },
                {
                    'name': 'hasHighlights',
                    'type': None
                },
                {
                    'name': 'permalinkDelimiter',
                    'type': None
                },
                {
                    'name': 'stickyPosition',
                    'type': None
                }
            ],
            'i18n': {
                'cs': {
                    'Highlights': 'Hlavní body',
                    'Comment by': 'Komentář',
                    'Powered by': 'Poháněno',
                    'Advertisement': 'reklama',
                    'Cancel': 'Zrušit',
                    'Comment': 'Váš příspěvek',
                    'Comment *': 'Text *',
                    'Comment should be maximum 300 characters in length': 'Maximální délka textu je 300 znaků',
                    'Editorial': 'redakční',
                    'Load more posts': 'Načíst další',
                    'Loading': 'Načítám',
                    'Name *': 'Jméno *',
                    'Name should be maximum 30 characters in length': 'Maximální délka jména je 30 znaků',
                    'Newest first': 'nejnovější',
                    'No posts for now': 'Žádné příspěvky',
                    'Oldest first': 'nejstarší',
                    'One pinned post': 'Jeden připnutý příspěvek',
                    'pinned posts': 'připnuté příspěvky',
                    'Post a comment': 'Otázka / komentář',
                    'See one new update': 'Zobraz 1 nový příspěvek',
                    'See new updates': 'Zobraz nové příspěvky',
                    'Send': 'Odeslat',
                    'Show all posts': 'Zobrazit všechny',
                    'Show highlighted post only': 'Zobraz jen zvýrazněné příspěvky',
                    'Sort by:': 'Řazení:',
                    'Updated': 'Aktualizace',
                    'Your comment was sent for approval': 'Váš text byl úspěšně odeslán Čeká na schválení',
                    'credit:': 'autor:'
                },
                'de': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Kommentar von',
                    'Powered by': 'Unterstützt von',
                    'Advertisement': 'Werbung',
                    'Cancel': 'Abbrechen',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar',
                    'Comment should be maximum 300 characters in length': 'Kommentar \
                        darf maximal 300 Zeichen lang sein',
                    'Editorial': 'Redaktionell',
                    'Load more posts': 'Mehr Einträge laden',
                    'Loading': 'Lade',
                    'Name *': 'Name',
                    'Name should be maximum 30 characters in length': 'Name darf maximal 30 Zeichen lang sein',
                    'Newest first': 'Neueste zuerst',
                    'No posts for now': 'Kein Beitrag vorhanden',
                    'Oldest first': 'Älteste zuerst',
                    'One pinned post': 'Angehefteter Eintrag',
                    'pinned posts': 'Angeheftete Einträge',
                    'Please fill in your Comment': 'Bitte Kommentar hier eintragen',
                    'Please fill in your Name': 'Bitte Namen hier eintragen',
                    'Post a comment': 'Kommentar posten',
                    'See one new update': 'Neuen Beitrag anzeigen',
                    'See new updates': 'Neue Beiträge anzeigen',
                    'Send': 'Abschicken',
                    'Show all posts': 'Alle Beiträge anzeigen',
                    'Show highlighted post only': 'Anzeigen hervorgehoben Beitrag ist nur',
                    'Sort by:': 'Ordnen nach',
                    'Updated': 'Aktualisiert am',
                    'Your comment was sent for approval': 'Ihr Kommentar wartet auf Freischaltung',
                    'credit:': 'Bild:'
                },
                'fi': {
                    'Highlights': 'Kohokohtia',
                    'Comment by': 'Comment by',
                    'Powered by': 'Powered by',
                    'Advertisement': 'Mainos',
                    'Cancel': 'Peruuta',
                    'Comment': 'Kommentoi',
                    'Comment *': 'Kommentti *',
                    'Comment should be maximum 300 characters in length': 'Kommentin enimmäispituus on 300 merkkiä',
                    'Editorial': 'Toimituksellinen',
                    'Load more posts': 'Lataa lisää julkaisuja',
                    'Loading': 'Lataa',
                    'Name *': 'Nimi *',
                    'Name should be maximum 30 characters in length': 'Nimen enimmäispituus on 30 merkkiä',
                    'Newest first': 'Uusimmat ensin',
                    'No posts for now': 'Ei uusia julkaisuja',
                    'Oldest first': 'Vanhimmat ensin',
                    'One pinned post': 'Yksi kiinnitetty julkaisu',
                    'pinned posts': 'kiinnitettyä julkaisua',
                    'Please fill in your Comment': 'Lisää kommenttisi',
                    'Please fill in your Name': 'Lisää nimesi',
                    'Post a comment': 'Lähetä kommentti',
                    'See one new update': 'Lataa yksi uusi julkaisu',
                    'See new updates': 'Lataa uutta julkaisua',
                    'Send': 'Lähetä',
                    'Show all posts': 'Näytä kaikki julkaisut',
                    'Show highlighted post only': 'Näytä vain korostettu julkaisu',
                    'Sort by:': 'Järjestä:',
                    'Updated': 'Päivitetty',
                    'Your comment was sent for approval': 'Kommenttisi lähetettiin hyväksyttäväksi',
                    'credit:': '©'
                },
                'fr': {
                    'Highlights': 'Messages en surbrillance',
                    'Comment by': 'Commentaire de',
                    'Powered by': 'Alimenté par',
                    'Advertisement': 'Publicité',
                    'Cancel': 'Annuler',
                    'Comment': 'Commentaire',
                    'Comment *': 'Commentaire *',
                    'Comment should be maximum 300 characters in length': 'Un commentaire ne peut excéder 300 signes',
                    'Editorial': 'Éditorial',
                    'Load more posts': 'Afficher plus de messages',
                    'Loading': 'Chargement',
                    'Name *': 'Nom *',
                    'Name should be maximum 30 characters in length': 'Le nom ne peut excéder 30 signes',
                    'Newest first': "Le plus récent d'abord",
                    'No posts for now': 'Aucun message pour le moment',
                    'Oldest first': 'Plus ancien en premier',
                    'One pinned post': 'Voir le nouveau message',
                    'pinned posts': 'Voir nouveaux messages',
                    'Please fill in your Comment': 'Votre commentaire',
                    'Please fill in your Name': 'Votre nom',
                    'Post a comment': 'Envoyer un commentaire',
                    'See one new update': 'Voir le nouveau message',
                    'See new updates': 'Voir nouveaux messages',
                    'Send': 'Envoyer',
                    'Show all posts': 'Afficher tous les messages',
                    'Show highlighted post only': 'Afficher uniquement les messages en surbrillance',
                    'Sort by:': 'Trier par:',
                    'Updated': 'Mise à jour',
                    'Your comment was sent for approval': 'Votre commentaire \
                        a été envoyé et est en attente de validation',
                    'credit:': 'crédit:'
                },
                'nl': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Commentaar door',
                    'Powered by': 'Aangedreven door',
                    'Advertisement': 'Advertentie',
                    'Cancel': 'Annuleren',
                    'Comment': 'Reactie',
                    'Comment *': 'Tekst *',
                    'Comment should be maximum 300 characters in length': 'Uw reactie van maximaal 300 tekens',
                    'Editorial': 'Redactioneel',
                    'Load more posts': 'Meer',
                    'Loading': 'Laden',
                    'Name *': 'Naam *',
                    'Name should be maximum 30 characters in length': 'Uw naam kan maximaal 30 tekens lang zijn',
                    'Newest first': 'Toon nieuwste eerst',
                    'No posts for now': 'Nog geen berichten beschikbaar',
                    'Oldest first': 'Toon oudste eerst',
                    'One pinned post': 'Bekijk nieuw bericht',
                    'pinned posts': 'Bekijk nieuwe berichten',
                    'Please fill in your Comment': 'Uw reactie',
                    'Please fill in your Name': 'Vul hier uw naam in',
                    'Post a comment': 'Schrijf een reactie',
                    'See one new update': 'Bekijk nieuw bericht',
                    'See new updates': 'Bekijk nieuwe berichten',
                    'Send': 'Verzenden',
                    'Sort by:': 'Sorteer:',
                    'Your comment was sent for approval': 'Uw reactie is ontvangen ter beoordeling',
                    'credit:': 'credit:'
                },
                'no': {
                    'Highlights': 'Høydepunkter',
                    'Comment by': 'Kommentar av',
                    'Powered by': 'Drevet av',
                    'Advertisement': 'Annonse',
                    'Cancel': 'Avbryt',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar*',
                    'Comment should be maximum 300 characters in length': 'Kommentarer kan være inntil 300 tegn',
                    'Editorial': 'Redaksjonelt',
                    'Load more posts': 'Henter flere poster',
                    'Loading': 'Henter',
                    'Name *': 'Navn*',
                    'Name should be maximum 30 characters in length': 'Navn kan ikke ha mer enn 30 tegn',
                    'Newest first': 'Nyeste først',
                    'No posts for now': 'Ingen poster for øyeblikket',
                    'Oldest first': 'Eldste først',
                    'One pinned post': 'Én post festet til toppen',
                    'pinned posts': 'poster festet til toppen',
                    'Please fill in your Comment': 'Skriv inn din kommentar',
                    'Please fill in your Name': 'Skriv inn navn',
                    'Post a comment': 'Post en kommentar',
                    'See one new update': 'Se én ny oppdatering',
                    'See new updates': 'Se nye oppdateringer',
                    'Send': 'Send',
                    'Show all posts': 'Vis alle poster',
                    'Show highlighted post only': 'Vis bare høydepunkter',
                    'Sort by:': 'Sortér etter:',
                    'Updated': 'Oppdatert',
                    'Your comment was sent for approval': 'Din kommentar er sendt til godkjenning',
                    'credit:': 'credit:'
                },
                'ro': {
                    'Highlights': 'Repere',
                    'Comment by': 'Comentariu de',
                    'Powered by': 'Cu sprijinul',
                    'Advertisement': 'Reclamă',
                    'Cancel': 'Anulează',
                    'Comment': 'Comentează',
                    'Comment *': 'Comentariu *',
                    'Comment should be maximum 300 characters in length': 'Comentariu \
                        nu poate fi mai lung de 300 de caractere',
                    'Editorial': 'Editorial',
                    'Load more posts': 'Încarcă mai multe posturi',
                    'Loading': 'Se încarcă',
                    'Name *': 'Numele *',
                    'Name should be maximum 30 characters in length': 'Numele nu poate fi mai lung de 30 de caractere',
                    'Newest first': 'Cele mai noi',
                    'No posts for now': 'Deocamdata nu sunt articole',
                    'Oldest first': 'Cele mai vechi',
                    'One pinned post': 'Vezi un articol nou',
                    'pinned posts': 'Vezi articole noi',
                    'Please fill in your Comment': 'Completează comentariu',
                    'Please fill in your Name': 'Completează numele',
                    'Post a comment': 'Scrie un comentariu',
                    'See one new update': 'Vezi un articol nou',
                    'See new updates': 'Vezi articole noi',
                    'Send': 'Trimite',
                    'Sort by:': 'Ordonează după:',
                    'Your comment was sent for approval': 'Comentariul tău a fost trimis spre aprobare',
                    'credit:': 'credit:'
                }
            }
        }
        # Create themes
        self.themeservice.save_or_update_theme(self.angular_theme)
        self.themeservice.save_or_update_theme(self.classic_theme)
        self.themeservice.save_or_update_theme(self.default_theme)
        self.themeservice.save_or_update_theme(self.amp_theme)

        self.blogs_list = [{
            "_created": "2018-03-27T12:04:58+00:00",
            "_etag": "b962afec2413ddf43fcf0273a1a422a2fec1e34d",
            "_id": "5aba336a4d003d61e663eeeb",
            "_links": {
                "self": {
                    "href": "blogs/5aba336a4d003d61e663eeeb",
                    "title": "Blog"
                }
            },
            "_type": "blogs",
            "_updated": "2018-04-03T05:54:32+00:00",
            "blog_preferences": {
                "language": "en",
                "theme": "classic"
            },
            "blog_status": "open",
            "category": "",
            "description": "title: end to end Five",
            "firstcreated": "2018-03-27T12:04:58+00:00",
            "last_created_post": {
                "_id": "urn:newsml:localhost:2018-04-03T11:24:32.101496:a50ef9ff-6f85-4d9c-8d29-b8d294d46b85",
                "_updated": "2018-04-03T05:54:32+00:00"
            },
            "last_updated_post": {
                "_id": "urn:newsml:localhost:2018-04-03T11:12:52.153339:7eb09046-fa61-4a00-9007-1596ad484a1d",
                "_updated": "2018-04-03T05:43:12+00:00"
            },
            "market_enabled": False,
            "members": [],
            "original_creator": "5a9f82dc4d003d1469bbc22d",
            "picture": "urn:newsml:localhost:2018-03-27T17:34:58.093848:973b4459-5511-45fc-9bfe-4855159ea917",
            "picture_renditions": {
                "baseImage": {
                    "height": 1075,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c13/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c13",
                    "mimetype": "image/jpeg",
                    "width": 1920
                },
                "original": {
                    "height": 168,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0d/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c0d",
                    "mimetype": "image/jpeg",
                    "width": 300
                },
                "thumbnail": {
                    "height": 268,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c11/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c11",
                    "mimetype": "image/jpeg",
                    "width": 480
                },
                "viewImage": {
                    "height": 716,
                    "href": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
                    "media": "5aba336a4d003d44ee714c0f",
                    "mimetype": "image/jpeg",
                    "width": 1280
                }
            },
            "picture_url": "http://localhost:5000/api/upload/5aba336a4d003d44ee714c0f/raw?_schema=http",
            "posts_order_sequence": 3,
            "public_url": "http://localhost:5000/embed/5aba336a4d003d61e663eeeb/",
            "public_urls": {
                "output": {},
                "theme": {}
            },
            "start_date": "2018-03-27T12:04:58+00:00",
            "syndication_enabled": 'False',
            "theme_settings": {
                "authorNameFormat": "display_name",
                "authorNameLinksToEmail": False,
                "blockSearchEngines": False,
                "canComment": False,
                "datetimeFormat": "lll",
                "hasHighlights": False,
                "infinitScroll": True,
                "language": "en",
                "livestream": False,
                "livestreamAutoplay": False,
                "loadNewPostsManually": True,
                "permalinkDelimiter": "?",
                "postOrder": "editorial",
                "postsPerPage": 20,
                "showAuthor": True,
                "showAuthorAvatar": True,
                "showDescription": True,
                "showGallery": False,
                "showImage": True,
                "showSocialShare": True,
                "showSyndicatedAuthor": False,
                "showTitle": True
            },
            "title": "title: end to end Five",
            "total_posts": 3,
            "versioncreated": "2018-03-27T12:04:58+00:00"
        }, {
            "_created": "2018-03-30T10:24:33+00:00",
            "_etag": "8f96666a3d97401979a79bda82886dd12cc6f272",
            "_id": "5abe10614d003d5f22ce005e",
            "_links": {
                "collection": {
                    "href": "client_blogs",
                    "title": "client_blogs"
                },
                "parent": {
                    "href": "/",
                    "title": "home"
                },
                "self": {
                    "href": "client_blogs/5abe10614d003d5f22ce005e",
                    "title": "Client_blog"
                }
            },
            "_updated": "2018-04-05T09:59:24+00:00",
            "blog_preferences": {
                "language": "en",
                "theme": "default"
            },
            "blog_status": "open",
            "category": "",
            "description": "title: end to end Seven",
            "last_created_post": {
                "_id": "urn:newsml:localhost:2018-03-30T17:33:03.199625:540fb5c8-6119-4927-8b55-9c47bbb9f942",
                "_updated": "2018-03-30T12:03:03+00:00"
            },
            "last_updated_post": {
                "_id": "urn:newsml:localhost:2018-03-30T17:33:03.199625:540fb5c8-6119-4927-8b55-9c47bbb9f942",
                "_updated": "2018-04-03T05:37:16+00:00"
            },
            "market_enabled": False,
            "members": [],
            "original_creator": "5a9f82dc4d003d1469bbc22d",
            "picture": "urn:newsml:localhost:2018-03-30T15:54:33.260459:e093556c-a237-481b-b90d-c4570e0d8476",
            "picture_renditions": {
                "baseImage": {
                    "height": 1080,
                    "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc03/raw?_schema=http",
                    "media": "5abe10614d003d5f1cf9dc03",
                    "mimetype": "image/jpeg",
                    "width": 1717
                },
                "original": {
                    "height": 178,
                    "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dbff/raw?_schema=http",
                    "media": "5abe10614d003d5f1cf9dbff",
                    "mimetype": "image/jpeg",
                    "width": 283
                },
                "thumbnail": {
                    "height": 301,
                    "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc05/raw?_schema=http",
                    "media": "5abe10614d003d5f1cf9dc05",
                    "mimetype": "image/jpeg",
                    "width": 480
                },
                "viewImage": {
                    "height": 720,
                    "href": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc01/raw?_schema=http",
                    "media": "5abe10614d003d5f1cf9dc01",
                    "mimetype": "image/jpeg",
                    "width": 1144
                }
            },
            "picture_url": "http://localhost:5000/api/upload/5abe10614d003d5f1cf9dc01/raw?_schema=http",
            "posts_order_sequence": 6,
            "public_url": "http://localhost:5000/embed/5abe10614d003d5f22ce005e/",
            "public_urls": {
                "output": {},
                "theme": {}
            },
            "start_date": "2018-03-30T10:24:33+00:00",
            "syndication_enabled": False,
            "theme_settings": {
                "authorNameFormat": "display_name",
                "authorNameLinksToEmail": False,
                "autoApplyUpdates": True,
                "blockSearchEngines": True,
                "canComment": False,
                "clientDatetimeOnly": False,
                "datetimeFormat": "lll",
                "gaCode": "",
                "hasHighlights": False,
                "infinitScroll": True,
                "language": "en",
                "livestream": False,
                "livestreamAutoplay": False,
                "loadNewPostsManually": True,
                "permalinkDelimiter": "?",
                "postOrder": "editorial",
                "postsPerPage": 10,
                "removeStylesESI": False,
                "renderForESI": False,
                "showAuthor": True,
                "showAuthorAvatar": True,
                "showDescription": False,
                "showGallery": False,
                "showImage": False,
                "showLiveblogLogo": True,
                "showSocialShare": True,
                "showSyndicatedAuthor": False,
                "showTitle": False,
                "showUpdateDatetime": False,
                "stickyPosition": "bottom"
            },
            "title": "title: end to end Seven",
            "total_posts": 6,
            "version_creator": "5a9f82dc4d003d1469bbc22d",
            "versioncreated": "2018-04-05T09:29:37+00:00"
        }]

        self.blogs_service = get_resource_service('blogs')
        self.client_blog_service = get_resource_service('client_blogs')

        # Create blogs
        self.app.data.insert('blogs', self.blogs_list)

    def test_a_angular_save_theme_settings(self):
        angular_previous_theme = {
            '_id': ObjectId('5abc9d69fd16ad1ba3e92689'),
            'name': 'angular',
            'abstract': True,
            'version': '3.3.4',
            'options': [
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 20,
                    'help': 'Set the number of posts you want to see at the initialization'
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
                    'name': 'permalinkDelimiter',
                    'label': 'Permalink Delimiter',
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
                    'name': 'datetimeFormat',
                    'label': 'Date time Format',
                    'type': 'datetimeformat',
                    'default': 'lll',
                    'help': 'Sets the date time format to be used in the embed.\
                     Please enter a custom format in valid moment.js format \
                     http://momentjs.com/docs/#/parsing/string-format'
                }
            ],
            'settings': {
                'postsPerPage': 20,
                'postOrder': 'editorial',
                'permalinkDelimiter': '?',
                'datetimeFormat': '2018-03-29T13:35:51+05:30'
            },
            '_etag': '1b1239c1a88e3386226e84260bfd7c4d1c5e96c7'
        }
        angular_result = self.themeservice._save_theme_settings(self.angular_theme, angular_previous_theme)
        # Keep user settings, saved by user in database
        self.assertEqual(
            angular_previous_theme.get('settings').get('datetimeFormat'), angular_result[0].get('datetimeFormat'))
        # Override the default value present in theme
        self.assertNotEqual(angular_result[1], angular_previous_theme.get('settings'))
        self.assertNotEqual(
            angular_result[1].get('postsPerPage'), angular_previous_theme.get('settings').get('postsPerPage'))
        # Injected new value in theme
        self.assertNotEqual(len(angular_result[1]), len(angular_previous_theme.get('settings')))
        self.assertFalse(angular_previous_theme.get('datetimeFormattest'))
        self.assertTrue(angular_result[1].get('datetimeFormattest'))

    def test_c_classic_save_theme_settings(self):
        # assert self.test_a_angular_save_theme_settings()
        classic_previous_theme = {
            '_id': ObjectId('5abcbf73fd16ad623375bfa3'),
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
                    'default': 20,
                    'help': 'Set the number of posts you want to see per page'
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
                    'help': 'if true, more pages are automatically loaded when the \
                    bottom of the page is reached. Otherwise a button is added at the bottom of the posts list'
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
            ],
            '_etag': 'eae938b66f3d4dcafd46165eb0a2976c7b884a98',
            'settings': {
                'datetimeFormat': '2018-03-29T15:57:08+05:30',
                'language': 'en',
                'postsPerPage': 20,
                'postOrder': 'editorial',
                'loadNewPostsManually': True,
                'infinitScroll': True,
                'showImage': True,
                'showTitle': True,
                'showDescription': True,
                'showAuthor': True,
                'showAuthorAvatar': True,
                'authorNameFormat': 'display_name',
                'authorNameLinksToEmail': False,
                'permalinkDelimiter': '?',
                'canComment': False,
                'hasHighlights': False,
                'blockSearchEngines': False,
                'showGallery': False,
                'showSocialShare': True,
                'livestream': False,
                'livestreamAutoplay': False,
                'showSyndicatedAuthor': False
            }
        }
        classic_result = self.themeservice._save_theme_settings(self.classic_theme, classic_previous_theme)
        # Keep user settings, saved by user in database
        self.assertEqual(
            classic_previous_theme.get('settings').get('datetimeFormat'), classic_result[0].get('datetimeFormat'))
        # Override the default value present in theme
        self.assertNotEqual(classic_result[1], classic_previous_theme.get('settings'))
        self.assertNotEqual(
            classic_result[1].get('postsPerPage'), classic_previous_theme.get('settings').get('postsPerPage'))
        # Injected new value in theme
        self.assertNotEqual(len(classic_result[1]), len(classic_previous_theme.get('settings')))
        self.assertFalse(classic_previous_theme.get('datetimeFormattest'))
        self.assertTrue(classic_result[1].get('datetimeFormattest'))

    def test_b_default_save_theme_settings(self):
        default_previous_theme = {
            '_id': ObjectId('5abcd99afd16ad7de3d3f34a'),
            'name': 'default',
            'version': '3.3.56',
            'asyncTheme': True,
            'seoTheme': True,
            'options': [
                {
                    'name': 'datetimeFormat',
                    'label': 'Date time Format',
                    'type': 'datetimeformat',
                    'default': 'lll',
                    'help': 'Sets the date time format to be used in the \
                    embed. Please enter a custom format in valid moment.js \
                    format http://momentjs.com/docs/#/parsing/string-format'
                },
                {
                    'name': 'showUpdateDatetime',
                    'label': 'Show post update time',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If activated, users will see an additional timestamp, when the post has been updated'
                },
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 10,
                    'help': 'Set the number of posts you initially want to show to your readers'
                },
                {
                    'name': 'postOrder',
                    'label': 'Default posts order',
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
                    'name': 'autoApplyUpdates',
                    'label': 'All updates are auto-applied periodically',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Turn off to prompt user to load updates'
                },
                {
                    'name': 'canComment',
                    'label': 'Users can comment',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Enables a commenting form for users'
                },
                {
                    'name': 'showImage',
                    'label': 'Show the blog image',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showTitle',
                    'label': 'Show the blog title',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showDescription',
                    'label': 'Show the blog description',
                    'type': 'checkbox',
                    'default': False
                },
                {
                    'name': 'showLiveblogLogo',
                    'label': 'Show Liveblog logo',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Turn off to hide the “powered by Live Blog” logo'
                },
                {
                    'name': 'showAuthor',
                    'label': 'Show the author',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Show the author information on posts'
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
                    'help': 'How to show the author info'
                },
                {
                    'name': 'showAuthorAvatar',
                    'label': 'Show author avatar',
                    'type': 'checkbox',
                    'default': True,
                    'dependsOn': {
                        'showAuthor': True
                    },
                    'help': 'Shows an author image besides the author name'
                },
                {
                    'name': 'hasHighlights',
                    'label': 'Show highlight button',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Introduces a button for the readers to filter the timeline by highlights'
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
                    'name': 'blockSearchEngines',
                    'label': 'Block search engines',
                    'type': 'checkbox',
                    'default': True,
                    'help': 'Will block search engines from indexing the blog content'
                },
                {
                    'name': 'showGallery',
                    'label': 'Show slideshow gallery',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Multiple image posts will show up as an image gallery'
                },
                {
                    'name': 'stickyPosition',
                    'label': 'Pinned post behaviour',
                    'type': 'select',
                    'options': [
                        {
                            'value': 'bottom',
                            'label': 'Show below menu bar'
                        },
                        {
                            'value': 'top',
                            'label': 'Show above menu bar'
                        }
                    ],
                    'default': 'bottom',
                    'help': 'Please note: Pinned posts above the menu bar will \
                    not show the author info nor a timestamp. This setting is \
                    especially useful if you want to show a (streaming) video on top of your timeline.'
                },
                {
                    'name': 'gaCode',
                    'label': 'Google analytics code',
                    'type': 'text',
                    'placeholder': 'UA-XXXXX-Y',
                    'default': '',
                    'help': 'Please enter your google analytics account ID.'
                },
                {
                    'name': 'renderForESI',
                    'label': 'Optimise the Live Blog output for ESI',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Strips the head and body tags from the Live \
                    Blog output to publish it using Edge Side Includes'
                },
                {
                    'name': 'removeStylesESI',
                    'label': 'Remove stylesheet from the Live Blog output for ESI',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'Removes the link to the stylesheet from the \
                    Live Blog output to publish it using Edge Side Includes '
                },
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
                    'name': 'showSyndicatedAuthor',
                    'label': 'Show syndicated author',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If the users will see the syndicated author'
                },
                {
                    'name': 'clientDatetimeOnly',
                    'label': 'Show datetime only on client',
                    'type': 'checkbox',
                    'default': False,
                    'help': 'If the users will see the datetime only on client rendered'
                }
            ],
            'i18n': {
                'cs': {
                    'Highlights': 'Hlavní body',
                    'Comment by': 'Komentář',
                    'Powered by': 'Poháněno',
                    'Advertisement': 'reklama',
                    'Cancel': 'Zrušit',
                    'Comment': 'Váš příspěvek',
                    'Comment *': 'Text *',
                    'Comment should be maximum 300 characters in length': 'Maximální délka textu je 300 znaků',
                    'Editorial': 'redakční',
                    'Load more posts': 'Načíst další',
                    'Loading': 'Načítám',
                    'Name *': 'Jméno *',
                    'Name should be maximum 30 characters in length': 'Maximální délka jména je 30 znaků',
                    'Newest first': 'nejnovější',
                    'No posts for now': 'Žádné příspěvky',
                    'Oldest first': 'nejstarší',
                    'One pinned post': 'Jeden připnutý příspěvek',
                    'pinned posts': 'připnuté příspěvky',
                    'Post a comment': 'Otázka / komentář',
                    'See one new update': 'Zobraz 1 nový příspěvek',
                    'See new updates': 'Zobraz nové příspěvky',
                    'Send': 'Odeslat',
                    'Show all posts': 'Zobrazit všechny',
                    'Show highlighted post only': 'Zobraz jen zvýrazněné příspěvky',
                    'Sort by:': 'Řazení:',
                    'Updated': 'Aktualizace',
                    'Your comment was sent for approval': 'Váš text byl úspěšně odeslán Čeká na schválení',
                    'credit:': ' autor:'
                },
                'de': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Kommentar von',
                    'Powered by': 'Unterstützt von',
                    'Advertisement': 'Werbung',
                    'Cancel': 'Abbrechen',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar',
                    'Comment should be maximum 300 characters in length': 'Kommentar \
                    darf maximal 300 Zeichen lang sein',
                    'Editorial': 'Redaktionell',
                    'Load more posts': 'Weitere Beiträge',
                    'Loading': 'Lade',
                    'Name *': 'Name',
                    'Name should be maximum 30 characters in length': 'Name darf maximal 30 Zeichen lang sein',
                    'Newest first': 'Neueste zuerst',
                    'No posts for now': 'Kein Beitrag vorhanden',
                    'Oldest first': 'Älteste zuerst',
                    'One pinned post': 'Angehefteter Eintrag',
                    'pinned posts': 'Angeheftete Einträge',
                    'Please fill in your Comment': 'Bitte Kommentar hier eintragen',
                    'Please fill in your Name': 'Bitte Namen hier eintragen',
                    'Post a comment': 'Kommentar posten',
                    'See one new update': 'Neuen Beitrag anzeigen',
                    'See new updates': 'Neue Beiträge anzeigen',
                    'Send': 'Abschicken',
                    'Show all posts': 'Alle Beiträge anzeigen',
                    'Show highlighted post only': 'Anzeigen hervorgehoben Beitrag ist nur',
                    'Sort by:': 'Ordnen nach',
                    'Updated': 'Aktualisiert am',
                    'Your comment was sent for approval': 'Ihr Kommentar wartet auf Freischaltung',
                    'credit:': 'Bild:'
                },
                'fi': {
                    'Highlights': 'Kohokohtia',
                    'Comment by': 'Comment by',
                    'Powered by': 'Powered by',
                    'Advertisement': 'Mainos',
                    'Cancel': 'Peruuta',
                    'Comment': 'Kommentoi',
                    'Comment *': 'Kommentti *',
                    'Comment should be maximum 300 characters in length': 'Kommentin enimmäispituus on 300 merkkiä',
                    'Editorial': 'Toimituksellinen',
                    'Load more posts': 'Lataa lisää julkaisuja',
                    'Loading': 'Lataa',
                    'Name *': 'Nimi *',
                    'Name should be maximum 30 characters in length': 'Nimen enimmäispituus on 30 merkkiä',
                    'Newest first': 'Uusimmat ensin',
                    'No posts for now': 'Ei uusia julkaisuja',
                    'Oldest first': 'Vanhimmat ensin',
                    'One pinned post': 'Yksi kiinnitetty julkaisu',
                    'pinned posts': 'kiinnitettyä julkaisua',
                    'Please fill in your Comment': 'Lisää kommenttisi',
                    'Please fill in your Name': 'Lisää nimesi',
                    'Post a comment': 'Lähetä kommentti',
                    'See one new update': 'Lataa yksi uusi julkaisu',
                    'See new updates': 'Lataa uutta julkaisua',
                    'Send': 'Lähetä',
                    'Show all posts': 'Näytä kaikki julkaisut',
                    'Show highlighted post only': 'Näytä vain korostettu julkaisu',
                    'Sort by:': 'Järjestä:',
                    'Updated': 'Päivitetty',
                    'Your comment was sent for approval': 'Kommenttisi lähetettiin hyväksyttäväksi',
                    'credit:': '©'
                },
                'fr': {
                    'Highlights': 'Messages en surbrillance',
                    'Comment by': 'Commentaire de',
                    'Powered by': 'Alimenté par',
                    'Advertisement': 'Publicité',
                    'Cancel': 'Annuler',
                    'Comment': 'Commentaire',
                    'Comment *': 'Commentaire *',
                    'Comment should be maximum 300 characters in length': 'Un commentaire ne peut excéder 300 signes',
                    'Editorial': 'Éditorial',
                    'Load more posts': 'Afficher plus de messages',
                    'Loading': 'Chargement',
                    'Name *': 'Nom *',
                    'Name should be maximum 30 characters in length': 'Le nom ne peut excéder 30 signes',
                    'Newest first': "Le plus récent d'abord",
                    'No posts for now': 'Aucun message pour le moment',
                    'Oldest first': 'Plus ancien en premier',
                    'One pinned post': 'Voir le nouveau message',
                    'pinned posts': 'Voir nouveaux messages',
                    'Please fill in your Comment': 'Votre commentaire',
                    'Please fill in your Name': 'Votre nom',
                    'Post a comment': 'Envoyer un commentaire',
                    'See one new update': 'Voir le nouveau message',
                    'See new updates': 'Voir nouveaux messages',
                    'Send': 'Envoyer',
                    'Show all posts': 'Afficher tous les messages',
                    'Show highlighted post only': 'Afficher uniquement les messages en surbrillance',
                    'Sort by:': 'Trier par:',
                    'Updated': 'Mise à jour',
                    'Your comment was sent for approval': 'Votre commentaire \
                    a été envoyé et est en attente de validation',
                    'credit:': 'crédit:'
                },
                'nl': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Commentaar door',
                    'Powered by': 'Aangedreven door',
                    'Advertisement': 'Advertentie',
                    'Cancel': 'Annuleren',
                    'Comment': 'Reactie',
                    'Comment *': 'Tekst *',
                    'Comment should be maximum 300 characters in length': 'Uw reactie van maximaal 300 tekens',
                    'Editorial': 'Redactioneel',
                    'Load more posts': 'Meer',
                    'Loading': 'Laden',
                    'Name *': 'Naam *',
                    'Name should be maximum 30 characters in length': 'Uw naam kan maximaal 30 tekens lang zijn',
                    'Newest first': 'Toon nieuwste eerst',
                    'No posts for now': 'Nog geen berichten beschikbaar',
                    'Oldest first': 'Toon oudste eerst',
                    'One pinned post': 'Bekijk nieuw bericht',
                    'pinned posts': 'Bekijk nieuwe berichten',
                    'Please fill in your Comment': 'Uw reactie',
                    'Please fill in your Name': 'Vul hier uw naam in',
                    'Post a comment': 'Schrijf een reactie',
                    'See one new update': 'Bekijk nieuw bericht',
                    'See new updates': 'Bekijk nieuwe berichten',
                    'Send': 'Verzenden',
                    'Sort by:': 'Sorteer:',
                    'Your comment was sent for approval': 'Uw reactie is ontvangen ter beoordeling',
                    'credit:': 'credit:'
                },
                'no': {
                    'Highlights': 'Høydepunkter',
                    'Comment by': 'Kommentar av',
                    'Powered by': 'Drevet av',
                    'Advertisement': 'Annonse',
                    'Cancel': 'Avbryt',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar*',
                    'Comment should be maximum 300 characters in length': 'Kommentarer kan være inntil 300 tegn',
                    'Editorial': 'Redaksjonelt',
                    'Load more posts': 'Henter flere poster',
                    'Loading': 'Henter',
                    'Name *': 'Navn*',
                    'Name should be maximum 30 characters in length': 'Navn kan ikke ha mer enn 30 tegn',
                    'Newest first': 'Nyeste først',
                    'No posts for now': 'Ingen poster for øyeblikket',
                    'Oldest first': 'Eldste først',
                    'One pinned post': 'Én post festet til toppen',
                    'pinned posts': 'poster festet til toppen',
                    'Please fill in your Comment': 'Skriv inn din kommentar',
                    'Please fill in your Name': 'Skriv inn navn',
                    'Post a comment': 'Post en kommentar',
                    'See one new update': 'Se én ny oppdatering',
                    'See new updates': 'Se nye oppdateringer',
                    'Send': 'Send',
                    'Show all posts': 'Vis alle poster',
                    'Show highlighted post only': 'Vis bare høydepunkter',
                    'Sort by:': 'Sortér etter:',
                    'Updated': 'Oppdatert',
                    'Your comment was sent for approval': 'Din kommentar er sendt til godkjenning',
                    'credit:': 'credit:'
                },
                'ro': {
                    'Highlights': 'Repere',
                    'Comment by': 'Comentariu de',
                    'Powered by': 'Cu sprijinul',
                    'Advertisement': 'Reclamă',
                    'Cancel': 'Anulează',
                    'Comment': 'Comentează',
                    'Comment *': 'Comentariu *',
                    'Comment should be maximum 300 characters in length': 'Comentariu \
                    nu poate fi mai lung de 300 de caractere',
                    'Editorial': 'Editorial',
                    'Load more posts': 'Încarcă mai multe posturi',
                    'Loading': 'Se încarcă',
                    'Name *': 'Numele *',
                    'Name should be maximum 30 characters in length': 'Numele nu poate fi mai lung de 30 de caractere',
                    'Newest first': 'Cele mai noi',
                    'No posts for now': 'Deocamdata nu sunt articole',
                    'Oldest first': 'Cele mai vechi',
                    'One pinned post': 'Vezi un articol nou',
                    'pinned posts': 'Vezi articole noi',
                    'Please fill in your Comment': 'Completează comentariu',
                    'Please fill in your Name': 'Completează numele',
                    'Post a comment': 'Scrie un comentariu',
                    'See one new update': 'Vezi un articol nou',
                    'See new updates': 'Vezi articole noi',
                    'Send': 'Trimite',
                    'Sort by:': 'Ordonează după:',
                    'Your comment was sent for approval': 'Comentariul tău a fost trimis spre aprobare',
                    'credit:': 'credit:'
                }
            },
            '_etag': '96e02349a2ebf6c526ea1eda40f647349b7dbbd8',
            'settings': {
                'datetimeFormat': '2018-03-29T17:48:50+05:30',
                'showUpdateDatetime': False,
                'postsPerPage': 10,
                'postOrder': 'editorial',
                'autoApplyUpdates': True,
                'canComment': False,
                'showImage': False,
                'showTitle': False,
                'showDescription': False,
                'showLiveblogLogo': True,
                'showAuthor': True,
                'authorNameFormat': 'display_name',
                'showAuthorAvatar': True,
                'hasHighlights': False,
                'permalinkDelimiter': '?',
                'blockSearchEngines': True,
                'showGallery': False,
                'stickyPosition': 'bottom',
                'gaCode': '',
                'renderForESI': False,
                'removeStylesESI': False,
                'language': 'en',
                'showSyndicatedAuthor': False,
                'clientDatetimeOnly': False
            }
        }
        default_result = self.themeservice._save_theme_settings(self.default_theme, default_previous_theme)
        # Keep user settings, saved by user in database
        self.assertEqual(
            default_previous_theme.get('settings').get('datetimeFormat'), default_result[0].get('datetimeFormat'))
        # Override the default value present in theme
        self.assertNotEqual(default_result[1], default_previous_theme.get('settings'))
        self.assertNotEqual(
            default_result[1].get('postsPerPage'), default_previous_theme.get('settings').get('postsPerPage'))
        # Injected new value in theme
        self.assertNotEqual(len(default_result[1]), len(default_previous_theme.get('settings')))
        self.assertFalse(default_previous_theme.get('datetimeFormattest'))
        self.assertTrue(default_result[1].get('datetimeFormattest'))

    def test_d_amp_save_theme_settings(self):
        # assert self.test_b_default_save_theme_settings()
        amp_previous_theme = {
            '_id': ObjectId('5abcd99afd16ad7de3d3f349'),
            'name': 'amp',
            'version': '3.3.22',
            'seoTheme': True,
            'ampTheme': True,
            'extends': 'default',
            'options': [
                {
                    'name': 'postsPerPage',
                    'label': 'Number of posts per page',
                    'type': 'number',
                    'default': 100,
                    'help': 'Be aware that paging is not yet available for the Liveblog 3 AMP theme'
                },
                {
                    'name': 'canComment',
                    'type': None
                },
                {
                    'name': 'autoApplyUpdates',
                    'type': None
                },
                {
                    'name': 'hasHighlights',
                    'type': None
                },
                {
                    'name': 'permalinkDelimiter',
                    'type': None
                },
                {
                    'name': 'stickyPosition',
                    'type': None
                }
            ],
            'i18n': {
                'cs': {
                    'Highlights': 'Hlavní body',
                    'Comment by': 'Komentář',
                    'Powered by': 'Poháněno',
                    'Advertisement': 'reklama',
                    'Cancel': 'Zrušit',
                    'Comment': 'Váš příspěvek',
                    'Comment *': 'Text *',
                    'Comment should be maximum 300 characters in length': 'Maximální délka textu je 300 znaků',
                    'Editorial': 'redakční',
                    'Load more posts': 'Načíst další',
                    'Loading': 'Načítám',
                    'Name *': 'Jméno *',
                    'Name should be maximum 30 characters in length': 'Maximální délka jména je 30 znaků',
                    'Newest first': 'nejnovější',
                    'No posts for now': 'Žádné příspěvky',
                    'Oldest first': 'nejstarší',
                    'One pinned post': 'Jeden připnutý příspěvek',
                    'pinned posts': 'připnuté příspěvky',
                    'Post a comment': 'Otázka / komentář',
                    'See one new update': 'Zobraz 1 nový příspěvek',
                    'See new updates': 'Zobraz nové příspěvky',
                    'Send': 'Odeslat',
                    'Show all posts': 'Zobrazit všechny',
                    'Show highlighted post only': 'Zobraz jen zvýrazněné příspěvky',
                    'Sort by:': 'Řazení:',
                    'Updated': 'Aktualizace',
                    'Your comment was sent for approval': 'Váš text byl úspěšně odeslán Čeká na schválení',
                    'credit:': 'autor:'
                },
                'de': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Kommentar von',
                    'Powered by': 'Unterstützt von',
                    'Advertisement': 'Werbung',
                    'Cancel': 'Abbrechen',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar',
                    'Comment should be maximum 300 characters in length': 'Kommentar \
                    darf maximal 300 Zeichen lang sein',
                    'Editorial': 'Redaktionell',
                    'Load more posts': 'Mehr Einträge laden',
                    'Loading': 'Lade',
                    'Name *': 'Name',
                    'Name should be maximum 30 characters in length': 'Name darf maximal 30 Zeichen lang sein',
                    'Newest first': 'Neueste zuerst',
                    'No posts for now': 'Kein Beitrag vorhanden',
                    'Oldest first': 'Älteste zuerst',
                    'One pinned post': 'Angehefteter Eintrag',
                    'pinned posts': 'Angeheftete Einträge',
                    'Please fill in your Comment': 'Bitte Kommentar hier eintragen',
                    'Please fill in your Name': 'Bitte Namen hier eintragen',
                    'Post a comment': 'Kommentar posten',
                    'See one new update': 'Neuen Beitrag anzeigen',
                    'See new updates': 'Neue Beiträge anzeigen',
                    'Send': 'Abschicken',
                    'Show all posts': 'Alle Beiträge anzeigen',
                    'Show highlighted post only': 'Anzeigen hervorgehoben Beitrag ist nur',
                    'Sort by:': 'Ordnen nach',
                    'Updated': 'Aktualisiert am',
                    'Your comment was sent for approval': 'Ihr Kommentar wartet auf Freischaltung',
                    'credit:': 'Bild:'
                },
                'fi': {
                    'Highlights': 'Kohokohtia',
                    'Comment by': 'Comment by',
                    'Powered by': 'Powered by',
                    'Advertisement': 'Mainos',
                    'Cancel': 'Peruuta',
                    'Comment': 'Kommentoi',
                    'Comment *': 'Kommentti *',
                    'Comment should be maximum 300 characters in length': 'Kommentin enimmäispituus on 300 merkkiä',
                    'Editorial': 'Toimituksellinen',
                    'Load more posts': 'Lataa lisää julkaisuja',
                    'Loading': 'Lataa',
                    'Name *': 'Nimi *',
                    'Name should be maximum 30 characters in length': 'Nimen enimmäispituus on 30 merkkiä',
                    'Newest first': 'Uusimmat ensin',
                    'No posts for now': 'Ei uusia julkaisuja',
                    'Oldest first': 'Vanhimmat ensin',
                    'One pinned post': 'Yksi kiinnitetty julkaisu',
                    'pinned posts': 'kiinnitettyä julkaisua',
                    'Please fill in your Comment': 'Lisää kommenttisi',
                    'Please fill in your Name': 'Lisää nimesi',
                    'Post a comment': 'Lähetä kommentti',
                    'See one new update': 'Lataa yksi uusi julkaisu',
                    'See new updates': 'Lataa uutta julkaisua',
                    'Send': 'Lähetä',
                    'Show all posts': 'Näytä kaikki julkaisut',
                    'Show highlighted post only': 'Näytä vain korostettu julkaisu',
                    'Sort by:': 'Järjestä:',
                    'Updated': 'Päivitetty',
                    'Your comment was sent for approval': 'Kommenttisi lähetettiin hyväksyttäväksi',
                    'credit:': '©'
                },
                'fr': {
                    'Highlights': 'Messages en surbrillance',
                    'Comment by': 'Commentaire de',
                    'Powered by': 'Alimenté par',
                    'Advertisement': 'Publicité',
                    'Cancel': 'Annuler',
                    'Comment': 'Commentaire',
                    'Comment *': 'Commentaire *',
                    'Comment should be maximum 300 characters in length': 'Un commentaire ne peut excéder 300 signes',
                    'Editorial': 'Éditorial',
                    'Load more posts': 'Afficher plus de messages',
                    'Loading': 'Chargement',
                    'Name *': 'Nom *',
                    'Name should be maximum 30 characters in length': 'Le nom ne peut excéder 30 signes',
                    'Newest first': "Le plus récent d'abord",
                    'No posts for now': 'Aucun message pour le moment',
                    'Oldest first': 'Plus ancien en premier',
                    'One pinned post': 'Voir le nouveau message',
                    'pinned posts': 'Voir nouveaux messages',
                    'Please fill in your Comment': 'Votre commentaire',
                    'Please fill in your Name': 'Votre nom',
                    'Post a comment': 'Envoyer un commentaire',
                    'See one new update': 'Voir le nouveau message',
                    'See new updates': 'Voir nouveaux messages',
                    'Send': 'Envoyer',
                    'Show all posts': 'Afficher tous les messages',
                    'Show highlighted post only': 'Afficher uniquement les messages en surbrillance',
                    'Sort by:': 'Trier par:',
                    'Updated': 'Mise à jour',
                    'Your comment was sent for approval': 'Votre commentaire\
                     a été envoyé et est en attente de validation',
                    'credit:': 'crédit:'
                },
                'nl': {
                    'Highlights': 'Highlights',
                    'Comment by': 'Commentaar door',
                    'Powered by': 'Aangedreven door',
                    'Advertisement': 'Advertentie',
                    'Cancel': 'Annuleren',
                    'Comment': 'Reactie',
                    'Comment *': 'Tekst *',
                    'Comment should be maximum 300 characters in length': 'Uw reactie van maximaal 300 tekens',
                    'Editorial': 'Redactioneel',
                    'Load more posts': 'Meer',
                    'Loading': 'Laden',
                    'Name *': 'Naam *',
                    'Name should be maximum 30 characters in length': 'Uw naam kan maximaal 30 tekens lang zijn',
                    'Newest first': 'Toon nieuwste eerst',
                    'No posts for now': 'Nog geen berichten beschikbaar',
                    'Oldest first': 'Toon oudste eerst',
                    'One pinned post': 'Bekijk nieuw bericht',
                    'pinned posts': 'Bekijk nieuwe berichten',
                    'Please fill in your Comment': 'Uw reactie',
                    'Please fill in your Name': 'Vul hier uw naam in',
                    'Post a comment': 'Schrijf een reactie',
                    'See one new update': 'Bekijk nieuw bericht',
                    'See new updates': 'Bekijk nieuwe berichten',
                    'Send': 'Verzenden',
                    'Sort by:': 'Sorteer:',
                    'Your comment was sent for approval': 'Uw reactie is ontvangen ter beoordeling',
                    'credit:': 'credit:'
                },
                'no': {
                    'Highlights': 'Høydepunkter',
                    'Comment by': 'Kommentar av',
                    'Powered by': 'Drevet av',
                    'Advertisement': 'Annonse',
                    'Cancel': 'Avbryt',
                    'Comment': 'Kommentar',
                    'Comment *': 'Kommentar*',
                    'Comment should be maximum 300 characters in length': 'Kommentarer kan være inntil 300 tegn',
                    'Editorial': 'Redaksjonelt',
                    'Load more posts': 'Henter flere poster',
                    'Loading': 'Henter',
                    'Name *': 'Navn*',
                    'Name should be maximum 30 characters in length': 'Navn kan ikke ha mer enn 30 tegn',
                    'Newest first': 'Nyeste først',
                    'No posts for now': 'Ingen poster for øyeblikket',
                    'Oldest first': 'Eldste først',
                    'One pinned post': 'Én post festet til toppen',
                    'pinned posts': 'poster festet til toppen',
                    'Please fill in your Comment': 'Skriv inn din kommentar',
                    'Please fill in your Name': 'Skriv inn navn',
                    'Post a comment': 'Post en kommentar',
                    'See one new update': 'Se én ny oppdatering',
                    'See new updates': 'Se nye oppdateringer',
                    'Send': 'Send',
                    'Show all posts': 'Vis alle poster',
                    'Show highlighted post only': 'Vis bare høydepunkter',
                    'Sort by:': 'Sortér etter:',
                    'Updated': 'Oppdatert',
                    'Your comment was sent for approval': 'Din kommentar er sendt til godkjenning',
                    'credit:': 'credit:'
                },
                'ro': {
                    'Highlights': 'Repere',
                    'Comment by': 'Comentariu de',
                    'Powered by': 'Cu sprijinul',
                    'Advertisement': 'Reclamă',
                    'Cancel': 'Anulează',
                    'Comment': 'Comentează',
                    'Comment *': 'Comentariu *',
                    'Comment should be maximum 300 characters in length': 'Comentariu \
                    nu poate fi mai lung de 300 de caractere',
                    'Editorial': 'Editorial',
                    'Load more posts': 'Încarcă mai multe posturi',
                    'Loading': 'Se încarcă',
                    'Name *': 'Numele *',
                    'Name should be maximum 30 characters in length': 'Numele nu poate fi mai lung de 30 de caractere',
                    'Newest first': 'Cele mai noi',
                    'No posts for now': 'Deocamdata nu sunt articole',
                    'Oldest first': 'Cele mai vechi',
                    'One pinned post': 'Vezi un articol nou',
                    'pinned posts': 'Vezi articole noi',
                    'Please fill in your Comment': 'Completează comentariu',
                    'Please fill in your Name': 'Completează numele',
                    'Post a comment': 'Scrie un comentariu',
                    'See one new update': 'Vezi un articol nou',
                    'See new updates': 'Vezi articole noi',
                    'Send': 'Trimite',
                    'Sort by:': 'Ordonează după:',
                    'Your comment was sent for approval': 'Comentariul tău a fost trimis spre aprobare',
                    'credit:': 'credit:'
                }
            },
            '_etag': '6264fdae8e153dae910caeebfd3124819bee4a93',
            'settings': {
                'datetimeFormat': '2018-03-29T17:48:50+05:30',
                'showUpdateDatetime': False,
                'postOrder': 'editorial',
                'showImage': False,
                'showTitle': False,
                'showDescription': False,
                'showLiveblogLogo': True,
                'showAuthor': True,
                'authorNameFormat': 'display_name',
                'showAuthorAvatar': True,
                'blockSearchEngines': True,
                'showGallery': False,
                'gaCode': '',
                'renderForESI': False,
                'removeStylesESI': False,
                'language': 'en',
                'showSyndicatedAuthor': False,
                'clientDatetimeOnly': False,
                'postsPerPage': 100
            }
        }
        amp_result = self.themeservice._save_theme_settings(self.amp_theme, amp_previous_theme)
        # Keep user settings, saved by user in database
        self.assertEqual(amp_previous_theme.get('settings').get('datetimeFormat'), amp_result[0].get('datetimeFormat'))
        # Override the default value present in theme
        self.assertNotEqual(amp_result[1], amp_previous_theme.get('settings'))
        self.assertNotEqual(amp_result[1].get('postsPerPage'), amp_previous_theme.get('settings').get('postsPerPage'))
        # Injected new value in theme
        self.assertNotEqual(len(amp_result[1]), len(amp_previous_theme.get('settings')))
        self.assertFalse(amp_previous_theme.get('datetimeFormattest'))
        self.assertTrue(amp_result[1].get('datetimeFormattest'))

    def test_classic_theme(self):
        # Load the template in classic theme, template found
        template = embeds.collect_theme_assets(self.classic_theme)[1]
        self.assertIsNotNone(template, True)

    def test_angular_theme(self):
        # Load the template in angular theme, template not found
        template = embeds.collect_theme_assets(self.angular_theme)[1]
        self.assertIsNone(template, True)

    def test_default_theme(self):
        # Load the template in default theme, template found
        template = embeds.collect_theme_assets(self.default_theme)[1]
        self.assertIsNotNone(template, True)

    def test_amp_theme(self):
        # Load the template in amp theme, template found
        template = embeds.collect_theme_assets(self.amp_theme)[1]
        self.assertIsNotNone(template, True)

    def test_emebed_gathering(self):
        # check blog exists
        client_blog = self.client_blog_service.find_one(req=None, _id='5aba336a4d003d61e663eeeb')
        self.assertIsNotNone(client_blog, True)
        response = self.client.get('/embed/5aba336a4d003d61e663eeeb/')
        data = str(response.data)
        # response status 200
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog id exists in response page
        test_blog_id = data.find('"_id": "5aba336a4d003d61e663eeeb"')
        self.assertNotEqual(test_blog_id, -1)
        # blog title
        blog_title = data.find('"title": "title: end to end Five"')
        self.assertNotEqual(blog_title, -1)
        # blog created date exists in response
        test_created = data.find('"_created": "2018-03-27T12:04:58+0000"')
        self.assertNotEqual(test_created, -1)
        # test blog_preferences
        blog_pref = data.find('"blog_preferences": {"language": "en", "theme": "classic"}')
        self.assertNotEqual(blog_pref, -1)
        # debug is true
        check_debug = data.find('debug: true')
        self.assertNotEqual(check_debug, -1)
        # test settings data in response
        author_name = data.find('"authorNameFormat": "display_name"')
        self.assertNotEqual(author_name, -1)
        post_order = data.find('"postOrder": "editorial"')
        self.assertNotEqual(post_order, -1)

    def test_is_seo(self):
        response = self.client.get('/embed/5abe10614d003d5f22ce005e/theme/default')
        data = str(response.data)
        # response status 200
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog id exists in response page
        test_blog_id = data.find('"_id": "5abe10614d003d5f22ce005e"')
        self.assertNotEqual(test_blog_id, -1)
        # blog title
        blog_title = data.find('"title: end to end Seven"')
        self.assertNotEqual(blog_title, -1)
        # blog created date exists in response
        test_created = data.find('"_created": "2018-03-30T10:24:33+0000"')
        self.assertNotEqual(test_created, -1)
        # test blog_preferences
        blog_pref = data.find('"blog_preferences": {"language": "en", "theme": "default"')
        self.assertNotEqual(blog_pref, -1)
        # debug is true
        check_debug = data.find('debug: true')
        self.assertNotEqual(check_debug, -1)
        # assests_root
        assets_root = data.find('assets_root: \\\'/themes_assets/default/\\\'')
        self.assertNotEqual(assets_root, -1)

    def test_is_amp(self):
        response = self.client.get('/embed/5abe10614d003d5f22ce005e/theme/amp')
        data = str(response.data)
        self.assertEqual(response.status_code, 200)
        # response contains data
        self.assertIsNotNone(data, True)
        # blog title
        title = data.find('<title>title: end to end Seven</title>')
        self.assertNotEqual(title, -1)
        # Test: Add AMP compatible css
        amp_styles = data.find('<style amp-boilerplate>')
        self.assertNotEqual(amp_styles, -1)
        # test amp img
        amp_img = data.find(
            '<amp-img src="image.png"\\n  width="1"\\n  height="1"\\n  layout="fixed"\\n  alt="AMP"></amp-img>')
        self.assertNotEqual(amp_img, -1)
        # amp live-list
        amp_live_list = data.find(
            '<amp-live-list\\n    layout="container"\\n    data-poll-interval="15000"\\n    ' +
            'data-max-items-per-page="110"\\n    id="amp-live-list-insert-blog"\\n    class="timeline-body">\\')
        self.assertNotEqual(amp_live_list, -1)

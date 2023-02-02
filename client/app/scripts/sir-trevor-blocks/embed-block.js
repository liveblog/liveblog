import {guessProvider} from '../liveblog-edit/embed/helpers';
import {getYoutubeID} from './video-block';
import handlePlaceholder from './handle-placeholder';

var uriRegx = '(https?:)?\\/\\/[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&amp;:/~+#-]*[\\w@?^=%&amp;/~+#-])?';
var socialEmbedRegex = '(iframe|blockquote)+(?:.|\\n)*'
    + '(youtube-nocookie\\.com/embed|youtube\\.com\\/embed|facebook\\.com'
    + '\\/plugins|instagram\\.com\\/p\\/|players\\.brightcove\\.net'
    + '|twitter\\.com\\/.*\\/status)(?:.|\\n)*(iframe|blockquote)';
var generalPattern = new RegExp(socialEmbedRegex, 'i');
var youtubePattern = new RegExp('(?:https?:\\/\\/)?'
    + '(?:www\\.)?(?:youtu\\.be\\/|youtube\\.com\\/|youtube-nocookie\\.com\\/'
    + '(?:embed\\/|v\\/|watch\\?v=|watch\\?.+&v=))(\\w+)', 'i');
var facebookPattern = /(?:post\.php|video\.php)\?href=(https?(\w|%|\.)+)/i;
var instagramPattern = /(https?:\/\/(?:www)?\.?instagram\.com\/p\/(?:\w+.)+\/)/i;
var twitterPattern = /(https?:\/\/(?:www|mobile)?\.?twitter\.com\/\w+\/status\/\d+)/i;
var bcPattern = /(http|https)?:?\/\/players.brightcove.net\/\d*\/[a-zA-Z\d_-]*\/index\.html\?videoId=\d*/i;


function fixDataEmbed(data) {
    if (data.html) {
        var tmp = document.createElement('DIV');

        tmp.innerHTML = data.html;
        data.html = tmp.innerHTML;
    }
    return data;
}

function fixSecureEmbed(string) {
    let ret;

    if (window.location.protocol === 'https:') {
        const pattern = new RegExp(uriRegx, 'i');
        const matches = string.match(pattern);

        if (matches && matches.length && matches[1] === 'http:') {
            ret = matches[0];
        } else {
            ret = string;
        }
    } else {
        ret = string;
    }
    // particular case for cnn.
    ret = ret.replace('cnn.com/video/api/embed.html#/video', 'cnn.com/videos');
    return ret;
}

function fixSocial(html, data) {
    // remove link for some provider (included in the card)
    if (['Facebook', 'Youtube', 'Twitter', 'Soundcloud'].indexOf(data.provider_name) > -1) {
        html.find('.link-preview').remove();
    }
    // special case for twitter
    if (data.provider_name === 'Twitter') {
        // remove credit and title fields (duplicated with rendered card)
        html.find('.credit-preview, .title-preview').remove();
        // empty the description
        html.find('.description-preview').html('');
    }
}

const handleTitleAndDescription = (cardHtml, data) => {
    const isInstagramEmbed = (data.provider_name === 'Instagram');

    // For instagram (TODO: check for others) we do not render this title and description
    // So far, when clients want to add custom content, they add a separate text item which
    // seems more logical and flexible
    if (isInstagramEmbed) {
        ['title', 'description'].forEach((fieldName) => {
            cardHtml.find('.' + fieldName + '-preview').addClass('hide');
        });

        cardHtml
            .find('.show-embed-description input')
            .attr('checked', data.show_embed_description)
            .parent()
            .removeClass('hide');
    } else {
        if (_.has(data, 'title')) {
            cardHtml.find('.title-preview')
                .html(data.title);
        }

        if (_.has(data, 'description')) {
            cardHtml.find('.description-preview')
                .html(data.description);
        }
    }
};

const setCredit = (cardHtml, data) => {
    if (_.has(data, 'provider_name')) {
        let creditText = data.provider_name;

        if (_.has(data, 'author_name')) {
            creditText += ' | <a href="' + data.author_url + '" target="_blank">' +
                data.author_name + '</a>';
        }
        cardHtml.find('.credit-preview').html(creditText);
    }

    if (_.has(data, 'credit')) {
        cardHtml.find('.credit-preview').html(data.credit);
    }
};

function isURI(string) {
    var pattern = new RegExp('^' + uriRegx, 'i');

    return pattern.test(string);
}

function cleanupURL(string) {
    var m;

    if ((m = twitterPattern.exec(string)) !== null) {
        return m[1];
    }
    return string;
}

function replaceEmbedWithUrl(string) {
    var m;

    // checking if string contains any of the "big four" embeds
    if (generalPattern.test(string)) {
        if ((m = youtubePattern.exec(string)) !== null) {
            return 'https://www.youtube.com/watch?v=' + getYoutubeID(string);
        } else if ((m = facebookPattern.exec(string)) !== null) {
            return decodeURIComponent(m[1]);
        } else if ((m = instagramPattern.exec(string)) !== null) {
            return m[1];
        } else if ((m = twitterPattern.exec(string)) !== null) {
            return m[1];
        } else if ((m = bcPattern.exec(string)) !== null) {
            return m[0];
        }
    }

    return string;
}

export default function embedBlockFactory(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'embed',
        data: {},
        title: () => 'Embed',
        icon_name: 'embed',
        embedPlaceholder: window.gettext('url or embed code'),

        editorHTML: function() {
            return [
                '<div class="st-required st-embed-block embed-input"',
                ' placeholder="' + this.embedPlaceholder + '" contenteditable="true"></div>',
            ].join('\n');
        },

        onBlockRender: function() {
            var self = this;
            var editorParent = self.$editor.next();
            let editableFields = editorParent.find('[contenteditable]');
            let checkboxDesc = editorParent.find('.show-embed-description input[type=checkbox]');

            editableFields.on('focus', function(ev) {
                const $this = $(this);
                const html = $this.html();

                $this.data('before', html);
            });

            editableFields.on('blur keyup paste input', function(ev) {
                const $this = $(this);

                if ($this.data('before') !== $this.html()) {
                    $this.data('before', $this.html());
                    self.getOptions().disableSubmit(false);
                }
            });

            // enable publish button and also change html to mark it as modified
            checkboxDesc.on('change', () => {
                self.getOptions().disableSubmit(false);
                editorParent.attr('data-desc-changed', '1');
            });

            handlePlaceholder(editableFields, self.embedPlaceholder);

            // when the link field changes
            const callServiceAndLoadData = function() {
                let input = $(this)
                    .text()
                    .trim();

                // exit if the input field is empty
                if (_.isEmpty(input)) {
                    self.getOptions().disableSubmit(true);
                    return false;
                }
                self.getOptions().disableSubmit(false);

                // reset error messages
                self.resetMessages();

                // start a loader over the block, it will be stopped in the loadData function
                self.loading();
                input = replaceEmbedWithUrl(input);
                input = fixSecureEmbed(input);

                // if the input is an url, use embed services
                if (isURI(input)) {
                    input = cleanupURL(input);

                    var originalUrl = input;

                    // very simple test to check if it was encoded already
                    if (decodeURIComponent(input) === input) {
                        input = encodeURIComponent(input);
                    }

                    // request the embedService with the provided url
                    const {embedService, coverMaxWidth} = self.getOptions();

                    embedService.get(input, coverMaxWidth).then(
                        function successCallback(data) {
                            data.original_url = originalUrl;

                            if (!data.provider_name || !data.provider_url) {
                                const providerData = guessProvider(data.url);

                                if (!data.provider_name) data.provider_name = providerData.name;

                                if (!data.provider_url) data.provider_url = providerData.url;
                            }

                            self.loadData(data);
                        },
                        function errorCallback(error) {
                            self.addMessage(error);
                            self.ready();
                        }
                    );
                // otherwise, use the input as the embed code
                } else {
                    self.loadData({html: input});
                }
            };

            this.$editor.on('paste', _.debounce(callServiceAndLoadData, 200));

            this.$editor.on('keydown', function(e) {
                if (e.keyCode === 13) {
                    e.preventDefault();
                    callServiceAndLoadData.call(this);
                }
            });
        },

        isEmpty: function() {
            return _.isEmpty(this.retrieveData().url || this.retrieveData().html);
        },

        retrieveData: function() {
            const self = this;

            // retrieve new data from editor
            var editorData = {
                title: self.$('.title-preview').text(),
                description: self.$('.description-preview').text(),
                credit: self.$('.credit-preview').text(),
                syndicated_creator: this.getData().syndicated_creator,
                liveblog_version: '3.4',
            };

            // remove thumbnail_url if it was removed by user
            if (self.$('.cover-preview').hasClass('hidden')) {
                editorData.thumbnail_url = null;
            }

            // add data which are not in the editor but has been saved before (like thumbnail_width)
            // clean data by removing empty string
            _.merge(self.data, editorData);
            _.forEach(self.data, (value, key) => {
                if (typeof value === 'string' && value.trim() === '') {
                    delete self.data[key];
                }
            });

            return self.data;
        },

        renderCard: function(data) {
            const cardClass = 'liveblog--card';
            const html = $([
                '<div class="' + cardClass + ' hidden">',
                '  <div class="hidden st-embed-block embed-preview"></div>',
                '  <div class="hidden st-embed-block cover-preview-handler">',
                '    <div class="st-embed-block cover-preview"></div>',
                '  </div>',
                '  <div class="st-embed-block title-preview"></div>',
                '  <div class="st-embed-block description-preview"></div>',
                '  <div class="st-embed-block credit-preview"></div>',
                '  <div class="st-embed-block show-embed-description hide"><input name="show-desc" type="checkbox"> ',
                '     Show Instagram description</div>',
                '  <a class="hidden st-embed-block link-preview" target="_blank"></a><br />',
                '</div>',
            ].join('\n'));

            // hide everything
            html.find(
                [
                    '.embed-preview',
                    '.cover-preview-handler',
                ].join(', ')
            ).addClass('hidden');

            // set the link
            if (_.has(data, 'url')) {
                html
                    .find('.link-preview')
                    .attr('href', data.original_url)
                    .html(data.original_url)
                    .removeClass('hidden');
            }

            // set the embed code
            if (_.has(data, 'html')) {
                html.find('.embed-preview')
                    .html(data.html)
                    .removeClass('hidden');
            }

            // set the cover illustration
            if (!_.has(data, 'html') && !_.isEmpty(data.thumbnail_url)) {
                const ratio = data.thumbnail_width / data.thumbnail_height;
                const coverWidth = Math.min(this.getOptions().coverMaxWidth, data.thumbnail_width);
                const coverHeight = coverWidth / ratio;

                html.find('.cover-preview').css({
                    'background-image': 'url("' + data.thumbnail_url + '")',
                    'background-size': 'cover',
                    width: coverWidth,
                    height: coverHeight,
                });
                html.find('.cover-preview-handler').removeClass('hidden');
            }

            handleTitleAndDescription(html, data);
            setCredit(html, data);
            fixSocial(html, data);

            return `<div class="${cardClass}">${html.get(0).innerHTML}</div>`;
        },

        // render a card from data, and make it editable
        loadData: function(dataParam) {
            const self = this;
            const data = _.has(dataParam, 'meta') ? dataParam.meta : dataParam;

            self.data = fixDataEmbed(data);
            // hide the embed input field, render the card and add it to the DOM
            self.$('.embed-input')
                .addClass('hidden')
                .after(self.renderCard(data));

            ['title', 'description', 'credit'].forEach((fieldName) => {
                self.$('.' + fieldName + '-preview').attr({
                    contenteditable: true,
                    placeholder: fieldName,
                });
            });

            // remove the loader when media is loadedhtml =
            const iframe = this.$('.embed-preview iframe');

            // special case for iframe
            iframe.length > 0 ? iframe.ready(this.ready.bind(this)) : this.ready();

            const $coverHandler = this.$('.cover-preview-handler');

            if ($coverHandler.length > 0 && !$coverHandler.hasClass('hidden')) {
                const $coverPreview = $coverHandler.find('.cover-preview');
                const $removeLink = $('<a href="#">').text('hide the illustration');
                const $showLink = $('<a href="#">')
                    .text('show the illustration')
                    .addClass('hidden');

                $removeLink.on('click', function removeCoverAndDisillustrationplayShowLink(e) {
                    self.saved_cover_url = self.data.thumbnail_url;
                    $coverPreview.addClass('hidden');
                    $(this).addClass('hidden');
                    $showLink.removeClass('hidden');
                    e.preventDefault();
                });
                $showLink.on('click', function showCoverAndDisplayRemoveLink(e) {
                    self.data.thumbnail_url = self.saved_cover_url;
                    $coverPreview.removeClass('hidden');
                    $(this).addClass('hidden');
                    $removeLink.removeClass('hidden');
                    e.preventDefault();
                });
                $coverHandler.append($removeLink, $showLink);
            }

            switch (data.provider_name) {
            case 'Instagram':
                setTimeout(window.instgrm.Embeds.process, 1000);
                break;

            case 'Twitter':
                setTimeout(window.twttr.widgets.load, 500);
                break;
            }
        },

        focus: function() {
            this.$('.embed-input').focus();
        },

        toHTML: function() {
            const data = this.retrieveData();

            return this.renderCard(data);
        },

        toCleanHTML: function() {
            const html = $(this.toHTML());

            html
                .find('.show-embed-description')
                .remove();

            return html.get(0).innerHTML;
        },

        toMeta: function() {
            const meta = this.retrieveData();

            meta.show_embed_description = $('.show-embed-description')
                .find('input')
                .is(':checked') || false;

            return meta;
        },
    });
}

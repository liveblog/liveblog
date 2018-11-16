/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import angular from 'angular';
import _ from 'lodash';

import sanitizeHtml from 'sanitize-html';

import imageBlock from './image-block';
import handlePlaceholder from './handle-placeholder';
import sanitizeConfig from './sanitizer-config';

function createCaretPlacer(atStart) {
    return function(el) {
        el.focus();
        if (typeof window.getSelection !== 'undefined'
                && typeof document.createRange !== 'undefined') {
            var range = document.createRange();

            range.selectNodeContents(el);
            range.collapse(atStart);
            var sel = window.getSelection();

            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange !== 'undefined') {
            var textRange = document.body.createTextRange();

            textRange.moveToElementText(el);
            textRange.collapse(atStart);
            textRange.select();
        }
    };
}

createCaretPlacer(true);
var placeCaretAtEnd = createCaretPlacer(false);
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
            return 'https://www.youtube.com/watch?v=' + m[1];
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

angular
    .module('SirTrevorBlocks', [])
    .config(['SirTrevorProvider', 'config', function(SirTrevor, config) {
        // replace the plus symbol with text description
        SirTrevor.FloatingBlockControls.prototype.attributes = function() {
            return {
                'data-icon': 'ADD CONTENT HERE',
            };
        };
        SirTrevor.Block.prototype.attributes = function() {
            return _.extend(SirTrevor.SimpleBlock.fn.attributes.call(this), {
                'data-icon-after': 'ADD CONTENT HERE',
            });
        };
        // Add toMeta method to all blocks.
        SirTrevor.Block.prototype.toMeta = function() {
            return this.getData();
        };
        SirTrevor.Block.prototype.getOptions = function() {
            const instance = SirTrevor.$get().getInstance(this.instanceID);

            return instance ? instance.options : null;
        };
        SirTrevor.Blocks.Embed = SirTrevor.Block.extend({
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

                // create and trigger a 'change' event for the $editor which is a contenteditable
                this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                    const $this = $(this);

                    $this.data('before', $this.html());
                });
                this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                    const $this = $(this);

                    if ($this.data('before') !== $this.html()) {
                        $this.data('before', $this.html());
                        $this.trigger('change');
                    }
                });
                handlePlaceholder(this.$editor.filter('[contenteditable]'), self.embedPlaceholder);
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
                        // request the embedService with the provided url
                        self.getOptions().embedService.get(input, self.getOptions().coverMaxWidth).then(
                            function successCallback(data) {
                                data.original_url = input;
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
                _.merge(self.data, editorData);
                // clean data by removing empty string
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
                    '  <a class="hidden st-embed-block link-preview" target="_blank"></a>',
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
                        width: coverWidth,
                        height: coverHeight,
                        'background-size': 'cover',
                    });
                    html.find('.cover-preview-handler').removeClass('hidden');
                }
                // set the title
                if (_.has(data, 'title')) {
                    html.find('.title-preview')
                        .html(data.title);
                }
                // set the description
                if (_.has(data, 'description')) {
                    html.find('.description-preview')
                        .html(data.description);
                }
                // set the credit
                if (_.has(data, 'provider_name')) {
                    let creditText = data.provider_name;

                    if (_.has(data, 'author_name')) {
                        creditText += ' | <a href="' + data.author_url + '" target="_blank">' +
                            data.author_name + '</a>';
                    }
                    html.find('.credit-preview').html(creditText);
                }

                if (_.has(data, 'credit')) {
                    html.find('.credit-preview').html(data.credit);
                }

                fixSocial(html, data);
                // retrieve the final html code
                let htmlToReturn = '';

                htmlToReturn = '<div class="' + cardClass + '">';
                htmlToReturn += html.get(0).innerHTML;
                htmlToReturn += '</div>';
                return htmlToReturn;
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
                // set somes fields contenteditable
                ['title', 'description', 'credit'].forEach((fieldName) => {
                    self.$('.' + fieldName + '-preview').attr({
                        contenteditable: true,
                        placeholder: fieldName,
                    });
                });
                // remove the loader when media is loadedhtml =
                const iframe = this.$('.embed-preview iframe');

                if (iframe.length > 0) {
                    // special case for iframe
                    iframe.ready(this.ready.bind(this));
                } else {
                    this.ready();
                }
                // add a link to remove/show the cover
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
                // if instagram process the embed code
                if (data.html && data.html.indexOf('platform.instagram.com') !== -1) {
                    setTimeout(() => {
                        window.instgrm.Embeds.process();
                    }, 1000);
                }
            },
            focus: function() {
                this.$('.embed-input').focus();
            },
            // toMarkdown: function(markdown) {},
            toHTML: function() {
                const data = this.retrieveData();

                return this.renderCard(data);
            },
            toMeta: function() {
                return this.retrieveData();
            },
        });
        SirTrevor.Blocks.Quote = SirTrevor.Block.extend({
            type: 'quote',
            title: function() {
                return window.i18n.t('blocks:quote:title');
            },
            icon_name: 'quote',
            quotePlaceholder: window.gettext('quote'),
            creditPlaceholder: window.i18n.t('blocks:quote:credit_field'),
            editorHTML: function() {
                const template = _.template([
                    '<div class="st-required st-quote-block quote-input" ',
                    ' placeholder="' + this.quotePlaceholder + '" contenteditable="true"></div>',
                    '<div contenteditable="true" name="cite" placeholder="' + this.creditPlaceholder + '"',
                    ' class="js-cite-input st-quote-block"></div>',
                ].join('\n'));

                return template(this);
            },
            onBlockRender: function() {
                const onEditorChange = () => {
                    const data = this.retrieveData();
                    const input = data.quote + data.credit;

                    if (_.isEmpty(input)) {
                        this.getOptions().disableSubmit(true);
                        return false;
                    }
                    this.getOptions().disableSubmit(false);
                };

                this.$('.quote-input .js-cite-input');
                this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                    const $this = $(this);

                    $this.data('before', $this.html());
                });
                this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                    const $this = $(this);

                    if ($this.data('before') !== $this.html()) {
                        $this.data('before', $this.html());
                        onEditorChange();
                    }
                });
                handlePlaceholder(this.$editor.filter('.quote-input'), this.quotePlaceholder);
                handlePlaceholder(this.$('[name=cite]'), this.creditPlaceholder, {tabbedOrder: true});
                // when the link field changes
                this.$editor.on('change', _.debounce(onEditorChange, 200));
            },
            focus: function() {
                this.$('.quote-input').focus();
            },
            retrieveData: function() {
                return {
                    quote: this.$('.quote-input').text() || undefined,
                    credit: this.$('.js-cite-input').text() || undefined,
                    syndicated_creator: this.getData().syndicated_creator,
                };
            },
            loadData: function(data) {
                this.$('.quote-input').text(data.quote);
                this.$('.js-cite-input').text(data.credit);
            },
            isEmpty: function() {
                return _.isEmpty(this.retrieveData().quote);
            },
            toMarkdown: function(markdown) {
                return markdown.replace(/^(.+)$/mg, '> $1');
            },
            toHTML: function(html) {
                const data = this.retrieveData();

                return [
                    '<blockquote><p>',
                    data.quote,
                    '</p><h4><i>',
                    data.credit,
                    '</i></h4></blockquote>',
                ].join('');
            },
            toMeta: function() {
                return this.retrieveData();
            },
        });

        // Image Block
        const uploadOptions = {
        // NOTE: responsive layout is currently disabled. so row and col-md-6 are useless
            html: [
                '<div class="row st-block__upload-container">',
                '    <div class="col-md-6">',
                '       <label onclick="$(this).next().trigger(\'click\');" ',
                '              class="btn btn-default"><%= i18n.t("general:upload") %></label>',
                '       <input type="file" type="st-file-upload" />',
                '    </div>',
                '</div>',
            ].join('\n'),
        };

        SirTrevor.DEFAULTS.Block.upload_options = uploadOptions;
        SirTrevor.Locales.en.general.upload = 'Select from folder';

        SirTrevor.Blocks.Image = imageBlock(SirTrevor, config);

        SirTrevor.Blocks.Text.prototype.loadData = function(data) {
            this.getTextBlock().html(SirTrevor.toHTML(data.text, this.type));
        };

        SirTrevor.Blocks.Text.prototype.toMeta = function() {
            return {
                syndicated_creator: this.getData().syndicated_creator,
            };
        };

        SirTrevor.Blocks.Text.prototype.onBlockRender = function() {
            const self = this;
            const placeHolderText = window.gettext('Write here (or press Ctrl+Shift+V to paste unformatted text)...');

            // add placeholder class and placeholder text
            this.$editor.attr('placeholder', placeHolderText).addClass('st-placeholder');
            // create and trigger a 'change' event for the $editor which is a contenteditable
            this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                const $this = $(this);

                $this.data('before', $this.html());
            });
            this.$editor.filter('[contenteditable]').on('click', function(ev) {
                const $this = $(this);

                if (_.trim($this.html()) === '') {
                    $this.attr('placeholder', '');
                }
            });
            this.$editor.filter('[contenteditable]').on('focusout', function(ev) {
                const $this = $(this);

                if (_.trim($this.html()) === '') {
                    $this.attr('placeholder', placeHolderText);
                }
            });
            this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                const $this = $(this);

                if ($this.data('before') !== $this.html()) {
                    $this.data('before', $this.html());
                    $this.trigger('change');
                }
            });
            // when the link field changes
            this.$editor.on('change', _.debounce(function() {
                const input = $(this)
                    .text()
                    .trim();

                if (_.isEmpty(input)) {
                    if (self.getOptions()) {
                        self.getOptions().disableSubmit(true);
                    }
                    return false;
                } else if (self.getOptions()) {
                    self.getOptions().disableSubmit(false);
                }
            }, 200));
        };

        // Add toHTML to existing Text Block.
        SirTrevor.Blocks.Text.prototype.toHTML = function(html) {
            if (this.$el) {
                return this.getTextBlock().html();
            }

            return html;
        };
        SirTrevor.Blocks.Text.prototype.onContentPasted = _.debounce((event) => {
            // Content pasted. Delegate to the drop parse method
            const input = $(event.target).closest('[contenteditable]');
            let val = input.html();

            if (val) {
                val = sanitizeHtml(val, sanitizeConfig);
                val = (val || '').trim();
                // let's also remove not needed line breaks
                val = val.replace(/\r/g, ' ');
                val = val.replace(/\n/g, ' ');
            }
            input.html(val);
            placeCaretAtEnd(input.get(0));
        }, 0);

        SirTrevor.Blocks.Comment = SirTrevor.Block.extend({
            type: 'comment',

            title: function() {
                return window.i18n.t('blocks:comment:title');
            },

            editorHTML: '<div class="st-required st-text-block"></div>',

            icon_name: 'comment',

            loadData: function(data) {
                this.getTextBlock().html(SirTrevor.toHTML(data.text, this.type));
            },
            isEmpty: function() {
                return _.isEmpty(this.getData().text);
            },
            retrieveData: function() {
                return {
                    text: this.$('.st-text-block').text() || undefined,
                    syndicated_creator: this.getData().syndicated_creator,
                };
            },
            toHTML: function(html) {
                if (this.$el) {
                    return this.getTextBlock().html();
                }

                return html;
            },
            toMeta: function() {
                const data = this.getData();

                return {
                    text: data.text,
                    commenter: data.commenter,
                    _created: data._created,
                };
            },
        });
        const Strikethrough = SirTrevor.Formatter.extend({
            title: 'strikethrough',
            iconName: 'strikethrough',
            cmd: 'strikeThrough',
            text: 'strike',
        });

        SirTrevor.Formatters.Strikethrough = new Strikethrough();

        const OrderedList = SirTrevor.Formatter.extend({
            title: 'orderedlist',
            iconName: 'orderedlist',
            cmd: 'insertOrderedList',
            text: 'orderedlist',
        });

        SirTrevor.Formatters.NumberedList = new OrderedList();

        const UnorderedList = SirTrevor.Formatter.extend({
            title: 'unorderedlist',
            iconName: 'unorderedlist',
            cmd: 'insertUnorderedList',
            text: 'unorderedlist',
        });

        SirTrevor.Formatters.BulletList = new UnorderedList();

        const RemoveFormat = SirTrevor.Formatter.extend({
            title: 'removeformat',
            iconName: 'removeformat',
            cmd: 'removeformat',
            text: 'removeformat',
        });

        SirTrevor.Formatters.RemoveFormat = new RemoveFormat();

        const Bold = SirTrevor.Formatter.extend({
            title: 'bold',
            iconName: 'bold',
            cmd: 'bold',
            keyCode: 66,
            text: 'bold',
        });

        SirTrevor.Formatters.Bold = new Bold();

        const Italic = SirTrevor.Formatter.extend({
            title: 'italic',
            iconName: 'italic',
            cmd: 'italic',
            keyCode: 73,
            text: 'italic',
        });

        SirTrevor.Formatters.Italic = new Italic();

        const UnLink = SirTrevor.Formatter.extend({
            title: 'unlink',
            iconName: 'unlink',
            cmd: 'unlink',
            text: 'unlink',
        });

        SirTrevor.Formatters.Unlink = new UnLink();

        const HeaderFour = SirTrevor.Formatter.extend({
            title: 'h4',
            iconName: 'h4',
            cmd: 'headerFour',
            text: 'H4',
            onClick: () => {
                document.execCommand('formatBlock', false, '<h4>');
            },
        });

        SirTrevor.Formatters.HeaderFour = new HeaderFour();

        const HeaderFive = SirTrevor.Formatter.extend({
            title: 'h5',
            iconName: 'h5',
            cmd: 'headerFive',
            text: 'H5',
            onClick: () => {
                document.execCommand('formatBlock', false, '<h5>');
            },
        });

        SirTrevor.Formatters.HeaderFive = new HeaderFive();

        const Link = SirTrevor.Formatter.extend({
            title: 'link',
            iconName: 'link',
            cmd: 'CreateLink',
            text: 'link',
            onClick: function() {
                const selectionText = document.getSelection();
                /* eslint-disable no-alert */
                let link = prompt(window.i18n.t('general:link'));
                const linkRegex = /((ftp|http|https):\/\/.)|mailto(?=:[-.\w]+@)/;

                if (link && link.length > 0) {
                    if (!linkRegex.test(link)) {
                        link = 'http://' + link;
                    }

                    document.execCommand(
                        'insertHTML',
                        false,
                        '<a href="' + link + '" target="_blank">' + selectionText + '</a>'
                    );
                }
            },
            isActive: function() {
                const selection = window.getSelection();
                let node;

                if (selection.rangeCount > 0) {
                    node = selection.getRangeAt(0)
                        .startContainer
                        .parentNode;
                }
                return node && node.nodeName === 'A';
            },
        });

        SirTrevor.Formatters.Link = new Link();
    }]);

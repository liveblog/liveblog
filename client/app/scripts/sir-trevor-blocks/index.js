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
import pollBlock from './poll-block';
import videoBlock from './video-block';
import embedBockFactory from './embed-block';
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

/**
 * Simple function is intended to escape _ characters from html tag attributes
 * before passing the content to SirTrevor.toHTML function. SirTrevors screws up underscores
 * and replace them with <i> tags like if it was markdown
 *
 * This is long time known issue. Check https://dev.sourcefabric.org/browse/LBSD-2353
 * and connected issues.
 * @param {string} htmlString
 */
function escapeUnderscore(htmlString) {
    // SirTrevor won't match this and then it will replace them with _
    const tripleBackslashEscape = '\\\_'; // eslint-disable-line
    const tagAttrs = /(\S+)\s*=\s*([']|["])([\W\w]*?)\2/gm;

    return htmlString
        .replace(tagAttrs, (match) => match.replace(/_/g, tripleBackslashEscape));
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

        // Add custom methods to all blocks.
        SirTrevor.Block.prototype.toCleanHTML = function() {
            return this.toHTML();
        };

        SirTrevor.Block.prototype.toMeta = function() {
            return this.getData();
        };

        SirTrevor.Block.prototype.getOptions = function() {
            const instance = SirTrevor.$get().getInstance(this.instanceID);

            return instance ? instance.options : null;
        };

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
                    '<div data-test-id="st-quote-input" class="st-required st-quote-block quote-input" ',
                    ' placeholder="' + this.quotePlaceholder + '" contenteditable="true"></div>',
                    '<div data-test-id="st-cite-input" contenteditable="true" name="cite" placeholder="',
                    this.creditPlaceholder + '" class="js-cite-input st-quote-block"></div>',
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

        SirTrevor.Blocks.Embed = embedBockFactory(SirTrevor, config);

        SirTrevor.Blocks.Image = imageBlock(SirTrevor, config);

        SirTrevor.Blocks.Video = videoBlock(SirTrevor, config);

        SirTrevor.Blocks.Poll = pollBlock(SirTrevor, config);

        SirTrevor.Blocks.Text.prototype.loadData = function(data) {
            let htmlContent = escapeUnderscore(data.text);

            this.getTextBlock().html(SirTrevor.toHTML(htmlContent, this.type));
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
                let htmlContent = escapeUnderscore(data.text);

                this.getTextBlock().html(SirTrevor.toHTML(htmlContent, this.type));
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

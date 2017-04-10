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

function createCaretPlacer(atStart) {
    return function(el) {
        el.focus();
        if (typeof window.getSelection !== "undefined"
                && typeof document.createRange !== "undefined") {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(atStart);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange !== "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(atStart);
            textRange.select();
        }
    };
}

var AddContentBtns = function() {
    this.top = $('.st-block-controls__top');
    this.bottom = $('[data-icon-after="ADD CONTENT HERE"]');
};

AddContentBtns.prototype.hide = function() {
    this.top.hide();
    this.bottom.removeAttr('data-icon-after');
}

AddContentBtns.prototype.show = function() {
    this.top.show();
    this.bottom.attr('data-icon-after', 'ADD CONTENT HERE');
}

var placeCaretAtStart = createCaretPlacer(true);
var placeCaretAtEnd = createCaretPlacer(false);
var uriRegx = '(https?:)?\\/\\/[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&amp;:\/~+#-]*[\\w@?^=%&amp;\/~+#-])?';

function fixSecureEmbed(string) {
    var ret;
    if (window.location.protocol === 'https:') {
        var pattern = new RegExp(uriRegx, 'i'),
            matches = string.match(pattern);
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

function isURI(string) {
    var pattern = new RegExp('^' + uriRegx, 'i');
    return pattern.test(string);
}
function handlePlaceholder(selector, placeHolderText, options) {
    var onEvents = 'click';
    if (options && options.tabbedOrder) {
        onEvents += ' focus';
    }
    selector.on(onEvents, function(ev) {
        var $this = $(this);
        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', '');
        }
    });
    selector.on('focusout', function(ev) {
        var $this = $(this);
        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', placeHolderText);
        }
    });
}
angular
.module('SirTrevorBlocks', [])
    .config(['SirTrevorProvider', 'config', function(SirTrevor, config) {

        //replace the plus symbol with text description
        SirTrevor.FloatingBlockControls.prototype.attributes = function() {
            return {
              'data-icon': 'ADD CONTENT HERE'
            };
        }
        SirTrevor.Block.prototype.attributes = function() {
            return _.extend(SirTrevor.SimpleBlock.fn.attributes.call(this), {
                'data-icon-after': "ADD CONTENT HERE"
            });
        }
        // Add toMeta method to all blocks.
        SirTrevor.Block.prototype.toMeta = function() {return;};
        SirTrevor.Block.prototype.getOptions = function() {
            var instance = SirTrevor.$get().getInstance(this.instanceID);
            return instance ? instance.options : null;
        };
        SirTrevor.Blocks.Embed = SirTrevor.Block.extend({
            type: 'embed',
            data: {},
            title: function() { return 'Embed'; },
            icon_name: 'embed',
            embedPlaceholder: window.gettext('url or embed code'),
            editorHTML: function() {
                return [
                    '<div class="st-required st-embed-block embed-input"',
                    ' placeholder="' + this.embedPlaceholder + '" contenteditable="true"></div>'
                ].join('\n');
            },
            onBlockRender: function() {
                var that = this;
                // create and trigger a 'change' event for the $editor which is a contenteditable
                this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                    var $this = $(this);
                    $this.data('before', $this.html());
                });
                this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                    var $this = $(this);
                    if ($this.data('before') !== $this.html()) {
                        $this.data('before', $this.html());
                        $this.trigger('change');
                    }
                });
                handlePlaceholder(this.$editor.filter('[contenteditable]'), that.embedPlaceholder);
                // when the link field changes
                var callServiceAndLoadData = function() {
                    var input = $(this)
                        .text()
                        .trim();

                    // exit if the input field is empty
                    if (_.isEmpty(input)) {
                        that.getOptions().disableSubmit(true);
                        return false;
                    }
                    that.getOptions().disableSubmit(false);
                    // reset error messages
                    that.resetMessages();
                    // start a loader over the block, it will be stopped in the loadData function
                    that.loading();
                    input = fixSecureEmbed(input);
                    // if the input is an url, use embed services
                    if (isURI(input)) {
                        // request the embedService with the provided url
                        that.getOptions().embedService.get(input, that.getOptions().coverMaxWidth).then(
                            function successCallback(data) {
                                data.original_url = input;
                                that.loadData(data);
                            },
                            function errorCallback(error) {
                                that.addMessage(error);
                                that.ready();
                            }
                        );
                    // otherwise, use the input as the embed code
                    } else {
                        that.loadData({html: input});
                    }
                }
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
                var that = this;
                // retrieve new data from editor
                var editor_data = {
                    title: that.$('.title-preview').text(),
                    description: that.$('.description-preview').text(),
                    credit: that.$('.credit-preview').text()
                };
                // remove thumbnail_url if it was removed by user
                if (that.$('.cover-preview').hasClass('hidden')) {
                    editor_data.thumbnail_url = null;
                }
                // add data which are not in the editor but has been saved before (like thumbnail_width)
                _.merge(that.data, editor_data);
                // clean data by removing empty string
                _.forEach(that.data, function(value, key) {
                    if (typeof(value) === 'string' && value.trim() === '') {
                        delete that.data[key];
                    }
                });
                return that.data;
            },
            renderCard: function(data) {
                var card_class = 'liveblog--card';
                var html = $([
                    '<div class="' + card_class + ' hidden">',
                    '  <div class="hidden st-embed-block embed-preview"></div>',
                    '  <div class="hidden st-embed-block cover-preview-handler">',
                    '    <div class="st-embed-block cover-preview"></div>',
                    '  </div>',
                    '  <div class="st-embed-block title-preview"></div>',
                    '  <div class="st-embed-block description-preview"></div>',
                    '  <div class="st-embed-block credit-preview"></div>',
                    '  <a class="hidden st-embed-block link-preview" target="_blank"></a>',
                    '</div>'
                ].join('\n'));
                // hide everything
                html.find(
                    ['.embed-preview',
                    '.cover-preview-handler'].join(', ')
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
                    var ratio = data.thumbnail_width / data.thumbnail_height;
                    var cover_width = Math.min(this.getOptions().coverMaxWidth, data.thumbnail_width);
                    var cover_height = cover_width / ratio;
                    html.find('.cover-preview').css({
                        'background-image': 'url("' + data.thumbnail_url + '")',
                        width: cover_width,
                        height: cover_height,
                        'background-size': 'cover'
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
                    var credit_text = data.provider_name;
                    if (_.has(data, 'author_name')) {
                        credit_text += ' | by <a href="' + data.author_url + '" target="_blank">' +
                            data.author_name + '</a>';
                    }
                    html.find('.credit-preview').html(credit_text);
                }

                if (_.has(data, 'credit')) {
                    html.find('.credit-preview').html(data.credit);
                }

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
                // retrieve the final html code
                var html_to_return = '';
                html_to_return = '<div class="' + card_class + '">';
                html_to_return += html.get(0).innerHTML;
                html_to_return += '</div>';
                return html_to_return;
            },
            // render a card from data, and make it editable
            loadData: function(data) {
                var that = this;
                that.data = data;
                // hide the embed input field, render the card and add it to the DOM
                that.$('.embed-input')
                    .addClass('hidden')
                    .after(that.renderCard(data));
                // set somes fields contenteditable
                ['title', 'description', 'credit'].forEach(function(field_name) {
                    that.$('.' + field_name + '-preview').attr({
                        contenteditable: true,
                        placeholder: field_name
                    });
                });
                // remove the loader when media is loaded
                var iframe = this.$('.embed-preview iframe');
                if (iframe.length > 0) {
                    // special case for iframe
                    iframe.ready(this.ready.bind(this));
                } else {
                    this.ready();
                }
                // add a link to remove/show the cover
                var $cover_handler = this.$('.cover-preview-handler');
                if ($cover_handler.length > 0 && !$cover_handler.hasClass('hidden')) {
                    var $cover_preview = $cover_handler.find('.cover-preview');
                    var $remove_link = $('<a href="#">').text('hide the illustration');
                    var $show_link = $('<a href="#">')
                        .text('show the illustration')
                        .addClass('hidden');

                    $remove_link.on('click', function removeCoverAndDisillustrationplayShowLink(e) {
                        that.saved_cover_url = that.data.thumbnail_url;
                        $cover_preview.addClass('hidden');
                        $(this).addClass('hidden');
                        $show_link.removeClass('hidden');
                        e.preventDefault();
                    });
                    $show_link.on('click', function showCoverAndDisplayRemoveLink(e) {
                        that.data.thumbnail_url = that.saved_cover_url;
                        $cover_preview.removeClass('hidden');
                        $(this).addClass('hidden');
                        $remove_link.removeClass('hidden');
                        e.preventDefault();
                    });
                    $cover_handler.append($remove_link, $show_link);
                }
                //if instagram process the embed code
                if (data.html && data.html.indexOf('platform.instagram.com') !== -1) {
                    setTimeout(function() {
                        window.instgrm.Embeds.process();
                    }, 1000);
                }
            },
            focus: function() {
                this.$('.embed-input').focus();
            },
            // toMarkdown: function(markdown) {},
            toHTML: function() {
                var data = this.retrieveData();
                return this.renderCard(data);
            },
            toMeta: function() {
                return this.retrieveData();
            }
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
                var template = _.template([
                    '<div class="st-required st-quote-block quote-input" ',
                    ' placeholder="' + this.quotePlaceholder + '" contenteditable="true"></div>',
                    '<div contenteditable="true" name="cite" placeholder="' + this.creditPlaceholder + '"',
                    ' class="js-cite-input st-quote-block"></div>'
                ].join('\n'));

                return template(this);
            },
            onBlockRender: function() {
                const onEditorChange = () => {
                    var data = this.retrieveData(),
                        input = data.quote + data.credit;

                    if (_.isEmpty(input)) {
                        this.getOptions().disableSubmit(true);
                        return false;
                    }
                    this.getOptions().disableSubmit(false);
                };

                this.$('.quote-input .js-cite-input');
                this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                    var $this = $(this);

                    $this.data('before', $this.html());
                });
                this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                    var $this = $(this);

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
                    credit: this.$('.js-cite-input').text() || undefined
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
                var data = this.retrieveData();

                return [
                    '<blockquote><p>',
                    data.quote,
                    '</p><h4><i>',
                    data.credit,
                    '</i></h4></blockquote>'
                ].join('');
            },
            toMeta: function() {
                return this.retrieveData();
            }
        });

        // Image Block
        var upload_options = {
        // NOTE: responsive layout is currently disabled. so row and col-md-6 are useless
            html: [
                '<div class="row st-block__upload-container">',
                '    <div class="col-md-6">',
                '       <label onclick="$(this).next().trigger(\'click\');" ',
                '              class="btn btn-default"><%= i18n.t("general:upload") %></label>',
                '       <input type="file" type="st-file-upload" />',
                '    </div>',
                '</div>'
            ].join('\n')
        };

        SirTrevor.DEFAULTS.Block.upload_options = upload_options;
        SirTrevor.Locales.en.general.upload = 'Select from folder';
        SirTrevor.Blocks.Image = SirTrevor.Block.extend({
            type: 'image',
            title: function() {
                return 'Image';
            },
            droppable: true,
            uploadable: true,
            icon_name: 'image',
            descriptionPlaceholder: window.gettext('Add a description'),
            authorPlaceholder: window.gettext('Add author / photographer'),
            loadData: function(data) {
                var that = this;

                let fileUrl = '';

                if (typeof(data.file) !== 'undefined') {
                    fileUrl = data.file.url;
                } else if (data.media._url) {
                    fileUrl = data.media._url;
                } else if (data.media.renditions.thumbnail.href) {
                    fileUrl = data.media.renditions.thumbnail.href;
                }

                this.$editor.html($('<img>', {
                    src: fileUrl
                })).show();
                this.$editor.append($('<div>', {
                    name: 'caption',
                    class: 'st-image-block',
                    contenteditable: true,
                    placeholder: that.descriptionPlaceholder
                }).html(data.caption));

                //add hidden credit size warning just in case
                this.$editor.append($('<div>', {
                    name: 'credit-size-alert',
                    class: 'alert alert-error',
                    role: 'alert',
                    style: 'display: none'
                })
                .html(window.gettext('Max. amount of 300 characters is reached')));

                this.$editor.append($('<div>', {
                    name: 'credit',
                    class: 'st-image-block',
                    contenteditable: true,
                    placeholder: that.authorPlaceholder
                }).html(data.credit));

                //limit characters for credit to a max of 300
                this.$editor.find('[name="credit"]').bind('input', function(ev) {
                    if (this.innerText.length > 300) {
                        this.innerText = this.innerText.substring(0, 300);
                        $(this).css('border', '1px solid red');
                        that.$editor.find('[name="credit-size-alert"]').css('display', 'block');
                    } else {
                        that.$editor.find('[name="credit-size-alert"]').css('display', 'none');
                        $(this).css({'border': '0px', 'border-bottom': '1px solid #999'});
                    }
                });

                //image size warning
                var maxFileSize = 2; //in MB
                if ( data.file && (data.file.size / 1048576) > maxFileSize) {
                    this.$editor.prepend($('<div>', {
                        name: 'size-warning',
                        class: 'alert alert-warning',
                        role: 'alert',
                    })
                    .html(window.gettext(
                        'The image is being uploaded, please stand by. ' +
                        'It may take a while as the file is bigger than ' + maxFileSize + 'MB.'
                    )));
                    window.setTimeout(function() {
                        that.$editor.find('[name="size-warning"]').css('display', 'none');
                    }, 10000);
                }

                //remove placeholders
                handlePlaceholder(this.$('[name=caption]'), that.descriptionPlaceholder)
                handlePlaceholder(this.$('[name=credit]'), that.authorPlaceholder, {tabbedOrder: true})
            },
            onBlockRender: function() {
                var that = this;
                // assert we have an uploader function in options
                if (typeof(this.getOptions().uploader) !== 'function') {
                    throw 'Image block need an `uploader` function in options.';
                }
                // setup the upload button
                this.$inputs.find('button').bind('click', function(ev) {
                    ev.preventDefault();
                });
                this.$inputs.find('input').on('change', _.bind(function(ev) {
                    this.onDrop(ev.currentTarget);
                }, this));
            },
            onDrop: function(transferData) {
                var that = this;
                var file = transferData.files[0];
                var urlAPI = window.URL;
                var addContentBtns = new AddContentBtns();

                if (typeof urlAPI === 'undefined') {
                    urlAPI = window.webkitURL;
                }

                if (file.size > config.maxContentLength) {
                    var message = "Image bigger than " +
                        (config.maxContentLength / 1024 / 1024) +
                        "MB";

                    that.addMessage(message);
                    that.ready();

                    return;
                }

                // Handle one upload at a time
                if (/image/.test(file.type)) {
                    this.loading();

                    // Hide add content buttons while uploading
                    addContentBtns.hide();

                    // Show this image on here
                    this.$inputs.hide();
                    this.loadData({
                        file: {
                            url: urlAPI.createObjectURL(file),
                            size: file.size
                        }
                    });
                    this.getOptions().uploader(
                        file,
                        function(data) {
                            addContentBtns.show();
                            that.getOptions().disableSubmit(false);
                            that.setData(data);
                            that.ready();
                        },
                        function(error) {
                            addContentBtns.show();
                            var message = error || window.i18n.t('blocks:image:upload_error');
                            that.addMessage(message);
                            that.ready();
                        }
                    );
                }
            },
            retrieveData: function() {
                return {
                    media: this.getData().media,
                    caption: this.$('[name=caption]').text(),
                    credit: this.$('[name=credit]').text()
                };
            },
            toHTML: function() {
                var data = this.retrieveData();
                var srcset = '';
                _.forEach(data.media.renditions, function(value) {
                    srcset += ', ' + value.href + ' ' + value.width + 'w';
                });
                return [
                    '<figure>',
                    '    <img src="' + data.media._url + '" alt="' + data.caption + '"',
                    srcset? ' srcset="' + srcset.substring(2) + '"' : '',
                    '/>',
                    '    <figcaption>' + 
                    data.caption + (data.credit === '' ? '' : ' Credit: ' + data.credit) + 
                    '</figcaption>',
                    '</figure>'
                ].join('');
            },
            toMeta: function() {
                return this.retrieveData();
            }
        });
        SirTrevor.Blocks.Text.prototype.loadData = function(data) {
            this.getTextBlock().html(SirTrevor.toHTML(data.text, this.type));
        };

        SirTrevor.Blocks.Text.prototype.onBlockRender = function() {
                var that = this, placeHolderText = window.gettext('Start writing here…');

                //add placeholder class and placeholder text
                this.$editor.attr('placeholder', placeHolderText).addClass('st-placeholder');
                // create and trigger a 'change' event for the $editor which is a contenteditable
                this.$editor.filter('[contenteditable]').on('focus', function(ev) {
                    var $this = $(this);
                    $this.data('before', $this.html());
                });
                this.$editor.filter('[contenteditable]').on('click', function(ev) {
                    var $this = $(this);
                    if (_.trim($this.html()) === '') {
                        $this.attr('placeholder', '');
                    }
                });
                this.$editor.filter('[contenteditable]').on('focusout', function(ev) {
                    var $this = $(this);
                    if (_.trim($this.html()) === '') {
                        $this.attr('placeholder', placeHolderText);
                    }
                });
                this.$editor.filter('[contenteditable]').on('blur keyup paste input', function(ev) {
                    var $this = $(this);
                    if ($this.data('before') !== $this.html()) {
                        $this.data('before', $this.html());
                        $this.trigger('change');
                    }
                });
                // when the link field changes
                this.$editor.on('change', _.debounce(function () {
                    var input = $(this)
                        .text()
                        .trim();

                    if (_.isEmpty(input)) {
                        if (that.getOptions())
                            that.getOptions().disableSubmit(true);
                        return false;
                    } else if (that.getOptions()) {
                        that.getOptions().disableSubmit(false);
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
        SirTrevor.Blocks.Text.prototype.onContentPasted = _.debounce(function(event) {
            // Content pasted. Delegate to the drop parse method
            var input = $(event.target).closest('[contenteditable]'),
                val = input.html();
            if (val) {
                val = val.replace(/(<style\b[^>]*>)[^<>]*(<\/style>)/ig, '');
                val = val.replace(/(<script\b[^>]*>)[^<>]*(<\/script>)/ig, '');
                // use paragraph tag `p` instead of `div` witch isn't supported.
                val = val.replace(/<(\/)?div\b[^\/>]*>/ig, '<$1p>');
                val = val.replace(/<(br|p|b|i|strike|ul|ol|li|a)\b[^\/>]+>/ig, '<$1>');
                val = val.replace(/<(?!\s*\/?(br|p|b|i|strike|ul|ol|li|a)\b)[^>]+>/ig, '');
            }
            input.html(val);
            placeCaretAtEnd(input.get(0));
        }, 0);

        SirTrevor.Blocks.Comment = SirTrevor.Block.extend({
            type: "comment",

            title: function() { return window.i18n.t('blocks:comment:title'); },

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
                };
            },
            toHTML: function(html) {
                if (this.$el) {
                    return this.getTextBlock().html();
                }

                return html;
            },
            toMeta: function() {
                var data = this.getData();
                return {
                    text: data.text,
                    commenter: data.commenter,
                    _created: data._created
                }
            }
        });
        var Strikethrough = SirTrevor.Formatter.extend({
            title: 'strikethrough',
            iconName: 'strikethrough',
            cmd: 'strikeThrough',
            text: 'strike'
        });
        SirTrevor.Formatters.Strikethrough = new Strikethrough();

        var OrderedList = SirTrevor.Formatter.extend({
            title: 'orderedlist',
            iconName: 'orderedlist',
            cmd: 'insertOrderedList',
            text: 'orderedlist'
        });
        SirTrevor.Formatters.NumberedList = new OrderedList();

        var UnorderedList = SirTrevor.Formatter.extend({
            title: 'unorderedlist',
            iconName: 'unorderedlist',
            cmd: 'insertUnorderedList',
            text: 'unorderedlist'
        });
        SirTrevor.Formatters.BulletList = new UnorderedList();

        var RemoveFormat = SirTrevor.Formatter.extend({
            title: 'removeformat',
            iconName: 'removeformat',
            cmd: 'removeformat',
            text: 'removeformat'
        });
        SirTrevor.Formatters.RemoveFormat = new RemoveFormat();

        var Bold = SirTrevor.Formatter.extend({
            title: 'bold',
            iconName: 'bold',
            cmd: 'bold',
            keyCode: 66,
            text: 'bold'
        });
        SirTrevor.Formatters.Bold = new Bold();

        var Italic = SirTrevor.Formatter.extend({
            title: 'italic',
            iconName: 'italic',
            cmd: 'italic',
            keyCode: 73,
            text: 'italic'
        });
        SirTrevor.Formatters.Italic = new Italic();

        var UnLink = SirTrevor.Formatter.extend({
            title: 'unlink',
            iconName: 'unlink',
            cmd: 'unlink',
            text: 'unlink'
        });
        SirTrevor.Formatters.Unlink = new UnLink();

        var Link = SirTrevor.Formatter.extend({
            title: 'link',
            iconName: 'link',
            cmd: 'CreateLink',
            text: 'link',
            onClick: function() {
                var selection_text = document.getSelection(),
                    link = prompt(window.i18n.t("general:link")),
                    link_regex = /((ftp|http|https):\/\/.)|mailto(?=\:[-\.\w]+@)/;
                if (link && link.length > 0) {
                    if (!link_regex.test(link)) {
                        link = "http://" + link;
                    }

                    document.execCommand(
                        'insertHTML',
                        false,
                        '<a href="' + link + '" target="_blank">' + selection_text + '</a>'
                    );
                }
            },
            isActive: function() {
            var selection = window.getSelection(),
                node;
            if (selection.rangeCount > 0) {
              node = selection.getRangeAt(0)
                              .startContainer
                              .parentNode;
            }
            return (node && node.nodeName === 'A');
          }
        });
        SirTrevor.Formatters.Link = new Link();
    }]);

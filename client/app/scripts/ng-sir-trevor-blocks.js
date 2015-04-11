/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

define([
    'angular',
    'lodash',
    'ng-sir-trevor'
], function(angular, _) {
    'use strict';
  
    function isURI(string) {
        var url_regex = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        return (url_regex.test(string));
    }
    angular
    .module('SirTrevorBlocks', [])
        .config(['SirTrevorProvider', function(SirTrevor) {
            // Add toMeta method to all blocks.
            SirTrevor.Block.prototype.toMeta = function() {return;};
            SirTrevor.Block.prototype.getOptions = function() {
                return SirTrevor.$get().getInstance(this.instanceID).options;
            };

            SirTrevor.Blocks.Embed =  SirTrevor.Block.extend({
                type: 'embed',
                data: {},
                title: function() { return 'Embed'; },
                icon_name: 'embed',
                editorHTML: function() {
                    return [
                        '<div class="st-required st-embed-block embed-input"',
                        ' placeholder="url or embed code" contenteditable="true"></div>'
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
                    // when the link field changes
                    this.$editor.on('change', _.debounce(function callServiceAndLoadData() {
                        var input = $(this).text().trim();
                        // exit if the input field is empty
                        if (_.isEmpty(input)) {
                            return false;
                        }
                        // reset error messages
                        that.resetMessages();
                        // start a loader over the block, it will be stopped in the loadData function
                        that.loading();
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
                    }, 200));
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
                        html.find('.link-preview').attr('href', data.original_url).html(data.original_url).removeClass('hidden');
                    }
                    // set the embed code
                    if (_.has(data, 'html')) {
                        html.find('.embed-preview')
                            .html(data.html).removeClass('hidden');
                    }
                    // set the cover illustration
                    if (!_.has(data, 'html') && !_.isEmpty(data.thumbnail_url)) {
                        var ratio = data.thumbnail_width / data.thumbnail_height;
                        var cover_width = Math.min(this.getOptions().coverMaxWidth, data.thumbnail_width);
                        var cover_height = cover_width / ratio;
                        html.find('.cover-preview').css({
                            'background-image': 'url(' + data.thumbnail_url + ')',
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
                        var credit_text  = data.provider_name;
                        if (_.has(data, 'author_name')) {
                            credit_text += ' | by <a href="' + data.author_url + '" target="_blank">' + data.author_name + '</a>';
                        }
                        html.find('.credit-preview').html(credit_text);
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
                        var $remove_link = $('<a href="#">').text('remove the illustration');
                        var $show_link = $('<a href="#">').text('show the illustration').addClass('hidden');
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

            SirTrevor.Blocks.Quote =  SirTrevor.Block.extend({
                type: 'quote',
                title: function() { return window.i18n.t('blocks:quote:title'); },
                icon_name: 'quote',
                editorHTML: function() {
                    var template = _.template([
                        '<div class="st-required st-quote-block quote-input" ',
                        ' placeholder="quote" contenteditable="true"></div>',
                        '<div contenteditable="true" name="cite" placeholder="<%= i18n.t("blocks:quote:credit_field") %>"',
                        ' class="js-cite-input st-quote-block"></div>'
                    ].join('\n'));
                    return template(this);
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
                        '</p><ul><li>',
                        data.credit,
                        '</li></ul></blockquote>'
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
                    '       <label for="file-upload" class="btn btn-default"><%= i18n.t("general:upload") %></label>',
                    '       <input id="file-upload" type="file" type="st-file-upload" />',
                    '    </div>',
                    '</div>'
                ].join('\n')
            };
            SirTrevor.DEFAULTS.Block.upload_options = upload_options;
            SirTrevor.Locales.en.general.upload = 'Select from folder';
            SirTrevor.Blocks.Image =  SirTrevor.Block.extend({
                type: 'image',
                title: function() {
                    return 'Image';
                },
                droppable: true,
                uploadable: true,
                icon_name: 'image',
                loadData: function(data) {
                    var file_url = (typeof(data.file) !== 'undefined') ? data.file.url : data.media._url;
                    this.$editor.html($('<img>', {
                        src: file_url
                    })).show();
                    this.$editor.append($('<div>', {
                        name: 'caption',
                        class: 'st-image-block',
                        contenteditable: true,
                        placeholder: 'Add a description'
                    }).html(data.caption));
                    this.$editor.append($('<div>', {
                        name: 'credit',
                        class: 'st-image-block',
                        contenteditable: true,
                        placeholder: 'Add author / photographer'
                    }).html(data.credit));
                },
                onBlockRender: function() {
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
                    if (typeof urlAPI === 'undefined') {
                        urlAPI = window.webkitURL;
                    }
                    // Handle one upload at a time
                    if (/image/.test(file.type)) {
                        this.loading();
                        // Show this image on here
                        this.$inputs.hide();
                        this.loadData({
                            file: {
                                url: urlAPI.createObjectURL(file)
                            }
                        });
                        this.getOptions().uploader(
                            file,
                            function(data) {
                                that.setData(data);
                                that.ready();
                            },
                            function(error) {
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
                    return [
                        '<figure>',
                        '    <img src="' + data.media._url + '" alt="' + data.caption + '"/>',
                        '    <figcaption>' + data.caption + (data.credit === '' ? '' : ' from ' + data.credit) + '</figcaption>',
                        '</figure>'
                    ].join('');
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            // Add toHTML to existing Text Block.
            SirTrevor.Blocks.Text.prototype.toHTML = function(html) {
                if (this.$el) {
                    return this.getTextBlock().html();
                } else {
                    return html;
                }
            };

            SirTrevor.Blocks.Text.prototype.onContentPasted = _.debounce(function(event) {
                // Content pasted. Delegate to the drop parse method
                var input = $(event.target).closest('[contenteditable]'),
                    val = input.html();
                val = val.replace(/(<style\b[^>]*>)[^<>]*(<\/style>)/ig, '');
                val = val.replace(/(<script\b[^>]*>)[^<>]*(<\/script>)/ig, '');
                val = val.replace(/<(br|p|b|i|strike|ul|ol|li|a)[^\/>]+>/ig, '<$1>');
                val = val.replace(/<(?!\s*\/?(br|p|b|i|strike|ul|ol|li|a)\b)[^>]+>/ig, '');
                input.html(val);
            }, 0);

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
        }]);
});

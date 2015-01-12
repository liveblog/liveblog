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
    'ng-sir-trevor'
], function(angular) {
    'use strict';
    angular
    .module('SirTrevorBlocks', [])
        .config(['SirTrevorProvider', function(SirTrevor) {
            // Add toMeta method to all blocks.
            SirTrevor.Block.prototype.toMeta = function(){return;};
            SirTrevor.Block.prototype.getOptions = function(){return SirTrevor.$get().getInstance(this.instanceID).options;};

            SirTrevor.Blocks.Link =  SirTrevor.Block.extend({
                type: 'link',
                title: function(){ return 'Link'; },
                icon_name: 'link',
                editorHTML: function() {
                    return [
                        '<div class="st-required st-link-block link-input"',
                        ' placeholder="url" contenteditable="true"></div>',
                        '<div class="hidden st-link-block embed-preview"></div>',
                        '<img class="hidden st-link-block cover-preview" />',
                        '<div class="hidden st-link-block title-preview" contenteditable="true"></div>',
                        '<div class="hidden st-link-block description-preview" contenteditable="true"></div>',
                        '<div class="hidden st-link-block link-preview"></div>'
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
                    this.$editor.on('change', function() {
                        var $this = $(this);
                        var url = $this.text();
                        if (url.trim() === '') {
                            return false;
                        }
                        that.getOptions().embedService.get(url)
                            .then(function loadData(data) {
                                var link_data = {
                                    url: url,
                                    title: data.title,
                                    description: data.description
                                };
                                // add an embed code or a cover
                                if (data.html !== undefined) {
                                    link_data.embedCode = data.html;
                                } else {
                                    link_data.cover = data.thumbnail_url;
                                }
                                that.data = link_data;
                                that.loadData(link_data);
                            });
                    });
                },
                // retrieveData: function() {},
                loadData: function(data) {
                    // TODO: reset fields
                    this.$('.link-input, .embed-preview, .cover-preview, .title-preview, .description-preview').addClass('hidden');
                    this.$('.link-preview').removeClass('hidden').html(data.url);
                    if (data.embedCode !== undefined) {this.$('.embed-preview').removeClass('hidden').html(data.embedCode);}
                    if (data.cover !== undefined) {this.$('.cover-preview').removeClass('hidden').attr('src', data.cover);}
                    if (data.title !== undefined) {this.$('.title-preview').removeClass('hidden').html(data.title);}
                    if (data.description !== undefined) {this.$('.description-preview').removeClass('hidden').html(data.description);}
                    this.focus();
                },
                focus: function() {
                    this.$('.link-input').focus();
                },
                // toMarkdown: function(markdown) {},
                toHTML: function() {
                    var compile = _.template([
                        '<div class="embed-preview"><%= embedCode %></div>',
                        '<img class="cover-preview" src="<%= cover %>"/>',
                        '<div class="title-preview"><%= title %></div>',
                        '<div class="description-preview"><%= description %></div>',
                        '<div class="link-preview"></div>'
                    ].join('\n'));
                    console.log(compile(this.data));
                    return compile(this.data);
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            SirTrevor.Blocks.Quote =  SirTrevor.Block.extend({
                type: 'quote',
                title: function(){ return window.i18n.t('blocks:quote:title'); },
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
                loadData: function(data){
                    this.$('.quote-input').text(SirTrevor.toHTML(data.text, this.type));
                    this.$('.js-cite-input').text(data.credit);
                },
                isEmpty: function() {
                    return _.isEmpty(this.retrieveData().quote);
                },
                toMarkdown: function(markdown) {
                    return markdown.replace(/^(.+)$/mg,'> $1');
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
                    '    <input type="file" type="st-file-upload" />',
                    '    <div class="col-md-6">',
                    '        <button class="btn btn-default"><%= i18n.t("general:upload") %></button>',
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
                        '    <figcaption>' + data.caption + (data.credit === '' ? '' : ' from ' + data.credit) +'</figcaption>',
                        '</figure>'
                    ].join('');
                },
                toMeta: function() {
                    return this.retrieveData();
                }
            });

            // Add toHTML to existing Text Block.
            SirTrevor.Blocks.Text.prototype.toHTML = function() {
                return this.getTextBlock().html();
            };

            var Strikethrough = SirTrevor.Formatter.extend({
                title: 'strikethrough',
                iconName: 'strikethrough',
                cmd: 'strikeThrough',
                text: 'S'
            });
            SirTrevor.Formatters.Strikethrough = new Strikethrough();

            var OrderedList = SirTrevor.Formatter.extend({
                title: 'orderedlist',
                iconName: 'link',
                cmd: 'insertOrderedList',
                text: 'orderedlist'
            });
            SirTrevor.Formatters.NumberedList = new OrderedList();

            var UnorderedList = SirTrevor.Formatter.extend({
                title: 'unorderedlist',
                iconName: 'link',
                cmd: 'insertUnorderedList',
                text: 'unorderedlist'
            });
            SirTrevor.Formatters.BulletList = new UnorderedList();

        }]);
});

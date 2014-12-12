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

            SirTrevor.Blocks.Quote =  SirTrevor.Block.extend({

                type: 'quote',

                title: function(){ return window.i18n.t('blocks:quote:title'); },

                icon_name: 'quote',

                editorHTML: function() {
                    var template = _.template([
                        '<blockquote class="st-required st-text-block" contenteditable="true"></blockquote>',
                        '<label class="st-input-label"> <%= i18n.t("blocks:quote:credit_field") %></label>',
                        '<input maxlength="140" name="cite" placeholder="<%= i18n.t("blocks:quote:credit_field") %>"',
                        ' class="st-input-string st-required js-cite-input" type="text" />'
                    ].join('\n'));
                    return template(this);
                },
          
                loadData: function(data){
                    this.getTextBlock().html(SirTrevor.toHTML(data.text, this.type));
                    this.$('.js-cite-input').val(data.cite);
                },
          
                toMarkdown: function(markdown) {
                    return markdown.replace(/^(.+)$/mg,'> $1');
                },
                toHTML: function(html) {
                    return [
                        '<blockquote><p>',
                        this.getTextBlock().html(),
                        '</p><ul><li>',
                        this.$('.js-cite-input').val(),
                        '</li></ul></blockquote>'
                    ].join('');
                },
                toMeta: function() {
                    return {
                        quote: this.getTextBlock().html(),
                        credit: this.$('.js-cite-input').val()
                    };
                }
            });

            SirTrevor.Blocks.Image =  SirTrevor.Block.extend({
                type: 'Image',
                title: function() {
                    return 'Image';
                },
                droppable: true,
                uploadable: true,
                icon_name: 'image',
                loadData: function(data) {
                    this.$editor.html($('<img>', {
                        src: data.file.url
                    })).show();
                    this.$editor.append($('<input>', {
                        type: 'text',
                        name: 'description',
                        placeholder: 'Description',
                        value: data.text
                    }));
                    this.$editor.append($('<input>', {
                        type: 'text',
                        name: 'credit',
                        placeholder: 'Credit',
                        value: data.text
                    }));
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
                                that.addMessage(window.i18n.t('blocks:image:upload_error'));
                                that.ready();
                            }
                        );
                    }
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

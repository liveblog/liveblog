define([
    'jquery',
    'sir-trevor'
], function($, SirTrevor) {

    'use strict';

    // BLOCK: Image with Description and Credit
    var ImageWithDescriptionAndCreditFactory = function (block_name) {
        return SirTrevor.Block.extend({
            type: block_name,
            title: function() {
                return 'Add image';
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
            getOptions: function() {
                return SirTrevor.getInstance(this.instanceID).options;
            },
            onBlockRender: function() {
                // assert we have an uploader function in options
                if (typeof(this.getOptions().uploader) !== 'function') {
                    throw block_name  + ' need an `uploader` function in options.';
                }
                /* Setup the upload button */
                this.$inputs.find('button').bind('click', function(ev) {
                    ev.preventDefault();
                });
                this.$inputs.find('input').on('change', _.bind(function(ev) {
                    this.onDrop(ev.currentTarget);
                }, this));
            },
            onDrop: function(transferData) {
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
                            this.setData(data);
                            this.ready();
                        },
                        function(error) {
                            this.addMessage(window.i18n.t('blocks:image:upload_error'));
                            this.ready();
                        }
                    );
                }
            }
        });
    };
    return ImageWithDescriptionAndCreditFactory;
});

// EOF

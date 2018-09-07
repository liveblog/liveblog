import handlePlaceholder from './handle-placeholder';

const AddContentBtns = function() {
    this.top = $('.st-block-controls__top');
    this.bottom = $('[data-icon-after="ADD CONTENT HERE"]');
};

AddContentBtns.prototype.hide = function() {
    this.top.hide();
    this.bottom.removeAttr('data-icon-after');
};

AddContentBtns.prototype.show = function() {
    this.top.show();
    this.bottom.attr('data-icon-after', 'ADD CONTENT HERE');
};

export default function imageBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
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
            const self = this;
            let fileUrl = '';

            if (typeof data.file !== 'undefined') {
                fileUrl = data.file.url;
            } else if (data.media._url) {
                fileUrl = data.media._url;
            } else if (data.media.renditions.thumbnail.href) {
                fileUrl = data.media.renditions.thumbnail.href;
            }

            this.$editor.html($('<img>', {
                src: fileUrl,
            })).show();
            this.$editor.append($('<div>', {
                name: 'caption',
                class: 'st-image-block',
                contenteditable: true,
                placeholder: self.descriptionPlaceholder,
            }).html(data.caption));

            // Add hidden credit size warning just in case
            this.$editor.append($('<div>', {
                name: 'credit-size-alert',
                class: 'alert alert-error',
                role: 'alert',
                style: 'display: none',
            })
                .html(window.gettext('Max. amount of 300 characters is reached')));

            this.$editor.append($('<div>', {
                name: 'credit',
                class: 'st-image-block',
                contenteditable: true,
                placeholder: self.authorPlaceholder,
            }).html(data.credit));

            // limit characters for credit to a max of 300
            this.$editor.find('[name="credit"]').bind('input', function(ev) {
                if (this.innerText.length > 300) {
                    this.innerText = this.innerText.substring(0, 300);
                    $(this).css('border', '1px solid red');
                    self.$editor.find('[name="credit-size-alert"]').css('display', 'block');
                } else {
                    self.$editor.find('[name="credit-size-alert"]').css('display', 'none');
                    $(this).css({border: '0px', 'border-bottom': '1px solid #999'});
                }
            });

            // TODO: This shouldn't be here, max image size is defined in the configuration
            // Image size warning
            const maxFileSize = 2; // in MB

            if (data.file && data.file.size / 1048576 > maxFileSize) {
                this.$editor.prepend($('<div>', {
                    name: 'size-warning',
                    class: 'alert alert-warning',
                    role: 'alert',
                })
                    .html(window.gettext(
                        'The image is being uploaded, please stand by. ' +
                    'It may take a while as the file is bigger than ' + maxFileSize + 'MB.'
                    )));
                window.setTimeout(() => {
                    self.$editor.find('[name="size-warning"]').css('display', 'none');
                }, 10000);
            }

            // Remove placeholders
            handlePlaceholder(this.$('[name=caption]'), self.descriptionPlaceholder);
            handlePlaceholder(this.$('[name=credit]'), self.authorPlaceholder, {tabbedOrder: true});
        },
        onBlockRender: function() {
            const self = this;

            // assert we have an uploader function in options
            if (typeof this.getOptions().uploader !== 'function') {
                throw 'Image block need an `uploader` function in options.';
            }
            // setup the upload button
            this.$inputs.find('button').bind('click', (ev) => {
                ev.preventDefault();
            });
            this.$inputs.find('input').on('change', _.bind(function(ev) {
                this.onDrop(ev.currentTarget);
            }, this));

            this.$('[data-icon="close"]').on('click', () => {
                self.getOptions().setPending(false);
                const addContentBtns = new AddContentBtns();

                addContentBtns.show();
            });

            this.$inputs.find('.st-block__dropzone')[0].addEventListener('drop', _.bind(function(ev) {
                this.onRemoteDrop(ev.dataTransfer);
            }, this));
        },
        // Drag and drop from a remote web page
        onRemoteDrop: function(transferData) {
            // Check for an existing URL
            if (transferData.getData('text/html')) {
                const addContentBtns = new AddContentBtns();
                const remoteTag = transferData.getData('text/html');
                const regex = /<img.*?src="(.*?)"/;
                let sourceAttr = regex.exec(remoteTag)[1];
                const srcAttr = sourceAttr.replace(/&amp;/g, '&');

                addContentBtns.hide();
                this.loading();
                // Show this image on here
                this.$inputs.hide();
                this.loadData({
                    file: {
                        url: srcAttr,
                    },
                });

                this.getOptions().disableSubmit(false);
                this.setData({media: {_url: srcAttr}});

                this.getOptions()
                    .gogoGadgetoRemoteImage(srcAttr)
                    .then((data) => {
                        Object.keys(data.media.renditions).forEach((key) => {
                            const rendition = data.media.renditions[key];

                            rendition.media = rendition.media.$oid;
                        });

                        this.getOptions().disableSubmit(false);
                        this.setData(data);
                        this.ready();
                        addContentBtns.show();
                    })
                    .catch((err) => {
                        addContentBtns.show();
                        this.addMessage(window.i18n.t('blocks:image:remote_upload_error'));
                        this.addMessage(gettext(`
                            Liveblog can not access the link to the file you have dropped.
                            This can have several reasons -
                            the link could be expired or only be accessible from your network.
                            Please try downloading the file and then uploading it
                            instead of dragging & dropping
                        `));
                        this.ready();
                    });
            }
        },
        // Drag and drop an image from a local drive
        onDrop: function(transferData) {
            const file = transferData.files[0];
            let urlAPI = window.URL;
            const addContentBtns = new AddContentBtns();

            if (typeof urlAPI === 'undefined') {
                urlAPI = window.webkitURL;
            }

            if (!file) {
                return false;
            }

            if (file.size > config.maxContentLength) {
                const maxContentLengthMB = config.maxContentLength / 1024 / 1024;
                const message = `Image bigger than ${maxContentLengthMB}MB`;

                this.addMessage(message);
                this.ready();

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
                        size: file.size,
                    },
                });
                this.getOptions().uploader(
                    file,
                    (data) => {
                        addContentBtns.show();
                        this.getOptions().disableSubmit(false);
                        this.setData(data);
                        this.ready();
                    },
                    (error) => {
                        addContentBtns.show();
                        const message = error || window.i18n.t('blocks:image:upload_error');

                        this.addMessage(message);
                        this.ready();
                    }
                );
            }
        },
        retrieveData: function() {
            return {
                media: this.getData().media,
                caption: this.$('[name=caption]').text(),
                credit: this.$('[name=credit]').text(),
                syndicated_creator: this.getData().syndicated_creator,
            };
        },
        toHTML: function() {
            const data = this.retrieveData();

            if (data.media.hasOwnProperty('renditions')) {
                let srcset = '';

                _.forEach(data.media.renditions, (value) => {
                    srcset += ', ' + value.href + ' ' + value.width + 'w';
                });

                return [
                    '<figure>',
                    '    <img src="' + data.media._url + '" alt="' + data.caption + '"',
                    srcset ? ' srcset="' + srcset.substring(2) + '"' : '',
                    '/>',
                    '    <figcaption>',
                    data.caption + (data.credit === '' ? '' : ' Credit: ' + data.credit),
                    '</figcaption>',
                    '</figure>',
                ].join('');
            }
            // When drag & dropping from an external web page
            return '<figure><img src="' + data.media._url + '" /></figure>';
        },
        toMeta: function() {
            return this.retrieveData();
        },
    });
}

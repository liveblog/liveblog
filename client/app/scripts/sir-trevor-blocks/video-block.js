import handlePlaceholder from './handle-placeholder';
import MediaUploader from './helpers/media-uploader';

var AddContentBtns = function() {
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

function handleFileSize(size) {
    var i = Math.floor(Math.log(size) / Math.log(1024));

    return (size / Math.pow(1024, i)).toFixed(2) * 1
    + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
}

export default function videoBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'video',
        icon_name: 'video',
        title: function() {
            return 'Video';
        },
        droppable: true,
        descriptionPlaceholder: window.gettext('Add a description'),
        authorPlaceholder: window.gettext('Add author'),
        titlePlaceholder: window.gettext('Add title'),
        youtubeCredential: config.youtubeCredential,

        editorHTML: function() {
            return [
                '<div class="st-required st-embed-block video-input"></div>',
                '<div class="upload-status"></div><br>',
                '<div class="remaining_time"></div><br>',
                '<div class="during-upload">',
                '<p><span id="percent-transferred">'
                + '</span>% Done (<span id="bytes-transferred"></span>'
                + '/<span id="total-bytes"></span>)</p>',
                '<progress id="upload-progress" max="1" value="0"></progress>',
                '</div>',
            ].join('\n');
        },

        onBlockRender: function() {
            var self = this;

            var addContentBtns = new AddContentBtns();
            var isAdmin = self.getOptions().isAdmin();
            var uploadBlock = [
                '<div class="row st-block__upload-container">',
                '<div class="col-md-6">',
                '<label onclick="$(this).next().trigger(\'click\');"' +
                    'class="btn btn-default">Select from folder</label>',
                '<input type="file" id="embedlyUploadFile">',
                '<span class="btn btn--primary pull-right" id="updateButton">Update Credentials</span>',
                '</div>',
                '</div>',
            ].join('\n');

            // when rendering the block we need to check right away if the keys
            // for youtube uploading are already set, it not show the modal
            self.getOptions().getAccessToken(
                (data) => {
                    localStorage.setItem('accessToken', data);
                },
                (error) => {
                    self.getOptions().displayModalBox();
                }
            );

            self.$('.during-upload').hide();
            self.$('.st-block__inputs').append(uploadBlock);
            if (!isAdmin) self.$('#updateButton').hide();

            self.$('#updateButton').on('click', () => {
                var message = 'Are you sure to update the credentials?';

                self.getOptions().displayModalBox(message);
            });

            self.$('#embedlyUploadFile').on('change', function() {
                var file = $(this).prop('files')[0];

                if (!file) return false;

                // Handle one upload at a time
                if (/video/.test(file.type)) {
                    self.loading();

                    // Hide add content buttons while uploading
                    addContentBtns.hide();
                    self.$inputs.hide();

                    self.uploadFile(file);
                }
            });
        },
        uploadFile: function(file) {
            var uploadStartTime = 0;
            var title = 'liveblog-' + Math.random().toString(36)
                .substr(2, 5);
            var self = this;
            var metadata = {
                snippet: {
                    title: title,
                    description: '',
                    tags: ['youtube-cors-upload'],
                    categoryId: 22,
                },
                status: {
                    privacyStatus: 'public',
                },
            };

            let uploader = new MediaUploader({
                baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
                file: file,
                token: localStorage.getItem('accessToken'),
                metadata: metadata,
                onError: function(data) {
                    var message = data;

                    try {
                        var errorResponse = JSON.parse(data);

                        message = errorResponse.error.message;
                    } finally {
                        alert(message // eslint-disable-line
                            + '\nThe direct video upload requires a connection to Youtube');
                    }
                },
                onProgress: function(data) {
                    let currentTime = Date.now();
                    let bytesUploaded = data.loaded;
                    let totalBytes = data.total;
                    // Time is in ms, so we need to convert get seconds
                    let bytesPerSecond = bytesUploaded / ((currentTime - uploadStartTime) / 1000);
                    let estimatedSecondsRemaining = ((totalBytes - bytesUploaded) / bytesPerSecond).toFixed(2);
                    let percentageComplete = ((bytesUploaded * 100) / totalBytes).toFixed(2);

                    $('.remaining_time').text('Time Left: ' + estimatedSecondsRemaining + ' Seconds');
                    $('#upload-progress').attr({
                        value: bytesUploaded,
                        max: totalBytes,
                    });

                    $('#percent-transferred').text(percentageComplete);
                    $('#bytes-transferred').text(handleFileSize(bytesUploaded));
                    $('#total-bytes').text(handleFileSize(totalBytes));
                    $('.upload-status').text(`Please wait until the upload completes.
                        Do not close or reload your browser.`);
                    $('.during-upload').show();
                },

                onComplete: function(data) {
                    $('.remaining_time').hide();
                    $('.upload-status').text('Video uploaded successfully');
                    $('.during-upload').hide();

                    let ytParams = $.param({enablejsapi: 1, modestbranding: 1, rel: 0});
                    let uploadResponse = JSON.parse(data);
                    let media = {
                        html: `<iframe width="100%" height="400" scrolling="no"\
                            frameborder="0" src="https://www.youtube.com/embed/${uploadResponse.id}?${ytParams}"\
                            allowfullscreen></iframe>`,
                    };

                    self.getOptions().disableSubmit(false);
                    self.setData(media);
                    self.loadData(media);
                    self.ready();
                },
            });

            // This won't correspond to the *exact* start of the upload, but it should be close enough.
            uploadStartTime = Date.now();
            uploader.upload();
        },

        renderCard: function(data) {
            let cardClass = 'liveblog--card';
            let html = $(
                `<div class="${cardClass} hidden">
                  <div class="hidden st-embed-block embed-preview"></div>
                  <div class="item--embed__info">
                    <div name="title" class="st-embed-block item--embed__title title-preview"></div>
                    <div name="caption" class="st-embed-block item--embed__description description-preview"></div>
                    <div name="credit" class="st-embed-block item--embed__credit credit-preview"></div>
                  </div>
                </div>`
            );

            // hide everything
            html.find('.embed-preview').addClass('hidden');

            // set the embed code
            if (_.has(data, 'html')) {
                html.find('.embed-preview')
                    .html(data.html)
                    .removeClass('hidden');
            }

            // set the title
            if (_.has(data, 'title')) {
                html.find('.title-preview')
                    .html(data.title);
            }

            // set the description
            if (_.has(data, 'caption')) {
                html.find('.description-preview')
                    .html(data.caption);
            }

            // set the credit
            if (_.has(data, 'credit')) {
                html.find('.credit-preview').html(data.credit);
            }

            // retrieve the final html code
            return `<div class="${cardClass}">${html.get(0).innerHTML}</div>`;
        },

        onDrop: function(transferData) {
            var file = transferData.files[0];
            var addContentBtns = new AddContentBtns();
            var self = this;

            if (!file) {
                return false;
            }

            // Handle one upload at a time
            if (/video/.test(file.type)) {
                this.loading();

                // Hide add content buttons while uploading
                addContentBtns.hide();
                this.$inputs.hide();
                self.uploadFile(file);
            }
        },

        // render a card from data, and make it editable
        loadData: function(data) {
            const self = this;

            // hide the embed input field, render the card and add it to the DOM
            self.$('.video-input')
                .addClass('hidden')
                .after(self.renderCard(data));

            // set somes fields contenteditable
            self.$('.title-preview').attr({
                contenteditable: true,
                placeholder: self.titlePlaceholder,
            });

            self.$('.description-preview').attr({
                contenteditable: true,
                placeholder: self.descriptionPlaceholder,
            });

            self.$('.credit-preview').attr({
                contenteditable: true,
                placeholder: self.authorPlaceholder,
            });

            // remove the loader when media is loaded
            let iframe = this.$('.embed-preview iframe');

            // special case for iframe
            (iframe.length > 0) ? iframe.ready(this.ready.bind(this)) : this.ready();

            // Remove placeholders
            handlePlaceholder(this.$('[name=title]'), self.titlePlaceholder);
            handlePlaceholder(this.$('[name=caption]'), self.descriptionPlaceholder);
            handlePlaceholder(this.$('[name=credit]'), self.authorPlaceholder, {tabbedOrder: true});
        },

        retrieveData: function() {
            return {
                html: this.getData().html,
                url: this.getData().url,
                video_id: this.getData().video_id,
                caption: this.$('[name=caption]').text(),
                credit: this.$('[name=credit]').text(),
                title: this.$('[name=title]').text(),
            };
        },

        toHTML: function() {
            var data = this.retrieveData();

            return this.renderCard(data);
        },

        toMeta: function() {
            return this.retrieveData();
        },

    });
}

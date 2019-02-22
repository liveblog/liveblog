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
    + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
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
        embedlyKey: config.embedly.key,
        youtubeCredential: config.youtubeCredential,

        editorHTML: function() {
            return [
                '<div class="st-required st-embed-block video-input"></div>',
                '<div class="upload-status"></div><br>',
                '<div class="remaining_time"></div><br>',
                '<div class="during-upload">',
                '<p><span id="percent-transferred">'
                + '</span>% Done (<span id="bytes-transferred"></span>'
                + '/<span id="total-bytes"></span> bytes)</p>',
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
            if (!isAdmin)
                self.$('#updateButton').hide();
            self.$('#updateButton').on('click', () => {
                var message = 'Are you sure to update the credentials?';

                self.getOptions().displayModalBox(message);
            });

            self.$('#embedlyUploadFile').on('change', function() {
                var file = $(this).prop('files')[0];

                if (!file) {
                    return false;
                }
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
            debugger; // eslint-disable-line
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
            var uploader = new MediaUploader({
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
                    var currentTime = Date.now();
                    var bytesUploaded = data.loaded;
                    var totalBytes = data.total;
                    // The times are in millis, so we need to divide by 1000 to get seconds.
                    var bytesPerSecond = bytesUploaded / ((currentTime - uploadStartTime) / 1000);
                    var estimatedSecondsRemaining = ((totalBytes - bytesUploaded) / bytesPerSecond).toFixed(2);
                    var percentageComplete = ((bytesUploaded * 100) / totalBytes).toFixed(2);

                    $('.remaining_time').text('Time Left: ' + estimatedSecondsRemaining + ' Seconds');
                    $('#upload-progress').attr({
                        value: bytesUploaded,
                        max: totalBytes,
                    });

                    $('#percent-transferred').text(percentageComplete);
                    $('#bytes-transferred').text(handleFileSize(bytesUploaded));
                    $('#total-bytes').text(handleFileSize(totalBytes));
                    $('.upload-status').text('Please wait!!! uploading the video');
                    $('.during-upload').show();
                },
                onComplete: function(data) {
                    $('.remaining_time').hide();
                    $('.upload-status').text('Video uploaded successfully..');
                    $('.during-upload').hide();
                    var uploadResponse = JSON.parse(data);
                    var media = {
                        html: '<iframe width="400" height="300" scrolling="no"'
                        + ' frameborder="0" src="https://www.youtube.com/embed/'
                            + uploadResponse.id + '" allowfullscreen></iframe>',
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
            var cardClass = 'liveblog--card';

            var html = $([
                '<div class="' + cardClass + ' hidden">',
                '  <div class="hidden st-embed-block embed-preview"></div>',
                '  <div name="title" class="st-embed-block title-preview"></div>',
                '  <div name="caption" class="st-embed-block description-preview"></div>',
                '  <div name="credit" class="st-embed-block credit-preview"></div>',
                '</div>',
            ].join('\n'));

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
            var htmltoReturn = '';

            htmltoReturn = '<div class="' + cardClass + '">';
            htmltoReturn += html.get(0).innerHTML;
            htmltoReturn += '</div>';

            // this.handleProgress(data.video_id);

            return htmltoReturn;
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
            var iframe = this.$('.embed-preview iframe');

            if (iframe.length > 0) {
                // special case for iframe
                iframe.ready(this.ready.bind(this));
            } else {
                this.ready();
            }
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

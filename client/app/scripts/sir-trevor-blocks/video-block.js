/* eslint-disable no-alert, complexity */
import handlePlaceholder from './handle-placeholder';
var DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

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


var RetryHandler = function() {
    this.interval = 1000; // Start at one second
    this.maxInterval = 60 * 1000; // Don't wait longer than a minute
};

/**
 * Invoke the function after waiting
 *
 * @param {function} fn Function to invoke
 */
RetryHandler.prototype.retry = function(fn) {
    setTimeout(fn, this.interval);
    this.interval = this.nextInterval_();
};

/**
 * Reset the counter (e.g. after successful request.)
 */
RetryHandler.prototype.reset = function() {
    this.interval = 1000;
};

/**
 * Calculate the next wait time.
 * @return {number} Next wait interval, in milliseconds
 *
 * @private
 */
RetryHandler.prototype.nextInterval_ = function() {
    var interval = this.interval * 2 + this.getRandomInt_(0, 1000);

    return Math.min(interval, this.maxInterval);
};

/**
 * Get a random int in the range of min to max. Used to add jitter to wait times.
 *
 * @param {number} min Lower bounds
 * @param {number} max Upper bounds
 * @private
 */
RetryHandler.prototype.getRandomInt_ = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};


var MediaUploader = function(options) {
    var noop = function() {
        // do nothing
    };

    this.file = options.file;
    this.contentType = options.contentType || this.file.type || 'application/octet-stream';
    this.metadata = options.metadata || {
        title: this.file.name,
        mimeType: this.contentType,
    };
    this.token = options.token;
    this.onComplete = options.onComplete || noop;
    this.onProgress = options.onProgress || noop;
    this.onError = options.onError || noop;
    this.offset = options.offset || 0;
    this.chunkSize = options.chunkSize || 0;
    this.retryHandler = new RetryHandler();

    this.url = options.url;
    if (!this.url) {
        var params = options.params || {};

        params.uploadType = 'resumable';
        params.part = 'snippet,status';
        this.url = this.buildUrl_(options.fileId, params, options.baseUrl);
    }
    this.httpMethod = options.fileId ? 'PUT' : 'POST';
};

/**
 * Initiate the upload.
 */
MediaUploader.prototype.upload = function() {
    var xhr = new XMLHttpRequest();

    xhr.open(this.httpMethod, this.url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Upload-Content-Length', this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);

    xhr.onload = function(e) {
        if (e.target.status < 400) {
            var location = e.target.getResponseHeader('Location');

            this.url = location;
            this.sendFile_();
        } else {
            this.onUploadError_(e);
        }
    }.bind(this);
    xhr.onerror = this.onUploadError_.bind(this);
    xhr.send(JSON.stringify(this.metadata));
};

/**
 * Send the actual file content.
 *
 * @private
 */
MediaUploader.prototype.sendFile_ = function() {
    var content = this.file;
    var end = this.file.size;

    if (this.offset || this.chunkSize) {
    // Only bother to slice the file if we're either resuming or uploading in chunks
        if (this.chunkSize) {
            end = Math.min(this.offset + this.chunkSize, this.file.size);
        }
        content = content.slice(this.offset, end);
    }

    var xhr = new XMLHttpRequest();

    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Type', this.contentType);
    xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
        xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send(content);
};

/**
 * Query for the state of the file for resumption.
 *
 * @private
 */
MediaUploader.prototype.resume_ = function() {
    var xhr = new XMLHttpRequest();

    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Range', 'bytes */' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
        xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send();
};

/**
 * Extract the last saved range if available in the request.
 *
 * @param {XMLHttpRequest} xhr Request object
 */
MediaUploader.prototype.extractRange_ = function(xhr) {
    var range = xhr.getResponseHeader('Range');

    if (range) {
        this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
    }
};

/**
 * Handle successful responses for uploads. Depending on the context,
 * may continue with uploading the next chunk of the file or, if complete,
 * invokes the caller's callback.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadSuccess_ = function(e) {
    if (e.target.status == 200 || e.target.status == 201) {
        this.onComplete(e.target.response);
    } else if (e.target.status == 308) {
        this.extractRange_(e.target);
        this.retryHandler.reset();
        this.sendFile_();
    }
};

/**
 * Handles errors for uploads. Either retries or aborts depending
 * on the error.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadError_ = function(e) {
    if (e.target.status && e.target.status < 500) {
        this.onError(e.target.response);
    } else {
        this.retryHandler.retry(this.resume_.bind(this));
    }
};

/**
 * Handles errors for the initial request.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onUploadError_ = function(e) {
    this.onError(e.target.response); // TODO - Retries for initial upload
};

/**
 * Construct a query string from a hash/object
 *
 * @private
 * @param {object} [params] Key/value pairs for query string
 * @return {string} query string
 */
MediaUploader.prototype.buildQuery_ = function(params) {
    var param = params || {};

    return Object.keys(param).map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(param[key]))
        .join('&');
};

/**
 * Build the drive upload URL
 *
 * @private
 * @param {string} [id] File ID if replacing
 * @param {object} [params] Query parameters
 * @return {string} URL
 */
MediaUploader.prototype.buildUrl_ = function(id, params, baseUrl) {
    var url = baseUrl || DRIVE_UPLOAD_URL;

    if (id) {
        url += id;
    }
    var query = this.buildQuery_(params);

    if (query) {
        url += '?' + query;
    }
    return url;
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

            self.getOptions().getAccessToken(
                (data) => {
                    localStorage.setItem('accessToken', data);
                },
                (error) => {
                    var message = `The direct video upload requires a connection to Youtube<br/>
                        Do you want to update the YouTube Credential?`;

                    self.getOptions().displayModalBox(message);
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
                        alert(message
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

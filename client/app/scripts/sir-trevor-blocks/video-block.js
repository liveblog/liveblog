import handlePlaceholder from './handle-placeholder';

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

        editorHTML: function() {
            return [
                '<div class="st-required st-embed-block video-input"></div>',
                '<div class="video-progress-indicator hidden">',
                '<span class="video-progress-indicator__processing hidden"></span>',
                '<div class="video-progress-indicator__bar"></div>',
                '</div>'
            ].join('\n');
        },

        onBlockRender: function() {
            var _this = this;
            var addContentBtns = new AddContentBtns();
            var uploadBlock = [
                '<div class="row st-block__upload-container">',
                    '<div class="col-md-6">',
                        '<label onclick="$(this).next().trigger(\'click\');" class="btn btn-default">Select from folder</label>',
                        '<input type="file" id="embedlyUploadFile">',
                    '</div>',
                '</div>'
            ].join('\n');

            _this.$('.st-block__inputs').append(uploadBlock);
            _this.$('#embedlyUploadFile').on('change', function() {
                var file = $(this).prop('files')[0];

                if (!file) {
                    return false;
                }

                // Handle one upload at a time
                if (/video/.test(file.type)) {
                    _this.loading();

                    // Hide add content buttons while uploading
                    addContentBtns.hide();
                    _this.$inputs.hide();

                    _this.handleUpload(file)
                        .then((data) => {
                            addContentBtns.show();
                            _this.getOptions().disableSubmit(false);
                            _this.setData(data);
                            _this.loadData(data);
                            _this.ready();
                        });
                }
            });
        },

        handleUpload: function(file) {
            var _this = this;

            return new Promise((resolve, reject) => {
                var formData = new FormData();

                formData.append('video_file', file);

                var xhr = $.ajax({
                    url: 'https://upload.embed.ly/1/video?key=' + this.embedlyKey,
                    data: formData,
                    cache: false,
                    processData: false,
                    contentType: false,
                    crossDomain: true,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    type: 'POST',
                    success: function(response) {
                        _this.$('.video-progress-indicator').addClass('hidden');
                        resolve(response);
                    },
                    error: function(response) {
                        _this.$('.video-progress-indicator').addClass('hidden');
                        reject(response);
                    },
                    xhr: function() {
                        // Monitor and display the percentage uploaded
                        var xhr = new window.XMLHttpRequest();

                        xhr.upload.addEventListener('progress', (evt) => {
                            if (evt.lengthComputable) {
                                var percentComplete = (evt.loaded / evt.total * 100.0).toFixed(2);

                                _this.$('.video-progress-indicator')
                                    .removeClass('hidden');
                                _this.$('.video-progress-indicator__bar')
                                    .css('width', percentComplete + '%');
                            }
                        }, false);
                        return xhr;
                    }

                });


            });
        },

        handleProgress: function(videoId) {
            var call = "https://upload.embed.ly/1/status?key=" + this.embedlyKey + "&video_id=" + videoId;
            var _videoId = videoId;
            var _this = this;

            $.ajax({
                url: call,
                type: 'GET',
                success: function(response) {
                    if (response.status === 'finished') {
                        _this.$('.video-progress-indicator')
                            .addClass('hidden');
                        _this.$('.embed-preview iframe').attr('src', function ( i, val ) { return val; });
                    } else if (response.status === 'cancelled' || response.status ==='failed') {
                        _this.$('.embed-preview').html('<h1>Video</h1><p>' + response.status + '</p>');
                    } else {
                        var percentComplete = parseInt(response.progress);

                        _this.$('.video-progress-indicator')
                            .removeClass('hidden');
                        _this.$('.video-progress-indicator__bar')
                            .css('width', percentComplete + '%');
                        _this.$('.video-progress-indicator__processing')
                            .removeClass('hidden')
                            .html(percentComplete + '%');
                        setTimeout(_this.handleProgress(_videoId), 10000);
                    }
                },
                error: function(response) {
                    setTimeout(_this.handleProgress(_videoId), 10000);
                }
            });
        },

        renderCard: function(data) {
            var card_class = 'liveblog--card';

            var html = $([
                '<div class="' + card_class + ' hidden">',
                '  <div class="hidden st-embed-block embed-preview"></div>',
                '  <div name="title" class="st-embed-block title-preview"></div>',
                '  <div name="caption" class="st-embed-block description-preview"></div>',
                '  <div name="credit" class="st-embed-block credit-preview"></div>',
                '</div>'
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
            var html_to_return = '';

            html_to_return = '<div class="' + card_class + '">';
            html_to_return += html.get(0).innerHTML;
            html_to_return += '</div>';

            this.handleProgress(data.video_id);

            return html_to_return;
        },

        onDrop: function(transferData) {
            var file = transferData.files[0];
            var addContentBtns = new AddContentBtns();
            var _this = this;

            if (!file) {
                return false;
            }

            // Handle one upload at a time
            if (/video/.test(file.type)) {
                this.loading();

                // Hide add content buttons while uploading
                addContentBtns.hide();
                this.$inputs.hide();

                this.handleUpload(file)
                    .then((data) => {
                        addContentBtns.show();
                        _this.getOptions().disableSubmit(false);
                        _this.setData(data);
                        _this.loadData(data);
                        _this.ready();
                    });
            }
        },
        // render a card from data, and make it editable
        loadData: function(data) {
            const _this = this;

            // hide the embed input field, render the card and add it to the DOM
            _this.$('.video-input')
                .addClass('hidden')
                .after(_this.renderCard(data));
            // set somes fields contenteditable
            _this.$('.title-preview').attr({
                contenteditable: true,
                placeholder: _this.titlePlaceholder
            });
            _this.$('.description-preview').attr({
                contenteditable: true,
                placeholder: _this.descriptionPlaceholder
            });
            _this.$('.credit-preview').attr({
                contenteditable: true,
                placeholder: _this.authorPlaceholder
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
            handlePlaceholder(this.$('[name=title]'), _this.titlePlaceholder);
            handlePlaceholder(this.$('[name=caption]'), _this.descriptionPlaceholder);
            handlePlaceholder(this.$('[name=credit]'), _this.authorPlaceholder, {tabbedOrder: true});
        },
        retrieveData: function() {
            return {
                html: this.getData().html,
                url: this.getData().url,
                video_id: this.getData().video_id,
                caption: this.$('[name=caption]').text(),
                credit: this.$('[name=credit]').text(),
                title: this.$('[name=title]').text()
            };
        },
        toHTML: function() {
            var data = this.retrieveData();

            return this.renderCard(data);
        },
        toMeta: function() {
            return this.retrieveData();
        }

    });
}

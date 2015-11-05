(function() {
    'use strict';
    ChangeAvatarController.$inject = ['$scope', 'upload', 'session', 'urls'];
    function ChangeAvatarController($scope, upload, session, urls) {

        $scope.methods = [
            {id: 'upload', label: gettext('Upload from computer')}
        ];

        $scope.activate = function(method) {
            $scope.active = method;
            $scope.preview = {};
            $scope.notify = {message:'', code: ''};
            $scope.progress = {width: 0};
        };

        $scope.activate($scope.methods[0]);

        $scope.upload = function(config) {
            var form = {};
            form.CropLeft = Math.round(Math.min(config.cords.x, config.cords.x2));
            form.CropRight = Math.round(Math.max(config.cords.x, config.cords.x2));
            form.CropTop = Math.round(Math.min(config.cords.y, config.cords.y2));
            form.CropBottom = Math.round(Math.max(config.cords.y, config.cords.y2));

            if (config.img) {
                form.media = config.img;
            } else if (config.url) {
                form.URL = config.url;
            } else {
                return;
            }

            return urls.resource('upload').then(function(uploadUrl) {
                return upload.start({
                    url: uploadUrl,
                    method: 'POST',
                    data: form
                }).then(function(response) {

                    if (response.data._status === 'ERR'){
                        return;
                    }

                    var picture_url = response.data.renditions.viewImage.href;
                    $scope.locals.data.picture_url = picture_url;
                    $scope.locals.data.avatar = response.data._id;

                    return $scope.resolve(picture_url);
                },  function(error) {
                    $scope.notify.message = (error.statusText !== '') ? error.statusText : gettext('There was a problem with your upload');
                    $scope.notify.code = 'error';
                }, function(update) {
                    $scope.progress.width = Math.round(update.loaded / update.total * 100.0);
                });
            });
        };
    }

    angular.module('superdesk.users')
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('edit.avatar', {
                    label: gettext('Change avatar'),
                    modal: true,
                    cssClass: 'upload-avatar modal-static modal-large',
                    controller: ChangeAvatarController,
                    templateUrl: 'scripts/liveblog-users/views/change-avatar.html',
                    filters: [{action: 'edit', type: 'avatar'}]
                });
        }])
        .directive('sdCropLiveblog', ['gettext', function(gettext) {
        return {
            scope: {
                src: '=',
                cords: '=',
                progressWidth: '=',
                file: '=',
                notifyMessage: '=',
                notifyCode: '='
            },
            link: function(scope, elem) {

                var bounds, boundx, boundy;

                var updateScope = _.throttle(function(c) {
                    scope.$apply(function() {
                        scope.cords = c;
                        var rx = 120 / scope.cords.w;
                        var ry = 120 / scope.cords.h;
                        showPreview('.preview-target-1', rx, ry, boundx, boundy, scope.cords.x, scope.cords.y);
                        showPreview('.preview-target-2', rx / 2, ry / 2, boundx, boundy, scope.cords.x, scope.cords.y);
                    });
                }, 300);

                function showPreview(e, rx, ry, boundx, boundy, cordx, cordy) {
                    $(e).css({
                        width: Math.round(rx * boundx) + 'px',
                        height: Math.round(ry * boundy) + 'px',
                        marginLeft: '-' + Math.round(rx * cordx) + 'px',
                        marginTop: '-' + Math.round(ry * cordy) + 'px'
                    });
                }

                scope.$watch('src', function(src) {
                    elem.empty();
                    if ((scope.file.size / 1048576) > 2) {
                        scope.notifyMessage = gettext('Image is bigger then 2MB, upload file size may be limited!');
                        scope.notifyCode = 'info';
                    }
                    if (src) {
                        var img = new Image();
                        img.onload = function() {
                            scope.progressWidth = 80;
                            var size = [this.width, this.height];

                            if (this.width < 200 || this.height < 200) {
                                scope.$apply(function() {
                                    scope.notifyMessage = gettext('Sorry, but blog image must be at least 200x200 pixels big!');
                                    scope.notifyCode = 'error';
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }

                            elem.append(img);
                            $(img).Jcrop({
                                aspectRatio: 1.0,
                                minSize: [200, 200],
                                trueSize: size,
                                boxWidth: 300,
                                boxHeight: 225,
                                setSelect: [0, 0, Math.min.apply(size), Math.min.apply(size)],
                                allowSelect: false,
                                onChange: updateScope
                            }, function() {
                                bounds = this.getBounds();
                                boundx = bounds[0];
                                boundy = bounds[1];
                            });
                            scope.progressWidth = 0;
                        };
                        img.src = src;
                    }
                });
            }
        };
    }]);
})();

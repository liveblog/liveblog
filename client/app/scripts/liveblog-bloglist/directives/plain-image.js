sdPlainImage.$inject = ['gettext', 'notify', 'config'];

export default function sdPlainImage(gettext, notify, config) {
    return {
        scope: {
            src: '=',
            file: '=',
            progressWidth: '=',
            minWidth: '@',
            minHeight: '@',
            maxWidth: '@',
            maxHeight: '@',
            msgErrorMax: '@',
            msgErrorMin: '@'
        },
        link: function(scope, elem) {
            scope.$watch('src', (src) => {
                elem.empty();
                if (src) {
                    var img = new Image();

                    if (scope.file.size > config.maxContentLength) {
                        notify.error(gettext(
                            `Blog image is bigger than ${config.maxContentLength / 1024 / 1024}MB`
                        ));
                        scope.src = null;
                        scope.progressWidth = 0;
                    } else {
                        if (scope.file.size / 1048576 > 2) {
                            notify.info(gettext('Blog image is big, upload can take some time!'));
                        }
                        img.onload = function() {
                            scope.progressWidth = 80;

                            var minWidth = scope.minWidth || 320,
                                minHeight = scope.minHeight || 240,
                                maxWidth = scope.maxWidth || 3840,
                                maxHeight = scope.maxHeight || 2160;

                            if (this.width < minWidth || this.height < minHeight) {
                                scope.$apply(() => {
                                    notify.error(scope.msgErrorMin ? gettext(scope.msgErrorMin) : gettext(
                                        'Sorry, but blog image must be at least ' + minWidth + 'x' +
                                        minHeight + ' pixels big!'
                                    ));
                                    scope.file = null;
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }
                            if (this.width > maxWidth || this.height > maxHeight) {
                                scope.$apply(() => {
                                    notify.error(scope.msgErrorMax ? gettext(scope.msgErrorMax) : gettext(
                                        'Sorry, but blog image must smaller then ' + maxWidth + 'x' +
                                        maxHeight + ' pixels!'
                                    ));
                                    scope.file = null;
                                    scope.src = null;
                                    scope.progressWidth = 0;
                                });

                                return;
                            }
                            elem.append(img);
                            scope.$apply(() => {
                                scope.progressWidth = 0;
                            });
                        };
                        img.src = src;
                    }
                }
            });
        }
    };
}

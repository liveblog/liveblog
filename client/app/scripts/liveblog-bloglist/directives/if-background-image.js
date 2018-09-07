export default function ifBackgroundImage() {
    return {
        restrict: 'A',
        scope: {
            ifBackgroundImage: '@',
        },
        link: function(scope, element, attrs) {
            const url = scope.ifBackgroundImage;

            if (url) {
                element.css({
                    'background-image': 'url(' + url + ')',
                });
            }
        },
    };
}

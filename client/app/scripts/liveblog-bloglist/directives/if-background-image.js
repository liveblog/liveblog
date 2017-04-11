export default function ifBackgroundImage() {
    return {
        restrict: 'A',
        scope: {
            ifBackgroundImage: '@'
        },
        link: function(scope, element, attrs) {
            var url = scope.ifBackgroundImage;

            if (url) {
                element.css({
                    'background-image': 'url(' + url + ')'
                });
            }
        }
    };
}

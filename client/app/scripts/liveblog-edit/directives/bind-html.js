export default function lbBindHtml() {
    return {
        restrict: 'A',
        priority: 2,
        link: function(scope, elem, attrs) {
            attrs.$observe('htmlContent', function() {
                if (attrs.htmlLocation) {
                    //need to inject the html in a specific element
                    elem.find('[' + attrs.htmlLocation + ']').html(attrs.htmlContent);
                } else {
                    //inject streaght in the elem
                    elem.html(attrs.htmlContent);
                }
            });
        }
    };
}

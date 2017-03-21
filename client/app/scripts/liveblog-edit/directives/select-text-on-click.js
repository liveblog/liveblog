export default function selectTextOnClick() {
    return {
        link: function(scope, elem, attrs) {
            elem.bind('click', function() {
                elem.focus();
                elem.select();
            });
        }
    };
}

export default function selectTextOnClick() {
    return {
        link: function(scope, elem, attrs) {
            elem.bind('click', () => {
                elem.focus();
                elem.select();
            });
        },
    };
}

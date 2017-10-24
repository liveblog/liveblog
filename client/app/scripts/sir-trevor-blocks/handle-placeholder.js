export default function handlePlaceholder(selector, placeHolderText, options) {
    var onEvents = 'click';

    if (options && options.tabbedOrder) {
        onEvents += ' focus';
    }
    selector.on(onEvents, function(ev) {
        var $this = $(this);

        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', '');
        }
    });
    selector.on('focusout', function(ev) {
        var $this = $(this);

        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', placeHolderText);
        }
    });
}

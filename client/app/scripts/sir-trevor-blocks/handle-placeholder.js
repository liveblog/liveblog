export default function handlePlaceholder(selector, placeHolderText, options) {
    let onEvents = 'click';

    if (options && options.tabbedOrder) {
        onEvents += ' focus';
    }
    selector.on(onEvents, function(ev) {
        const $this = $(this);

        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', '');
        }
    });
    selector.on('focusout', function(ev) {
        const $this = $(this);

        if (_.trim($this.html()) === '') {
            $this.attr('placeholder', placeHolderText);
        }
    });
}

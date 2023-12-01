export default class InputChangeTracker {
    $input: JQuery<HTMLInputElement>;
    onInputContentsChange: () => void;

    constructor(input: JQuery<HTMLInputElement>, onInputContentsChange: () => void) {
        this.$input = $(input);
        this.onInputContentsChange = onInputContentsChange;
        this.setInitialState();
        this.setUpTracker();
    }

    private setInitialState = () => {
        const { $input } = this;

        $input.on('focus', () => {
            const html = $input.html();

            $input.data('initial', html);
        });
    }

    private setUpTracker = () => {
        const { $input } = this;

        $input.on('blur keyup paste input', () => {
            if ($input.data('initial') !== $input.html()) {
                $input.data('initial', $input.html());
                this.onInputContentsChange();
            }
        });
    }
}

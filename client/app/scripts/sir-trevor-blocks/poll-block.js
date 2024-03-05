import renderPollComponent from '../liveblog-edit/components/polls/poll-component.tsx';

export default function pollBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'poll',
        title: 'Poll',
        icon_name: function() {
            return '<span class="icon-analytics" style="color: #666666" />';
        },
        editorHTML: function() {
            return '<div class="st-required st-poll_block poll-input"></div>';
        },
        onBlockRender: function() {
            const container = this.$('.st-poll_block');
            const onFormPopulated = (data) => {
                this.getOptions().disableSubmit(false);
                this.setData(data);
            };
            let data = this.getData();

            renderPollComponent(container[0], data, onFormPopulated);

            container.closest('.st-block__inner').off('click');
        },
        loadData: function(data) {
            this.setData(data);
        },
        focus: function() {
            this.$('.poll-input').focus();
        },
    });
}

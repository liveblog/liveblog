import renderPollComponent from '../liveblog-edit/components/polls/poll-component.tsx';

export default function pollBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'poll',
        title: 'Poll',
        icon_name: function() {
            return '<span class="icon-analytics" />';
        },
        editorHTML: function() {
            return '<div class="poll_block_container"></div>';
        },
        onBlockRender: function() {
            const container = this.$('.poll_block_container');

            renderPollComponent(container[0], null);

            container.closest('.st-block__inner').off('click');
        },
    });
}

import renderPollComponent from '../liveblog-edit/components/polls/pollComponent.tsx';

export default function pollBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'poll',
        title: 'Poll',
        icon_name: 'poll',
        editorHTML: function() {
            return '<div class="poll_block_container"></div>';
        },
        onBlockRender: function() {
            const container = this.$('.poll_block_container')[0];

            renderPollComponent(container, null);
        },
    });
}

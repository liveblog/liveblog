import React from 'react';
import ReactDOM from 'react-dom';
import {PollComponent} from '../liveblog-edit/components/pollComponent.tsx';

export default function pollBlock(SirTrevor, config) {
    return SirTrevor.Block.extend({
        type: 'poll',
        title: 'Poll',
        icon_name: 'poll',
        editorHTML: function() {
            return '<div class="poll_block_container">Here is the poll</div>';
        },
        onBlockRender: function() {
            const container = this.$('.poll_block_container')[0];

            ReactDOM.render(<PollComponent />, container);
        },
    });
}

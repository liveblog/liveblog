/* eslint-disable */
// @ts-nocheck

import React from 'react';
import ReactDOMServer from 'react-dom/server';

class PollComponent extends React.Component {
  render() {
    return <div>Create Poll</div>;
  }
}

export default function pollBlock(SirTrevor, config) {
  return SirTrevor.Block.extend({
    type: 'poll',
    title: 'Poll',
    icon_name: 'poll',
    editorHTML: function() {
      return ReactDOMServer.renderToString(<PollComponent />);
    }
  });
};

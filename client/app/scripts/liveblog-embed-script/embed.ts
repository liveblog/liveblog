import { MsgHandlerFunc } from './types'; // eslint-disable-line
import * as consent from './handlers/consent';
import * as permalink from './handlers/permalink';
import * as sharing from './sharing';
import * as responsive from './responsive';

const handlers = {};

const registerHandler = (eventName: string, handler: MsgHandlerFunc) => {
    handlers[eventName] = handler;
};

registerHandler(sharing.Message.ApiHost, (url) => {
    sharing.ReceiveApiHost(url);
    const postId = permalink.getSharedPost();

    if (postId) {
        sharing.handleSharedPost(postId);
    }
});

// consent handling messages
registerHandler(consent.Message.Init, consent.init);
registerHandler(consent.Message.Accept, consent.accept);

// permalink handling messages
registerHandler(permalink.Event.Init, permalink.init);

// sharing handling messages
registerHandler(sharing.Message.ScrollHeaderIntoView, sharing.scrollHeaderIntoView);

permalink.init();
responsive.init();

window.addEventListener('message', (event: MessageEvent) => {
    const { type, data } = event.data;

    // tslint:disable-next-line:curly
    if (!type) return;

    if (type in handlers) {
        handlers[type](data);
    }
}, false);

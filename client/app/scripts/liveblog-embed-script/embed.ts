import { MsgHandlerFunc } from './types'; // eslint-disable-line
import * as consent from './handlers/consent';
import * as permalink from './handlers/permalink';
import * as sharing from './sharing';

const handlers = {};

const registerHandler = (eventName: string, handler: MsgHandlerFunc) => {
    handlers[eventName] = handler;
};

// consent handling messages
registerHandler(consent.Message.Init, consent.init);
registerHandler(consent.Message.Accept, consent.accept);

// permalink handling messages
registerHandler(permalink.Event.Init, permalink.init);

permalink.init();

window.addEventListener('message', (event: MessageEvent) => {
    const { type, data } = event.data;

    // tslint:disable-next-line:curly
    if (!type) return;

    if (type in handlers) {
        handlers[type](data);
    }
}, false);

const postId = permalink.getSharedPost();

if (postId) {
    sharing.handleSharedPost(postId);
}

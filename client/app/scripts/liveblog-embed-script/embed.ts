import _ from 'lodash';
import { MsgHandlerFunc } from './types'; // eslint-disable-line
import * as consent from './handlers/consent';

const handlers = {};

const registerHandler = (eventName: string, handler: MsgHandlerFunc) => {
    handlers[eventName] = handler;
};

// consent handling messages
registerHandler(consent.Message.Init, consent.init);
registerHandler(consent.Message.Accept, consent.accept);

// permalink handling messages

window.addEventListener('message', (event: MessageEvent) => {
    const { type, data } = event.data;

    // tslint:disable-next-line:curly
    if (!type) return;

    if (_.has(handlers, type)) {
        handlers[type](data);
    }
}, false);

import { messageIframe } from './utils';

let apiHost;

export enum Message {
    ApiHost = 'api_host',
}

export enum Event {
    UpdateTimeline = 'update_timeline',
}

export const ReceiveApiHost = (url: string) => {
    apiHost = url;
};

export const handleSharedPost = (postId: string) => {
    const checkUrl = `${apiHost}/api/client_posts/${postId}`;

    fetch(checkUrl)
        .then((res) => {
            if (res.status !== 200) {
                return;
            }
            messageIframe(Event.UpdateTimeline, postId);
        })
        .catch((err) => console.log(err)); // eslint-disable-line
};

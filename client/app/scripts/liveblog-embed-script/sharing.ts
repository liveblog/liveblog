/* eslint-disable */
// @ts-nocheck
import { messageIframe } from './utils';

let apiHost;

export enum Message {
    ApiHost = 'api_host',
    ScrollHeaderIntoView = 'scroll_header_into_view',
}

export enum Event {
    UpdateTimeline = 'update_timeline',
}

export const ReceiveApiHost = (url: string) => {
    apiHost = url;
};

export const scrollHeaderIntoView = () => {
    console.log("Received scroll_header_into_view from iframe");
    const liveblogEmbed: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblogEmbed) {
        const elemPosition = liveblogEmbed.getBoundingClientRect().top + window.scrollY;
        const offset = 20;

        window.scrollTo({
            top: elemPosition - offset,
            behavior: 'smooth',
        });
    }
};

export const handleSharedPost = (postId: string) => {
    const checkUrl = `${apiHost}/api/client_posts/${postId}`;

    fetch(checkUrl)
        .then((res) => {
            if (res.status !== 200) {
                return;
            }
            console.log("Sending update_timeline to iframe with postId:", postId);
            messageIframe(Event.UpdateTimeline, postId);
        })
        .catch((err) => console.log(err)); // eslint-disable-line
};

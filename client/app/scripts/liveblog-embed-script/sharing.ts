import modalHtml from './ui/shared-post-modal.html';

let apiHost;
const modalUrl = 'https://unpkg.com/micromodal@0.4.6/dist/micromodal.min.js';

export enum Message {
    ApiHost = 'api_host',
}

export const ReceiveApiHost = (url: string) => {
    apiHost = url;
};

const modalScriptReady = () => {
    const MicroModal = (window as any).MicroModal;

    MicroModal.show('lb--shared-post-modal');
};

const getBlogID = (url: string) => {
    const regex = /[a-f0-9]{24}/gm;
    const match = url.match(regex);

    if (!match) {
        return null;
    }

    return match[0];
};

const renderModalPost = (postUrl: string) => {
    document.body.insertAdjacentHTML('beforeend', modalHtml.replace('__INSERT_IFRAME_URL__', postUrl));

    const mScript = document.createElement('script');

    mScript.type = 'text/javascript';
    mScript.src = modalUrl;
    mScript.async = true;
    mScript.defer = true;
    mScript.onload = modalScriptReady;
    document.body.appendChild(mScript);
};

export const handleSharedPost = (postId: string) => {
    let blogID: string;
    const liveblog: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblog) {
        blogID = getBlogID(liveblog.src);
    } else {
        // check if LB exist means we're on ESI approach
        const LB = (window as any).LB;

        // tslint:disable-next-line:curly
        if (!LB) return;

        blogID = LB.blog._id;
    }

    const url = `${apiHost}/api/embed/shared_post/${blogID}/${postId}`;
    const checkUrl = `${apiHost}/api/client_posts/${postId}`;

    fetch(checkUrl)
        .then((res) => {
            if (res.status !== 200) {
                return;
            }
            renderModalPost(url);
        })
        .catch((err) => console.log(err)); // eslint-disable-line
};

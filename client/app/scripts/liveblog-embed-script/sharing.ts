let apiHost;
let reloaded = false;

export enum Message {
    ApiHost = 'api_host',
}

export const ReceiveApiHost = (url: string) => {
    apiHost = url;
};

const getBlogID = (url: string) => {
    const regex = /[a-f0-9]{24}/gm;
    const match = url.match(regex);

    if (!match) {
        return null;
    }

    return match[0];
};

const renderSharedPost = (postUrl: string) => {
    const liveblog: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (liveblog && !reloaded) {
        liveblog.src = postUrl;
        reloaded = true;
    }
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
            renderSharedPost(url);
        })
        .catch((err) => console.log(err)); // eslint-disable-line
};

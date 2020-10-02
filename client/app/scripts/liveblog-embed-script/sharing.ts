import modalHtml from './ui/shared-post-modal.html';

const modalUrl = 'https://unpkg.com/micromodal@0.4.6/dist/micromodal.min.js';

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

export const handleSharedPost = (postId: string) => {
    const parser = document.createElement('a');
    const liveblog: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (!liveblog) {
        return;
    }

    parser.href = liveblog.src;
    const blogID = getBlogID(liveblog.src);
    const url = `${parser.origin}/embed/shared-post/${blogID}/${postId}`;

    // fetch(url)
    //     .then((res) => {
    //         if (res.status !== 200) {
    //             return;
    //         }
    //         const data: any = res.json();

    //         modalHtml.replace('__INSERT_IFRAME__', data.embed);
    //         document.body.insertAdjacentHTML('beforeend', modalHtml);
    //     });

    document.body.insertAdjacentHTML('beforeend', modalHtml.replace('__INSERT_IFRAME_URL__', url));

    const mScript = document.createElement('script');

    mScript.type = 'text/javascript';
    mScript.src = modalUrl;
    mScript.async = true;
    mScript.defer = true;
    mScript.onload = modalScriptReady;
    document.body.appendChild(mScript);

    // step 2: fetch post from backend
    // step 3: render things
    console.log(postId); // eslint-disable-line
};

import { loadScript, messageIframePlain } from './utils';

let timer = null;

const debounce = (fn, time) => {
    if (timer === null) {
        timer = setTimeout(() => {
            timer = null;
            fn();
        }, time);
    }
};

export const init = () => {
    const iframe: HTMLIFrameElement = document.querySelector('#liveblog-iframe');

    if (!iframe || (iframe && iframe.getAttribute('data-responsive') !== 'yes')) {
        return;
    }

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/3.5.14/iframeResizer.min.js', () => {
        (window as any).iFrameResize({
            minHeight: 1000,
            heightCalculationMethod: 'lowestElement',
        }, iframe);

        var reached = false;
        const detectEndOfBlog = () => {
            const wScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const iframeHeight = iframe.getBoundingClientRect().height;

            if (wScrollTop > iframeHeight + iframe.offsetTop - 50 - window.innerHeight) {
                if (reached) {
                    return;
                }
                messageIframePlain('loadMore');
                reached = true;
            } else {
                reached = false;
            }
        };

        window.addEventListener('scroll', () => {
            debounce(detectEndOfBlog, 200);
        });
    });
};

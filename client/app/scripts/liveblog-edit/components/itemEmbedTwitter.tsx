import React, { useEffect, useRef } from 'react';

interface IProps {
    description: string;
    title: string;
    original_url: string; // eslint-disable-line camelcase
}

const loadTwitterLib = () => {
    // Load library based on documentation
    // https://developer.twitter.com/en/docs/twitter-for-websites/javascript-api/guides/set-up-twitter-for-websites

    (window as any).twttr = (function(document, tag, id) {
        const twttr = (window as any).twttr || {};
        const firstScript = document.getElementsByTagName(tag)[0];
        let scriptElem;

        if (document.getElementById(id)) return twttr;

        scriptElem = document.createElement(tag);
        scriptElem.id = id;
        scriptElem.src = 'https://platform.twitter.com/widgets.js';

        firstScript.parentNode.insertBefore(scriptElem, firstScript);

        twttr._e = [];
        twttr.ready = function(f) {
            twttr._e.push(f);
        };

        return twttr;
    }(document, 'script', 'twitter-wjs'));
};

export const ItemEmbedTwitter: React.FunctionComponent<IProps> = (props) => {
    const divRef = useRef(null);
    const decodedUrl = decodeURIComponent(props.original_url);

    if (!(window as any).twttr) loadTwitterLib();

    useEffect(() => {
        setTimeout(() => {
            (window as any).twttr.widgets.load(divRef.current);
        }, 1000);
    }, [props.original_url]);

    return (
        <div ref={divRef} className="item-embed-container">
            <blockquote className="twitter-tweet">
                <p>{props.description}</p> &mdash; {props.title}
                <a href={decodedUrl}>
                    {props.original_url}
                </a>
            </blockquote>
        </div>
    );
};

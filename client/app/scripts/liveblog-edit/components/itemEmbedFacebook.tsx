/* eslint-disable react/no-multi-comp */
import React, { CSSProperties, useEffect, useState } from 'react';
import { PlaceholderEmbed } from 'react-social-media-embed';
import { IItemMeta } from './itemEmbedInfo';

/* tslint:disable:interface-name */
declare global {
    interface Window {
        FB: any;
    }
}
/* tslint:enable:interface-name */

interface IProps extends IItemMeta {
    style?: CSSProperties | undefined;
}

const loadFacebookLib = (callback: () => void) => {
    const tag = 'script';
    const id = 'facebook-js';
    const firstScript = document.getElementsByTagName(tag)[0];

    if (document.getElementById(id)) {
        callback();
        return;
    }

    const scriptElem = document.createElement(tag);

    scriptElem.id = id;
    scriptElem.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v12.0';
    scriptElem.onload = () => callback();

    firstScript.parentNode.insertBefore(scriptElem, firstScript);
};

const RenderPlaceHolder = ({ url }: { url: string }) => {
    return (
        <PlaceholderEmbed
            linkText="View post on Facebook"
            url={url}
            style={{ maxWidth: 550, height: 600 }}
        />
    );
};

export const ItemEmbedFacebook: React.FunctionComponent<IProps> = (props) => {
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        loadFacebookLib(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!isLoading && window?.FB) {
            window.FB.XFBML.parse();
        }
    }, [isLoading, props.url]);

    return (
        <div>
            <div className="fb-post" data-href={props.url} data-width="500" style={props.style}>
                {isLoading && <RenderPlaceHolder url={props.url} />}
            </div>
        </div>
    );
};

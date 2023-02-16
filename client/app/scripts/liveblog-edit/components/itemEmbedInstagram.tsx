/* eslint-disable react/no-multi-comp */
import React, { CSSProperties, useEffect, useState } from 'react';
import { PlaceholderEmbed } from 'react-social-media-embed';
import { IItemMeta } from './itemEmbedInfo';

interface IProps extends IItemMeta {
    captioned?: boolean;
    style?: CSSProperties | undefined;
}

const loadInstagramLib = (callback: () => void) => {
    const tag = 'script';
    const id = 'instagram-js';
    const firstScript = document.getElementsByTagName(tag)[0];

    if (document.getElementById(id)) callback();

    let scriptElem = document.createElement(tag);

    scriptElem.id = id;
    scriptElem.src = '//www.instagram.com/embed.js';
    scriptElem.onload = () => callback();

    firstScript.parentNode.insertBefore(scriptElem, firstScript);
};

const RenderPlaceHolder = ({ url }: {url: string}) => {
    return (
        <PlaceholderEmbed
            linkText="View post on Instagram"
            url={url}
            // @ts-ignore:next-line
            style={{ maxWidth: 550, height: 600 }}
        />
    );
};

export const ItemEmbedInstagram: React.FunctionComponent<IProps> = (props) => {
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        loadInstagramLib(() => {
            setLoading(false);
            (window as any)?.instgrm?.Embeds?.process();
        });
    }, [props.original_url, props.captioned]);

    if (isLoading)
        return <RenderPlaceHolder url={props.original_url} />;

    const addAttrs = {};

    if (props.captioned)
        addAttrs['data-instgrm-captioned'] = '';

    return (
        <div>
            <div className="instagram-embed-container" key={`${props.original_url}_${props.captioned}`}>
                <blockquote
                    style={props.style}
                    className="instagram-media"
                    data-instgrm-permalink={props.original_url}
                    data-instgrm-version="12"
                    {...addAttrs}
                >
                    <RenderPlaceHolder url={props.original_url} />
                </blockquote>
            </div>
        </div>
    );
};
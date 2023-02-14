/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { PlaceholderEmbed } from 'react-social-media-embed';
import { IItemMeta } from './itemEmbedInfo';

interface IProps extends IItemMeta {
    captioned?: boolean;
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

export const ItemEmbedInstagram: React.FunctionComponent<IProps> = (props) => {
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        loadInstagramLib(() => {
            setLoading(false);
            setTimeout(() => (window as any).instgrm.Embeds.process, 500);
        });
    }, [props.original_url, props.captioned]);

    if (isLoading) {
        return (
            <PlaceholderEmbed
                linkText="View post on Instagram"
                url={props.original_url}
                // @ts-ignore:next-line
                style={{ maxWidth: 550, height: 600 }}
            />
        );
    }

    const addAttrs = {};

    if (props.captioned)
        addAttrs['data-instgrm-captioned'] = '';

    return (
        <blockquote
            className="instagram-media"
            data-instgrm-permalink={props.original_url}
            data-instgrm-version="12"
            {...addAttrs}
        />
    );
};
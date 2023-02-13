import React from 'react';
import { FacebookEmbed, TwitterEmbed } from 'react-social-media-embed';
import { ItemEmbedGeneric } from './itemEmbedGeneric';

interface IProps {
    text: string;
    title: string;
    description: string;
    url: string;
    original_url: string; // eslint-disable-line camelcase
    provider_name: string; // eslint-disable-line camelcase
}

export const ItemEmbedRender: React.FunctionComponent<IProps> = (props) => {
    switch (props.provider_name) {
    case 'Facebook':
        return (
            <FacebookEmbed
                url={props.url}
                linkText={props.title}
                // @ts-ignore:next-line
                style={{
                    maxWidth: 550,
                    minHeight: 600,
                }}
                width="100%"
            />
        );
    case 'Twitter':
        return (
            <TwitterEmbed
                linkText={props.title}
                url={props.original_url}
                // @ts-ignore:next-line
                style={{
                    maxWidth: 550,
                    minHeight: 600,
                }}
                width="100%"
            />
        );
    default:
        return <ItemEmbedGeneric htmlContent={props.text} />;
    }
};

import React from 'react';
import { TwitterEmbed as TwttEmbed } from 'react-social-media-embed';
import { ItemEmbedGeneric } from './itemEmbedGeneric';

interface IProps {
    text: string;
    title: string;
    description: string;
    original_url: string; // eslint-disable-line camelcase
    provider_name: string; // eslint-disable-line camelcase
}

// doing this because missing `style` property typing
const TwitterEmbed = TwttEmbed as any;

export const ItemEmbedRender: React.FunctionComponent<IProps> = (props) => {
    switch (props.provider_name) {
    case 'Twitter':
        return (
            <TwitterEmbed
                linkText={props.title}
                url={props.original_url}
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

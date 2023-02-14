import React from 'react';
import { FacebookEmbed, TwitterEmbed } from 'react-social-media-embed';
import { ItemEmbedGeneric } from './itemEmbedGeneric';
import { IItemMeta, ItemEmbedInfo } from './itemEmbedInfo';

interface IProps extends IItemMeta {
    text: string;
}

export const ItemEmbedRender: React.FunctionComponent<IProps> = (props) => {
    switch (props.provider_name) {
    case 'Facebook':
        return (
            <>
                <FacebookEmbed
                    url={props.url}
                    linkText={props.title}
                    // @ts-ignore:next-line
                    style={{ maxWidth: 550 }}
                    width="100%"
                />
                <ItemEmbedInfo {...props} original_url={props.url} />
            </>

        );
    case 'Twitter':
        return (
            <>
                <TwitterEmbed
                    linkText={props.title}
                    url={props.original_url}
                    // @ts-ignore:next-line
                    style={{ maxWidth: 550 }}
                    width="100%"
                />
                <ItemEmbedInfo {...props} credit={props.provider_name} />
            </>
        );
    default:
        return <ItemEmbedGeneric htmlContent={props.text} />;
    }
};

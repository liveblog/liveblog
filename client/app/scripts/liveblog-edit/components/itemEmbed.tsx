import React from 'react';
import { ItemEmbedGeneric } from './itemEmbedGeneric';
import { ItemEmbedTwitter } from './itemEmbedTwitter';

interface IProps {
    meta: any;
    htmlContent: string;
}

export const ItemEmbed: React.FunctionComponent<IProps> = (props) => {
    switch (props.meta.provider_name) {
    case 'Twitter':
        return <ItemEmbedTwitter {...props.meta} />;
    default:
        return <ItemEmbedGeneric htmlContent={props.htmlContent} />;
    }
};

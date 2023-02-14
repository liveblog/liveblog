import React from 'react';

export interface IItemMeta {
    title: string;
    description: string;
    url: string;
    credit: string;
    original_url: string; // eslint-disable-line camelcase
    provider_name: string; // eslint-disable-line camelcase
}

export const ItemEmbedInfo: React.FunctionComponent<IItemMeta> = (props) => {
    return (
        <div>
            <br />
            {props.title && <div className="title-preview">{props.title}</div>}

            {props.description && (
                <div className="description-preview">
                    {props.description}
                </div>
            )}

            {props.credit && (
                <div className="credit-preview">
                    {props.credit}
                </div>
            )}

            {props.original_url && (
                <a className="link-preview" target="_blank" href={props.original_url} rel="noreferrer">
                    {props.original_url}
                </a>
            )}
        </div>
    );
};

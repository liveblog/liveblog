import React, { useEffect, useRef } from 'react';

interface IProps {
    htmlContent: string;
}

export const ItemEmbedGeneric: React.FunctionComponent<IProps> = (props) => {
    const divRef = useRef(null);

    useEffect(() => {
        $(divRef.current).html(props.htmlContent);
    }, [props.htmlContent]);

    return (
        <div ref={divRef} />
    );
};

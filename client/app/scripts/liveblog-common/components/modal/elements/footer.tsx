import React from 'react';

const Footer: React.SFC = (props) => {
    return (
        <div className="modal__footer">
            {props.children}
        </div>
    );
};

export default Footer;

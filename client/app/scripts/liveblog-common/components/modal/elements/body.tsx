import * as React from 'react';

const Body: React.SFC = (props) => {
    return (
        <div className="modal__body">
            {props.children}
        </div>
    );
};

export default Body;

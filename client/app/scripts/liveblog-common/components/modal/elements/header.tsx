import * as React from 'react';

interface IProps {
    title: string;
}

const Header: React.SFC<IProps> = (props) => {
    return (
        <div className="modal__header">
            <h3 className="modal-title">{props.title}</h3>
        </div>
    );
};

export default Header;

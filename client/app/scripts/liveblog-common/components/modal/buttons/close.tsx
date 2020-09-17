import React from 'react';
import ModalContext from '../context';

interface IProps {
    text?: string;
}

const CloseBtn: React.SFC<IProps> = (props) => {
    return (
        <ModalContext.Consumer>
            {({ closeModal }) => (
                <button
                    onClick={closeModal}
                    type="button"
                    className="btn"
                    data-dismiss="modal"
                    aria-label="Close"
                >
                    <span aria-hidden="true">{props.text || 'Close'}</span>
                </button>
            )}
        </ModalContext.Consumer>
    );
};

export default CloseBtn;

import React from 'react';
import Header from './elements/header';
import Body from './elements/body';
import Footer from './elements/footer';
import ModalContext from './context';
import { IModalProps } from './types'; // eslint-disable-line

const Modal: React.SFC<IModalProps> = (props) => {
    return (
        <ModalContext.Consumer>
            {({ modalRef }) => (
                <div ref={modalRef} className={`modal fade ${props.modalClass || ''}`} tabIndex={-1} role="dialog">
                    <div className="modal__dialog v2" role="document">
                        <div className="modal__content">
                            <Header title={props.title} />
                            <Body>{props.body}</Body>
                            <Footer>{props.footer}</Footer>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Consumer>
    );
};

export default Modal;

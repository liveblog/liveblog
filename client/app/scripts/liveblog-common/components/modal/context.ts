import React from 'react';
import { IModalContext } from './types'; // eslint-disable-line

const ModalContext = React.createContext<IModalContext>({
    modalRef: null,
    // tslint:disable-next-line:no-empty
    closeModal: () => {},
    // tslint:disable-next-line:no-empty
    openModal: () => {},
});

export default ModalContext;

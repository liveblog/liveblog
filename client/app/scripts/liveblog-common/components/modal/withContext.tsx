import React from 'react';
import ModalContext from './context';

// eslint-disable-next-line
import { IModalContext } from './types';

const withModalContext = <T extends object>(Component: React.ComponentType<T>): React.ComponentType<T> => {
    class ComponentHOC extends React.Component<T> {
        modal: React.RefObject<any>;
        instance: React.ComponentType<T>;

        constructor(props: T) {
            super(props);

            this.modal = React.createRef();
        }

        static get displayName() {
            return `withModalContext(${Component.displayName || Component.name})`;
        }

        openModal = () => {
            $(this.modal.current).modal('show');

            // trick because we use custom styles
            // for modal coming from superdesk
            $('.modal-backdrop').addClass('modal__backdrop');
        }

        closeModal = () => {
            $(this.modal.current).modal('hide');
        }

        render() {
            const modalStore: IModalContext = {
                openModal: this.openModal,
                closeModal: this.closeModal,
                modalRef: this.modal,
            };

            return (
                <ModalContext.Provider value={modalStore}>
                    <Component {...this.props} ref={(el) => this.instance = el} />
                </ModalContext.Provider>
            );
        }
    }

    return ComponentHOC;
};

export default withModalContext;

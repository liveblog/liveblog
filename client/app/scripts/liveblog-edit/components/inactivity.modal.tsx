import angular from 'angular';
import React from 'react';
import ReactDOM from 'react-dom';
import ModalContext from 'liveblog-common/components/modal/context';
import withModalContext from 'liveblog-common/components/modal/withContext';
import Modal from 'liveblog-common/components/modal/modal';

interface IInactivityModalProps {
    onKeepWorking: () => void;
    onSaveAndClose: () => void;
    onClose: () => void;
}

class InactivityModal extends React.Component<IInactivityModalProps> {
    favicon: JQuery<HTMLElement>;
    initialIcon: string;

    constructor(props: IInactivityModalProps) {
        super(props);

        this.favicon = $('link[rel="icon"]');
        this.initialIcon = this.favicon.attr('href');
    }

    handleKeepWorking(closeModal: () => void) {
        this.props.onKeepWorking();
        closeModal();
    }

    handleSaveAndClose(closeModal: () => void) {
        this.props.onSaveAndClose();
        closeModal();
    }

    handleClose(closeModal: () => void) {
        this.props.onClose();
        closeModal();
    }

    modalActions() {
        return (
            <React.Fragment>
                <ModalContext.Consumer>
                    {({ closeModal }) => (
                        <React.Fragment>
                            <button onClick={() => this.handleKeepWorking(closeModal)}
                                className="btn btn--primary">Keep working on it</button>

                            <button onClick={() => this.handleSaveAndClose(closeModal)}
                                className="btn btn--primary">Save and Close</button>

                            <button onClick={() => this.handleClose(closeModal)}
                                className="btn">Close Without Saving</button>
                        </React.Fragment>
                    )}
                </ModalContext.Consumer>
            </React.Fragment>
        );
    }

    iconTabAlert() {
        this.favicon.attr('href', 'favicon-alert.ico');
    }

    resetBrowserTab() {
        this.favicon.attr('href', this.initialIcon);
    }

    render() {
        const bodyText = `
            The current post has been inactive in the editor for some time so the warning message
            of being edited by you has been removed. Please be careful about saving the post as
            the work from other users in this post could get overwritten.`;

        const footerBtns = this.modalActions();

        return (
            <Modal title="Inactivity Alert"
                modalClass="inactivity-modal"
                body={bodyText}
                footer={footerBtns}
            />
        );
    }
}

export default angular.module('liveblog.edit.components.inactivityModal', [])
    .factory('InactivityModal', () => {
        class InactiveModal {
            constructor(props: IInactivityModalProps) {
                const targetEl = document.createElement('div');

                document.body.appendChild(targetEl);

                const InactivityAlert = withModalContext<IInactivityModalProps>(InactivityModal);

                // eslint-disable-next-line
                const instance = ReactDOM.render(<InactivityAlert { ...props } />, targetEl);

                return instance as any;
            }
        }

        return InactiveModal;
    });

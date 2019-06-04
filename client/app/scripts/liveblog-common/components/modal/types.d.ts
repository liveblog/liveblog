export interface IModalProps {
    title: string;
    body: any;
    footer: any;
    modalClass?: string;
}

export interface IModalContext {
    openModal: () => void;
    closeModal: () => void;
    modalRef: React.RefObject;
}

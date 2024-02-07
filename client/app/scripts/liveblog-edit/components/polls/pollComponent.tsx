import React from 'react';
import ReactDOM from 'react-dom';
import './pollComponent.scss';
import { PollComponentCreate } from './pollComponentCreate';
import { PollComponentView } from './pollComponentView';

interface IProps {
    item: any;
}

const PollComponent: React.FunctionComponent<IProps> = ({ item }) => {
    if (item) {
        return <PollComponentView item={item} />;
    }

    return <PollComponentCreate />;
};


export const destroyPollComponent = (element: HTMLDivElement) => {
    ReactDOM.unmountComponentAtNode(element);
};

const renderPollComponent = (
    element: HTMLDivElement, item: any) => {
    ReactDOM.render(<PollComponent item={item} />, element);
};

export default renderPollComponent;

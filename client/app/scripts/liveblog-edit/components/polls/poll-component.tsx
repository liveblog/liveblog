import React from 'react';
import ReactDOM from 'react-dom';
import './poll-component.scss';
import { PollComponentCreate } from './poll-component-create';
import { PollComponentView } from './poll-component-view';

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

import React from 'react';
import ReactDOM from 'react-dom';
import './poll-component.scss';
import { PollComponentCreate } from './poll-component-create';
import { PollComponentView } from './poll-component-view';

interface IProps {
    item: any;
    onFormPopulated?: (data: any) => void;
}

const PollComponent: React.FunctionComponent<IProps> = ({ item, onFormPopulated }) => {
    if (item) {
        return <PollComponentView item={item} />;
    }

    return <PollComponentCreate onFormPopulated={onFormPopulated} />;
};

export const destroyPollComponent = (element: HTMLDivElement) => {
    ReactDOM.unmountComponentAtNode(element);
};

const renderPollComponent = (
    element: HTMLDivElement, item: any, onFormPopulated?: () => void) => {
    ReactDOM.render(<PollComponent item={item} onFormPopulated={onFormPopulated} />, element);
};

export default renderPollComponent;

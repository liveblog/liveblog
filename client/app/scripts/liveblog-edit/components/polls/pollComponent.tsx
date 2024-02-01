/* eslint-disable */
// @ts-nocheck
import React from 'react';
import './pollComponent.scss';
import PollComponentCreate from './pollComponentCreate.tsx';
import PollComponentView from './pollComponentView.tsx';

interface IProps {
    item: any;
}

export class PollComponent extends React.Component<IProps, IProps> {
    constructor(props) {
        super(props);

        this.state = {
            item: props.item,
        };
    }

    render() {
        const { item } = this.state;

        if(item) {
            return <PollComponentView item={item} />;
        }

        return <PollComponentCreate />;
    }
}

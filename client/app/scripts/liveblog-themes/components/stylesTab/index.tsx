/* eslint-disable */
import React, { useReducer, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import hash from 'object-hash';
import { Provider } from './context';
import { rootReducer } from './reducer';
import { StylesTabContent } from './styleTabContent';
import ResetStylesPortal from './resetStylesPortal';
import type { IStylesTabProps } from './types';

export const StylesTab: React.FunctionComponent<IStylesTabProps> = (props) => {
    const [state, dispatch] = useReducer(rootReducer, props);
    const settingsChanged = hash(props.settings);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        props.onStoreChange();
    }, [settingsChanged]);

    return (
        <Provider value={{ state, dispatch }}>
            <StylesTabContent {...props} />
            <ResetStylesPortal />
        </Provider>
    );
};

export const renderStylesTab = (props: IStylesTabProps, mountPoint: HTMLDivElement) => {
    ReactDOM.render(<StylesTab {...props} />, mountPoint);
};

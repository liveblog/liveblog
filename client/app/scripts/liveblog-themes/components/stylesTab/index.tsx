/* eslint-disable */
import React, { useReducer, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import hash from 'object-hash';
import { Provider } from './context';
import { rootReducer } from './reducer';
import { StylesTabContent } from './style-tab-content';
import ResetStylesPortal from './reset-styles-portal';
import { fetchWebFonts, updateFontOptionsAction } from './actions';
import type { IStylesTabProps } from './types';

export const StylesTab: React.FunctionComponent<IStylesTabProps> = (props) => {
    const [state, dispatch] = useReducer(rootReducer, props);
    const settingsChanged = hash(state.settings);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }

        props.onStoreChange();
    }, [settingsChanged]);

    if (isFirstRun.current) {
        if (props.googleApiKey.length > 0) {
            fetchWebFonts(props.googleApiKey)
                .then((data) => {
                    const actionUpdate = updateFontOptionsAction(data);

                    dispatch(actionUpdate);
                });
        } else {
            console.warn(`Google API Key required for FontPicker. \n
                https://cloud.google.com/docs/authentication/api-keys`);
        }
    }

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

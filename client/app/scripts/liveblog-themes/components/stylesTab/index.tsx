/* eslint-disable */
import React, { useReducer, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import hash from 'object-hash';
import { Provider } from './context';
import { rootReducer } from './reducer';
import { StylesTabContent } from './styleTabContent';

interface IProps {
    styleOptions: Array<IStyleGroup>;
    settings: IStyleSettings;
    onStoreChange: () => void;
}

export const StylesTab: React.FunctionComponent<IProps> = (props) => {
    const { settings } = props;
    const [state, dispatch] = useReducer(rootReducer, settings);
    const settingsChanged = hash(settings);
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
        </Provider>
    );
};

export const renderStylesTab = (
        element: HTMLDivElement,
        options: Array<IStyleGroup>,
        settings: IStyleSettings,
        onStoreChange: () => void
    ) => {

    ReactDOM.render(
        <StylesTab styleOptions={options} settings={settings} onStoreChange={onStoreChange} />, element);
};

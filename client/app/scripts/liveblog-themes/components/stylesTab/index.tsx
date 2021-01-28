/* eslint-disable */
import React, { useReducer } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from './context';
import { rootReducer } from './reducer';
import type { IStyleOptionProps } from './types';
import { Input } from './elements/input';
import { ColorPicker } from './elements/colorpicker';
import { Dropdown } from './elements/dropdown';
import { genericConnect } from './elements/helpers';

interface IStyleProps {
    styleOptions: Array<IStyleGroup>;
    settings: IStyleSettings;
}

const availableElements = {
    text: genericConnect(Input),
    colorpicker: genericConnect(ColorPicker),
    dropdown: genericConnect(Dropdown),
};

const StyleOption: React.FunctionComponent<Partial<IStyleOptionProps>> = (props) => {
    const Element = availableElements[props.type];

    if (!Element) {
        console.warn(`Style setting option "${props.type}" not found`);
        return null;
    }

    return (
        <div className="flex-item">
            <Element {...props} />
        </div>
    );
};

const StylesTab: React.SFC<IStyleProps> = (props) => {
    const renderGroup = (group: IStyleGroup, idx: number) => {
        return (
            <div className="form-group" key={idx}>
                <div>
                    <div className="lb-group-heading">
                        <label className="sd-line-input__label text-uppercase text-bold">
                            {group.label}
                        </label>
                    </div>

                    <div className={`flex-grid wrap-items padded-grid small-1 medium-${group.columns}`}>
                        {group.options.map(
                            (option, id) => <StyleOption {...option} group={group} key={`option-${id}`} />)}
                    </div>
                </div>
            </div>
        );
    };

    const { settings, styleOptions } = props;
    const groups = styleOptions.map(renderGroup);

    const [state, dispatch] = useReducer(rootReducer, settings);

    return (
        <Provider value={{ state, dispatch }}>
            <div className="styles-tab-content">
                {groups}
            </div>
        </Provider>
    );
};

const renderStylesTab = (element: HTMLDivElement, options: Array<IStyleGroup>, settings: IStyleSettings) => {
    ReactDOM.render(
        <StylesTab styleOptions={options} settings={settings} />, element);
};

export {
    StylesTab,
    renderStylesTab,
};

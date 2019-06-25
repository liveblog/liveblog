/* eslint-disable */
import React, { useReducer } from 'react';
import ReactDOM from 'react-dom';
import { Input } from './elements/input';
import { Provider } from './context';
import { rootReducer } from './reducer';
import { connect } from './utils';

interface IStyleProps {
    styleOptions: Array<IStyleGroup>;
    settings: IStyleSettings;
}

const availableElements = {
    text: Input,
};

const StylesTab: React.SFC<IStyleProps> = (props) => {
    const renderOptions = (group: IStyleGroup) => {
        return group.options.map((option: IStyleOption, idx: number) => {
            const _Element = availableElements[option.type];

            if (!_Element) {
                console.warn(`Style setting option "${option.type}" not found`);
                return null;
            }

            const Element = connect(group, option)(_Element);

            return (
                <div className="flex-item" key={`option-${idx}`}>
                    <Element />
                </div>
            );
        });
    };

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
                        {renderOptions(group)}
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

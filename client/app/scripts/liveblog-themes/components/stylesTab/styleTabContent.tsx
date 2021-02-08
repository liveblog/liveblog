/* eslint-disable */
import React from 'react';
import type { IStyleOptionProps } from './types';
import { Input } from './elements/input';
import { ColorPicker } from './elements/colorpicker';
import { Dropdown } from './elements/dropdown';
import { genericConnect } from './elements/helpers';

interface IProps {
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

const StylesTabContent: React.FunctionComponent<IProps> = (props) => {
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

    const { styleOptions } = props;
    const groups = styleOptions.map(renderGroup);

    return (
        <div className="styles-tab-content">
            {groups}
        </div>
    );
};

export { StylesTabContent };

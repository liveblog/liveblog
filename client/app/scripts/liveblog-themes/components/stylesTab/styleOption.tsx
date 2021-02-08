import React from 'react';
import type { IStyleOptionProps } from './types';
import { Input } from './elements/input';
import { ColorPicker } from './elements/colorpicker';
import { Dropdown } from './elements/dropdown';
import { genericConnect } from './elements/helpers';

const availableElements = {
    text: genericConnect(Input),
    colorpicker: genericConnect(ColorPicker),
    dropdown: genericConnect(Dropdown),
};

export const StyleOption: React.FunctionComponent<Partial<IStyleOptionProps>> = (props) => {
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

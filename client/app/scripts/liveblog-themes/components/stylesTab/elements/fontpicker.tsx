import React from 'react';
import Select from 'react-select';
import type { IStyleOptionProps, IStylesTabProps, IFontOption } from '../types';
import { genericMapDispatchToProps } from './helpers';
import { connect } from '../utils';
import { selectStyles as reactSelectStyles } from 'liveblog-common/react-select-styles';

interface IProps extends IStyleOptionProps {
    fontOptions: IFontOption[];
}

const selectStyles = {
    ...reactSelectStyles,
    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '1px',
    }),

    clearIndicator: (provided) => ({
        ...provided,
        padding: '1px',
    }),

    indicatorsContainer: (provided) => ({
        ...provided,
        padding: '1px',
    }),

    input: (provided) => ({
        ...provided,
        margin: '0px',
        paddingBottom: '0px',
    }),

    menu: (provided) => ({
        ...provided,
        minWidth: '200px',
    }),

    control: (provided, state) => ({
        ...reactSelectStyles.control(provided, state),
        minHeight: '16px',
    }),
};

class FontPickerInternal extends React.Component<IProps> {
    render() {
        const props = this.props;
        const propertyName = props.property as string;
        let selectedFont;

        if (props.value && props.fontOptions) {
            selectedFont = props.fontOptions.find((s) => s.value === props.value);
        }

        return (
            <div className="sd-line-input">
                <label
                    className="sd-line-input__label text-uppercase"
                    htmlFor={propertyName}
                >
                    {props.label}
                </label>

                <div>
                    <Select
                        className="react-select__selector"
                        styles={selectStyles}
                        options={props.fontOptions}
                        value={selectedFont}
                        menuPosition="fixed"
                        onChange={(selected) => props.onChange((selected as any).value)}
                    />
                </div>

                {props.help && <small>{props.help}</small>}
            </div>
        );
    }
}

const mapStateToProps = (state: IStylesTabProps, ownProps: IProps): IProps => {
    const { settings } = state;

    return {
        ...ownProps,
        value: settings[ownProps.group.name][ownProps.property as string],
        fontOptions: state.fontsOptions,
    };
};

const FontPickerConnected = connect(mapStateToProps, genericMapDispatchToProps)(FontPickerInternal);

export { FontPickerConnected };

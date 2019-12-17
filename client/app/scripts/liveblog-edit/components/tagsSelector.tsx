import React from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import _ from 'lodash';
import { ActionMeta } from 'react-select/src/types'; // eslint-disable-line
import { Styles } from 'react-select/src/styles'; // eslint-disable-line

interface IProps {
    tags: Array<string>;
    selectedTags: Array<string>;
    isMulti: boolean;
    onChange: (value: Array<string>) => void;
}

const selectStyles: Styles = {
    control: (provided, state) => {
        const styles = {
            ...provided,
            borderRadius: '3px',
            minHeight: '32px',
            borderColor: '#d9d9d9',
        };

        if (state.menuIsOpen || state.isFocused) {
            styles.borderColor = '#5ea9c8';
            styles.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.15)';
        }

        return styles;
    },

    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '6px',
    }),

    clearIndicator: (provided) => ({
        ...provided,
        padding: '6px',
    }),

    valueContainer: (provided) => ({
        ...provided,
        padding: '2px 3px',
    }),
};

const TagsSelector: React.FunctionComponent<IProps> = (props) => {
    const options = _.map(props.tags, (x) => ({ label: x, value: x }));
    const selectedTags = _.map(props.selectedTags, (x) => ({ label: x, value: x }));

    return (
        <React.Fragment>
            <Select
                className="react__tags__selector"
                styles={selectStyles}
                isMulti={props.isMulti}
                placeholder="Type in or select from the dropdown"
                onChange={(value: any, _action: ActionMeta) => {
                    if (props.isMulti) {
                        return props.onChange(_.map(value, (x) => x.value));
                    }

                    return props.onChange([value.value]);
                }}
                defaultValue={selectedTags}
                options={options}
            />
        </React.Fragment>
    );
};

export const destroyTagsSelector = (element: HTMLDivElement) => {
    ReactDOM.unmountComponentAtNode(element);
};

const renderTagsSelector = (
    element: HTMLDivElement, props: IProps) => {
    ReactDOM.render(<TagsSelector { ...props } />, element);
};

export default renderTagsSelector;

import React from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import _ from 'lodash';
import type { ActionMeta } from 'react-select/src/types';
import { selectStyles } from '../../liveblog-common/react-select-styles';

interface IProps {
    tags: string[];
    selectedTags: string[];
    isMulti: boolean;
    onChange: (value: string[]) => void;
}

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
    ReactDOM.render(<TagsSelector {...props} />, element);
};

export default renderTagsSelector;

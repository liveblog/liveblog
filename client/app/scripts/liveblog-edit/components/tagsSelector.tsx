import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Select from 'react-select';
import { ActionMeta } from 'react-select/src/types'; // eslint-disable-line

interface IProps {
    tags: Array<string>;
    selectedTags: Array<string>;
    isMulti: boolean;
    onChange: (value: Array<string>) => void;
}

const TagsSelector: React.FunctionComponent<IProps> = (props) => {
    const options = _.map(props.tags, (x) => ({ label: x, value: x }));
    const selectedTags = _.map(props.selectedTags, (x) => ({ label: x, value: x }));

    return (
        <React.Fragment>
            <Select
                isMulti={props.isMulti}
                placeholder="Type in or select from the dropdown"
                onChange={(value: any, action: ActionMeta) => {
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

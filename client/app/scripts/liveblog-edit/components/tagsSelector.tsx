import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import Select from 'react-select';

interface IProps {
    tags: Array<string>;
}

const TagsSelector: React.FunctionComponent<IProps> = (props) => {
    const options = _.map(props.tags, (x) => ({ label: x, value: x }));

    return (
        <React.Fragment>
            <div className="selector__label">Tag(s):</div>

            <Select
                isMulti
                placeholder="Type in or select from the dropdown"
                options={options}
            />
        </React.Fragment>
    );
};

const renderTagsSelector = (
    element: HTMLDivElement, tags: Array<any>, onChange?: (tags: Array<any>) => void) => {
    ReactDOM.render(<TagsSelector tags={tags} />, element);
};

export default renderTagsSelector;

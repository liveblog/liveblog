import React from 'react';
import ReactDOM from 'react-dom';
import CreatableSelect from 'react-select/creatable';

interface IProps {
    tags: Array<any>;
}

const TagsSelector: React.FunctionComponent<IProps> = (props) => {
    return (
        <div>
            <CreatableSelect
                isMulti
                options={props.tags}
            />
        </div>
    );
};

const renderTagsComponent = (element: HTMLDivElement, tags: Array<any>) => {
    ReactDOM.render(
        <TagsSelector tags={tags} />, element);
};

export { renderTagsComponent, TagsSelector };

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import CreatableSelect from 'react-select/creatable';
import { ActionMeta, OptionsType } from 'react-select/src/types'; // eslint-disable-line
import { ITagOption } from './types'; // eslint-disable-line

interface IProps {
    tags: Array<any>;
    onChange: (value: Array<any>) => void;
}

const TagsSelector: React.FunctionComponent<IProps> = (props) => {
    const options: OptionsType<ITagOption> = _.map(props.tags, (x) => ({ label: x, value: x }));
    const bodyContainer = $('body').get(0);

    return (
        <div>
            <CreatableSelect
                menuPortalTarget={bodyContainer}
                isMulti={true}
                options={options}
                defaultValue={options}
                placeholder={'Write your tags and hit ENTER or TAB key'}
                onChange={(value: any, action: ActionMeta) => {
                    props.onChange(_.map(value, (x) => x.value));
                }}
            />
            <span>{'Modifying an existing tag won\'t change the posts that have been already tagged.'}</span>
        </div>
    );
};

const renderTagsManager = (
    element: HTMLDivElement, tags: Array<any>, onChange: (tags: Array<any>) => void) => {
    ReactDOM.render(
        <TagsSelector tags={tags} onChange={onChange} />, element);
};

export { renderTagsManager };

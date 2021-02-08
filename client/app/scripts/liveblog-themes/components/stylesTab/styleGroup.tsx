import React from 'react';
import { StyleOption } from './styleOption';

interface IProps {
    group: IStyleGroup;
}

export const StyleGroup: React.FunctionComponent<IProps> = (props) => {
    const { group } = props;

    return (
        <div className="form-group">
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

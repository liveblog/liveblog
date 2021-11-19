import React from 'react';
import { StyleGroup } from './style-group';

interface IProps {
    styleOptions: IStyleGroup[];
    settings: IStyleSettings;
}

const StylesTabContent: React.FunctionComponent<IProps> = (props) => {
    const { styleOptions } = props;
    const groups = styleOptions.map((group, idx) => <StyleGroup group={group} key={idx} />);

    return (
        <div className="styles-tab-content">
            {groups}
        </div>
    );
};

export { StylesTabContent };

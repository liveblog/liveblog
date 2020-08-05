import React, { useState } from 'react';
import moment from 'moment';
import { DateTimePicker as DTPicker } from '@atlaskit/datetime-picker';
import { generateTimes } from './utils';

interface IProps {
    label: string;
}

// otherwise TS will complain with warnings
const AtlasPicker = DTPicker as any;

export const DateTimePicker: React.FunctionComponent<IProps> = (props) => {
    const [value, setValue] = useState(moment().format());
    const [invalid, setInvalid] = useState(false);

    const onChange = (datetime: string) => {
        const now = moment();
        const selectedDate = moment(datetime);

        setInvalid(!selectedDate.isValid() || selectedDate <= now);
        setValue(datetime);
    };

    const times = generateTimes('01:00', 30, 'minutes');

    console.log(props.label); // eslint-disable-line
    console.log(times); // eslint-disable-line

    return (
        <div className="flex-grid flex-grid--wrap-items flex-grid--small-1">
            <div className="flex-grid__item">
                <AtlasPicker
                    value={value}
                    onChange={onChange}
                    timeIsEditable={true}
                    isInvalid={invalid}
                    times={times}
                />

                {invalid ? <span>Please provide a valid date and time (in future)</span> : null}
            </div>
        </div>
    );
};

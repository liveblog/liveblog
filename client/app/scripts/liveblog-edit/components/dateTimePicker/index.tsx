import React, { useState } from 'react';
import moment from 'moment';
import { DateTimePicker as DTPicker } from '@atlaskit/datetime-picker';
import { generateTimes } from './utils';

interface IProps {
    datetime?: string;
    onChange: (utcDatetime: string) => void;
}

// otherwise TS will complain with warnings
const AtlasPicker = DTPicker as any;

export const DateTimePicker: React.FunctionComponent<IProps> = (props) => {
    const currentUtc = moment().utc();
    const initialDate = props.datetime ?? currentUtc.format();

    const [value, setValue] = useState(initialDate);
    const [invalid, setInvalid] = useState(false);

    const onChange = (datetime: string) => {
        const now = moment();
        const selectedDate = moment(datetime);

        setInvalid(!selectedDate.isValid() || selectedDate <= now);
        setValue(datetime);

        props.onChange(selectedDate.utc().format());
    };

    const times = generateTimes('01:00', 30, 'minutes');

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

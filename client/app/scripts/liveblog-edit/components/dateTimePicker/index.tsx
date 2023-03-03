import React, { useState } from 'react';
import moment from 'moment';
import { DateTimePicker as DTPicker } from '@atlaskit/datetime-picker';
import { generateTimes } from './utils';
import { Styles } from 'react-select/src/styles';

interface IProps {
    datetime?: string;
    onChange: (utcDatetime: string, isDatetimeInvalid: boolean) => void;
}

// otherwise TS will complain with warnings
const AtlasPicker = DTPicker as any;

const selectStyles: Styles = {
    control: (provided) => {
        const styles = {
            ...provided,
            minHeight: '32px',
        };

        return styles;
    },

    valueContainer: (provided) => ({
        ...provided,
        paddingTop: '0px',
        paddingBottom: '0px',
        paddingLeft: '3px',
        paddingRight: '3px',
    }),

    input: (provided) => ({
        ...provided,
        paddingTop: '0px',
        paddingBottom: '0px',
        margin: '1px',
    }),

    singleValue: (provided) => ({
        ...provided,
        color: '#808080',
    }),
};

export const DateTimePicker: React.FunctionComponent<IProps> = (props) => {
    const currentUtc = moment().utc();
    const initialDate = props.datetime ?? currentUtc.format();

    const [value, setValue] = useState(initialDate);
    const [invalid, setInvalid] = useState(false);

    const onChange = (datetime: string) => {
        const now = moment();
        const selectedDate = moment(datetime);
        const isDatetimeInvalid = !selectedDate.isValid() || selectedDate <= now;

        setInvalid(isDatetimeInvalid);
        setValue(datetime);

        props.onChange(selectedDate.utc().format(), isDatetimeInvalid);
    };

    const times = generateTimes('00:00', 30, 'minutes');
    const [isFocused, setFocused] = useState(false);
    const containerClass = 'schedule-datetime-picker';

    return (
        <div className="flex-grid flex-grid--wrap-items flex-grid--small-1">
            <div className="flex-grid__item">
                <AtlasPicker
                    value={value}
                    onChange={onChange}
                    timeIsEditable={true}
                    isInvalid={invalid}
                    times={times}
                    innerProps={{
                        className: `${containerClass}${isFocused ? '__hover' : ''}`,
                    }}
                    datePickerSelectProps={{
                        styles: selectStyles,
                    }}
                    timePickerSelectProps={{
                        styles: selectStyles,
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />

                {invalid && (
                    <span className="freetype--error freetype--error-text">
                        Please provide a valid date and time (in future)
                    </span>
                )}
            </div>
        </div>
    );
};

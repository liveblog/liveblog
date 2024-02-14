import React, { useState } from 'react';
import './poll-component.scss';

export const PollComponentCreate: React.FunctionComponent<{}> = () => {
    const [question, setQuestion] = useState<string>('');
    const [options, setOptions] = useState<string[]>(['', '']);
    const [days, setDays] = useState<number>(1);
    const [hours, setHours] = useState<number>(0);
    const [minutes, setMinutes] = useState<number>(0);

    const addOption = (event) => {
        event.preventDefault();
        setOptions((prev) => [...prev, '']);
    };

    const removeOption = (indexToRemove) => {
        setOptions((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const updateOption = (indexToUpdate, event) => {
        const newOption = event.target.value;

        setOptions((prev) => prev.map((option, index) => index === indexToUpdate ? newOption : option));
    };

    const resetPoll = (event) => {
        event.preventDefault();
        setQuestion('');
        setOptions(['', '']);
        setDays(1);
        setHours(0);
        setMinutes(0);
    };

    return (
        <div className="poll_component poll_column poll_gap_16">
            <p className="poll_component_title">Create poll</p>

            <div id="poll_question">
                <p className="poll_component_subtitle">QUESTION:</p>
                <input
                    type="text"
                    placeholder="Ask A Question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />
            </div>

            <div id="poll_options">
                <p className="poll_component_subtitle">ANSWERS:</p>
                <div className="poll_flex_box poll_column poll_gap_8">
                    {options.map((option, index) => {
                        return (
                            <div key={index} className="poll_option_container">
                                <input
                                    key={index}
                                    type="text"
                                    placeholder={`Option ${index + 1}`}
                                    style={{ width: '100%', paddingRight: '30px' }}
                                    value={option}
                                    onChange={(e) => updateOption(index, e)}
                                />
                                <span
                                    className="poll_option_remove_container"
                                    onClick={() => removeOption(index)}
                                >
                                    <span className="icon-close-small" />
                                </span>
                            </div>
                        );
                    })}
                    <button className="poll_option_add_button" onClick={(e) => addOption(e)}>+ Add Option</button>
                </div>
            </div>

            <div id="poll_settings">
                <p className="poll_component_title">Poll length:</p>
                <div className="poll_flex_box poll_row poll_gap_8">

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">DAYS:</p>
                        <input
                            id="poll_days_input"
                            type="number"
                            min={0}
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value, 10))}
                        />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">HOURS:</p>
                        <input
                            id="poll_hours_input"
                            type="number"
                            min={0}
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value, 10))}
                        />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">MINUTES:</p>
                        <input
                            id="poll_minutes_input"
                            type="number"
                            min={0}
                            value={minutes}
                            onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                        />
                    </div>

                </div>
            </div>

            <button className="btn poll_reset_button" onClick={(e) => resetPoll(e)}>RESET POLL</button>
        </div>
    );
};

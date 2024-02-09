import React, { useState } from 'react';
import './poll-component.scss';

export const PollComponentCreate: React.FunctionComponent<{}> = () => {
    const [options, setOptions] = useState<string[]>(['Option 1', 'Option 2']);

    const addOption = () => {
        setOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
    };

    const removeOption = (indexToRemove) => {
        setOptions((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className="poll_component poll_column poll_gap_16">
            <p className="poll_component_title">Create poll</p>

            <div id="poll_question">
                <p className="poll_component_subtitle">QUESTION:</p>
                <input type="text" placeholder="Ask A Question..." />
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
                                    placeholder={option}
                                    style={{ width: '100%', paddingRight: '30px' }}
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
                    <p className="poll_option_add" onClick={addOption}>+ Add Option</p>
                </div>
            </div>

            <div id="poll_settings">
                <p className="poll_component_title">Poll length:</p>
                <div className="poll_flex_box poll_row poll_gap_8">

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">DAYS:</p>
                        <input type="number" placeholder="1" />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">HOURS:</p>
                        <input type="number" placeholder="0" />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4">
                        <p className="poll_component_subtitle">MINUTES:</p>
                        <input type="number" placeholder="0" />
                    </div>

                </div>
            </div>

            <button className="btn poll_reset_button">RESET POLL</button>
        </div>
    );
};

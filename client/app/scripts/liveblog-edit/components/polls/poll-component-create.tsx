import React, { useState, useEffect } from 'react';
import { timeLeftCalculation } from './utils';
import './poll-component.scss';
import moment from 'moment';

interface IProps {
    item: any;
    onFormPopulated: (data: any) => void;
}

interface IAnswers {
    option: string;
    votes: number;
}

export const PollComponentCreate: React.FunctionComponent<IProps> = ({ item, onFormPopulated }) => {
    const [question, setQuestion] = useState<string>('');
    const [answers, setAnswers] = useState<IAnswers[]>([{ option: '', votes: 0 }, { option: '', votes: 0 }]);
    const [days, setDays] = useState<number>(0);
    const [hours, setHours] = useState<number>(0);
    const [minutes, setMinutes] = useState<number>(0);
    const [disableUpdate, setDisableUpdate] = useState<boolean>(false);
    const [timeElapsed, setTimeElapsed] = useState<boolean>(false);

    const addAnswer = (event) => {
        event.preventDefault();
        setAnswers((prev) => [...prev, { option: '', votes: 0 }]);
    };

    const removeAnswer = (indexToRemove) => {
        setAnswers((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const updateAnswer = (indexToUpdate, event) => {
        const newAnswer = event.target.value;

        setAnswers((prev) => {
            return prev.map((answer, index) => {
                return index === indexToUpdate ? { ...answer, option: newAnswer } : answer;
            });
        });
    };

    const resetPoll = (event) => {
        event.preventDefault();
        setQuestion('');
        setAnswers([{ option: '', votes: 0 }, { option: '', votes: 0 }]);
        setDays(0);
        setHours(0);
        setMinutes(0);
    };

    const isFormFilled = () => {
        return question !== ''
            && answers.length >= 2 && answers.every((answer) => answer.option !== '')
            && (days > 0 || hours > 0 || minutes > 0);
    };

    const getPollBody = () => {
        const futureTime = moment().add({ days: days, hours: hours, minutes: minutes });
        const pollBody = {
            question: question,
            answers: answers,
            active_until: futureTime.toISOString(),
        };

        return pollBody;
    };

    useEffect(() => {
        if (isFormFilled() || timeElapsed) {
            const pollBody = getPollBody();

            onFormPopulated(pollBody);
        }
    }, [question, answers, days, hours, minutes]);

    useEffect(() => {
        if (item.poll_body) {
            setDisableUpdate(true);
            const pollBody = item.poll_body;
            const timeLeft = timeLeftCalculation(pollBody.active_until);

            if (timeLeft.days <= 0 && timeLeft.hours <= 0 && timeLeft.minutes <= 0) {
                setTimeElapsed(true);
            }

            setQuestion(pollBody.question);
            setAnswers(pollBody.answers);
            setDays(timeLeft.days <= 0 ? 0 : timeLeft.days);
            setHours(timeLeft.hours <= 0 ? 0 : timeLeft.hours);
            setMinutes(timeLeft.minutes <= 0 ? 0 : timeLeft.minutes);
        }
    }, [item]);

    return (
        <div className="poll_component poll_column poll_gap_16">
            <p className="poll_component_title">{!disableUpdate ? 'Create' : 'Edit'} poll</p>

            <div id="poll_question">
                <p className="poll_component_subtitle">QUESTION:</p>
                <input
                    type="text"
                    placeholder="Ask A Question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={disableUpdate}
                />
            </div>

            <div id="poll_options">
                <p className="poll_component_subtitle">ANSWERS:</p>
                <div className="poll_flex_box poll_column poll_gap_8">
                    {answers.map((answer, index) => {
                        return (
                            <div key={index} className="poll_option_container">
                                <input
                                    key={index}
                                    type="text"
                                    placeholder={`Option ${index + 1}`}
                                    style={{ width: '100%', paddingRight: '30px' }}
                                    value={answer.option}
                                    onChange={(e) => updateAnswer(index, e)}
                                    disabled={disableUpdate}
                                />
                                {!disableUpdate && (
                                    <span
                                        className="poll_option_remove_container"
                                        onClick={() => removeAnswer(index)}
                                    >
                                        <span className="icon-close-small" />
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    {!disableUpdate && (
                        <button className="poll_option_add_button" onClick={(e) => addAnswer(e)}>+ Add Option</button>
                    )}
                </div>
            </div>

            <div id="poll_settings">
                <p className="poll_component_title">Poll length:</p>
                <div className="poll_flex_box poll_row poll_gap_8">

                    <div className="poll_flex_box poll_column poll_gap_4" style={{ width: '100%' }}>
                        <p className="poll_component_subtitle">DAYS:</p>
                        <input
                            id="poll_days_input"
                            type="number"
                            min={0}
                            value={days}
                            onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
                            disabled={timeElapsed}
                        />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4" style={{ width: '100%' }}>
                        <p className="poll_component_subtitle">HOURS:</p>
                        <input
                            id="poll_hours_input"
                            type="number"
                            min={0}
                            max={24}
                            value={hours}
                            onChange={(e) => {
                                const value = Math.min(Math.max(parseInt(e.target.value, 10) || 0, 0), 24);

                                setHours(value);
                            }}
                            disabled={timeElapsed}
                        />
                    </div>

                    <div className="poll_flex_box poll_column poll_gap_4" style={{ width: '100%' }}>
                        <p className="poll_component_subtitle">MINUTES:</p>
                        <input
                            id="poll_minutes_input"
                            type="number"
                            min={0}
                            max={60}
                            value={minutes}
                            onChange={(e) => {
                                const value = Math.min(Math.max(parseInt(e.target.value, 10) || 0, 0), 60);

                                setMinutes(value);
                            }}
                            disabled={timeElapsed}
                        />
                    </div>

                </div>
            </div>

            {timeElapsed && (
                <p className="poll_component_subtitle">Note: The poll time elapsed so it cannot be updated.</p>
            )}

            {!disableUpdate && (
                <button className="btn poll_reset_button" onClick={(e) => resetPoll(e)}>RESET POLL</button>
            )}
        </div>
    );
};

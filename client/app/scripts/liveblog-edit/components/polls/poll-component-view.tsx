/* eslint camelcase: "off" */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './poll-component.scss';
import { pollCalculations } from './utils';

export interface IPollBody {
    active_until: string;
    answers: Array<{ option: string; votes: number; percentage?: number }>;
    question: string;
    totalVotes?: number;
    timeLeft?: number;
    timeUnit?: string;
}

interface IProps {
    item: any;
}

const PollComponentView: React.FunctionComponent<IProps> = ({ item }) => {
    const [poll, setPoll] = useState<IPollBody>(pollCalculations(item.poll_body));

    useEffect(() => {
        setPoll(pollCalculations(item.poll_body));
    }, [item]);

    return (
        <div
            className="poll_component poll_column poll_gap_16"
            style={{ width: '50%', backgroundColor: '#FBFAFB' }}
        >
            <p className="poll_component_title">{poll.question}</p>

            {poll.answers.map((answer, index) => {
                return (
                    <div key={index} className="poll_flex_box poll_column">
                        <p className="poll_component_vote_option">{answer.option}</p>
                        <div className="poll_flex_box poll_row poll_gap_8">
                            <div className="poll_vote_container">
                                <div className="poll_vote_bg">
                                    <div className="poll_vote_fg" style={{ width: `${answer.percentage}%` }} />
                                </div>
                            </div>
                            <div className="poll_component_subtitle poll_component_vote_percentage">
                                {answer.percentage}%
                            </div>
                        </div>
                        <p className="poll_component_subtitle">Votes: {answer.votes}</p>
                    </div>
                );
            })}

            <div className="poll_flex_box poll_row poll_gap_8">
                <p className="poll_component_subtitle">Total Votes: {poll.totalVotes}</p>
                <p className="poll_component_subtitle">&bull;</p>
                {poll.timeLeft > 0 ? (
                    <p className="poll_component_subtitle">{poll.timeLeft} {poll.timeUnit} Left</p>
                ) : (
                    <p className="poll_component_subtitle">Poll Closed</p>
                )}
            </div>
        </div>
    );
};


export const destroyPollComponentView = (element: HTMLDivElement) => {
    ReactDOM.unmountComponentAtNode(element);
};

const renderPollComponentView = (element: HTMLDivElement, item: any) => {
    ReactDOM.render(<PollComponentView item={item} />, element);
};

export default renderPollComponentView;

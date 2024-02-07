/* eslint camelcase: "off" */
import React, { useState, useEffect } from 'react';
import './pollComponent.scss';

interface PollBody {
    active_until: string;
    answers: { option: string; votes: number; percentage?: number }[];
    question: string;
    totalVotes?: number;
    daysLeft?: number;
}

interface IProps {
    item: any;
}

export const PollComponentView: React.FunctionComponent<IProps> = ({ item }) => {
    const [poll, setPoll] = useState<PollBody>(handleCalculations(item.poll_body));

    useEffect(() => {
        setPoll(handleCalculations(item.poll_body));
    }, [item]);

    function handleCalculations(poll_body: PollBody): PollBody {
        const totalVotes = poll_body.answers.reduce((acc, answer) => acc + answer.votes, 0);
        const currentTime = new Date();
        const activeUntilTime = new Date(poll_body.active_until);
        const differenceMs = activeUntilTime.getTime() - currentTime.getTime();
        const daysLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
        let updatedAnswers = poll_body.answers.map((answer) => ({
            ...answer,
            percentage: totalVotes === 0 ? 0 : Math.ceil((answer.votes / totalVotes) * 100),
        }));

        updatedAnswers = updatedAnswers.sort((a, b) => b.votes - a.votes);

        return {
            ...poll_body,
            totalVotes: totalVotes,
            daysLeft: daysLeft,
            answers: updatedAnswers,
        };
    }

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
                <p className="poll_component_subtitle">{poll.daysLeft} Days Left</p>
            </div>
        </div>
    );
};

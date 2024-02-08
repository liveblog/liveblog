import { PollBody } from './poll-component-view';

export function handleCalculations(pollBody: PollBody): PollBody {
    const totalVotes = pollBody.answers.reduce((acc, answer) => acc + answer.votes, 0);
    const currentTime = new Date();
    const activeUntilTime = new Date(pollBody.active_until);
    const differenceMs = activeUntilTime.getTime() - currentTime.getTime();
    const daysLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
    let updatedAnswers = pollBody.answers.map((answer) => ({
        ...answer,
        percentage: totalVotes === 0 ? 0 : +((answer.votes / totalVotes) * 100).toFixed(1),
    }));

    updatedAnswers = updatedAnswers.sort((a, b) => b.votes - a.votes);

    return {
        ...pollBody,
        totalVotes: totalVotes,
        daysLeft: daysLeft,
        answers: updatedAnswers,
    };
}

import { PollBody } from './poll-component-view';

export function pollCalculations(pollBody: PollBody): PollBody {
    const totalVotes = pollBody.answers.reduce((acc, answer) => acc + answer.votes, 0);
    const currentTime = new Date();
    const activeUntilTime = new Date(pollBody.active_until);
    const differenceMs = activeUntilTime.getTime() - currentTime.getTime();
    const daysLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    // To ensure the percentages add up to 100%, perform some maths
    // Using the Percentage Rounding Error Allocation method
    let rawPercentages = pollBody.answers.map((answer) => ({
        ...answer,
        rawPercentage: totalVotes === 0 ? 0 : (answer.votes / totalVotes) * 100,
    }));
    let roundedPercentages = rawPercentages.map((answer) => ({
        ...answer,
        percentage: Math.round(answer.rawPercentage),
    }));
    let totalPercentage = roundedPercentages.reduce((acc, answer) => acc + answer.percentage, 0);
    let adjustment = 100 - totalPercentage;
    let sortedByRemainder = [...roundedPercentages].sort((a, b) =>
        (b.rawPercentage - Math.floor(b.rawPercentage)) - (a.rawPercentage - Math.floor(a.rawPercentage))
    );

    for (let i = 0; i < Math.abs(adjustment); i++) {
        sortedByRemainder[i % sortedByRemainder.length].percentage += Math.sign(adjustment);
    }

    let updatedAnswers = sortedByRemainder.map(({ option, votes, percentage }) => ({ option, votes, percentage }));

    updatedAnswers = updatedAnswers.sort((a, b) => b.votes - a.votes);

    return {
        ...pollBody,
        totalVotes: totalVotes,
        daysLeft: daysLeft,
        answers: updatedAnswers,
    };
}

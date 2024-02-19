import { IPollBody } from './poll-component-view';

export const pollCalculations: (pollBody: IPollBody) => IPollBody = (pollBody) => {
    const totalVotes = pollBody.answers.reduce((acc, answer) => acc + answer.votes, 0);
    const currentTime = new Date();
    const activeUntilTime = new Date(pollBody.active_until);
    const differenceMs = activeUntilTime.getTime() - currentTime.getTime();
    const timeLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
    const timeUnit = timeLeft > 1 ? 'Days' : 'Day';

    let updatedAnswers = pollBody.answers.map((answer) => ({
        ...answer,
        percentage: totalVotes === 0 ? 0 : Math.round((answer.votes / totalVotes) * 100),
    }));

    if (totalVotes > 0) {
        // To ensure the percentages add up to 100%, perform some maths
        // Using the Percentage Rounding Error Allocation method
        const rawPercentages = pollBody.answers.map((answer) => ({
            ...answer,
            rawPercentage: totalVotes === 0 ? 0 : (answer.votes / totalVotes) * 100,
        }));
        const roundedPercentages = rawPercentages.map((answer) => ({
            ...answer,
            percentage: Math.round(answer.rawPercentage),
        }));
        const totalPercentage = roundedPercentages.reduce((acc, answer) => acc + answer.percentage, 0);
        const adjustment = 100 - totalPercentage;
        const sortedByRemainder = [...roundedPercentages].sort((a, b) =>
            (b.rawPercentage - Math.floor(b.rawPercentage)) - (a.rawPercentage - Math.floor(a.rawPercentage))
        );

        for (let i = 0; i < Math.abs(adjustment); i++) {
            sortedByRemainder[i % sortedByRemainder.length].percentage += Math.sign(adjustment);
        }

        updatedAnswers = sortedByRemainder.map(({ option, votes, percentage }) => ({ option, votes, percentage }));
    }

    updatedAnswers = updatedAnswers.sort((a, b) => b.votes - a.votes);

    return {
        ...pollBody,
        totalVotes: totalVotes,
        timeLeft: timeLeft,
        timeUnit: timeUnit,
        answers: updatedAnswers,
    };
};

export const timeLeftCalculation: (activeUntil: string) => {
    days: number;
    hours: number;
    minutes: number;
} = (activeUntil) => {
    const currentTime = new Date();
    const activeUntilTime = new Date(activeUntil);
    const differenceMs = activeUntilTime.getTime() - currentTime.getTime();

    const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((differenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
};

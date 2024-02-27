import { IPollBody } from './poll-component-view';
import moment from 'moment';

export const pollCalculations: (pollBody: IPollBody) => IPollBody = (pollBody) => {
    const totalVotes = pollBody.answers.reduce((acc, answer) => acc + answer.votes, 0);
    const currentTime = moment();
    const activeUntilTime = moment(pollBody.active_until);
    const elapsed = activeUntilTime.isBefore(currentTime);
    const timeLeft = activeUntilTime.fromNow();

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
        answers: updatedAnswers,
        timeLeft: timeLeft,
        elapsed: elapsed,
    };
};

export const timeLeftCalculation: (activeUntil: string) => {
    days: number;
    hours: number;
    minutes: number;
} = (activeUntil) => {
    const currentTime = moment();
    const activeUntilTime = moment(activeUntil);
    const duration = moment.duration(activeUntilTime.diff(currentTime));

    const days = Math.floor(duration.asDays());
    const hours = Math.floor(duration.asHours() % 24);
    const minutes = Math.floor(duration.asMinutes() % 60);

    return { days, hours, minutes };
};

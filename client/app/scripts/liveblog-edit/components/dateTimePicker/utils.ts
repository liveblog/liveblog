import moment from 'moment';

export const generateTimes = (desiredStartTime: string, interval: number, period: moment.unitOfTime.Base) => {
    const timeLabels = [];
    const periodsInADay = moment.duration(1, 'day').as(period);
    const startTimeMoment = moment(desiredStartTime, 'hh:mm');

    for (let i = 0; i < periodsInADay; i += interval) {
        startTimeMoment.add(i === 0 ? 0 : interval, period);
        timeLabels.push(startTimeMoment.format('HH:mm'));
    }

    return timeLabels;
};

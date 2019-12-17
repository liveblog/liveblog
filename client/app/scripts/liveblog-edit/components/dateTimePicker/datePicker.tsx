/* eslint react/no-multi-comp: 0 */
import React from 'react';
import moment from 'moment'; // eslint-disable-line no-unused-vars
import Select from 'react-select';
import { MenuProps } from 'react-select/src/components/Menu'; // eslint-disable-line no-unused-vars
import Calendar from 'react-calendar/dist/entry.nostyle';

import { connect } from 'liveblog-common/lb-redux';
import * as Actions from './actions';
import { IStore } from './types'; // eslint-disable-line no-unused-vars

import IndicatorsContainer from './indicators';

interface IOptionType {
    value: Date;
    label: string;
}

const Menu: React.FunctionComponent<MenuProps<IOptionType>> = (props) => {
    const { value, onCalendarChange } = props.selectProps;

    return (
        <Calendar
            minDate={new Date()}
            value={(value as any).value}
            onChange={onCalendarChange}
        />
    );
};

interface IProps {
    date: moment.Moment;
    isOpen: boolean;
    togglePicker: (open: boolean) => void;
    onDateChange: (datetime: Date) => void;
}

class DatePicker extends React.Component<IProps> {
    container: HTMLDivElement;

    componentDidMount() {
        document.addEventListener('click', this.handleClick);
    }

    handleClick = (e: MouseEvent) => {
        const outsideBoundaries = !this.container.contains(e.target as any);

        if (outsideBoundaries) {
            this.props.togglePicker(false);
        }
    }

    openPicker = () => this.props.togglePicker(true);

    render() {
        const { date } = this.props;
        const value = date.clone().toDate();
        const formattedNow = date.format('DD/MM/YYYY');

        const calendarProps = {
            onCalendarChange: this.props.onDateChange,
        };

        return (
            <div ref={(x) => this.container = x} onClick={this.openPicker}>
                <Select
                    className="react__tags__selector"
                    menuIsOpen={this.props.isOpen}
                    components={{
                        IndicatorsContainer,
                        Menu,
                    }}
                    // styles={selectStyles}
                    placeholder={formattedNow}
                    value={{
                        value: value as any, label: formattedNow,
                    }}
                    {...calendarProps}
                />
                <div>{formattedNow}</div>
            </div>
        );
    }
}

const mapStateToProps = (state: IStore, ownProps: IProps): IProps => {
    return {
        ...ownProps,
        isOpen: state.isDatePickerOpen,
        date: state.datetime,
    };
};

const mapDispatchToProps = (dispatch, ownProps: IProps): IProps => {
    return {
        ...ownProps,
        togglePicker: (open: boolean) => {
            dispatch(Actions.toggleDatePicker(open));
        },
        onDateChange: (datetime: Date) => {
            dispatch(Actions.updateDate(datetime));
            dispatch(Actions.toggleDatePicker(false));
        },
    };
};

export const ConnectedDatePicker = connect(mapStateToProps, mapDispatchToProps)(DatePicker);

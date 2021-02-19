import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from './utils';
import { Actions } from './actions';

interface IProps {
    resetStyles: () => void;
}

class ResetStylesPortal extends React.Component<IProps> {
    el: HTMLElement;

    constructor(props) {
        super(props);
        this.el = document.getElementById('reset-styles-portal');
    }

    render() {
        return ReactDOM.createPortal(
            <button className="btn btn--primary pull-left" onClick={this.props.resetStyles}>
                Reset Styles
            </button>,
            this.el
        );
    }
}

const mapDispatchToProps = (dispatch, ownProps: any) => {
    return {
        ...ownProps,
        resetStyles: () => {
            dispatch({ type: Actions.resetStylesSettings });
        },
    };
};

const ResetStylesPortalConnected = connect(null, mapDispatchToProps)(ResetStylesPortal);

export default ResetStylesPortalConnected;

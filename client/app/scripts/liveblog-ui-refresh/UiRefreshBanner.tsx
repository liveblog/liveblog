import React, { useEffect, useReducer } from 'react';
import {
    dismissUiRefreshBanner,
    isUiRefreshBannerDismissed,
    isUiRefreshEnabled,
    onUiRefreshChange,
    setUiRefreshEnabled,
} from './ui-refresh';

import './ui-refresh-banner.scss';

interface IProps {
    gettext: (text: string) => string;
}

export const UiRefreshBanner: React.FunctionComponent<IProps> = ({ gettext }) => {
    const [, rerender] = useReducer((x: number) => x + 1, 0);

    useEffect(() => onUiRefreshChange(rerender), []);

    if (isUiRefreshEnabled() || isUiRefreshBannerDismissed()) {
        return null;
    }

    return (
        <div className="ui-refresh-banner" role="region" data-testid="ui-refresh-banner">
            <div className="ui-refresh-banner__copy">
                <strong>{gettext('Liveblog has a new look')}</strong>
                <span>{gettext('Try the refreshed interface. You can switch back any time from the Help menu.')}</span>
            </div>
            <div className="ui-refresh-banner__actions">
                <button
                    type="button"
                    className="btn btn--primary"
                    data-testid="ui-refresh-try"
                    onClick={() => setUiRefreshEnabled(true)}
                >
                    {gettext('Try it')}
                </button>
                <button
                    type="button"
                    className="btn btn--hollow"
                    data-testid="ui-refresh-dismiss"
                    onClick={dismissUiRefreshBanner}
                >
                    {gettext('Not now')}
                </button>
            </div>
        </div>
    );
};

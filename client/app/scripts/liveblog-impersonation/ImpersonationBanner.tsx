import React, { useState } from 'react';
import {
    IImpersonationUser,
    getImpersonationInfo,
    isImpersonating,
    stopImpersonation,
} from './impersonation';

interface IProps {
    gettext: (text: string) => string;
}

export const ImpersonationBanner: React.FunctionComponent<IProps> = ({ gettext }) => {
    const [stopping, setStopping] = useState(false);

    if (!isImpersonating()) {
        return null;
    }

    const info = getImpersonationInfo();
    const user: Partial<IImpersonationUser> = (info && info.user) || {};
    const tenant = (info && info.tenant) || null;
    const details = [tenant && tenant.name, user.role || user.user_type]
        .filter((x) => Boolean(x))
        .join(', ');
    const text = gettext('Impersonating') + ' ' + (user.display_name || gettext('unknown user'))
        + (details ? ' (' + details + ')' : '');

    return (
        <div className="impersonation-banner" data-testid="impersonation-banner">
            <span className="impersonation-banner__text">{text}</span>
            <button
                type="button"
                className="impersonation-banner__stop"
                data-testid="impersonation-stop"
                disabled={stopping}
                onClick={() => {
                    setStopping(true);
                    stopImpersonation();
                }}
            >
                {gettext('Stop impersonating')}
            </button>
        </div>
    );
};

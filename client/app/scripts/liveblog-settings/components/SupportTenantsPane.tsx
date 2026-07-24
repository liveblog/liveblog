import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {
    ITenant,
    ITenantUser,
    IImpersonationUser,
    fetchSupportTenants,
    fetchTenantUsers,
    startImpersonation,
} from '../../liveblog-impersonation/impersonation';

interface IProps {
    gettext: (text: string) => string;
    onError: (message: string) => void;
}

interface ITenantUsersState {
    loading: boolean;
    users: ITenantUser[];
}

const SupportTenantsPane: React.FunctionComponent<IProps> = ({ gettext, onError }) => {
    const [tenants, setTenants] = useState<ITenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [expanded, setExpanded] = useState<{ [tenantId: string]: boolean }>({});
    const [tenantUsers, setTenantUsers] = useState<{ [tenantId: string]: ITenantUsersState }>({});
    const [impersonating, setImpersonating] = useState(false);

    useEffect(() => {
        fetchSupportTenants()
            .then((items) => setTenants(items))
            .catch(() => onError(gettext('Could not load tenants.')))
            .then(() => setLoading(false));
    }, []);

    const tenantMatches = (tenant: ITenant): boolean => {
        const needle = filterText.trim().toLowerCase();

        if (!needle) {
            return true;
        }

        return [tenant.name, tenant.organization_name, tenant.owner && tenant.owner.email]
            .some((value) => Boolean(value) && value.toLowerCase().indexOf(needle) !== -1);
    };

    const toggleExpand = (tenant: ITenant) => {
        const id = tenant._id;
        const isOpen = !expanded[id];

        setExpanded((prev) => ({ ...prev, [id]: isOpen }));

        if (!isOpen || tenantUsers[id]) {
            return;
        }

        setTenantUsers((prev) => ({ ...prev, [id]: { loading: true, users: [] } }));

        fetchTenantUsers(id)
            .then((users) => {
                setTenantUsers((prev) => ({ ...prev, [id]: { loading: false, users: users } }));
            })
            .catch(() => {
                // drop the entry so a later expand retries the request
                setTenantUsers((prev) => {
                    const next = { ...prev };

                    delete next[id];
                    return next;
                });
                setExpanded((prev) => ({ ...prev, [id]: false }));
                onError(gettext('Could not load the users of this tenant.'));
            });
    };

    // A null reason means impersonation is allowed; a string is the tooltip
    // explaining why the button is disabled. Single source per rule.
    const ownerDisabledReason = (tenant: ITenant): string | null => {
        if (!tenant.owner) {
            return gettext('This tenant has no owner assigned');
        }

        if (tenant.owner.is_active === false) {
            return gettext('The owner account is inactive');
        }

        return null;
    };

    const userDisabledReason = (user: ITenantUser): string | null => {
        if (!user.is_active) {
            return gettext('This user is inactive');
        }

        if (user.needs_activation) {
            return gettext('This user has not been activated yet');
        }

        return null;
    };

    const impersonate = (user: IImpersonationUser) => {
        if (impersonating) {
            return;
        }

        setImpersonating(true);

        startImpersonation(user).catch((error) => {
            setImpersonating(false);
            onError(error.message || gettext('Impersonation failed.'));
        });
    };

    const userStatus = (user: ITenantUser): string => {
        if (!user.is_active) {
            return gettext('inactive');
        }

        return user.needs_activation ? gettext('pending activation') : gettext('active');
    };

    const renderUsersRow = (tenant: ITenant) => {
        const state = tenantUsers[tenant._id];

        return (
            <tr className="support-tenants__users-row">
                <td colSpan={7}>
                    <div data-testid="tenant-users-list">
                        {(!state || state.loading) ? (
                            <div className="loading-indicator"><span>{gettext('loading')}</span></div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{gettext('Name')}</th>
                                        <th>{gettext('Email')}</th>
                                        <th>{gettext('Role')}</th>
                                        <th>{gettext('Status')}</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {state.users.map((user) => (
                                        <tr key={user._id} data-testid="tenant-user-row">
                                            <td>
                                                {user.display_name}
                                                {user.is_owner && (
                                                    <span className="label label-info">{gettext('Owner')}</span>
                                                )}
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.role || user.user_type}</td>
                                            <td>{userStatus(user)}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn--primary btn--small"
                                                    data-testid="impersonate-user"
                                                    disabled={impersonating || userDisabledReason(user) != null}
                                                    title={userDisabledReason(user) || ''}
                                                    onClick={() => impersonate(user)}
                                                >
                                                    {gettext('Impersonate')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {state.users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="support-tenants__muted">
                                                {gettext('This tenant has no users')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const visibleTenants = tenants.filter(tenantMatches);

    return (
        <div>
            <div className="support-tenants__toolbar">
                <input
                    type="text"
                    className="support-tenants__filter"
                    data-testid="tenants-filter"
                    placeholder={gettext('Filter by name, organization or owner email')}
                    value={filterText}
                    onChange={(event) => setFilterText(event.target.value)}
                />
            </div>
            {loading ? (
                <div className="loading-indicator"><span>{gettext('loading')}</span></div>
            ) : (
                <div data-testid="support-tenants-list" className="support-tenants__list">
                    <table className="table">
                        <thead>
                            <tr>
                                <th />
                                <th>{gettext('Name')}</th>
                                <th>{gettext('Organization')}</th>
                                <th>{gettext('Subscription')}</th>
                                <th>{gettext('Owner')}</th>
                                <th>{gettext('Created')}</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {visibleTenants.map((tenant) => (
                                <React.Fragment key={tenant._id}>
                                    <tr data-testid="tenant-row">
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-default btn--small"
                                                data-testid="tenant-expand"
                                                title={expanded[tenant._id]
                                                    ? gettext('Hide users') : gettext('Show users')}
                                                onClick={() => toggleExpand(tenant)}
                                            >
                                                {expanded[tenant._id] ? '-' : '+'}
                                            </button>
                                        </td>
                                        <td>{tenant.name}</td>
                                        <td>{tenant.organization_name}</td>
                                        <td>{tenant.subscription_level}</td>
                                        <td>
                                            {tenant.owner ? (
                                                <span>
                                                    {tenant.owner.display_name}<br />
                                                    <small>{tenant.owner.email}</small>
                                                </span>
                                            ) : (
                                                <span className="support-tenants__muted">
                                                    {gettext('No owner assigned')}
                                                </span>
                                            )}
                                        </td>
                                        <td>{(tenant._created || '').slice(0, 10)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn--primary btn--small"
                                                data-testid="impersonate-owner"
                                                disabled={impersonating || ownerDisabledReason(tenant) != null}
                                                title={ownerDisabledReason(tenant) || ''}
                                                onClick={() => impersonate(tenant.owner)}
                                            >
                                                {gettext('Impersonate owner')}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded[tenant._id] && renderUsersRow(tenant)}
                                </React.Fragment>
                            ))}
                            {visibleTenants.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="support-tenants__muted">
                                        {gettext('No tenants found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const renderSupportTenantsPane = (element: HTMLElement, props: IProps) => {
    ReactDOM.render(<SupportTenantsPane gettext={props.gettext} onError={props.onError} />, element);
};

const unmountSupportTenantsPane = (element: HTMLElement) => {
    ReactDOM.unmountComponentAtNode(element);
};

export { SupportTenantsPane, renderSupportTenantsPane, unmountSupportTenantsPane };

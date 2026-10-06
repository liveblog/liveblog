import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
    ITenant,
    ITenantOwner,
    ITenantUser,
    ITenantDetail,
    IImpersonationUser,
    fetchSupportTenants,
    fetchTenantDetail,
    fetchTenantUsers,
    startImpersonation,
} from '../../liveblog-impersonation/impersonation';

interface IProps {
    gettext: (text: string) => string;
    onError: (message: string) => void;
}

interface IBillingBadge {
    label: string;
    modifier: string;
}

const SupportTenantsPane: React.FunctionComponent<IProps> = ({ gettext, onError }) => {
    const [tenants, setTenants] = useState<ITenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<ITenantDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailFailed, setDetailFailed] = useState(false);
    const [users, setUsers] = useState<ITenantUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [impersonating, setImpersonating] = useState(false);
    const requestSeq = useRef(0);
    const detailSeq = useRef(0);

    // Search is server-side so it can match tenant fields AND any of a
    // tenant's users (name, username, email), which are not loaded client
    // side. Debounced, with a sequence guard so a slow response cannot
    // overwrite a newer one.
    useEffect(() => {
        const term = filterText.trim();
        const seq = requestSeq.current + 1;

        requestSeq.current = seq;

        const timer = setTimeout(() => {
            fetchSupportTenants(term)
                .then((items) => {
                    if (seq === requestSeq.current) {
                        setTenants(items);
                    }
                })
                .catch(() => {
                    if (seq === requestSeq.current) {
                        onError(gettext('Could not load tenants.'));
                    }
                })
                .then(() => {
                    if (seq === requestSeq.current) {
                        setLoading(false);
                    }
                });
        }, term ? 250 : 0);

        return () => clearTimeout(timer);
    }, [filterText]);

    // Detail and users are two independent calls fired in parallel. A single
    // sequence guard (detailSeq) covers both so switching tenants quickly
    // cannot let a stale response paint over the current selection.
    const selectTenant = (tenant: ITenant) => {
        if (tenant._id === selectedId) {
            return;
        }

        const seq = detailSeq.current + 1;

        detailSeq.current = seq;
        setSelectedId(tenant._id);
        setDetail(null);
        setDetailFailed(false);
        setDetailLoading(true);
        setUsers([]);
        setUsersLoading(true);

        fetchTenantDetail(tenant._id)
            .then((data) => {
                if (seq === detailSeq.current) {
                    setDetail(data);
                }
            })
            .catch(() => {
                if (seq === detailSeq.current) {
                    setDetailFailed(true);
                    onError(gettext('Could not load tenant details.'));
                }
            })
            .then(() => {
                if (seq === detailSeq.current) {
                    setDetailLoading(false);
                }
            });

        fetchTenantUsers(tenant._id)
            .then((list) => {
                if (seq === detailSeq.current) {
                    setUsers(list);
                }
            })
            .catch(() => {
                if (seq === detailSeq.current) {
                    onError(gettext('Could not load the users of this tenant.'));
                }
            })
            .then(() => {
                if (seq === detailSeq.current) {
                    setUsersLoading(false);
                }
            });
    };

    // Maps a billing status to a health colour. active/trialing read as
    // healthy, past_due as a warning, expired/canceled as danger, anything
    // unknown (including null) stays neutral.
    const billingBadge = (status: string | null): IBillingBadge => {
        const value = (status || '').toLowerCase();

        if (value === 'active' || value === 'trialing') {
            return { label: gettext('active'), modifier: 'healthy' };
        }

        if (value === 'past_due') {
            return { label: gettext('past due'), modifier: 'warning' };
        }

        if (value === 'expired' || value === 'canceled' || value === 'cancelled') {
            return { label: value, modifier: 'danger' };
        }

        return { label: gettext('unknown'), modifier: 'unknown' };
    };

    // A null reason means impersonation is allowed; a string is the tooltip
    // explaining why the button is disabled. Single source per rule.
    const userDisabledReason = (user: ITenantUser): string | null => {
        if (!user.is_active) {
            return gettext('This user is inactive');
        }

        if (user.needs_activation) {
            return gettext('This user has not been activated yet');
        }

        return null;
    };

    // The owner button must obey the same rule as the owner's own row, so it
    // is driven by the owner's full user record (the is_owner entry in the
    // loaded users list), not the sparse owner summary, which lacks the
    // activation state.
    const ownerActionReason = (
        owner: ITenantOwner | null, ownerUser: ITenantUser | null
    ): string | null => {
        if (!owner) {
            return gettext('This tenant has no owner assigned');
        }

        if (ownerUser) {
            return userDisabledReason(ownerUser);
        }

        // Owner exists but the full record is not available (users still
        // loading, or not returned); disable, with no tooltip while loading.
        return usersLoading ? '' : gettext('The owner account could not be loaded');
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

    const statusModifier = (user: ITenantUser): string => {
        if (!user.is_active) {
            return 'inactive';
        }

        return user.needs_activation ? 'pending' : 'active';
    };

    const shortDate = (value: string | null): string => (value || '').slice(0, 10) || '-';

    const renderTenantRow = (tenant: ITenant) => {
        const badge = billingBadge(tenant.billing_status);
        const isSelected = tenant._id === selectedId;
        const rowClass = 'support-tenants__row' + (isSelected ? ' support-tenants__row--selected' : '');

        return (
            <button
                key={tenant._id}
                type="button"
                data-testid="tenant-row"
                className={rowClass}
                onClick={() => selectTenant(tenant)}
            >
                <span className="support-tenants__row-main">
                    <span className="support-tenants__row-name">{tenant.name}</span>
                    <span className="support-tenants__row-sub">{tenant.subscription_level}</span>
                </span>
                <span className={'support-tenants__badge support-tenants__badge--' + badge.modifier}>
                    {badge.label}
                </span>
            </button>
        );
    };

    const renderUserRow = (user: ITenantUser) => {
        const reason = userDisabledReason(user);
        const statusClass = 'support-tenants__status support-tenants__status--' + statusModifier(user);

        return (
            <li key={user._id} className="support-tenants__user-row" data-testid="tenant-user-row">
                <div className="support-tenants__user-info">
                    <span className="support-tenants__user-name">
                        {user.display_name}
                        {user.is_owner && (
                            <span className="label label-info">{gettext('Owner')}</span>
                        )}
                    </span>
                    <span className="support-tenants__user-email">{user.email}</span>
                </div>
                <span className={statusClass}>{userStatus(user)}</span>
                <button
                    type="button"
                    className="btn btn--primary btn--small"
                    data-testid="impersonate-user"
                    disabled={impersonating || reason != null}
                    title={reason || ''}
                    onClick={() => impersonate(user)}
                >
                    {gettext('Impersonate')}
                </button>
            </li>
        );
    };

    const renderUsersList = () => {
        if (usersLoading) {
            return <div className="loading-indicator"><span>{gettext('loading')}</span></div>;
        }

        if (users.length === 0) {
            return (
                <div className="support-tenants__muted">{gettext('This tenant has no users')}</div>
            );
        }

        return (
            <ul className="support-tenants__user-list">
                {users.map((user) => renderUserRow(user))}
            </ul>
        );
    };

    const renderField = (label: string, value: React.ReactNode) => (
        <div className="support-tenants__field">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );

    const renderComingSoon = (label: string) => (
        <div className="support-tenants__coming-soon">
            <span className="support-tenants__coming-soon-label">{label}</span>
            <span className="support-tenants__badge support-tenants__badge--soon">
                {gettext('Coming soon')}
            </span>
        </div>
    );

    const renderDetailBody = (data: ITenantDetail) => {
        const tenant = data.tenant;
        const billing = data.billing;
        const stats = data.stats;
        const owner = tenant.owner;
        const ownerUser = users.find((user) => user.is_owner) || null;
        const ownerReason = ownerActionReason(owner, ownerUser);
        const badge = billingBadge(billing.status);

        return (
            <React.Fragment>
                <header className="support-tenants__detail-header">
                    <h3 className="support-tenants__detail-title">{tenant.name}</h3>
                    <div className="support-tenants__detail-org">{tenant.organization_name}</div>
                    <div className="support-tenants__detail-owner">
                        {owner ? (
                            <span>
                                {owner.display_name} <small>{owner.email}</small>
                            </span>
                        ) : (
                            <span className="support-tenants__muted">
                                {gettext('No owner assigned')}
                            </span>
                        )}
                    </div>
                    <div className="support-tenants__detail-created">
                        {gettext('Created')}: {shortDate(tenant._created)}
                    </div>
                </header>

                <section className="support-tenants__section">
                    <h4 className="support-tenants__section-title">{gettext('Plan & billing')}</h4>
                    <dl className="support-tenants__fields">
                        {renderField(gettext('Subscription'), tenant.subscription_level)}
                        {renderField(
                            gettext('Billing status'),
                            <span className={'support-tenants__badge support-tenants__badge--' + badge.modifier}>
                                {badge.label}
                            </span>
                        )}
                        {renderField(gettext('Plan expires'), shortDate(billing.plan_expires_at))}
                        {renderField(gettext('Stripe customer'), billing.stripe_customer_id || '-')}
                    </dl>
                </section>

                <section className="support-tenants__section">
                    <h4 className="support-tenants__section-title">{gettext('Usage')}</h4>
                    <div className="support-tenants__stats">
                        <div className="support-tenants__stat">
                            <span className="support-tenants__stat-value">{stats.blogs_count}</span>
                            <span className="support-tenants__stat-label">{gettext('Blogs')}</span>
                        </div>
                        <div className="support-tenants__stat">
                            <span className="support-tenants__stat-value">{stats.users_count}</span>
                            <span className="support-tenants__stat-label">{gettext('Users')}</span>
                        </div>
                    </div>
                </section>

                <section className="support-tenants__section">
                    <h4 className="support-tenants__section-title">{gettext('Insights')}</h4>
                    {renderComingSoon(gettext('Pageviews'))}
                    {renderComingSoon(gettext('Last activity'))}
                </section>

                <section className="support-tenants__section support-tenants__actions">
                    <h4 className="support-tenants__section-title">{gettext('Actions')}</h4>
                    <button
                        type="button"
                        className="btn btn--primary"
                        data-testid="impersonate-owner"
                        disabled={impersonating || ownerReason != null}
                        title={ownerReason || ''}
                        onClick={() => ownerUser && impersonate(ownerUser)}
                    >
                        {gettext('Impersonate owner')}
                    </button>
                    <div className="support-tenants__users" data-testid="tenant-users-list">
                        <h5 className="support-tenants__section-title">{gettext('Users')}</h5>
                        {renderUsersList()}
                    </div>
                </section>
            </React.Fragment>
        );
    };

    const renderDetailContent = () => {
        if (detailLoading) {
            return <div className="loading-indicator"><span>{gettext('loading')}</span></div>;
        }

        if (detailFailed || detail == null) {
            return (
                <div className="support-tenants__placeholder">
                    <span>{gettext('Could not load tenant details.')}</span>
                </div>
            );
        }

        return renderDetailBody(detail);
    };

    const renderDetailPane = () => {
        if (selectedId == null) {
            return (
                <div className="support-tenants__placeholder">
                    <span>{gettext('Select a tenant')}</span>
                </div>
            );
        }

        return (
            <div data-testid="tenant-detail" className="support-tenants__detail">
                {renderDetailContent()}
            </div>
        );
    };

    return (
        <div className="support-tenants">
            <div className="support-tenants__master">
                <div className="support-tenants__toolbar">
                    <input
                        type="text"
                        className="support-tenants__filter"
                        data-testid="tenants-filter"
                        placeholder={gettext('Filter by tenant, organization, or user email')}
                        value={filterText}
                        onChange={(event) => setFilterText(event.target.value)}
                    />
                </div>
                {loading ? (
                    <div className="loading-indicator"><span>{gettext('loading')}</span></div>
                ) : (
                    <div data-testid="support-tenants-list" className="support-tenants__list">
                        {tenants.map((tenant) => renderTenantRow(tenant))}
                        {tenants.length === 0 && (
                            <div className="support-tenants__empty">{gettext('No tenants found')}</div>
                        )}
                    </div>
                )}
            </div>
            <div className="support-tenants__detail-pane">
                {renderDetailPane()}
            </div>
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

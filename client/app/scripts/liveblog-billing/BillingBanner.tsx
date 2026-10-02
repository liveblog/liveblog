import React from 'react';
import { apiGet, apiPost } from '../liveblog-common/api';
import { getToken } from '../liveblog-common/session';

interface IProps {
    onPortalError?: (message: string) => void;
}

interface IBillingStatus {
    billingRequired: boolean;
    accessAllowed: boolean;
    redirect: string | null;
    pricingUrl: string | null;
    status: string | null;
    planExpiresAt: string | null;
    checkoutPriceId: string | null;
}

interface IState {
    billingStatus: IBillingStatus | null;
}

export class BillingBanner extends React.Component<IProps, IState> {
    state: IState = { billingStatus: null };

    componentDidMount() {
        if (!getToken()) {
            return;
        }

        apiGet('/billing/status')
            .then((data) => {
                if (data) {
                    this.setState({
                        billingStatus: {
                            billingRequired: data.billing_required,
                            accessAllowed: data.access_allowed,
                            redirect: data.redirect,
                            pricingUrl: data.pricing_url,
                            status: data.status,
                            planExpiresAt: data.plan_expires_at || null,
                            checkoutPriceId: data.checkout_price_id || null,
                        },
                    });
                }
            })
            .catch(() => undefined);
    }

    private isVisible() {
        const { billingStatus } = this.state;

        return Boolean(
            billingStatus
            && billingStatus.billingRequired
            && !billingStatus.accessAllowed
        );
    }

    private handleAction = () => {
        const { onPortalError } = this.props;

        if (!getToken()) {
            return;
        }

        apiPost('/billing/portal', { return_url: window.location.origin })
            .then((data) => {
                if (data && data.url) {
                    window.location.href = data.url;
                    return;
                }

                if (onPortalError) {
                    onPortalError('Unable to open billing portal. Please try again.');
                }
            })
            .catch(() => {
                if (onPortalError) {
                    onPortalError('Unable to open billing portal. Please try again.');
                }
            });
    }

    private handleExtend = () => {
        const { billingStatus } = this.state;

        if (!getToken() || !billingStatus?.checkoutPriceId) {
            return;
        }

        apiPost('/billing/checkout', {
            price_id: billingStatus.checkoutPriceId,
            return_url: window.location.origin,
        })
            .then((data) => {
                if (data && data.url) {
                    window.location.href = data.url;
                }
            })
            .catch(() => undefined);
    }

    render() {
        const { billingStatus } = this.state;

        if (!this.isVisible() || !billingStatus) {
            return null;
        }

        if (billingStatus.redirect === 'extend') {
            return (
                <div
                    className="billing-banner alert alert-warning"
                    role="alert"
                >
                    <div className="billing-banner__content">
                        <div className="billing-banner__copy">
                            <strong>
                                Your plan has expired.
                            </strong>
                            <span>
                                Extend your plan to continue.
                            </span>
                        </div>
                        <button
                            className="billing-banner__action"
                            onClick={this.handleExtend}
                            type="button"
                        >
                            Extend
                        </button>
                    </div>
                </div>
            );
        }

        if (billingStatus.redirect === 'portal') {
            return (
                <div
                    className="billing-banner alert alert-warning"
                    role="alert"
                >
                    <div className="billing-banner__content">
                        <div className="billing-banner__copy">
                            <strong>
                                Your subscription needs attention.
                            </strong>
                            <span>
                                LiveBlog is in read-only mode
                                until billing is updated.
                            </span>
                        </div>
                        <button
                            className="billing-banner__action"
                            onClick={this.handleAction}
                            type="button"
                        >
                            Update Billing
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="billing-banner alert alert-warning"
                role="alert"
            >
                <div className="billing-banner__content">
                    <div className="billing-banner__copy">
                        <strong>
                            Your subscription is inactive.
                        </strong>
                        <span>
                            Please contact support to activate
                            your account.
                        </span>
                    </div>
                    <a
                        className="billing-banner__action"
                        href="https://sourcefabricberlin.zendesk.com/hc/en-us/requests/new"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        );
    }
}

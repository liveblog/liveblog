import React from 'react';

interface IProps {
    onPortalError?: (message: string) => void;
}

interface IBillingStatus {
    billingRequired: boolean;
    accessAllowed: boolean;
    redirect: string | null;
    pricingUrl: string | null;
    status: string | null;
}

interface IState {
    billingStatus: IBillingStatus | null;
}

export class BillingBanner extends React.Component<IProps, IState> {
    state: IState = { billingStatus: null };

    componentDidMount() {
        const apiUrl = __SUPERDESK_CONFIG__.server.url;
        const token = localStorage.getItem('sess:token');

        if (!token) {
            return;
        }

        fetch(`${apiUrl}/billing/status`, {
            headers: { Authorization: token },
        })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (data) {
                    this.setState({
                        billingStatus: {
                            billingRequired: data.billing_required,
                            accessAllowed: data.access_allowed,
                            redirect: data.redirect,
                            pricingUrl: data.pricing_url,
                            status: data.status,
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
        const apiUrl = __SUPERDESK_CONFIG__.server.url;
        const token = localStorage.getItem('sess:token');
        const { onPortalError } = this.props;

        if (!token) {
            return;
        }

        fetch(`${apiUrl}/billing/portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({
                return_url: window.location.origin,
            }),
        })
            .then((r) => r.ok ? r.json() : null)
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

    render() {
        const { billingStatus } = this.state;

        if (!this.isVisible() || !billingStatus) {
            return null;
        }

        const isRecoverable = billingStatus.redirect === 'portal';

        if (isRecoverable) {
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

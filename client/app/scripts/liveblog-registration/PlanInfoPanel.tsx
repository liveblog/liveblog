import React from 'react';

export interface IPlanInfo {
    productName: string;
    tagline: string;
    subtitle: string;
    description: string;
    marketingFeatures: Array<{ name: string }>;
    price: {
        amount: number;
        currency: string;
        interval: string | null;
        intervalCount: number | null;
    };
    discount?: {
        originalAmount: number | null;
        offerEndsAt: string | null;
    };
    metadata: {
        subscriptionLevel: string;
        planDurationDays: string | null;
    };
}

const styles: { [key: string]: React.CSSProperties } = {
    panel: {
        background: '#e0f5e7',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        padding: '40px 36px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        minHeight: '100%',
    },
    badge: {
        display: 'inline-block',
        background: 'oklab(0.72 -0.150101 0.07981 / 0.15)',
        color: '#15803d',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.1em',
        padding: '5px 12px',
        borderRadius: 20,
        marginBottom: 24,
        textTransform: 'uppercase' as const,
    },
    tagline: {
        fontSize: 26,
        fontWeight: 700,
        color: '#111827',
        lineHeight: 1.35,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 1.6,
        marginBottom: 28,
    },
    featureList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        marginBottom: 32,
    },
    featureItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '7px 0',
        fontSize: 14,
        color: 'rgba(17, 24, 39, 0.85)',
    },
    checkmark: {
        width: 20,
        height: 20,
        marginTop: 2,
        borderRadius: '50%',
        background: '#1eb06c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkSvg: {
        width: 12,
        height: 12,
    },
    priceSection: {
        marginTop: 'auto',
        paddingTop: 32,
    },
    priceAmount: {
        fontSize: 36,
        fontWeight: 700,
        color: '#111827',
    },
    priceInterval: {
        fontSize: 14,
        fontWeight: 400,
        color: 'rgba(17, 24, 39, 0.65)',
    },
    priceNote: {
        fontSize: 12,
        color: 'rgba(17, 24, 39, 0.6)',
        marginTop: 4,
    },
    pricingLink: {
        color: '#2563eb',
        textDecoration: 'none',
    },
    saveBadge: {
        display: 'inline-block',
        background: '#1eb06c',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        padding: '4px 12px',
        borderRadius: 20,
        marginTop: 8,
    },
    originalPriceRow: {
        fontSize: 16,
        color: 'rgba(17, 24, 39, 0.4)',
        textDecoration: 'line-through',
        marginBottom: 2,
    },
    discountOfferText: {
        fontSize: 12,
        color: '#b91c1c',
        fontWeight: 500,
        marginTop: 4,
    },
    priceRow: {
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap' as const,
        gap: 4,
    },
};

const getCurrencySymbol = (currency: string): string => {
    const symbols: { [key: string]: string } = { usd: '$', eur: '\u20AC', gbp: '\u00A3' };

    return symbols[currency] || currency.toUpperCase() + ' ';
};

const formatInterval = (price: IPlanInfo['price']): string => {
    if (!price.interval) {
        return '';
    }
    if (price.intervalCount === 1) {
        return price.interval;
    }
    return `${price.intervalCount} ${price.interval}s`;
};

const getInterval = (price: IPlanInfo['price'], durationDays: string | null): string => {
    if (price.interval) {
        return formatInterval(price);
    }
    if (durationDays) {
        return `${durationDays} days`;
    }
    return 'one-time';
};

const getPriceNote = (price: IPlanInfo['price'], durationDays: string | null): string => {
    if (price.interval) {
        return 'Cancel anytime';
    }
    if (durationDays) {
        return `${durationDays}-day access \u2014 extend anytime from your dashboard`;
    }
    return '';
};

// eslint-disable-next-line react/no-multi-comp
export const PlanInfoPanel: React.FC<{ planInfo: IPlanInfo }> = ({ planInfo }) => {
    const durationDays = planInfo.metadata.planDurationDays;
    const symbol = getCurrencySymbol(planInfo.price.currency);
    const amount = Number.isInteger(planInfo.price.amount)
        ? planInfo.price.amount : planInfo.price.amount.toFixed(2);
    const interval = getInterval(planInfo.price, durationDays);
    const note = getPriceNote(planInfo.price, durationDays);

    const { discount } = planInfo;
    const hasDiscount = discount && discount.originalAmount != null && discount.originalAmount > 0;
    const savePercent = hasDiscount
        ? Math.round((1 - planInfo.price.amount / discount!.originalAmount!) * 100)
        : 0;
    const origSymbol = getCurrencySymbol(planInfo.price.currency);
    const origAmount = hasDiscount && Number.isInteger(discount!.originalAmount)
        ? discount!.originalAmount : (discount!.originalAmount || 0).toFixed(2);
    const origInterval = getInterval(planInfo.price, durationDays);

    return (
        <div className="register-plan-panel" style={styles.panel}>
            <div>
                <span style={styles.badge}>{planInfo.productName}</span>
                <div style={styles.tagline}>
                    {planInfo.tagline}
                </div>
                <div style={styles.subtitle}>
                    {planInfo.subtitle}
                </div>
                {planInfo.marketingFeatures.length > 0 && (
                    <ul className="register-plan-features" style={styles.featureList}>
                        {planInfo.marketingFeatures.map((f, i) => (
                            <li key={i} style={styles.featureItem}>
                                <span style={styles.checkmark}>
                                    <svg style={styles.checkSvg} viewBox="0 0 12 12" fill="none">
                                        <path
                                            d="M2 6l3 3 5-5"
                                            stroke="#fff"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                                {f.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="register-plan-price-section" style={styles.priceSection}>
                {hasDiscount && (
                    <div style={styles.originalPriceRow}>
                        {origSymbol}{origAmount} / {origInterval}
                    </div>
                )}
                <div style={styles.priceRow}>
                    <span style={styles.priceAmount}>{symbol}{amount}</span>
                    <span style={styles.priceInterval}> / {interval}</span>
                </div>
                {hasDiscount && (
                    <div style={styles.saveBadge}>{savePercent}% OFF</div>
                )}
                {hasDiscount && discount!.offerEndsAt && (
                    <div style={styles.discountOfferText}>
                        Limited-time offer: ends {discount!.offerEndsAt}
                    </div>
                )}
                {note && (
                    <div style={styles.priceNote}>{note}</div>
                )}
                <div style={styles.priceNote}>
                    See other{' '}
                    <a
                        href="https://liveblog.pro/en/pricing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.pricingLink}
                    >
                        pricing plans
                    </a>
                </div>
            </div>
        </div>
    );
};

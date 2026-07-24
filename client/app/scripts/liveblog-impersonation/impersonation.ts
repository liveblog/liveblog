/* eslint camelcase: "off" */
import { apiGet, apiPost } from '../liveblog-common/api';
import {
    setSession,
    readSessionSnapshot,
    writeSessionSnapshot,
    SESSION_KEY_SUFFIXES,
    ISessionSnapshot,
} from '../liveblog-common/session';

/**
 * Tenant impersonation for support users (LBSD-2960).
 *
 * Framework-agnostic module: fetch + localStorage + hard reload, no Angular.
 * Starting an impersonation stashes the support user's session under
 * `support:*` localStorage keys, installs the session returned by
 * POST /api/support/impersonate and hard-reloads. Stopping restores the
 * stashed session and reloads again. This avoids Angular digest/boot
 * ordering entirely and lets the normal session boot path rehydrate
 * everything from storage.
 *
 * Raw fetch with the 'sess:token' header is used instead of $http for the
 * same reasons as featuresService: it must work regardless of $http defaults
 * state, including when the impersonation session has already expired.
 */

// While impersonating, the support user's own session snapshot is stashed
// under these `support:*` keys so stopping can restore it.
const SUPPORT_BACKUP_PREFIX = 'support:';
const backupKey = (suffix: string): string => SUPPORT_BACKUP_PREFIX + suffix;
const IMPERSONATING_KEY = backupKey('impersonating');

const stashSupportSession = (): void => {
    const snapshot = readSessionSnapshot();

    SESSION_KEY_SUFFIXES.forEach((suffix) => {
        if (snapshot[suffix] != null) {
            localStorage.setItem(backupKey(suffix), snapshot[suffix]);
        }
    });
};

const readStashedSession = (): ISessionSnapshot => {
    const snapshot: ISessionSnapshot = {};

    SESSION_KEY_SUFFIXES.forEach((suffix) => {
        snapshot[suffix] = localStorage.getItem(backupKey(suffix));
    });

    return snapshot;
};

const clearStashedSession = (): void => {
    SESSION_KEY_SUFFIXES.forEach((suffix) => localStorage.removeItem(backupKey(suffix)));
    localStorage.removeItem(IMPERSONATING_KEY);
};

export interface IImpersonationUser {
    _id: string;
    display_name?: string;
    role?: string;
    user_type?: string;
}

export interface IImpersonationInfo {
    user: IImpersonationUser;
    tenant: { _id: string; name: string };
}

export interface ITenantOwner {
    _id: string;
    display_name: string;
    email: string;
    is_active?: boolean;
}

export interface ITenantSummary {
    _id: string;
    name: string;
    organization_name: string;
    subscription_level: string;
    _created: string;
    owner: ITenantOwner | null;
}

export interface ITenant extends ITenantSummary {
    billing_status: string | null;
    access_allowed: boolean;
}

export interface ITenantBilling {
    status: string | null;
    access_allowed: boolean;
    plan_expires_at: string | null;
    stripe_customer_id: string | null;
}

export interface ITenantStats {
    blogs_count: number;
    users_count: number;
}

export interface ITenantDetail {
    tenant: ITenantSummary;
    billing: ITenantBilling;
    stats: ITenantStats;
}

export interface ITenantUser {
    _id: string;
    display_name: string;
    email: string;
    username: string;
    user_type: string;
    role: string;
    is_active: boolean;
    needs_activation: boolean;
    is_owner: boolean;
}

export const isImpersonating = (): boolean => localStorage.getItem(backupKey('token')) !== null;

export const getImpersonationInfo = (): IImpersonationInfo | null => {
    try {
        return JSON.parse(localStorage.getItem(IMPERSONATING_KEY));
    } catch (error) {
        return null;
    }
};

export const fetchSupportTenants = async(query?: string): Promise<ITenant[]> => {
    const term = (query || '').trim();
    const path = term ? '/support/tenants?q=' + encodeURIComponent(term) : '/support/tenants';
    const data = await apiGet(path);

    return data.tenants || [];
};

export const fetchTenantDetail = async(tenantId: string): Promise<ITenantDetail> => {
    const data = await apiGet('/support/tenants/' + tenantId);

    return data;
};

export const fetchTenantUsers = async(tenantId: string): Promise<ITenantUser[]> => {
    const data = await apiGet('/support/tenants/' + tenantId + '/users');

    return data.users || [];
};

export const restoreSupportSession = (): void => {
    writeSessionSnapshot(readStashedSession());
    clearStashedSession();
    window.location.replace('/');
};

export const startImpersonation = async(user: IImpersonationUser): Promise<void> => {
    if (isImpersonating()) {
        throw new Error('Already impersonating a user. Stop the current impersonation first.');
    }

    const data = await apiPost('/support/impersonate', { user_id: user._id });

    stashSupportSession();

    localStorage.setItem(IMPERSONATING_KEY, JSON.stringify({
        user: {
            _id: data.identity._id,
            display_name: data.identity.display_name || user.display_name,
            role: user.role,
            user_type: user.user_type || data.identity.user_type,
        },
        tenant: data.tenant,
    }));

    setSession({
        token: data.session.token,
        id: data.session._id,
        identity: data.identity,
        href: data.session._links && data.session._links.self && data.session._links.self.href,
    });

    window.location.replace('/');
};

export const stopImpersonation = async(): Promise<void> => {
    try {
        await apiPost('/support/impersonate/stop');
    } catch (error) {
        // best-effort: the impersonation session may already be expired,
        // the support session must be restored regardless
    }

    restoreSupportSession();
};

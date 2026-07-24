/**
 * Framework-agnostic access to the auth session persisted in localStorage.
 *
 * superdesk-core's session service (core/auth/session-service.js) owns these
 * keys and writes them on regular login/logout. Liveblog code that needs the
 * session outside Angular (React components, raw fetch calls that must not
 * depend on $http defaults boot ordering) goes through this module instead
 * of hardcoding key names, so the keys and the token format live in one place.
 *
 * The stored token is always the full Authorization header value
 * ('Basic <base64>'), matching what basic-auth-adapter.js persists on login.
 */

export const SESSION_KEY_PREFIX = 'sess:';
export const SESSION_KEY_SUFFIXES = ['token', 'id', 'user', 'href'];

export const sessionKey = (suffix: string): string => SESSION_KEY_PREFIX + suffix;

export const SESSION_TOKEN_KEY = sessionKey('token');
export const SESSION_ID_KEY = sessionKey('id');
export const SESSION_USER_KEY = sessionKey('user');
export const SESSION_HREF_KEY = sessionKey('href');

export interface ISessionData {
    token: string;
    id: string;
    identity?: any;
    href?: string | null;
}

// matches basic-auth-adapter.js formatToken
export const formatToken = (token: string): string =>
    token.indexOf('Basic') === 0 ? token : 'Basic ' + btoa(token + ':');

export const getToken = (): string | null => localStorage.getItem(SESSION_TOKEN_KEY);

export const getAuthHeader = (): { Authorization: string } => ({ Authorization: getToken() });

export const getSessionId = (): string | null => localStorage.getItem(SESSION_ID_KEY);

export const getIdentity = (): any | null => {
    try {
        return JSON.parse(localStorage.getItem(SESSION_USER_KEY));
    } catch (error) {
        return null;
    }
};

// the core session service reads sess:user through its storage service,
// which JSON-parses, so the identity must be stored serialized
export const setIdentity = (identity: any): void => {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(identity));
};

export interface ISessionSnapshot {
    [suffix: string]: string | null;
}

// The raw stored values of every session key, for callers that move the
// whole session around opaquely (stash/restore) without interpreting it.
export const readSessionSnapshot = (): ISessionSnapshot => {
    const snapshot: ISessionSnapshot = {};

    SESSION_KEY_SUFFIXES.forEach((suffix) => {
        snapshot[suffix] = localStorage.getItem(sessionKey(suffix));
    });

    return snapshot;
};

export const writeSessionSnapshot = (snapshot: ISessionSnapshot): void => {
    SESSION_KEY_SUFFIXES.forEach((suffix) => {
        const value = snapshot[suffix];

        if (value != null) {
            localStorage.setItem(sessionKey(suffix), value);
        } else {
            localStorage.removeItem(sessionKey(suffix));
        }
    });
};

export const setSession = ({ token, id, identity, href }: ISessionData): void => {
    localStorage.setItem(SESSION_TOKEN_KEY, formatToken(token));
    localStorage.setItem(SESSION_ID_KEY, id);

    if (identity !== undefined) {
        setIdentity(identity);
    }

    if (href) {
        localStorage.setItem(SESSION_HREF_KEY, href);
    } else {
        localStorage.removeItem(SESSION_HREF_KEY);
    }
};

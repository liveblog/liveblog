/**
 * Opt-in switch for the refreshed UI: the `lb-refresh` class on <html>.
 * Styles use `:where(.lb-refresh)`, which adds no specificity.
 * Stored in cookies because superdesk-core clears localStorage on logout.
 */

export const UI_REFRESH_CLASS = 'lb-refresh';

const ENABLED_COOKIE = 'lb_ui_refresh';
const BANNER_DISMISSED_COOKIE = 'lb_ui_refresh_banner_dismissed';
const CHANGED_EVENT = 'lb:uiRefreshChanged';
const DAY = 60 * 60 * 24;
const ONE_YEAR = 365 * DAY;
// "Not now" snoozes; a choice retires the banner
const SNOOZE = 14 * DAY;

const readCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

    return match ? match[1] : null;
};

const writeCookie = (name: string, value: string | null, maxAge = ONE_YEAR): void => {
    document.cookie = `${name}=${value || ''}; path=/; max-age=${value === null ? 0 : maxAge}; SameSite=Lax`;
};

const notifyChange = (): void => {
    window.dispatchEvent(new Event(CHANGED_EVENT));
};

export const isUiRefreshEnabled = (): boolean => readCookie(ENABLED_COOKIE) === '1';

export const isUiRefreshBannerDismissed = (): boolean => readCookie(BANNER_DISMISSED_COOKIE) === '1';

export const applyUiRefresh = (): void => {
    document.documentElement.classList.toggle(UI_REFRESH_CLASS, isUiRefreshEnabled());
};

export const setUiRefreshEnabled = (enabled: boolean): void => {
    writeCookie(ENABLED_COOKIE, enabled ? '1' : null);
    writeCookie(BANNER_DISMISSED_COOKIE, '1');
    applyUiRefresh();
    notifyChange();
};

export const dismissUiRefreshBanner = (): void => {
    writeCookie(BANNER_DISMISSED_COOKIE, '1', SNOOZE);
    notifyChange();
};

export const onUiRefreshChange = (callback: () => void): (() => void) => {
    window.addEventListener(CHANGED_EVENT, callback);
    return () => window.removeEventListener(CHANGED_EVENT, callback);
};

// cookies have no change event, so resync when the tab is shown again
const onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
        applyUiRefresh();
        notifyChange();
    }
};

export const initUiRefresh = (): void => {
    applyUiRefresh();
    document.addEventListener('visibilitychange', onVisibilityChange);
};

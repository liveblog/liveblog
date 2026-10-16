/**
 * Opt-in switch for the refreshed admin UI.
 *
 * Every refreshed style is scoped under `:where(.lb-refresh)` and only matches
 * while `<html>` carries that class, so turning the refresh on or off is a
 * class toggle with no reload. `:where()` keeps the scope at zero specificity,
 * so the refreshed rules cascade exactly as they would unscoped. Don't replace
 * it with a plain `.lb-refresh` ancestor selector.
 *
 * The choice is per browser and kept in cookies rather than localStorage,
 * because superdesk-core wipes localStorage on logout (session.clear).
 */

export const UI_REFRESH_CLASS = 'lb-refresh';

const ENABLED_COOKIE = 'lb_ui_refresh';
const BANNER_DISMISSED_COOKIE = 'lb_ui_refresh_banner_dismissed';
const CHANGED_EVENT = 'lb:uiRefreshChanged';
const ONE_YEAR = 60 * 60 * 24 * 365;

const readCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));

    return match ? match[1] : null;
};

const writeCookie = (name: string, value: string | null): void => {
    const maxAge = value === null ? 0 : ONE_YEAR;

    document.cookie = `${name}=${value || ''}; path=/; max-age=${maxAge}; SameSite=Lax`;
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
    // once someone has made a choice, the banner has done its job
    writeCookie(BANNER_DISMISSED_COOKIE, '1');
    applyUiRefresh();
    notifyChange();
};

export const dismissUiRefreshBanner = (): void => {
    writeCookie(BANNER_DISMISSED_COOKIE, '1');
    notifyChange();
};

export const onUiRefreshChange = (callback: () => void): (() => void) => {
    window.addEventListener(CHANGED_EVENT, callback);
    return () => window.removeEventListener(CHANGED_EVENT, callback);
};

// cookies have no change event, so a tab picks up a switch made in another
// tab when it becomes visible again
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

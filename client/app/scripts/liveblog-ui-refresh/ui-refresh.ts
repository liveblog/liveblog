/**
 * Opt-in switch for the refreshed admin UI.
 *
 * Every refreshed style is scoped under `:where(.lb-refresh)` and only matches
 * while `<html>` carries that class, so turning the refresh on or off is a
 * class toggle with no reload. `:where()` keeps the scope at zero specificity,
 * so the refreshed rules cascade exactly as they would unscoped. Don't replace
 * it with a plain `.lb-refresh` ancestor selector.
 *
 * The choice is per browser (localStorage). superdesk-core wipes localStorage
 * on explicit logout (session.clear), which resets it to the classic UI.
 */

export const UI_REFRESH_CLASS = 'lb-refresh';

const ENABLED_KEY = 'lb:uiRefresh';
const BANNER_DISMISSED_KEY = 'lb:uiRefreshBannerDismissed';
const CHANGED_EVENT = 'lb:uiRefreshChanged';

// localStorage throws in some privacy modes; the classic UI is the safe fallback
const read = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

const write = (key: string, value: string | null): void => {
    try {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch (e) {
        // the class toggle still applies for the current page
    }
};

const notifyChange = (): void => {
    window.dispatchEvent(new Event(CHANGED_EVENT));
};

export const isUiRefreshEnabled = (): boolean => read(ENABLED_KEY) === '1';

export const isUiRefreshBannerDismissed = (): boolean => read(BANNER_DISMISSED_KEY) === '1';

export const applyUiRefresh = (): void => {
    document.documentElement.classList.toggle(UI_REFRESH_CLASS, isUiRefreshEnabled());
};

export const setUiRefreshEnabled = (enabled: boolean): void => {
    write(ENABLED_KEY, enabled ? '1' : null);
    // once someone has made a choice, the banner has done its job
    write(BANNER_DISMISSED_KEY, '1');
    applyUiRefresh();
    notifyChange();
};

export const dismissUiRefreshBanner = (): void => {
    write(BANNER_DISMISSED_KEY, '1');
    notifyChange();
};

export const onUiRefreshChange = (callback: () => void): (() => void) => {
    window.addEventListener(CHANGED_EVENT, callback);
    return () => window.removeEventListener(CHANGED_EVENT, callback);
};

// keeps other open tabs in sync when the choice changes in one of them
const onStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === ENABLED_KEY || event.key === BANNER_DISMISSED_KEY) {
        applyUiRefresh();
        notifyChange();
    }
};

export const initUiRefresh = (): void => {
    applyUiRefresh();
    window.addEventListener('storage', onStorage);
};

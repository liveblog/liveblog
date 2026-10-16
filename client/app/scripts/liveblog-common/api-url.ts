const LOCAL_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

const isLocalHost = (host: string): boolean => LOCAL_HOSTS.indexOf(host) !== -1;

export const getApiUrl = (configuredUrl?: string): string => {
    const runtimeConfig = (window as any).superdeskConfig;
    const apiUrl = runtimeConfig?.server?.url
        || configuredUrl
        || __SUPERDESK_CONFIG__.server.url;

    try {
        const parsed = new URL(apiUrl, window.location.origin);

        if (isLocalHost(parsed.hostname) && !isLocalHost(window.location.hostname)) {
            return `${window.location.origin}/api`;
        }
    } catch (error) {
        return apiUrl;
    }

    return apiUrl;
};

import { EventNames } from './liveblog-common/constants';

interface ISettings {
    authenticated?: boolean;
    features: { [key: string]: boolean };
    limits: { [key: string]: number };
    isNetworkSubscription: boolean;
}

class FeaturesService {
    api: any;
    private settings: ISettings = null;

    constructor(api) {
        this.api = api;
    }

    async initialize(): Promise<boolean> {
        try {
            return await this.loadSettings();
        } catch (error) {
            console.warn('There has been an error fetching instance settings');
            return false;
        }
    }

    clear(): void {
        this.settings = null;
    }

    /**
     * Gets the settings from cache or loads them if not already loaded.
     * @returns A promise that resolves to the settings object.
     */
    private async loadSettings(): Promise<boolean> {
        const settings = await this.api.get('/instance_settings/current');

        if (settings?.authenticated === false) {
            return false;
        }

        this.settings = settings;
        return true;
    }

    isNetworkSubscription = () => this.settings?.isNetworkSubscription ?? false;

    /**
     * Determines if a specific feature is enabled based on the current settings.
     * If the "network" subscription is active, all features are considered enabled.
     */
    isEnabled = (featureName: string) => {
        const settings = this.settings;

        if (settings?.isNetworkSubscription) {
            return true;
        }

        return settings?.features?.[featureName] ?? false;
    }

    /**
     * Determines if the limit for a specific feature has been reached.
     * If the "network" subscription plan is active, there are no limits.
     */
    isLimitReached = (featureName: string, currentUsage: number) => {
        const settings = this.settings;

        if (settings?.isNetworkSubscription) {
            return false;
        }

        const subscriptionLimit = settings?.limits?.[featureName] ?? 0;

        return currentUsage >= subscriptionLimit;
    }

    /**
     * Determines if instance has a bandwidth limit.
     */
    isBandwidthLimitEnabled = () => {
        const settings = this.settings;

        if (settings?.isNetworkSubscription) {
            return false;
        }

        const bandwidthLimit = settings?.limits?.['bandwidth_limit'] ?? 0;

        return bandwidthLimit > 0;
    }
}

angular.module('liveblog.features', [])
    .service('featuresService', [
        'api',
        '$rootScope',
        '$timeout',
        'session',
        'SESSION_EVENTS',
        (api, $rootScope, $timeout, session, SESSION_EVENTS) => {
            const featuresService = new FeaturesService(api);

            const initializeForSession = () => {
                if (!session.token) {
                    return;
                }

                $timeout(() => featuresService.initialize());
            };

            $rootScope.$on(EventNames.InstanceSettingsUpdated, initializeForSession);
            $rootScope.$on(SESSION_EVENTS.LOGIN, initializeForSession);
            $rootScope.$on(SESSION_EVENTS.LOGOUT, () => featuresService.clear());
            session.getIdentity().then(initializeForSession);
            return featuresService;
        },
    ]);

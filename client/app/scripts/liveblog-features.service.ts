import { EventNames } from './liveblog-common/constants';

interface ISettings {
    features: { [key: string]: boolean };
    limits: { [key: string]: number };
    isNetworkSubscription: boolean;
}

class FeaturesService {
    private settings: ISettings = null;
    private config: any;

    constructor(config) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        try {
            await this.loadSettings();
        } catch (error) {
            console.warn('There has been an error fetching instance settings');
        }
    }

    clear = () => {
        this.settings = null;
    }

    /**
     * Gets the settings from cache or loads them if not already loaded.
     * @returns A promise that resolves to the settings object.
     */
    private async loadSettings(): Promise<void> {
        const token = localStorage.getItem('sess:token');

        const response = await fetch(
            this.config.server.url + '/instance_settings/current',
            { headers: { Authorization: token } }
        );

        this.settings = response.ok ? await response.json() : null;
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
    .service('featuresService', ['$rootScope', 'SESSION_EVENTS', 'config',
        ($rootScope, SESSION_EVENTS, config) => {
            const featuresService = new FeaturesService(config);

            $rootScope.$on(EventNames.InstanceSettingsUpdated, () => {
                featuresService.initialize();
            });

            $rootScope.$on(SESSION_EVENTS.LOGIN, async() => {
                await featuresService.initialize();
            });

            $rootScope.$on(SESSION_EVENTS.LOGOUT, featuresService.clear);

            featuresService.initialize();

            return featuresService;
        }]);

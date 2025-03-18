interface ISettings {
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

    async initialize(): Promise<void> {
        try {
            await this.loadSettings();
        } catch (error) {
            console.warn('There has been an error fetching instance settings');
        }
    }

    /**
     * Gets the settings from cache or loads them if not already loaded.
     * @returns A promise that resolves to the settings object.
     */
    private async loadSettings(): Promise<void> {
        this.settings = await this.api.get('/instance_settings/current');
    }

    isNetworkSubscription = () => this.settings.isNetworkSubscription;

    /**
     * Determines if a specific feature is enabled based on the current settings.
     * If the "network" subscription is active, all features are considered enabled.
     */
    isEnabled = (featureName: string) => {
        const settings = this.settings;

        if (settings.isNetworkSubscription) {
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

        if (settings.isNetworkSubscription) {
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

        if (settings.isNetworkSubscription) {
            return false;
        }

        const bandwidthLimit = settings?.limits?.['bandwidth_limit'] ?? 0;

        return bandwidthLimit > 0;
    }
}

angular.module('liveblog.features', [])
    .service('featuresService', ['api', (api) => {
        const featuresService = new FeaturesService(api);

        featuresService.initialize();
        return featuresService;
    }]);

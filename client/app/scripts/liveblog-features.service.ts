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

    /**
     * Gets the settings from cache or loads them if not already loaded.
     */
    private async getSettings(): Promise<ISettings> {
        if (!this.settings) {
            await this.loadSettings();
        }

        return this.settings!;
    }

    /**
     * Determines if a specific feature is enabled based on the current settings.
     * If the "network" subscription is active, all features are considered enabled.
     */
    isEnabled = async(featureName: string) => {
        const settings = await this.getSettings();

        if (settings.isNetworkSubscription)
            return true;

        return settings?.features[featureName] ?? false;
    }
}


angular.module('liveblog.features', [])
    .service('featuresService', ['api', (api) => {
        const featuresService = new FeaturesService(api);

        featuresService.initialize();
        return featuresService;
    }]);
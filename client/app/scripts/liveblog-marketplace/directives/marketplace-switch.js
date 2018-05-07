import marketplatplaceSwitchTpl from 'scripts/liveblog-marketplace/views/marketplace-switch.ng1';

export default function lbMarketplaceSwitch() {
    return {
        templateUrl: marketplatplaceSwitchTpl,
        scope: {
            marketEnabled: '=',
        },
    };
}

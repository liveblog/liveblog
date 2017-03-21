import marketplatplaceSwitchTpl from 'scripts/liveblog-marketplace/views/marketplace-switch.html';

export default function lbMarketplaceSwitch() {
    return {
        templateUrl: marketplatplaceSwitchTpl,
        scope: {
            marketEnabled: '='
        }
    };
}

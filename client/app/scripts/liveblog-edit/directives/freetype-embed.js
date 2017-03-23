freetypeEmbed.$inject = ['$compile'];

export default function freetypeEmbed($compile) {
    return {
        restrict: 'E',
        template: '<textarea ng-model="embed" rows="8"></textarea>',
        scope: {
            embed: '='
        }
    };
}

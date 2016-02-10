'use strict';

angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100,-W109 */
  gettextCatalog.setStrings('fr', {
  "Editorial": "Éditorial",
  "Load more posts": "Charger plus de messages",
  "Loading": "Chargement",
  "Newest first": "Le plus récent d'abord",
  "No post for now.": "Aucun message pour le moment.",
  "Oldest first": "Plus ancien en premier",
  "See one new post": [
    "Voir un nouveau poste",
    "Voir {{$count}} nouveaux messages"
  ],
  "Sort by:": "Trier par:"
});
  gettextCatalog.setStrings('ro', {
  "Editorial": "editorial",
  "Load more posts": "Încărca mai multe posturi",
  "Loading": "Se incarcă",
  "Newest first": "cele mai noi",
  "No post for now.": "Deocamdata nu sunt posturi.",
  "Oldest first": "cele mai vechi",
  "See one new post": [
    "Vezi un nou post",
    "Vezi {{$count}} posturi noi",
    "Vezi {{$count}} de posturi noi"
  ],
  "Sort by:": "Ordonează după:"
});
/* jshint +W100,+W109 */
}]);
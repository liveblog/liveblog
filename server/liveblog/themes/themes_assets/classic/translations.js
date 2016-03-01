'use strict';

angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100,-W109 */
  gettextCatalog.setStrings('cs', {
  "Editorial": "podle redakce",
  "Load more posts": "Načíst další",
  "Loading": "Načítám",
  "Newest first": "od nejnovějších",
  "No post for now.": "Zatím zde nejsou žádné příspěvky.",
  "Oldest first": "od nejstarších",
  "See one new post": [
    "Zobraz novou aktualizaci",
    "Zobraz {{$count}} nové aktualizace",
    "Zobraz {{$count}} nových aktualizací"
  ],
  "Sort by:": "Řazení:"
});
  gettextCatalog.setStrings('fr', {
  "Editorial": "Éditorial",
  "Load more posts": "Afficher plus de messages",
  "Loading": "Chargement",
  "Newest first": "Le plus récent d'abord",
  "No post for now.": "Aucun message pour le moment.",
  "Oldest first": "Plus ancien en premier",
  "See one new post": [
    "Voir le nouveau message",
    "Voir {{$count}} nouveaux messages"
  ],
  "Sort by:": "Trier par:"
});
  gettextCatalog.setStrings('ro', {
  "Editorial": "editorial",
  "Load more posts": "Încarcă mai multe posturi",
  "Loading": "Se încarcă",
  "Newest first": "Cele mai noi",
  "No post for now.": "Deocamdata nu sunt articole.",
  "Oldest first": "Cele mai vechi",
  "See one new post": [
    "Vezi un articol nou",
    "Vezi {{$count}} articole noi",
    "Vezi {{$count}} de articole noi"
  ],
  "Sort by:": "Ordonează după:"
});
/* jshint +W100,+W109 */
}]);
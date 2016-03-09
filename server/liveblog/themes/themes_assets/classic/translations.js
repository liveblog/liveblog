'use strict';

angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100,-W109 */
  gettextCatalog.setStrings('cs', {
  "Cancel": "Zrušit",
  "Comment": "Váš příspěvek",
  "Comment *": "Text *",
  "Comment should be maximum 300 characters in length.": "Maximální délka textu je 300 znaků.",
  "Editorial": "podle redakce",
  "Load more posts": "Načíst další",
  "Loading": "Načítám",
  "Name *": "Jméno *",
  "Name should be maximum 30 characters in length.": "Maximální délka jména je 30 znaků.",
  "Newest first": "od nejnovějších",
  "No post for now.": "Zatím zde nejsou žádné příspěvky.",
  "Oldest first": "od nejstarších",
  "Please fill in your Comment.": "Napište váš text.",
  "Please fill in your Name.": "Napište své jméno.",
  "Post a comment": "Otázka / komentář",
  "See one new post": [
    "Zobraz novou aktualizaci",
    "Zobraz {{$count}} nové aktualizace",
    "Zobraz {{$count}} nových aktualizací"
  ],
  "Send": "Odeslat",
  "Sort by:": "Řazení:",
  "Your comment was sent for approval.": "Váš text byl úspěšně odeslán. Čeká na schválení."
});
  gettextCatalog.setStrings('fr', {
  "Cancel": "Annuler",
  "Comment": "Commentaire",
  "Comment *": "Commentaire *",
  "Comment should be maximum 300 characters in length.": "Un commentaire ne peut excéder 300 signes",
  "Editorial": "Éditorial",
  "Load more posts": "Afficher plus de messages",
  "Loading": "Chargement",
  "Name *": "Nom *",
  "Name should be maximum 30 characters in length.": "Le nom ne peut excéder 30 signes",
  "Newest first": "Le plus récent d'abord",
  "No post for now.": "Aucun message pour le moment.",
  "Oldest first": "Plus ancien en premier",
  "Please fill in your Comment.": "Votre commentaire.",
  "Please fill in your Name.": "Votre nom.",
  "Post a comment": "Envoyer un commentaire",
  "See one new post": [
    "Voir le nouveau message",
    "Voir {{$count}} nouveaux messages"
  ],
  "Send": "Envoyer",
  "Sort by:": "Trier par:",
  "Your comment was sent for approval.": "Votre commentaire a été envoyé et est en attente de validation."
});
  gettextCatalog.setStrings('ro', {
  "Cancel": "Anulează",
  "Comment": "Comentează",
  "Comment *": "Comentariu *",
  "Comment should be maximum 300 characters in length.": "Comentariu nu poate fi mai lung de 300 de caractere.",
  "Editorial": "editorial",
  "Load more posts": "Încarcă mai multe posturi",
  "Loading": "Se încarcă",
  "Name *": "Numele *",
  "Name should be maximum 30 characters in length.": "Numele nu poate fi mai lung de 30 de caractere.",
  "Newest first": "Cele mai noi",
  "No post for now.": "Deocamdata nu sunt articole.",
  "Oldest first": "Cele mai vechi",
  "Please fill in your Comment.": "Completează comentariu.",
  "Please fill in your Name.": "Completează numele.",
  "Post a comment": "Scrie un comentariu",
  "See one new post": [
    "Vezi un articol nou",
    "Vezi {{$count}} articole noi",
    "Vezi {{$count}} de articole noi"
  ],
  "Send": "Trimite",
  "Sort by:": "Ordonează după:",
  "Your comment was sent for approval.": "Comentariul tău a fost trimis spre aprobare."
});
/* jshint +W100,+W109 */
}]);
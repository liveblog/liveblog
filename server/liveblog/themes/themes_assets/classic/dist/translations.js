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
  "Oldest first": "od nejstarších",
  "Please fill in your Comment.": "Napište váš text.",
  "Please fill in your Name.": "Napište své jméno.",
  "Post a comment": "Otázka / komentář",
  "Send": "Odeslat",
  "Sort by:": "Řazení:",
  "Your comment was sent for approval.": "Váš text byl úspěšně odeslán. Čeká na schválení."
});
  gettextCatalog.setStrings('de', {
  "Cancel": "Abbrechen",
  "Comment": "Kommentar",
  "Comment *": "Kommentar",
  "Comment should be maximum 300 characters in length.": "Kommentar darf maximal 300 Zeichen lang sein.",
  "Editorial": "Redaktionell",
  "Load more posts": "Mehr Einträge laden",
  "Loading": "Lade",
  "Name *": "Name",
  "Name should be maximum 30 characters in length.": "Name darf maximal 30 Zeichen lang sein",
  "Newest first": "Neueste zuerst",
  "No posts for now.": "Kein Beitrag vorhanden",
  "Oldest first": "Älteste zuerst",
  "One pinned post": [
    "Angehefteter Eintrag",
    "{{$count}} Angeheftete Einträge"
  ],
  "Please fill in your Comment.": "Bitte Kommentar hier eintragen",
  "Please fill in your Name.": "Bitte Namen hier eintragen",
  "Post a comment": "Kommentar posten",
  "See one new update": [
    "Neuen Beitrag anzeigen",
    "Neue Beiträge anzeigen"
  ],
  "Send": "Abschicken",
  "Show all posts": "Alle Beiträge anzeigen",
  "Show highlighted post only": "Anzeigen hervorgehoben Beitrag ist nur",
  "Sort by:": "Ordnen nach",
  "Updated {{post.content_updated_date | prettifyIsoDate}}": "Aktualisiert am {{post.content_updated_date | prettifyIsoDate}}",
  "Your comment was sent for approval.": "Ihr Kommentar wartet auf Freischaltung,",
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} kredit: {{ item.meta.credit }}"
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
  "Oldest first": "Plus ancien en premier",
  "Please fill in your Comment.": "Votre commentaire.",
  "Please fill in your Name.": "Votre nom.",
  "Post a comment": "Envoyer un commentaire",
  "Send": "Envoyer",
  "Sort by:": "Trier par:",
  "Your comment was sent for approval.": "Votre commentaire a été envoyé et est en attente de validation."
});
  gettextCatalog.setStrings('nl', {
  "Cancel": "Annuleren",
  "Comment": "Reactie",
  "Comment *": "Tekst *",
  "Comment should be maximum 300 characters in length.": "Uw reactie van maximaal 300 tekens.",
  "Editorial": "Redactioneel",
  "Load more posts": "Meer",
  "Loading": "Laden",
  "Name *": "Naam *",
  "Name should be maximum 30 characters in length.": "Uw naam kan maximaal 30 tekens lang zijn.",
  "Newest first": "Toon nieuwste eerst",
  "Oldest first": "Toon oudste eerst",
  "Please fill in your Comment.": "Uw reactie.",
  "Please fill in your Name.": "Vul hier uw naam in.",
  "Post a comment": "Schrijf een reactie",
  "Send": "Verzenden",
  "Sort by:": "Sorteer:",
  "Your comment was sent for approval.": "Uw reactie is ontvangen ter beoordeling."
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
  "Oldest first": "Cele mai vechi",
  "Please fill in your Comment.": "Completează comentariu.",
  "Please fill in your Name.": "Completează numele.",
  "Post a comment": "Scrie un comentariu",
  "Send": "Trimite",
  "Sort by:": "Ordonează după:",
  "Your comment was sent for approval.": "Comentariul tău a fost trimis spre aprobare."
});
/* jshint +W100,+W109 */
}]);
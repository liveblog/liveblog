'use strict';

angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100,-W109 */
  gettextCatalog.setStrings('cs', {
  "Advertisement": "reklama",
  "Cancel": "Zrušit",
  "Comment": "Váš příspěvek",
  "Comment *": "Text *",
  "Comment should be maximum 300 characters in length.": "Maximální délka textu je 300 znaků.",
  "Editorial": "redakční",
  "Load more posts": "Načíst další",
  "Loading": "Načítám",
  "Name *": "Jméno *",
  "Name should be maximum 30 characters in length.": "Maximální délka jména je 30 znaků.",
  "Newest first": "nejnovější",
  "No posts for now.": "Žádné příspěvky.",
  "Oldest first": "nejstarší",
  "One pinned post": [
    "Jeden připnutý příspěvek",
    "{{$count}} připnuté příspěvky",
    "{{$count}} připnutých příspěvků"
  ],
  "Please fill in your Comment.": "Napište váš text.",
  "Please fill in your Name.": "Napište své jméno.",
  "Post a comment": "Otázka / komentář",
  "See one new update": [
    "Zobraz 1 nový příspěvek",
    "Zobraz {{$count}} nové příspěvky",
    "Zobraz {{$count}} nových příspěvků"
  ],
  "Send": "Odeslat",
  "Show all posts": "Zobrazit všechny",
  "Show highlighted post only": "Zobraz jen zvýrazněné příspěvky",
  "Sort by:": "Řazení:",
  "Updated {{post.content_updated_date | prettifyIsoDate}}": "Aktualizace {{post.content_updated_date | prettifyIsoDate}}",
  "Your comment was sent for approval.": "Váš text byl úspěšně odeslán. Čeká na schválení.",
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} autor: {{ item.meta.credit }}"
});
  gettextCatalog.setStrings('de', {
  "Advertisement": "Werbung",
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
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} Bild: {{ item.meta.credit }}"
});
  gettextCatalog.setStrings('fi', {
  "Advertisement": "Mainos",
  "Cancel": "Peruuta",
  "Comment": "Kommentoi",
  "Comment *": "Kommentti *",
  "Comment should be maximum 300 characters in length.": "Kommentin enimmäispituus on 300 merkkiä.",
  "Editorial": "Toimituksellinen",
  "Load more posts": "Lataa lisää julkaisuja",
  "Loading": "Lataa",
  "Name *": "Nimi *",
  "Name should be maximum 30 characters in length.": "Nimen enimmäispituus on 30 merkkiä.",
  "Newest first": "Uusimmat ensin",
  "No posts for now.": "Ei uusia julkaisuja.",
  "Oldest first": "Vanhimmat ensin",
  "One pinned post": [
    "Yksi kiinnitetty julkaisu",
    "{{$count}} kiinnitettyä julkaisua"
  ],
  "Please fill in your Comment.": "Lisää kommenttisi.",
  "Please fill in your Name.": "Lisää nimesi.",
  "Post a comment": "Lähetä kommentti",
  "See one new update": [
    "Lataa yksi uusi julkaisu",
    "Lataa {{$count}} uutta julkaisua"
  ],
  "Send": "Lähetä",
  "Show all posts": "Näytä kaikki julkaisut",
  "Show highlighted post only": "Näytä vain korostettu julkaisu",
  "Sort by:": "Järjestä:",
  "Updated {{post.content_updated_date | prettifyIsoDate}}": "Päivitetty {{post.content_updated_date | prettifyIsoDate}}",
  "Your comment was sent for approval.": "Kommenttisi lähetettiin hyväksyttäväksi.",
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} © {{ item.meta.credit }}"
});
  gettextCatalog.setStrings('fr', {
  "Advertisement": "Publicité",
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
  "No posts for now.": "Aucun message pour le moment.",
  "Oldest first": "Plus ancien en premier",
  "One pinned post": [
    "Voir le nouveau message",
    "Voir {{$count}} nouveaux messages"
  ],
  "Please fill in your Comment.": "Votre commentaire.",
  "Please fill in your Name.": "Votre nom.",
  "Post a comment": "Envoyer un commentaire",
  "See one new update": [
    "Voir le nouveau message",
    "Voir {{$count}} nouveaux messages"
  ],
  "Send": "Envoyer",
  "Show all posts": "Afficher tous les messages",
  "Show highlighted post only": "Afficher uniquement les messages en surbrillance",
  "Sort by:": "Trier par:",
  "Updated {{post.content_updated_date | prettifyIsoDate}}": "Mise à jour {{post.content_updated_date | prettifyIsoDate}}",
  "Your comment was sent for approval.": "Votre commentaire a été envoyé et est en attente de validation.",
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} crédit: {{ item.meta.credit }}"
});
  gettextCatalog.setStrings('nl', {
  "Advertisement": "Advertentie",
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
  "No posts for now.": "Nog geen berichten beschikbaar.",
  "Oldest first": "Toon oudste eerst",
  "One pinned post": [
    "Bekijk nieuw bericht",
    "Bekijk {{$count}} nieuwe berichten"
  ],
  "Please fill in your Comment.": "Uw reactie.",
  "Please fill in your Name.": "Vul hier uw naam in.",
  "Post a comment": "Schrijf een reactie",
  "See one new update": [
    "Bekijk nieuw bericht",
    "Bekijk {{$count}} nieuwe berichten"
  ],
  "Send": "Verzenden",
  "Sort by:": "Sorteer:",
  "Your comment was sent for approval.": "Uw reactie is ontvangen ter beoordeling."
});
  gettextCatalog.setStrings('no', {
  "Advertisement": "Annonse",
  "Cancel": "Avbryt",
  "Comment": "Kommentar",
  "Comment *": "Kommentar*",
  "Comment should be maximum 300 characters in length.": "Kommentarer kan være inntil 300 tegn",
  "Editorial": "Redaksjonelt",
  "Load more posts": "Henter flere poster",
  "Loading": "Henter",
  "Name *": "Navn*",
  "Name should be maximum 30 characters in length.": "Navn kan ikke ha mer enn 30 tegn",
  "Newest first": "Nyeste først",
  "No posts for now.": "Ingen poster for øyeblikket",
  "Oldest first": "Eldste først",
  "One pinned post": [
    "Én post festet til toppen",
    "{{$count}} poster festet til toppen"
  ],
  "Please fill in your Comment.": "Skriv inn din kommentar",
  "Please fill in your Name.": "Skriv inn navn",
  "Post a comment": "Post en kommentar",
  "See one new update": [
    "Se én ny oppdatering",
    "Se {{$count}} nye oppdateringer"
  ],
  "Send": "Send",
  "Show all posts": "Vis alle poster",
  "Show highlighted post only": "Vis bare høydepunkter",
  "Sort by:": "Sortér etter:",
  "Updated {{post.content_updated_date | prettifyIsoDate}}": "Oppdatert {{post.content_updated_date | prettifyIsoDate}}",
  "Your comment was sent for approval.": "Din kommentar er sendt til godkjenning",
  "{{ item.meta.caption }} credit: {{ item.meta.credit }}": "{{ item.meta.caption }} credit: {{ item.meta.credit }}"
});
  gettextCatalog.setStrings('ro', {
  "Advertisement": "Reclamă",
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
  "No posts for now.": "Deocamdata nu sunt articole.",
  "Oldest first": "Cele mai vechi",
  "One pinned post": [
    "Vezi un articol nou",
    "Vezi {{$count}} articole noi",
    "Vezi {{$count}} de articole noi"
  ],
  "Please fill in your Comment.": "Completează comentariu.",
  "Please fill in your Name.": "Completează numele.",
  "Post a comment": "Scrie un comentariu",
  "See one new update": [
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
# Popote

Carnet de cuisine de la semaine : menus dans un budget, liste de courses rangée par rayons Lidl, suivi nutritionnel selon un profil (perte de poids, maintien, prise de masse, végétarien, vegan), frigo, placard maison et scan de ticket de caisse.

Application web installable (PWA), sans compte et sans serveur.

## Données personnelles

- Tout est enregistré **sur l'appareil** (stockage du navigateur). Rien n'est envoyé ailleurs, il n'y a ni compte, ni statistiques, ni publicité.
- La page interdit toute connexion vers un autre site (Content Security Policy). Les polices et le lecteur de tickets sont hébergés ici même.
- Le scan de ticket fonctionne **sur le téléphone** : la photo n'est jamais envoyée.
- La sauvegarde (Profil → Ma sauvegarde) produit un fichier que tu gardes toi-même. Avec un mot de passe, il est chiffré (AES-GCM, clé dérivée par PBKDF2) : sans le mot de passe, il est illisible.

## Installer sur le téléphone

1. Ouvre l'adresse du site dans Safari (iPhone) ou Chrome (Android).
2. iPhone : bouton Partager → « Sur l'écran d'accueil ». Android : menu ⋮ → « Installer l'application ».
3. Une fois installée, l'app marche aussi hors connexion.

Sur iPhone, Safari peut effacer les données d'un site non installé après quelques semaines sans visite. Installe l'app sur l'écran d'accueil et exporte une sauvegarde de temps en temps.

## Mettre à jour le site

Après une modification, change `VERSION` dans `sw.js` (par exemple `popote-5`) pour que les téléphones récupèrent la nouvelle version.

## Crédits

- Recettes et photos : [TheMealDB](https://www.themealdb.com/), traduites et adaptées en français. Usage personnel.
- Lecture des tickets : [Tesseract.js](https://github.com/naptha/tesseract.js) (licence Apache 2.0) et données de langue française de Tesseract (Apache 2.0).
- Polices : Atkinson Hyperlegible, Caveat et Fraunces (SIL Open Font License).
- Valeurs nutritionnelles moyennes de type table CIQUAL ; prix Lidl estimés, corrigeables dans l'app.

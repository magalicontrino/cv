# Version onepage — la racine du site

Le même CV, mais qui se parcourt d'un seul défilement au lieu de six écrans qui
se remplacent. **Même contenu** que la réplique servie sous `/carrd/` : mêmes textes, mêmes dates,
mêmes liens, mêmes photos. Seules la mise en page et la mécanique changent.

La parité a été vérifiée en comparant les textes des deux fichiers. Deux écarts,
tous deux assumés :

- **Apostrophes uniformisées** en apostrophe courbe (`’`). Le Carrd d'origine
  mélange les deux formes, parfois dans la même clause — « Responsable d’accueil
  des rentrées d'hébergement d’urgence ». Cinq chaînes sont concernées.
- **L'écran « Merci »** n'existe pas ici : il n'a plus lieu d'être puisque le
  formulaire passe par le logiciel de courrier (voir plus bas).

S'y ajoute l'habillage propre au format — numéros de chapitre, points de
navigation, « Haut de page » — qui n'a pas d'équivalent dans la version Carrd.

## Les visuels

**Les neuf visuels du Carrd sont tous là** : les huit photographies et le
pinceau de l'accueil, qui mène au portfolio.

| Visuel | Où | Hauteur du cadre (1440 px / mobile) |
|---|---|---|
| Pinceau (SVG) | accueil, au-dessus du nom | 28 px |
| `image01` portrait | accueil | 859 / 352 |
| `image08` · `image03` · `image06` | cartes formations | 407 / 272 |
| `image07` · `image11` · `image04` | bandes expérience | 371 / 176 |
| `image02` | intérêts | 586 / 287 |

Les cadres des cartes sont calés sur la hauteur qu'elles avaient chez Carrd
(25 rem) : les photos sont le sujet, pas un bandeau décoratif. Un premier essai
plus bas les réduisait à une bande et perdait le cadrage.

Servir le dépôt :

```
npx serve -l 4404 .
```

Le site est statique : n'importe quel serveur de fichiers fait l'affaire.

## Les deux versions

| | `/carrd/` | racine du site |
|---|---|---|
| Origine | réplique au pixel du Carrd | mise en page nouvelle |
| Navigation | six sections qui se remplacent, par le hash | un seul défilement continu |
| CSS | 1 225 règles Carrd, texte d'origine | écrit pour l'occasion, ~700 lignes |
| Poids CSS | 170 Ko | 22 Ko |
| Identité | — | polices, couleurs et casse reprises telles quelles |

Rien n'est encore décidé quant à celle qui ira sur `cv.magalicontrino.com`.
Les deux dossiers sont autonomes et prêts à publier.

## L'identité est conservée

Ce n'est pas une refonte graphique : les jetons viennent du Carrd.

- **Couleurs** — `#F2F2F2` papier, `#474747` texte, `#919191` atténué, aplats
  noirs, cartes blanches.
- **Polices** — Bai Jamjuree 700 pour le nom et les grands chiffres, Raleway 700
  en capitales très espacées pour les intitulés, Source Sans Pro 200/300/600/900
  pour le texte courant. Servies en local, mêmes sous-ensembles que la réplique.
- **Gestes typographiques** — capitales, interlettrage large sur les étiquettes,
  noms de compétences alignés à droite face à leur description.

## Les sept mécanismes

Tout est écrit à la main, sans bibliothèque, sans CDN. `app.js` fait 12 Ko.

1. **Rideau d'entrée.** Un aplat sombre au monogramme se lève d'un bloc dès que
   la page est prête (ou au bout de 1,8 s si une image traîne).
2. **Nom découpé en lettres.** Chaque lettre monte avec 28 ms de décalage. Les
   lettres sont regroupées par mot dans une boîte insécable — sans quoi
   « CONTRINO » se coupe en fin de ligne.
3. **Apparition au défilement.** Un seul motif décliné partout : le bloc monte
   de 2,2 rem et se révèle sur 1 s, courbe `cubic-bezier(.16,1,.3,1)`.
   `data-delay` échelonne les frères par crans de 90 ms.
4. **Photos démasquées.** La photo se dévoile par le bas dans son cadre
   (`clip-path`, 1,4 s), le cadre gardant sa place en aplat gris avant l'arrivée.
5. **Parallaxe.** Les photos remontent plus lentement que la page.
6. **Piste collante.** Dans l'expérience, l'intitulé du métier et sa photo
   restent au bord de l'écran pendant que les postes défilent — la lecture se
   fait par famille (design, photo, social). Se désempile sous 820 px.
7. **Jauge, points de section, défilement animé.** La courbe du défilement est
   celle du Carrd d'origine, cubique symétrique, portée à 1,1 s.

Plus les états de survol : trait qui se déroule sous les liens, fond qui monte
dans les boutons, étiquettes flottantes dans le formulaire.

## Le contenu ne dépend jamais de l'animation

C'est la règle qui a le plus pesé sur la construction. Un CV doit se lire même
quand tout va mal.

- Les états de départ (`opacity: 0`, masques) ne s'appliquent que sous
  `html.anim`, classe posée par `app.js`. **Sans JavaScript, ou si le script
  casse avant cette ligne, la page s'affiche entièrement**, simplement sans
  mouvement. Vérifié : dans une iframe privée de scripts, 4 677 caractères
  restent lisibles, le nom est visible, les cartes sont opaques, les photos
  démasquées.
- Un `<noscript>` masque le rideau, la jauge et les points.
- Le rideau se lève tout seul au bout de 5 s par une animation CSS, même si le
  script ne pose jamais `is-open`.
- Le balayage passe par `requestAnimationFrame`, doublé d'un battement de 400 ms
  qui s'arrête dès qu'il n'y a plus rien à révéler. Si l'horloge d'animation dort
  — onglet non peint, moteur qui l'a suspendue — le contenu apparaît quand même.
- `prefers-reduced-motion: reduce` neutralise tout : ni rideau, ni parallaxe, ni
  apparitions, et les états de départ sont annulés.

## Trois pièges rencontrés, et ce qu'ils ont appris

Notés parce qu'ils sont silencieux : dans les trois cas la page ne signale rien,
elle se contente d'être incomplète.

**Un élément masqué par `clip-path` est invisible à l'IntersectionObserver.**
Le masque portait d'abord sur le cadre `<figure>` observé. Or `inset(0 0 100%)`
réduit la surface rendue à zéro : l'observateur ne « voit » jamais l'élément,
donc ne le révèle jamais, donc le masque ne se lève jamais. Les photos restaient
simplement absentes. Le masque porte maintenant sur l'image ; le cadre garde sa
hauteur et son aplat, il reste observable.

**Les callbacks d'observation peuvent ne jamais arriver.** Onglet en
arrière-plan, onglet restauré, économiseur de batterie : l'observateur se tait.
Sur une page dont tout le contenu part de `opacity: 0`, cela donne une page
blanche. D'où l'abandon de l'observateur au profit d'un balayage dans la boucle
de défilement, la classe `html.anim`, et le battement de secours.

**L'amplitude d'une parallaxe doit se mesurer sur l'élément, pas sur l'écran.**
Calculée en fraction de la hauteur du viewport, une petite vignette devait être
agrandie de 44 % pour couvrir son propre déplacement — sinon le bord de l'image
découvre le cadre. En fraction de sa propre hauteur, le surdimensionnement se
déduit du taux (`1 + 2 × taux`) et vaut ~18 % pour tout le monde.

## Ce qui a été vérifié, et ce qui ne l'a pas été

Vérifié : la mise en page de chaque section à 1440 px et à 390 px, l'absence de
débordement horizontal, l'absence d'erreur console, le repli sans JavaScript, le
formulaire (URL `mailto:` construite et vérifiée, validation, page qui ne bouge
pas), la chaîne de révélation de bout en bout (les cadres photo reçoivent bien
leur classe après défilement).

**Pas vérifié à l'œil** : le rendu des animations en mouvement. Le volet
d'aperçu de cette session ne peignait pas la page, ce qui gèle les transitions
CSS et suspend `requestAnimationFrame` ; les captures montrent donc les états
finaux, pas le mouvement. Les durées, les courbes et l'enchaînement sont justes
sur le papier et l'état des classes le confirme, mais **le rendu réel des
transitions reste à regarder dans un vrai navigateur.** C'est la première chose
à faire avant de publier.

## Formulaire

Identique à la réplique : le bouton ouvre le logiciel de courrier avec le message
déjà rempli, à destination de `magalicontrino@hotmail.fr` (constante
`CONTACT_EMAIL` en fin d'`app.js`). Rien n'est envoyé à un serveur, donc rien ne
prétend avoir été reçu.

## Mise en ligne

Le dossier est autonome. Pour le publier à la place de la réplique, reprendre la
marche à suivre du [README du dépôt](README.md) : il suffit d'échanger le
contenu de la racine et celui de `carrd/`, en laissant `CNAME` et `.github/` à
la racine.

# CV — réplique de magalicontrino.carrd.co

Le CV, reconstruit en HTML/CSS/JS autonome. Aucune dépendance : ni Carrd, ni
Google Fonts, ni Cloudflare, ni CDN. Polices et images en local.

Servir le dossier :

```
npx serve -l 4403 carrd
```

Servie en ligne sous `cv.magalicontrino.com/carrd/`.

## Ce que c'est

Une page unique découpée en six sections — accueil, formations, expérience,
compétences, intérêts, contact — plus un écran de confirmation d'envoi. Une seule
est visible à la fois ; le hash décide laquelle (`#experience` →
`#experience-section`, hash vide → accueil).

| Fichier | Rôle |
|---|---|
| `index.html` | Structure d'origine conservée : mêmes `id`, mêmes classes `instance-N` — ce sont les cibles du CSS |
| `style.css` | 1 225 règles retenues sur les 2 732 de la feuille Carrd, plus les `@font-face` locaux |
| `script.js` | Le moteur Carrd réécrit, réduit à ce que la page utilise |
| `assets/images/` | Les 8 photos |
| `assets/fonts/` | Source Sans Pro, Raleway, Bai Jamjuree — latin + latin-ext, graisses employées |
| `CNAME` | `cv.magalicontrino.com` — lu par GitHub Pages |
| `.github/workflows/` | Publication du dossier sur GitHub Pages |

## Comment c'est construit

### CSS

La feuille d'origine fait 362 Ko : le CSS générique de Carrd (tous les types de
composants, tous les états de formulaire) plus une règle par « instance » de
composant. Le tri a gardé les 672 sélecteurs qui servent réellement, dans l'ordre
et le texte d'origine — pas de réécriture, pas de reformatage : la cascade est
donc identique, pas seulement équivalente.

Le tri s'est fait contre le DOM d'origine **augmenté de ses états d'exécution** :

- colonnes permutées par `data-reorder` (le clone permuté est ajouté au document
  de test) ;
- les deux variantes de `data-visibility`, desktop et mobile ;
- les classes que le moteur pose en cours de route : `is-loading`, `is-playing`,
  `is-ready`, `is-instant`, `active`, `inactive`, `loading`, `waiting`.

Sans cette précaution, des règles qui ne s'appliquent qu'après coup passaient
pour inutilisées. Une en particulier compte :
`div:first-of-type > .full:last-child` sous 980 px décide de la marge basse de
l'image d'accueil — sans elle, 1,83 px d'écart en mobile.

### JS

Le moteur d'origine fait ~45 Ko et couvre tout ce que Carrd sait produire.
`script.js` ne reprend que ce que cette page utilise, avec les mêmes durées et
les mêmes seuils :

- **entrée de page** : `is-loading` → 100 ms → `is-playing` → 1 s → `is-ready` ;
  le bloc remonte de 1,6875 rem en fondu sur 1 s ;
- **changement de section** : l'ancienne se retire en 250 ms (fondu +
  `scale(0.94375)`), la nouvelle réapparaît à 250 ms, s'anime à 325 ms sur
  500 ms, se déverrouille à 825 ms ;
- **défilement animé** : courbe cubique symétrique d'origine, 750 ms ;
- **images différées** : chaque image porte en `src` un SVG d'un seul aplat — la
  couleur moyenne de la photo, à ses dimensions. Cet aplat sert de fond au cadre,
  la vraie photo n'est demandée qu'à 250 px du viewport, puis monte à opacity 1
  en 375 ms — ou 175 ms si elle est arrivée en moins de 375 ms (cache) ;
- **`data-reorder`** (seuils 736 px / 980 px) et **`data-visibility`**, qui
  retire du DOM la variante inutilisée plutôt que de la masquer — c'est ce que
  fait l'original, et ça compte : les marges `:first-child` / `:last-child` de
  Carrd dépendent du voisinage réel ;
- **hauteur de viewport mobile** (`100svh`, sinon mesure + `orientationchange`).

Non repris : détection navigateur/OS et correctifs iOS ≤ 11 et Android, variables
Carrd, captchas, préremplissage, types de champs inutilisés.

## Fidélité vérifiée

Mesuré **avant** les modifications de contenu listées plus bas, sur une réplique
alors identique au Carrd d'origine. Relevé automatique de **194 éléments**, dans
les 6 sections. Pour chacun : position, taille, police, corps, graisse,
interlettrage, interlignage, couleur, fond, casse, alignement, padding, marges,
arrondis, opacité — plus la hauteur de chaque section et la hauteur de page
obtenue.

| Largeur | Résultat |
|---|---|
| 1440 px | 194/194 identiques |
| 980 px | 194/194 identiques |
| 736 px | 194/194 identiques |
| 375 px | 194/194 identiques |
| 360 px | 194/194 identiques |

Les cinq largeurs encadrent les quatre points de rupture de la feuille
(980, 736, 480, 360).

Côté animation, la machine à états du changement de section a été relevée pas à
pas et suit la même séquence que l'original, et les déclarations `transition`
sont celles d'origine puisque le CSS n'a pas été réécrit.

## Écarts de contenu — demandés, à relire

**Le CV n'est plus une réplique stricte.** Le contenu a été mis à jour à la
demande de Magali ; le CSS, lui, n'a pas été touché. Les lignes ajoutées
réutilisent les classes existantes, et leurs styles calculés ont été comparés un
à un à ceux des lignes voisines — identiques, en deux colonnes comme en colonne
unique.

### Bouton « cv-pdf » retiré

Il pointait vers un document Canva. Les boutons restants passent de sept à six ;
aucune règle CSS ne visait les classes `.n01`…`.n07`, qui ne sont chez Carrd que
des marqueurs de rang, donc `Contact` a simplement repris `n06`.

### Compétences informatiques

Retirées : **word** (« Editeur de texte ») et **Carrd** — cette dernière faisait
doublon avec Webflow sur « Création de site web », et le site quitte justement
Carrd.

Ajoutées : **HTML, CSS, JavaScript**, **GitHub Pages**, **Canva**.

Reformulées : *Airtable* (« Gestionnaire » → « Gestion de projets »), *Figma*
(« Outil graphique de prototypage » → « Maquettage et prototypage »), et surtout
**After Effect** et **Jitter**, qui affichaient tous deux « Création
d'animation » — désormais « Animation et effets visuels » et « Animation
d'interface ». Coquille corrigée au passage : « Dévellopement » → « Développement ».

> **À vérifier par Magali** : les trois ajouts viennent de ce que j'ai vu de son
> travail (sites écrits à la main et déployés sur GitHub Pages, PDF fait sous
> Canva), pas d'une liste qu'elle m'aurait donnée. `GitHub Pages` en particulier
> est du jargon qui peut ne rien dire à un recruteur du secteur social : à
> couper ou à renommer si besoin.

La liste existe en double dans le HTML — `#container30` (deux colonnes, desktop)
et `#container26` (colonne unique, mobile, noms et descriptions alternés). **Les
deux doivent rester synchronisées.** Attention au piège : en colonne unique les
noms sont centrés, ils reprennent donc `instance-109` et non `.style-1`, qui
aligne à droite pour la mise en page à deux colonnes.

### Poste en cours

Le CV d'origine s'arrêtait en 2022. Ajout en tête de la partie « social »,
au-dessus du bloc Samusocial existant :

> Samusocial — **Point focal opérationnel (PFO)** — 2026 - en cours
> Centre d'urgence médicalisé

Volontairement court : rien n'a été inventé comme description de missions. À
étoffer quand tu voudras, sur le modèle des blocs voisins.

## Écarts techniques assumés

- **Envoi du formulaire.** Chez Carrd, « Envoyer » fait un `POST` vers
  `/post/contact` sur leur infrastructure. En statique cette route n'existe pas,
  et le choix a été fait de ne pas dépendre d'un service tiers : le bouton ouvre
  le logiciel de courrier avec le message déjà rempli, à destination de
  `magalicontrino@hotmail.fr` (constante `CONTACT_EMAIL` en tête de la section 9
  de `script.js`). Le formulaire garde son apparence et ses garde-fous d'origine
  — piège à robots, champs obligatoires, validation du navigateur.
  Conséquence : l'écran « Merci » (`#contact-done`) n'apparaît plus tout seul.
  Il l'annoncerait à tort, puisque à ce moment-là le message n'est pas parti — il
  attend dans le logiciel de courrier qu'on appuie sur envoyer. La section reste
  en place et joignable par son hash.
- **Favicon / apple-touch-icon / image de partage.** Le site d'origine les
  référence mais les trois URL renvoient un 404. Références retirées, comme dans
  `replica/splash`.
- **Adresse e-mail.** D'origine, Cloudflare la masque dans le HTML puis la
  rétablit en clair au chargement. Ici elle est écrite directement, dans le même
  état final : texte brut, pas de lien (le site d'origine n'en fait pas un
  `mailto:`).
- **`lang="fr"`** au lieu de `lang="en"` : le contenu est en français, et le
  réglage n'a aucun effet sur le rendu.
- **Identifiants des icônes SVG** renommés (`#icon-pen`, `#icon-arrow-left` au
  lieu des empreintes MD5 de Carrd). Invisible, purement lisibilité.
- **Polices** : seuls les sous-ensembles latin et latin-ext sont embarqués, en
  style normal, et uniquement les graisses employées (Source Sans Pro 200/300/
  600/900, Raleway 300/700, Bai Jamjuree 700). Le site d'origine demandait aussi
  les italiques, le cyrillique, le grec, le thaï et le vietnamien, qu'aucune
  règle n'utilise. Raleway est servie par Google en fonte variable : un seul
  fichier par sous-ensemble couvre les deux graisses.

## Mise en ligne sur cv.magalicontrino.com

GitHub Pages n'accepte qu'un domaine personnalisé par dépôt : le sous-domaine ne
peut pas vivre dans `magalicontrino/portfolio`, il lui faut le sien. Le dossier
est prêt à devenir la racine de ce dépôt — `CNAME` et workflow inclus.

1. Créer le dépôt **`magalicontrino/cv`** sur GitHub, vide.
2. Depuis ce dossier :
   ```
   git init && git add . && git commit -m "CV : réplique du Carrd"
   git branch -M main
   git remote add origin https://github.com/magalicontrino/cv.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source = GitHub Actions**. Le `CNAME` à la
   racine renseigne le domaine tout seul.
4. Chez **GoDaddy**, ajouter un enregistrement :
   `CNAME` · nom `cv` · valeur `magalicontrino.github.io`
   Ne pas toucher aux quatre `A` de `@` (magalicontrino.com) ni à la ligne
   `cavadaliga`.
5. Attendre la propagation DNS, puis cocher **Enforce HTTPS** dans Settings →
   Pages une fois que GitHub a émis le certificat.

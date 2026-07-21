# cv.magalicontrino.com

Le CV de Magali Contrino, en deux versions à contenu identique.

| URL | Dossier | Ce que c'est |
|---|---|---|
| `cv.magalicontrino.com` | racine | **Version onepage** — tout le CV en un seul défilement — [détails](onepage.md) |
| `cv.magalicontrino.com/carrd/` | `carrd/` | **Réplique du Carrd d'origine** — six écrans qui se remplacent — [détails](carrd/README.md) |

Les deux sont autonomes : ni Carrd, ni Google Fonts, ni Cloudflare, ni CDN.
Polices et images en local, aucune requête vers l'extérieur.

Garder les deux en ligne permet de les comparer en vrai avant de trancher. Pour
intervertir, échanger le contenu de la racine et celui de `carrd/`, en laissant
`CNAME` et `.github/` à la racine.

## Contenu

Identique dans les deux versions, et à jour :

- **Poste en cours** — Samusocial, Point focal opérationnel (PFO), 2026 - en
  cours, Centre d'urgence médicalisé.
- **Compétences** — 13 lignes. Retirées : *word* et *Carrd* (qui faisait doublon
  avec Webflow). Ajoutées : *HTML, CSS, JavaScript*, *GitHub Pages*, *Canva*.
- **Bouton « cv-pdf »** retiré : il pointait vers un document Canva.

Le formulaire de contact n'envoie rien à un serveur — il ouvre le logiciel de
courrier avec le message déjà rempli. L'écran « Merci » du Carrd n'est donc plus
atteint automatiquement : il annoncerait à tort que le message est parti.

## Publication

GitHub Pages, via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Le site est statique : rien à construire, le dépôt est téléversé tel quel à
chaque poussée sur `main`.

À régler une fois côté GitHub : **Settings → Pages → Source = GitHub Actions**.
Le domaine vient du fichier [`CNAME`](CNAME) à la racine.

Côté DNS (GoDaddy), un seul enregistrement à ajouter :

```
Type    CNAME
Nom     cv
Valeur  magalicontrino.github.io
```

Ne pas toucher aux quatre enregistrements `A` de `@`, qui servent
magalicontrino.com, ni à la ligne `cavadaliga`.

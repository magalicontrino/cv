# cv.magalicontrino.com

Le CV de Magali Contrino, en une page qui se parcourt d'un seul défilement.
[Détails de la construction](onepage.md).

Le site est autonome : ni Carrd, ni Google Fonts, ni Cloudflare, ni CDN. Polices
et images en local, aucune requête vers l'extérieur.

Il a remplacé `magalicontrino.carrd.co`. Une réplique au pixel de ce Carrd a
vécu un temps sous `/carrd/`, le temps de comparer les deux en vrai ; elle a été
retirée le 21 juillet 2026, la onepage l'ayant emporté. Elle reste dans
l'historique git (`git show 90a4068:carrd/index.html`) et dans
`~/Downloads/site mag/replica/cv`.

## Contenu

À jour par rapport au Carrd d'origine :

- **Poste en cours** — Samusocial, Point focal opérationnel (PFO), 2026 - en
  cours, Centre d'urgence médicalisé.
- **Compétences** — 13 lignes. Retirées : *word* et *Carrd* (qui faisait doublon
  avec Webflow). Ajoutées : *HTML, CSS, JavaScript*, *GitHub Pages*, *Canva*.
- **Bouton « cv-pdf »** retiré : il pointait vers un document Canva.

Le formulaire de contact n'envoie rien à un serveur — il ouvre le logiciel de
courrier avec le message déjà rempli. L'écran « Merci » du Carrd n'a donc pas
été repris : il annoncerait à tort que le message est parti.

## Publication

GitHub Pages, via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Le site est statique : rien à construire, le dépôt est téléversé tel quel à
chaque poussée sur `main`.

Réglé côté GitHub : **Settings → Pages → Source = GitHub Actions**. Le domaine
vient du fichier [`CNAME`](CNAME) à la racine.

Côté DNS (GoDaddy), l'enregistrement est en place :

```
Type    CNAME
Nom     cv
Valeur  magalicontrino.github.io
```

Ne pas toucher aux quatre enregistrements `A` de `@`, qui servent
magalicontrino.com, ni à la ligne `cavadaliga`.

Reste à cocher **Enforce HTTPS** dans Settings → Pages : `http://` sert encore
la page directement au lieu de rediriger.

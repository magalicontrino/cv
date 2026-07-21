/* ============================================================================
   Magali Contrino — CV onepage
   ----------------------------------------------------------------------------
   Aucune dépendance. Tout le mouvement tient en six mécanismes :

     1. découpe du titre en lettres
     2. rideau d'entrée
     3. apparition au défilement (IntersectionObserver)
     4. parallaxe des photos (une seule boucle rAF partagée)
     5. jauge de progression + point de section actif + fond clair/sombre
     6. défilement animé vers les ancres, courbe du site d'origine

   Tout est court-circuité si le système demande moins de mouvement : dans ce
   cas le script ne pose aucun état de départ et laisse le CSS afficher la page
   telle quelle.
   ============================================================================ */

(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. Découpe du titre en lettres
     Chaque lettre devient un span portant son rang (--i), que le CSS traduit en
     retard. Les espaces deviennent des blocs de largeur fixe pour que le mot ne
     se recolle pas. L'intitulé complet reste lisible par les lecteurs d'écran
     grâce à aria-label.
     ========================================================================== */

  $$('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';

    var i = 0;
    text.split(/\s+/).forEach(function (word, w) {
      // Chaque mot est une boîte insécable : sans ça, des lettres en
      // inline-block se coupent n'importe où et « CONTRINO » se retrouve
      // scindé en fin de ligne.
      var box = document.createElement('span');
      box.className = 'split-word';
      box.setAttribute('aria-hidden', 'true');

      word.split('').forEach(function (ch) {
        var span = document.createElement('span');
        span.className = 'split-char';
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        box.appendChild(span);
      });

      if (w > 0) el.appendChild(document.createTextNode(' '));
      el.appendChild(box);
    });
  });

  /* ==========================================================================
     2. Rideau d'entrée
     Il se lève dès que la page est prête — ou au bout de 1,8 s si une image
     traîne, pour ne jamais retenir quelqu'un devant un écran noir.
     ========================================================================== */

  var opened = false;

  function open() {
    if (opened) return;
    opened = true;
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-open');
    // Le premier écran s'anime dès l'ouverture, sans attendre le défilement ;
    // le reste reprend son cours normal au balayage suivant.
    reveal($('#intro'));
    onScroll();
  }

  if (reduced) {
    document.body.classList.add('is-open');
  } else {
    document.body.classList.add('is-locked');
    addEventListener('load', function () { setTimeout(open, 220); });
    setTimeout(open, 1800);
  }

  /* ==========================================================================
     3. Apparition au défilement

     Le contrôle se fait dans la boucle de défilement, pas avec un
     IntersectionObserver. Deux raisons, apprises en construisant la page :

       — un élément masqué par `clip-path: inset(0 0 100%)` a une surface rendue
         nulle, donc l'observateur ne le « voit » jamais et ne le révèle jamais.
         Le piège est silencieux : la photo reste simplement absente ;
       — les callbacks de l'observateur peuvent être différés (onglet en
         arrière-plan, onglet restauré, économiseur de batterie). Sur un CV,
         cela veut dire une page blanche.

     Ici, tant qu'il reste des éléments à révéler on teste leur rectangle à
     chaque image ; la liste se vide au fur et à mesure, le coût tend vers zéro.

     Filet de sécurité complémentaire : les états de départ ne s'appliquent que
     sous `html.anim`, classe posée par ce script. Si le JS ne s'exécute pas ou
     échoue avant cette ligne, le CV s'affiche entièrement, sans animation.
     ========================================================================== */

  // `[data-split]` compte parmi les cibles : il ne bouge pas lui-même, mais
  // c'est sa classe `is-in` qui déclenche la montée de ses lettres.
  var SELECTOR = '[data-reveal], [data-unmask], [data-split]';

  var pending = $$(SELECTOR);

  pending.forEach(function (el) {
    var d = parseInt(el.getAttribute('data-delay'), 10);
    if (d) el.style.setProperty('--d', 'calc(' + d + ' * var(--step))');
  });

  if (!reduced) document.documentElement.classList.add('anim');

  function reveal(scope) {
    if (!scope) return;
    var inside = $$(SELECTOR, scope);
    if (scope.matches && scope.matches(SELECTOR)) inside.push(scope);
    inside.forEach(function (el) {
      el.classList.add('is-in');
      var i = pending.indexOf(el);
      if (i !== -1) pending.splice(i, 1);
    });
  }

  function sweep(vh) {
    // Rien ne se révèle tant que le rideau est là : sinon l'entrée du premier
    // écran se joue derrière lui et personne ne la voit.
    if (!opened) return;

    for (var i = pending.length - 1; i >= 0; i--) {
      var r = pending[i].getBoundingClientRect();
      // On déclenche un peu avant le bas de l'écran : le mouvement a le temps
      // de se finir pendant que l'élément monte.
      if (r.top < vh * 0.88 && r.bottom > 0) {
        pending[i].classList.add('is-in');
        pending.splice(i, 1);
      }
    }
  }

  /* ==========================================================================
     4. Parallaxe
     Les photos remontent plus lentement que la page. Un seul rAF pour tout le
     monde, uniquement sur les images visibles, et rien d'autre que `transform`
     — donc pas de recalcul de mise en page.
     ========================================================================== */

  var parallax = $$('[data-parallax]').map(function (img) {
    return {
      el: img,
      // On mesure le CADRE, pas l'image : l'image est justement ce qu'on
      // déplace, lire sa position reviendrait à se mordre la queue.
      frame: img.parentElement,
      rate: parseFloat(img.getAttribute('data-parallax')) || 0.1,
      visible: false,
      amp: 0,
      scale: 1
    };
  });

  /* L'amplitude est une fraction de la hauteur de l'image, pas de celle de
     l'écran : sinon une petite vignette devrait être agrandie de moitié pour
     couvrir le même déplacement qu'une grande photo. Le surdimensionnement se
     déduit du taux — il couvre exactement la course, plus 2 % de marge. */
  function measure() {
    parallax.forEach(function (p) {
      p.amp = p.frame.getBoundingClientRect().height * p.rate;
      p.scale = 1 + 2 * p.rate + 0.02;
      p.el.style.transform = 'translate3d(0,0,0) scale(' + p.scale.toFixed(4) + ')';
    });
  }

  if (!reduced && parallax.length) {
    measure();
    addEventListener('resize', measure);
    addEventListener('load', measure);
  }

  /* ==========================================================================
     5. Jauge, section active, inversion de la navigation
     ========================================================================== */

  var bar = $('.progress__bar');
  var dots = $('.dots');
  var dotLinks = $$('.dots a');
  var sections = dotLinks.map(function (a) { return $(a.getAttribute('href')); });
  var darkSections = $$('.chapter--dark');
  var toTop = $('.totop');

  // Y a-t-il une section sombre à cette hauteur de l'écran ?
  function darkAt(y) {
    return darkSections.some(function (s) {
      var r = s.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
  }

  function frame() {
    var vh = innerHeight;

    if (!reduced && pending.length) sweep(vh);

    // Jauge : part de la position réelle, pas d'un compteur qui dérive.
    if (bar) {
      var max = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
    }

    // Parallaxe. `progress` vaut -1 quand le cadre entre par le bas, +1 quand
    // il sort par le haut ; l'image parcourt donc au plus ±amp, ce que le
    // surdimensionnement calculé dans measure() couvre exactement.
    if (!reduced) {
      parallax.forEach(function (p) {
        var r = p.frame.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;  // hors champ : on passe
        var span = (vh + r.height) / 2;
        var progress = span > 0 ? (r.top + r.height / 2 - vh / 2) / span : 0;
        if (progress > 1) progress = 1; else if (progress < -1) progress = -1;
        p.el.style.transform =
          'translate3d(0,' + (progress * p.amp).toFixed(2) + 'px,0) scale(' + p.scale.toFixed(4) + ')';
      });
    }

    // Section active : celle qui occupe le tiers haut de l'écran.
    var line = vh * 0.34;
    var current = 0;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= line) current = i;
    });
    dotLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });

    // Les commandes du bord droit s'inversent au-dessus des sections sombres.
    // On teste les rectangles plutôt que elementFromPoint, qui tombe sur la
    // barre de défilement au bord droit et force un recalcul de style à chaque
    // image. Chacune est jaugée à SA hauteur : les points sont au milieu, la
    // flèche en bas, elles ne survolent donc pas forcément la même section.
    if (dots) dots.classList.toggle('on-dark', darkAt(vh / 2));

    // La visibilité de la flèche est traitée hors de cette boucle (voir
    // showToTop) ; ici on ne règle que son contraste, qui demande de mesurer
    // les sections.
    if (toTop) toTop.classList.toggle('on-dark', darkAt(vh - 48));

    ticking = false;
  }

  // La flèche apparaît une fois le premier écran passé — au-dessus, le haut de
  // page est déjà là. Réglée directement dans le gestionnaire de défilement, et
  // non dans la boucle d'animation : c'est une simple comparaison, sans lecture
  // de mise en page, et Safari iOS suspend requestAnimationFrame pendant le
  // défilement inertiel. La flèche répond donc même à ce moment-là.
  function showToTop() {
    if (toTop) toTop.classList.toggle('is-visible', scrollY > innerHeight * 0.6);
  }

  var ticking = false;
  function onScroll() {
    showToTop();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // Un onglet caché suspend requestAnimationFrame. Sans ces deux rattrapages,
  // revenir sur l'onglet — ou revenir en arrière depuis une autre page — laisse
  // à l'écran ce qui n'avait pas encore été révélé, jusqu'au prochain
  // défilement. On repasse donc une fois dès que la page redevient visible.
  addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') onScroll();
  });
  addEventListener('pageshow', onScroll);
  addEventListener('load', onScroll);

  onScroll();

  // Dernier filet. Le balayage passe normalement par requestAnimationFrame ;
  // si celui-ci ne tourne pas (onglet non peint, moteur qui l'a suspendu), un
  // battement lent garantit quand même que le contenu apparaît. Il s'arrête de
  // lui-même dès qu'il n'y a plus rien à révéler, donc il ne coûte rien sur la
  // durée. Un CV ne doit jamais rester invisible parce qu'une horloge dort.
  if (!reduced) {
    var heartbeat = setInterval(function () {
      if (!pending.length) { clearInterval(heartbeat); return; }
      sweep(innerHeight);
    }, 400);
  }

  /* ==========================================================================
     6. Défilement animé vers les ancres
     Même courbe que le Carrd d'origine — cubique symétrique, 750 ms — pour que
     les deux versions du CV se déplacent de la même façon. Portée à 1,1 s ici,
     les distances étant plus grandes sur une page continue.
     ========================================================================== */

  function scrollToY(y, duration) {
    var start = Date.now();
    var from = scrollY;
    var delta = y - from;
    var ease = function (t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };
    (function step() {
      var t = Date.now() - start;
      if (t >= duration) { scrollTo(0, y); return; }
      scrollTo(0, from + delta * ease(t / duration));
      requestAnimationFrame(step);
    })();
  }

  addEventListener('click', function (event) {
    var a = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!a) return;

    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;

    var target = $(id);
    if (!target) return;

    event.preventDefault();
    history.replaceState(null, '', id);

    if (reduced) { target.scrollIntoView(); return; }
    scrollToY(target.getBoundingClientRect().top + scrollY, 1100);
  });

  /* ==========================================================================
     7. Formulaire — ouvre le logiciel de courrier
     Même comportement que la réplique : rien n'est envoyé à un serveur, donc
     rien ne prétend avoir été reçu.
     ========================================================================== */

  var CONTACT_EMAIL = 'magalicontrino@hotmail.fr';

  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var name = form.elements['name'].value.trim();
      var email = form.elements['email'].value.trim();
      var message = form.elements['message'].value.trim();

      var subject = name ? 'Message de ' + name : 'Message depuis le CV';
      var body = message + '\n\n—\n' + name + '\n' + email;

      location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  }

})();

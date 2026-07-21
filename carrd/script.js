/* ============================================================================
   CV Magali Contrino — réplique de magalicontrino.carrd.co
   ----------------------------------------------------------------------------
   Le moteur d'origine fait ~45 Ko et couvre tous les composants que Carrd sait
   produire (galeries, vidéos, variables, captchas, cinq types de champs de
   formulaire…). Cette page n'en utilise qu'une petite part. Ce fichier reprend
   uniquement cette part, avec les mêmes durées, les mêmes seuils et le même
   enchaînement que l'original — le reste n'a pas été repris.

   Ce qui est reproduit :
     1. entrée de page (is-loading → is-playing → is-ready)
     2. navigation entre sections par le hash, avec fondu/échelle
     3. défilement animé (courbe d'origine)
     4. chargement différé des images, avec aplat de couleur puis fondu
     5. réagencement des colonnes (data-reorder) et variantes desktop/mobile
        (data-visibility)
     6. hauteur de viewport réelle sur mobile
     7. formulaire de contact : piège à robots, validation, état d'attente

   Ce qui n'est PAS repris : la détection navigateur/OS (correctifs iOS ≤ 11,
   Android), les variables Carrd, les captchas, le préremplissage.
   L'envoi du formulaire est le seul écart de comportement — voir section 9.
   ============================================================================ */

(function () {
  'use strict';

  var $ = function (q) { return document.querySelector(q); };
  var $$ = function (q) { return document.querySelectorAll(q); };
  var $body = document.body;

  /* ==========================================================================
     1. Entrée de page
     Trois états successifs sur <body>. `.is-loading .site-main` met le bloc à
     opacity 0 / translateY(1.6875rem) ; le retrait de la classe le laisse
     revenir en 1 s (transition portée par `.site-main`).
     ========================================================================== */

  addEventListener('load', function () {
    setTimeout(function () {
      $body.classList.remove('is-loading');
      $body.classList.add('is-playing');
      setTimeout(function () {
        $body.classList.remove('is-playing');
        $body.classList.add('is-ready');
      }, 1000);
    }, 100);
  });

  /* ==========================================================================
     2. Défilement animé
     Courbe d'origine : cubique symétrique (accélère puis freine), 750 ms.
     ========================================================================== */

  function scrollToElement(e, style, duration) {
    var y = e ? e.offsetTop : 0;
    if (!style) style = 'smooth';
    if (!duration) duration = 750;

    if (style === 'instant') { window.scrollTo(0, y); return; }

    var start = Date.now();
    var cy = window.scrollY;
    var dy = y - cy;
    var easing = function (t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };
    (function step() {
      var t = Date.now() - start;
      if (t >= duration) window.scroll(0, y);
      else {
        window.scroll(0, cy + dy * easing(t / duration));
        requestAnimationFrame(step);
      }
    })();
  }

  /* ==========================================================================
     3. Navigation entre sections
     Une seule section est visible à la fois. Le hash choisit laquelle :
     `#formation` → `#formation-section`, hash vide → `#home-section`.

     Chronologie d'un changement (identique à l'original) :
       t=0     l'ancienne section prend `.inactive` → fondu + scale(0.94375)
               sur 250 ms, et on décharge ses éléments
       t=250   l'ancienne passe en display:none, la nouvelle réapparaît,
               on remonte en haut instantanément
       t=325   la nouvelle perd `.inactive` → fondu + échelle sur 500 ms,
               démarrés après 250 ms de retard (voir la transition CSS)
       t=825   ses éléments sont chargés, la navigation se déverrouille
     ========================================================================== */

  var title = document.title;
  var locked = false;

  function loadElements(parent) {
    // Les seuls éléments « chargeables » de cette page sont les images
    // différées : elles sont pilotées par scrollEvents, il suffit de
    // réévaluer la visibilité une fois la section affichée.
    scrollEvents.handler();
    var autofocus = parent.querySelector('[data-autofocus="1"]');
    if (autofocus) {
      var field = autofocus.querySelector('.field input, .field select, .field textarea');
      if (field) field.focus();
    }
  }

  function unloadElements() {
    var focused = $(':focus');
    if (focused) focused.blur();
  }

  function activateSection(section) {
    if (!section.classList.contains('inactive')) {
      // Déjà à l'écran : on se contente de remonter.
      scrollToElement(null);
      return;
    }

    locked = true;
    if (location.hash === '#home') history.replaceState(null, null, '#');

    var current = $('section:not(.inactive)');
    if (current) {
      current.classList.add('inactive');
      document.title = title;
      unloadElements();
      setTimeout(function () {
        current.style.display = 'none';
        current.classList.remove('active');
      }, 250);
    }

    setTimeout(function () {
      section.style.display = '';
      dispatchEvent(new Event('resize'));
      scrollToElement(null, 'instant');
      setTimeout(function () {
        section.classList.remove('inactive');
        section.classList.add('active');
        setTimeout(function () {
          loadElements(section);
          locked = false;
        }, 500);
      }, 75);
    }, 250);
  }

  function thisHash() {
    var h = location.hash ? location.hash.substring(1).toLowerCase() : null;
    return h && /^[a-z0-9-]+$/.test(h) ? h : null;
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var initialSection = $('#' + (thisHash() || 'home') + '-section');
  if (!initialSection) {
    // Hash inconnu : on retombe sur l'accueil et on nettoie l'URL.
    initialSection = $('#home-section');
    history.replaceState(undefined, undefined, '#');
  }

  // Tout sauf la section d'arrivée démarre masquée.
  $$('.site-main > .inner > section').forEach(function (s) {
    if (s === initialSection) return;
    s.className = 'inactive';
    s.style.display = 'none';
  });
  initialSection.classList.add('active');

  addEventListener('hashchange', function () {
    if (locked) return;
    var h = thisHash();
    var section = $('#' + (h || 'home') + '-section');
    if (!section) {
      section = $('#home-section');
      history.replaceState(undefined, undefined, '#');
    }
    activateSection(section);
  });

  // Recliquer sur le lien de la section courante : on remet le hash à zéro
  // puis on le repose, pour que `hashchange` reparte (et remonte en haut).
  addEventListener('click', function (event) {
    var t = event.target;
    while (t && t.tagName !== 'A') t = t.parentElement;
    if (!t) return;
    var href = t.getAttribute('href');
    if (href && href.charAt(0) === '#' && t.hash === window.location.hash) {
      event.preventDefault();
      history.replaceState(undefined, undefined, '#');
      location.replace(t.hash);
    }
  });

  /* ==========================================================================
     4. Hauteur de viewport sur mobile
     `--viewport-height` sert de min-height au site. Sur mobile la barre
     d'adresse fausse 100vh : on prend 100svh quand le navigateur sait le
     faire, sinon la hauteur mesurée, remise à jour à chaque rotation.
     ========================================================================== */

  var isMobile = /Android|iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && 'ontouchstart' in window);

  if (isMobile) {
    var probe = document.createElement('div');
    var supportsSvh = 'width' in probe.style && (probe.style.width = '100dvw', probe.style.width !== '');

    if (supportsSvh) {
      document.documentElement.style.setProperty('--viewport-height', '100svh');
      document.documentElement.style.setProperty('--background-height', '100lvh');
    } else {
      var measure = function () {
        document.documentElement.style.setProperty('--viewport-height', window.innerHeight + 'px');
        document.documentElement.style.setProperty('--background-height', (window.innerHeight + 250) + 'px');
      };
      addEventListener('load', measure);
      addEventListener('orientationchange', function () { setTimeout(measure, 100); });
    }
    $body.classList.add('touch');
  }

  /* ==========================================================================
     5. Réagencement des colonnes (data-reorder)
     `data-reorder="1,0"` : sous le point de rupture, les colonnes passent dans
     l'ordre 1 puis 0 — l'image du bandeau d'accueil repasse au-dessus du texte.
     `data-reorder-breakpoint` choisit le seuil : medium = 980 px, sinon 736 px.
     ========================================================================== */

  (function () {
    var breakpoints = { small: '(max-width: 736px)', medium: '(max-width: 980px)' };

    $$('[data-reorder]').forEach(function (e) {
      var query = breakpoints[e.dataset.reorderBreakpoint] || breakpoints.small;
      var desktop = [];
      var mobile = [];
      var reordered = false;

      Array.prototype.forEach.call(e.childNodes, function (child) {
        if (child.nodeType === 1) desktop.push(child);
      });
      e.dataset.reorder.split(',').forEach(function (i) {
        mobile.push(desktop[parseInt(i, 10)]);
      });

      var apply = function () {
        if (matchMedia(query).matches) {
          if (reordered) return;
          reordered = true;
          mobile.forEach(function (c) { e.appendChild(c); });
        } else {
          if (!reordered) return;
          reordered = false;
          desktop.forEach(function (c) { e.appendChild(c); });
        }
      };

      addEventListener('resize', apply);
      addEventListener('orientationchange', apply);
      addEventListener('load', apply);
      apply();
    });
  })();

  /* ==========================================================================
     6. Variantes desktop / mobile (data-visibility)
     Les compétences et les langues existent en deux blocs distincts. Celui qui
     ne sert pas est retiré du DOM (pas seulement masqué) : c'est ce que fait
     l'original, et ça compte — les marges `:first-child` / `:last-child` de
     Carrd dépendent du voisinage réel.
     ========================================================================== */

  (function () {
    $$('[data-visibility]').forEach(function (e) {
      var parent = e.parentElement;
      var removed = false;

      // Point de réinsertion : le premier frère qui n'est pas lui-même
      // conditionnel, pour retrouver la place exacte.
      var anchor = null;
      for (var n = e.nextSibling; n; n = n.nextSibling) {
        if (n.nodeType !== 1) continue;
        if (!n.dataset.visibility) { anchor = n; break; }
      }

      var query = e.dataset.visibility === 'mobile' ? '(min-width: 737px)'
        : e.dataset.visibility === 'desktop' ? '(max-width: 736px)'
        : null;
      if (!query) return;

      var apply = function () {
        if (matchMedia(query).matches) {
          if (removed) return;
          removed = true;
          parent.removeChild(e);
        } else {
          if (!removed) return;
          removed = false;
          parent.insertBefore(e, anchor);
        }
      };

      addEventListener('resize', apply);
      addEventListener('orientationchange', apply);
      addEventListener('load', apply);
      apply();
    });
  })();

  /* ==========================================================================
     7. Déclencheurs au défilement
     Reprise du mode 4 de l'original — le seul utilisé ici. Un élément est
     « dedans » dès qu'il chevauche le viewport rétréci de 25 % en haut et en
     bas, avec 250 px de marge d'avance pour les images. Les extrémités de la
     page sont traitées à part pour que le premier et le dernier élément
     puissent toujours se déclencher.
     ========================================================================== */

  var scrollEvents = {
    items: [],

    add: function (o) {
      this.items.push({
        element: o.element,
        enter: o.enter || null,
        threshold: 'threshold' in o ? o.threshold : 0.25,
        offset: 'offset' in o ? o.offset : 0,
        state: false
      });
    },

    handler: function () {
      var height = document.documentElement.clientHeight;
      var top = document.documentElement.scrollTop;
      var bottom = top + height;

      scrollEvents.items.forEach(function (item) {
        if (!item.enter) return;
        if (item.element.offsetParent === null) return; // section masquée

        var bcr = item.element.getBoundingClientRect();
        var elementTop = top + Math.floor(bcr.top);
        var elementBottom = elementTop + bcr.height;

        var pad = height * item.threshold;
        var viewportTop = top + pad;
        var viewportBottom = bottom - pad;
        if (Math.floor(top) <= pad) viewportTop = top;
        if (Math.ceil(bottom) >= document.body.scrollHeight - pad) viewportBottom = bottom;

        elementTop -= item.offset;
        elementBottom += item.offset;

        var state;
        if (viewportBottom - viewportTop >= elementBottom - elementTop) {
          state = (elementTop >= viewportTop && elementBottom <= viewportBottom) ||
            (elementTop >= viewportTop && elementTop <= viewportBottom) ||
            (elementBottom >= viewportTop && elementBottom <= viewportBottom);
        } else {
          state = (viewportTop >= elementTop && viewportBottom <= elementBottom) ||
            (elementTop >= viewportTop && elementTop <= viewportBottom) ||
            (elementBottom >= viewportTop && elementBottom <= viewportBottom);
        }

        if (state && !item.state) {
          item.state = true;
          item.enter.apply(item.element);
          item.enter = null; // une seule fois
        }
      });
    },

    init: function () {
      addEventListener('load', this.handler);
      addEventListener('resize', this.handler);
      addEventListener('scroll', this.handler);
      this.handler();
    }
  };

  scrollEvents.init();

  /* ==========================================================================
     8. Chargement différé des images
     Chaque image porte en `src` un SVG d'un seul aplat : la couleur moyenne de
     la photo, aux dimensions de la photo. Cet aplat est posé en fond du cadre,
     l'image passe à opacity 0, et la vraie photo n'est demandée qu'à l'approche
     du viewport. Au `load` elle remonte à 1 en 375 ms — ou 175 ms si elle est
     arrivée en moins de 375 ms (cache) : l'original raccourcit le fondu quand
     l'attente a été courte.
     ========================================================================== */

  (function () {
    var DURATION = 375;
    var DURATION_FAST = 175;

    function onLoad() {
      var img = this;
      var frame = img.parentElement;
      var duration = DURATION;

      if (img.dataset.src !== 'done') return;
      if (Date.now() - img._startLoad < DURATION) duration = DURATION_FAST;

      img.style.transitionDuration = (duration / 1000) + 's';
      frame.classList.remove('loading');
      img.style.opacity = 1;

      setTimeout(function () {
        frame.style.backgroundImage = 'none';
        img.style.transitionProperty = '';
        img.style.transitionTimingFunction = '';
        img.style.transitionDuration = '';
      }, duration);
    }

    function onEnter() {
      var img = this;
      var src = img.dataset.src;
      img.dataset.src = 'done';
      img.parentElement.classList.add('loading');
      img._startLoad = Date.now();
      img.src = src;
    }

    $$('.deferred').forEach(function (frame) {
      var img = frame.firstElementChild;

      frame.style.backgroundImage = 'url(' + img.src + ')';
      frame.style.backgroundSize = '100% 100%';
      frame.style.backgroundPosition = 'top left';
      frame.style.backgroundRepeat = 'no-repeat';

      img.style.opacity = 0;
      img.style.transitionProperty = 'opacity';
      img.style.transitionTimingFunction = 'ease-in-out';
      img.addEventListener('load', onLoad);

      scrollEvents.add({ element: img, enter: onEnter, offset: 250 });
    });
  })();

  /* ==========================================================================
     9. Formulaire de contact — écart assumé

     Chez Carrd, « Envoyer » fait un POST vers /post/contact sur leur
     infrastructure. En statique cette route n'existe pas, et le choix a été fait
     de ne pas passer par un service de formulaire tiers : le bouton ouvre le
     logiciel de courrier avec le message déjà rempli.

     Le formulaire garde son apparence et ses garde-fous d'origine — piège à
     robots, champs obligatoires, validation du navigateur. Ce qui change :
     l'écran « Merci » n'apparaît plus tout seul après l'envoi. Il l'annoncerait
     à tort, puisque à ce moment-là le message n'est pas parti : il attend dans
     le logiciel de courrier que la personne appuie sur envoyer.
     ========================================================================== */

  var CONTACT_EMAIL = 'magalicontrino@hotmail.fr';

  (function () {
    var form = $('#form02');
    if (!form) return;

    var submit = form.querySelector('.actions button[type="submit"]');

    // Piège à robots : champ visible pour un script, désactivé et masqué ici.
    // Un envoi qui le remplit vient forcément d'un robot.
    var honeypot = form.querySelector('input[name="post-url"]');
    if (honeypot) {
      honeypot.disabled = true;
      honeypot.parentNode.style.display = 'none';
    }

    submit.disabled = false;

    function field(name) {
      var e = form.elements[name];
      return e && e.value ? e.value.trim() : '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (!form.reportValidity()) return;

      var name = field('name');
      var email = field('email');
      var message = field('message');

      var subject = name ? 'Message de ' + name : 'Message depuis le CV';
      var body = message + '\n\n—\n' + name + '\n' + email;

      location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });

    // Ctrl+Entrée envoie depuis n'importe quel champ.
    form.addEventListener('keydown', function (event) {
      if (event.keyCode === 13 && event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();
        if (!submit.disabled) form.requestSubmit();
      }
    });
  })();

})();

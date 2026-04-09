/* ============================================================
   CODE NEURON ACADEMY — script.js  v2
   Features:
   · Global AI neural-net canvas (fixed, reacts to scroll)
   · Hero particle canvas (mouse-repulsion + connections)
   · Floating AI SVG parallax on scroll
   · Smooth scroll-reveal with staggered delays
   · Sticky nav + active-link tracker
   · Mobile hamburger
   · Custom cursor (dot + ring)
   · Stat counter animation
   · Hover shimmer on cards
   ============================================================ */

'use strict';

/* ── tiny helpers ──────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1.  CUSTOM CURSOR
   ============================================================ */
(function initCursor () {
  const dot  = $('cursorDot');
  const ring = $('cursorRing');
  if (!dot || !ring || !hasFinePointer || prefersReducedMotion) return;

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Smooth lag for ring
  (function animRing () {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  // Hover scale
  const sel = 'a,button,.course-card,.contact-card,.stat-card,.btn';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(sel)) ring.classList.add('hovered');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(sel)) ring.classList.remove('hovered');
  });

  // Click pulse
  document.addEventListener('mousedown', () => dot.classList.add('clicking'));
  document.addEventListener('mouseup',   () => dot.classList.remove('clicking'));

  // Hide when off-window
  document.addEventListener('mouseleave', () => { dot.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity='1'; ring.style.opacity='1'; });
})();

/* ============================================================
   2.  NAVBAR — sticky + scrolled class
   ============================================================ */
(function initNavbar () {
  const nb = $('navbar');
  if (!nb) return;
  const upd = () => nb.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* ============================================================
   3.  HAMBURGER
   ============================================================ */
(function initHamburger () {
  const btn   = $('hamburger');
  const links = $('navLinks');
  if (!btn || !links) return;

  const desktopMedia = window.matchMedia('(min-width: 769px)');
  const setMenuState = open => {
    links.classList.toggle('open', open);
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  btn.addEventListener('click', () => {
    setMenuState(!links.classList.contains('open'));
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenuState(false);
  });

  const closeOnDesktop = e => {
    if (e.matches) setMenuState(false);
  };

  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener('change', closeOnDesktop);
  } else {
    desktopMedia.addListener(closeOnDesktop);
  }
})();

/* ============================================================
   4.  ACTIVE NAV LINK
   ============================================================ */
(function initActiveNav () {
  const secs  = $$('section[id]');
  const links = $$('.nav-link');
  if (!secs.length || !links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  secs.forEach(s => obs.observe(s));
})();

/* ============================================================
   5.  SCROLL REVEAL
   ============================================================ */
(function initReveal () {
  const els = $$('.reveal-up,.reveal-left,.reveal-right');
  if (!els.length) return;
  if (prefersReducedMotion) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const delay = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('visible'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.1 });

  els.forEach(el => obs.observe(el));

  // Hero reveals fire on load
  window.addEventListener('DOMContentLoaded', () => {
    $$('.hero .reveal-up').forEach(el => {
      const d = parseInt(el.dataset.delay || 0, 10);
      setTimeout(() => el.classList.add('visible'), 350 + d);
    });
  });
})();

/* ============================================================
   6.  HERO PARTICLE CANVAS
   ============================================================ */
(function initHeroParticles () {
  const canvas = $('particleCanvas');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W, H, pts;
  let particleCount = 90;
  let connectionDistance = 120;
  const SPEED = 0.3;
  const MOUSE = { x: -999, y: -999 };

  function mkPt () {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r: 0.8 + Math.random() * 1.8,
      a: 0.25 + Math.random() * 0.55,
    };
  }

  function init () {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    particleCount = W < 768 ? 42 : 90;
    connectionDistance = W < 768 ? 90 : 120;
    pts = Array.from({ length: particleCount }, mkPt);
  }

  function tick () {
    ctx.clearRect(0, 0, W, H);

    pts.forEach((p, i) => {
      // mouse repulsion
      const dx = p.x - MOUSE.x, dy = p.y - MOUSE.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14000) {
        const f = (14000 - d2) / 14000;
        const d = Math.sqrt(d2) || 1;
        p.vx += (dx / d) * f * 0.1;
        p.vy += (dy / d) * f * 0.1;
      }

      // speed cap
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > SPEED * 2.2) { p.vx *= SPEED * 2.2 / sp; p.vy *= SPEED * 2.2 / sp; }

      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;

      // dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,107,0,${p.a})`;
      ctx.fill();

      // connections
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const cdx = p.x - q.x, cdy = p.y - q.y;
        const cd  = Math.hypot(cdx, cdy);
        if (cd < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255,107,0,${(1 - cd / connectionDistance) * 0.2})`;
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(tick);
  }

  if (hasFinePointer) {
    window.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      MOUSE.x = e.clientX - r.left;
      MOUSE.y = e.clientY - r.top;
    });
  }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 180); });

  init();
  tick();
})();

/* ============================================================
   7.  GLOBAL AI BACKGROUND CANVAS
       Neural-net style — reacts to scroll (nodes shift upward
       as user scrolls, creating a parallax depth effect)
   ============================================================ */
(function initAiBg () {
  const canvas = $('aiBgCanvas');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W, H, nodes;
  let nodeCount = 60;
  let scrollY = 0;
  let targetScrollY = 0;

  // Node types: circle, square, triangle
  const SHAPES = ['circle', 'square', 'tri'];
  const PALETTE = [
    'rgba(255,107,0,',
    'rgba(255,140,58,',
    'rgba(80,120,255,',
    'rgba(180,100,255,',
  ];

  function mkNode () {
    const col  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const shp  = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = 4 + Math.random() * 18;
    return {
      x:    Math.random() * W,
      y:    Math.random() * H,
      baseY:0,            // set after
      vx:  (Math.random() - 0.5) * 0.18,
      vy:  (Math.random() - 0.5) * 0.18,
      size,
      col,
      shp,
      a:    0.04 + Math.random() * 0.12,
      depth:0.05 + Math.random() * 0.6,   // parallax depth
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.003,
    };
  }

  function init () {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    nodeCount = W < 768 ? 28 : 60;
    nodes = Array.from({ length: nodeCount }, () => {
      const n = mkNode();
      n.baseY = n.y;
      return n;
    });
  }

  function drawShape (n, py) {
    const s = n.size;
    ctx.save();
    ctx.translate(n.x, py);
    ctx.rotate(n.rot);
    ctx.globalAlpha = n.a;
    ctx.strokeStyle = n.col + '1)';
    ctx.lineWidth   = 0.8;

    if (n.shp === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      // inner dot
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = n.col + '0.3)';
      ctx.fill();
    } else if (n.shp === 'square') {
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.87, s * 0.5);
      ctx.lineTo(-s * 0.87, s * 0.5);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick () {
    ctx.clearRect(0, 0, W, H);

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.06;

    // Draw faint grid lines
    ctx.save();
    ctx.globalAlpha = 0.025;
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth   = 0.6;
    const gs = 80;
    const offset = (scrollY * 0.08) % gs;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = -gs + offset; y < H + gs; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // Draw & connect nodes
    nodes.forEach((n, i) => {
      n.x   += n.vx; n.y += n.vy;
      n.rot += n.rotV;

      if (n.x < -30) n.x = W + 30; if (n.x > W + 30) n.x = -30;
      if (n.y < -30) n.y = H + 30; if (n.y > H + 30) n.y = -30;

      // parallax y
      const py = n.y - scrollY * n.depth;

      drawShape(n, py);

      // Connect nearby nodes with faint lines
      for (let j = i + 1; j < nodes.length; j++) {
        const m  = nodes[j];
        const pmy = m.y - scrollY * m.depth;
        const dx = n.x - m.x, dy = py - pmy;
        const d  = Math.hypot(dx, dy);
        if (d < 160) {
          ctx.save();
          ctx.globalAlpha = (1 - d / 160) * 0.035;
          ctx.strokeStyle = '#ff6b00';
          ctx.lineWidth   = 0.6;
          ctx.beginPath();
          ctx.moveTo(n.x, py);
          ctx.lineTo(m.x, pmy);
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    requestAnimationFrame(tick);
  }

  // Track scroll
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 150); });

  init();
  tick();
})();

/* ============================================================
   8.  FLOATING AI SVG PARALLAX ON SCROLL
   ============================================================ */
(function initFloatParallax () {
  const floats = $$('.ai-float');
  if (!floats.length || prefersReducedMotion) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const sy = window.scrollY;
      floats.forEach(el => {
        const speed = parseFloat(el.dataset.speed || 0.2);
        el.style.transform = `translateY(${sy * speed * -1}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
})();

/* ============================================================
   9.  FLOATING CSS KEYFRAMES INJECTION
      (floatY / floatX used inline in HTML)
   ============================================================ */
(function injectKeyframes () {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatY {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-18px); }
    }
    @keyframes floatX {
      0%,100% { transform: translateX(0px); }
      50%      { transform: translateX(-14px); }
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   10.  STAT COUNTER ANIMATION
   ============================================================ */
(function initCounters () {
  const stats   = $$('.stat-num');
  const numeric = [...stats].filter(s => /^\d/.test(s.textContent));
  if (!numeric.length || prefersReducedMotion) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.textContent, 10);
      const suffix = el.textContent.replace(/[0-9]/g, '');
      let cur = 0;
      const step = Math.ceil(target / 55);
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur + suffix;
        if (cur >= target) clearInterval(t);
      }, 18);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });

  numeric.forEach(s => obs.observe(s));
})();

/* ============================================================
   11. SMOOTH SCROLL WITH NAV OFFSET
   ============================================================ */
(function initSmoothLinks () {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
})();

/* ============================================================
   12. SHOW MORE / SHOW LESS
   ============================================================ */
(function initShowMore () {
  $$('.btn-toggle-extra').forEach(btn => {
    const card = btn.closest('.course-card');
    const extra = card && card.querySelector('.card-extra');
    const label = btn.querySelector('.btn-show-more-label');
    if (!extra || !card || !label) return;

    btn.addEventListener('click', () => {
      const isOpen = extra.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      label.textContent = isOpen ? 'Show Less' : 'Show More';

      // Smooth scroll so card stays in view when collapsing
      if (!isOpen) {
        setTimeout(() => {
          card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  });
})();

/* ============================================================
   13. CARD TILT  (subtle 3-D on mouse-move)
   ============================================================ */
(function initTilt () {
  if (!hasFinePointer || prefersReducedMotion) return;
  const cards = $$('.course-card,.contact-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const rx = ((e.clientY - cy) / (r.height / 2)) * -6;
      const ry = ((e.clientX - cx) / (r.width  / 2)) *  6;
      card.style.transform =
        `translateY(-10px) scale(1.01) perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

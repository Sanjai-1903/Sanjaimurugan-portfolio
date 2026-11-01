/* ============================================================
   Portfolio runtime
   Design notes:
   - One scroll listener, rAF-throttled. The old build had three separate
     listeners, two of which read layout (offsetTop / getBoundingClientRect)
     on every single scroll event — that is what made scrolling stutter.
   - Nothing that matters for reading is hidden unless JS is confirmed to be
     running and able to reveal it again.
   - Everything expensive is gated behind LOW_POWER / reduced motion.
   ============================================================ */

const root = document.documentElement;

// Tells the watchdog in index.html's <head> that the script did start, so it
// leaves the scroll-reveal rules armed.
window.__portfolioReady = true;
root.classList.add('js');

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE_POINTER = window.matchMedia('(pointer: coarse)').matches;

// Rough capability probe. deviceMemory / hardwareConcurrency are absent on
// Safari, so an unknown device is treated as capable unless it is a small
// touch screen.
const LOW_POWER = (function () {
  if (REDUCED_MOTION) return true;
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if (typeof mem === 'number' && mem <= 4) return true;
  if (typeof cores === 'number' && cores <= 4) return true;
  if (COARSE_POINTER && Math.min(screen.width, screen.height) <= 480) return true;
  return false;
})();

if (LOW_POWER) root.classList.add('low-power');

// ===== LOADING SCREEN =====
// Previously this waited for window 'load', which does not fire until every
// image and the third-party LinkedIn script have finished — the page sat
// behind the loader long after it was readable.
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;

  let done = false;
  function hide() {
    if (done) return;
    done = true;
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 700);
  }

  // Hide as soon as the document is parsed and the hero image has settled,
  // with a hard ceiling so a slow asset can never trap the visitor.
  const hero = document.querySelector('.hero-photo');
  const minShow = LOW_POWER ? 300 : 650;
  const started = performance.now();

  function ready() {
    const wait = Math.max(0, minShow - (performance.now() - started));
    setTimeout(hide, wait);
  }

  if (hero && !hero.complete) {
    hero.addEventListener('load', ready, { once: true });
    hero.addEventListener('error', ready, { once: true });
  } else {
    ready();
  }

  setTimeout(hide, 2500); // ceiling
})();

// ===== CUSTOM CURSOR =====
// Skipped on touch and low-power devices: it writes inline styles on every
// mousemove, which is pure cost when there is no visible cursor anyway.
if (!COARSE_POINTER && !LOW_POWER) {
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');

  if (cursor && cursorDot) {
    let cursorX = 0, cursorY = 0, dotX = 0, dotY = 0, pending = false;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => {
          cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
          pending = false;
        });
      }
    }, { passive: true });

    (function animateDot() {
      dotX += (cursorX - dotX) * 0.15;
      dotY += (cursorY - dotY) * 0.15;
      cursorDot.style.transform =
        `translate(${dotX.toFixed(1)}px, ${dotY.toFixed(1)}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateDot);
    })();

    document.querySelectorAll('a, button, .project-card, .research-card, .tech-item-el, .contact-item, .phase-tech span')
      .forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
      });
  }
} else {
  document.getElementById('cursor')?.remove();
  document.getElementById('cursorDot')?.remove();
}

// ===== MOBILE MENU =====
(function () {
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  if (!menuBtn || !navLinks) return;

  function setOpen(open) {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    const spans = menuBtn.querySelectorAll('span');
    spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : '';
    spans[1].style.opacity = open ? '0' : '1';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : '';
  }

  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => setOpen(false))
  );
})();

// ===== ROTATING TEXT =====
(function () {
  const rotateEl = document.getElementById('rotate-word');
  if (!rotateEl) return;

  const words = ['Local LLM Architect', 'AI Systems Engineer', 'Agentic AI Builder', 'Efficient Inference Researcher'];

  if (REDUCED_MOTION) {
    rotateEl.textContent = words[0];
    return;
  }

  let wordIndex = 0, charIndex = 0, isDeleting = false, timer = null;
  let running = true;

  function tick() {
    if (!running) return;
    const word = words[wordIndex];
    if (!isDeleting) {
      rotateEl.textContent = word.slice(0, ++charIndex);
      if (charIndex === word.length) {
        isDeleting = true;
        timer = setTimeout(tick, 2000);
        return;
      }
      timer = setTimeout(tick, 80 + Math.random() * 40);
    } else {
      rotateEl.textContent = word.slice(0, --charIndex);
      if (charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        timer = setTimeout(tick, 400);
        return;
      }
      timer = setTimeout(tick, 40);
    }
  }

  // Stop typing while the tab is in the background.
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    clearTimeout(timer);
    if (running) timer = setTimeout(tick, 200);
  });

  timer = setTimeout(tick, 2200);
})();

// ===== SCROLL REVEAL =====
(function () {
  const targets = document.querySelectorAll('.fade-up, .fade-in');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.stagger-item').forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 80);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));
})();

// ===== JOURNEY TIMELINE =====
// Reveal-once with IntersectionObserver. The old version recomputed every
// phase's bounding box on every frame of every scroll and set opacity back to
// 0 whenever a card drifted more than 150px from the middle of the screen —
// so most of the timeline was invisible most of the time, and the layout
// thrash made it worst on exactly the slow devices it hurt to lose.
const journeyPhases = [];
let timelineProgressEl = null;
let timelineEl = null;

(function () {
  const timeline = document.querySelector('.journey-timeline');
  if (!timeline) return;

  const phases = [...timeline.querySelectorAll('.journey-phase')];
  if (!phases.length) return;

  timelineEl = timeline;
  timelineProgressEl = timeline.querySelector('.timeline-progress');

  if (!('IntersectionObserver' in window)) {
    phases.forEach(p => p.classList.add('is-visible'));
    return;
  }

  // Only now is it safe to hide the cards for the entrance animation.
  timeline.classList.add('js-reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible'); // never removed again
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  phases.forEach(p => {
    io.observe(p);
    journeyPhases.push(p);
  });

  // Safety net: if anything above goes wrong, make sure nothing stays hidden.
  setTimeout(() => {
    phases.forEach(p => {
      const r = p.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) p.classList.add('is-visible');
    });
  }, 1200);
})();

// ===== PROFICIENCY BARS =====
(function () {
  const groups = document.querySelectorAll('.proficiency-bars');
  if (!groups.length) return;

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.prof-bar-fill').forEach(b => { b.style.width = b.dataset.width + '%'; });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.prof-bar-fill').forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, i * 120);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  groups.forEach(el => io.observe(el));
})();

// ===== METRICS COUNTER =====
(function () {
  const stats = document.querySelector('.hero-stats');
  if (!stats) return;

  function run() {
    stats.querySelectorAll('.stat-number').forEach(el => {
      const end = Number(el.dataset.target || el.textContent) || 0;
      if (REDUCED_MOTION) { el.textContent = String(end); return; }
      const duration = 1200;
      const start = performance.now();
      (function step(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = String(Math.floor(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  if (!('IntersectionObserver' in window)) { run(); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      run();
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  io.observe(stats);
})();

// ===== SINGLE SCROLL HANDLER =====
// Navbar state + active nav link + timeline progress, all from one
// rAF-throttled callback. Section offsets are cached and only recomputed on
// resize, so a scroll frame reads layout at most once.
(function () {
  const navbar = document.getElementById('navbar');
  const navAnchors = [...document.querySelectorAll('.nav-links a')];
  const sections = [...document.querySelectorAll('section[id]')];

  let offsets = [];
  let currentId = '';
  let queued = false;

  function measure() {
    offsets = sections.map(s => ({ id: s.id, top: s.offsetTop - 120 }));
  }

  function onScroll() {
    const y = window.scrollY;

    if (navbar) navbar.classList.toggle('scrolled', y > 50);

    // active nav link
    let active = '';
    for (const o of offsets) if (y >= o.top) active = o.id;
    if (active !== currentId) {
      currentId = active;
      navAnchors.forEach(a =>
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + active)
      );
    }

    // timeline progress — one rect read, only while the section is on screen
    if (timelineEl && timelineProgressEl) {
      const r = timelineEl.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        const vh = window.innerHeight;
        const p = (vh * 0.5 - r.top) / r.height;
        timelineProgressEl.style.height = (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%';
      }
    }

    // highlight the phase nearest the middle of the screen (one at a time)
    if (journeyPhases.length && !LOW_POWER) {
      const mid = window.innerHeight / 2;
      let best = null, bestDist = Infinity;
      for (const p of journeyPhases) {
        const r = p.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = p; }
      }
      for (const p of journeyPhases) p.classList.toggle('is-current', p === best);
    }

    queued = false;
  }

  function request() {
    if (!queued) { queued = true; requestAnimationFrame(onScroll); }
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { measure(); request(); }, 150);
  }, { passive: true });

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('load', measure);
  measure();
  request();
})();

// ===== COMMAND PALETTE =====
(function () {
  const cmdPalette = document.getElementById('cmd-palette');
  const cmdInput = document.getElementById('cmd-input');
  if (!cmdPalette || !cmdInput) return;

  let open = false;

  function close() {
    cmdPalette.classList.remove('open');
    cmdInput.value = '';
    document.querySelectorAll('.cmd-result').forEach(i => { i.style.display = 'flex'; });
    open = false;
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (open) { close(); return; }
      cmdPalette.classList.add('open');
      cmdInput.focus();
      open = true;
      return;
    }
    if (e.key === 'Escape' && open) close();

    if (e.altKey) {
      const map = { 1: 'hero', 2: 'about', 3: 'projects', 4: 'research', 5: 'startup', 6: 'journey', 7: 'techstack', 8: 'certifications', 9: 'contact' };
      const id = map[e.key];
      if (id) { e.preventDefault(); scrollToSection(id); }
    }
  });

  cmdInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll('.cmd-result').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(val) ? 'flex' : 'none';
    });
  });

  cmdPalette.addEventListener('click', (e) => { if (e.target === cmdPalette) close(); });
  window.__closeCmdPalette = close;
})();

// ===== HERO CANVAS =====
// Was 80 particles with an O(n²) neighbour scan (≈3,200 distance checks plus
// a stroke call per pair) every frame, at full device pixel ratio, forever —
// even with the hero scrolled off screen. Now: count scales with viewport,
// DPR is capped, the loop stops when the hero leaves the screen, and it does
// not start at all in low-power or reduced-motion mode.
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || LOW_POWER || REDUCED_MOTION) { canvas?.remove(); return; }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const LINK_DIST = 120;
  const MOUSE_DIST = 150;

  let dpr = 1, w = 0, h = 0, particles = [], running = false, rafId = 0;
  let mouseX = -9999, mouseY = -9999;

  function count() {
    // ~1 particle per 18k css px², clamped — a phone gets ~20, a desktop ~60.
    return Math.max(18, Math.min(60, Math.round((w * h) / 18000)));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = count();
    while (particles.length > target) particles.pop();
    while (particles.length < target) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.4 + 0.5,
        opacity: Math.random() * 0.45 + 0.12,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
      ctx.fill();
    }

    // Neighbour links batched into one path per alpha bucket would be ideal;
    // squared distances and an early bounding-box reject keep it cheap enough.
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        if (dx > LINK_DIST || dx < -LINK_DIST) continue;
        const dy = p.y - q.y;
        if (dy > LINK_DIST || dy < -LINK_DIST) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK_DIST * LINK_DIST) continue;
        ctx.strokeStyle = `rgba(6, 182, 212, ${(0.08 * (1 - Math.sqrt(d2) / LINK_DIST)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      const mdx = mouseX - p.x, mdy = mouseY - p.y;
      if (mdx * mdx + mdy * mdy < MOUSE_DIST * MOUSE_DIST) {
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        ctx.strokeStyle = `rgba(6, 182, 212, ${(0.15 * (1 - md / MOUSE_DIST)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  function start() { if (!running) { running = true; rafId = requestAnimationFrame(draw); } }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
  window.addEventListener('mouseout', () => { mouseX = mouseY = -9999; }, { passive: true });

  // Stop drawing once the hero is off screen or the tab is hidden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (canvas.getBoundingClientRect().bottom > 0) start();
  });
})();

// ===== HERO DOM PARTICLES =====
(function () {
  const host = document.getElementById('particles');
  if (!host) return;
  if (LOW_POWER || REDUCED_MOTION) { host.remove(); return; }

  const n = window.innerWidth < 768 ? 12 : 24;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText =
      `left:${(Math.random() * 100).toFixed(2)}%;` +
      `top:${(Math.random() * 100).toFixed(2)}%;` +
      `--dx:${((Math.random() - 0.5) * 100).toFixed(0)}px;` +
      `--dy:${((Math.random() - 0.5) * 100).toFixed(0)}px;` +
      `animation:particleDrift ${(10 + Math.random() * 20).toFixed(1)}s linear ${(Math.random() * 15).toFixed(1)}s infinite;`;
    frag.appendChild(p);
  }
  host.appendChild(frag);
})();

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
    window.__closeCmdPalette?.();
  });
});

// ===== INFO CARD REVEAL =====
(function () {
  const cards = document.querySelectorAll('.info-item');
  if (!cards.length) return;
  if (!('IntersectionObserver' in window)) {
    cards.forEach(c => c.classList.add('active'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('active');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  cards.forEach(c => io.observe(c));

  if (LOW_POWER) return;
  cards.forEach(card => {
    card.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'info-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
})();

// ===== EXPANDABLE SECTIONS (called from inline onclick) =====
function toggleExpand(btn) {
  const content = btn.nextElementSibling;
  if (!content) return;
  const willOpen = !content.classList.contains('open');

  document.querySelectorAll('.expand-content.open').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.expand-toggle').forEach(b => {
    b.textContent = b.textContent.replace('▾', '▸');
    b.setAttribute('aria-expanded', 'false');
  });

  content.classList.toggle('open', willOpen);
  btn.textContent = (willOpen ? '▾ ' : '▸ ') + btn.textContent.replace(/^[▾▸]\s*/, '');
  btn.setAttribute('aria-expanded', String(willOpen));
}

// ===== SECTION JUMP (called from inline onclick) =====
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth', block: 'start' });
  window.__closeCmdPalette?.();
}

// ===== RAG CHATBOT WIDGET (markup is optional) =====
(function () {
  const toggle = document.getElementById('chatbotToggle');
  const panel = document.getElementById('chatbotPanel');
  const input = document.getElementById('chatbotInput');
  const sendBtn = document.getElementById('chatbotSend');
  const messages = document.getElementById('chatbotMessages');
  const status = document.getElementById('chatbotStatus');
  if (!toggle || !panel || !input || !messages) return;

  function append(sender, text) {
    const div = document.createElement('div');
    div.className = `chatbot-message ${sender}`;
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  async function send() {
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    append('user', query);
    if (status) status.textContent = 'Thinking...';
    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      append('bot', data.error ? '⚠️ ' + data.error : data.response);
    } catch {
      append('bot', '⚠️ Unable to connect. Ensure the Flask backend is running.');
    }
    if (status) status.textContent = 'Ready';
  }

  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });
  document.getElementById('chatbotClose')?.addEventListener('click', () => panel.classList.remove('open'));
  sendBtn?.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
})();

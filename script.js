// ===== LOADING SCREEN =====
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
  }, 1800);
});

// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let cursorX = 0, cursorY = 0;
let dotX = 0, dotY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  cursor.style.left = cursorX + 'px';
  cursor.style.top = cursorY + 'px';
  cursorDot.style.left = cursorX + 'px';
  cursorDot.style.top = cursorY + 'px';
});

// Hover glow on interactive elements
document.querySelectorAll('a, button, .project-card, .blog-card, .skill-tag, .tech-item-el, .contact-item, .phase-tech span').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// Cursor dot follows more smoothly
function animateDot() {
  dotX += (cursorX - dotX) * 0.15;
  dotY += (cursorY - dotY) * 0.15;
  cursorDot.style.left = dotX + 'px';
  cursorDot.style.top = dotY + 'px';
  requestAnimationFrame(animateDot);
}
animateDot();

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== INFO CARDS INTERACTIONS =====
const infoCards = document.querySelectorAll('.info-item');

const infoCardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      if (!entry.target.classList.contains('animated')) {
        entry.target.classList.add('animated');
      }
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

infoCards.forEach(card => {
  infoCardObserver.observe(card);
});

// Click ripple effect
infoCards.forEach(card => {
  card.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    this.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Add ripple effect CSS
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(6, 182, 212, 0.3);
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
    pointer-events: none;
  }

  @keyframes rippleEffect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ===== MOBILE MENU =====
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = menuBtn.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
  }
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    const spans = menuBtn.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '1';
    spans[2].style.transform = '';
  });
});

// ===== ROTATING TEXT =====
const words = ['Local LLM Architect', 'AI Systems Engineer', 'Agentic AI Builder', 'Efficient Inference Researcher'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const rotateEl = document.getElementById('rotate-word');

function typeRotate() {
  const currentWord = words[wordIndex];
  if (!isDeleting) {
    rotateEl.textContent = currentWord.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === currentWord.length) {
      isDeleting = true;
      setTimeout(typeRotate, 2000);
      return;
    }
    setTimeout(typeRotate, 80 + Math.random() * 40);
  } else {
    rotateEl.textContent = currentWord.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(typeRotate, 400);
      return;
    }
    setTimeout(typeRotate, 40);
  }
}
setTimeout(typeRotate, 2500);

// ===== SCROLL ANIMATIONS WITH STAGGERED REVEAL =====
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Staggered reveal for children
      const staggerItems = entry.target.querySelectorAll('.stagger-item');
      staggerItems.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 100);
      });
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-up, .fade-in').forEach(el => observer.observe(el));

// ===== PREMIUM JOURNEY TIMELINE ANIMATIONS =====
const journeySection = document.querySelector('#journey');
const timelineLine = journeySection?.querySelector('.timeline-line');
const phases = journeySection?.querySelectorAll('.journey-phase');

let ticking = false;
function updateJourneyTimeline() {
  if (!journeySection || !timelineLine) return;

  const journeyRect = journeySection.getBoundingClientRect();
  const timelineProgress = timelineLine.querySelector('.timeline-progress');

  if (journeyRect.top < window.innerHeight && journeyRect.bottom > 0) {
    // Calculate scroll progress
    const progress = Math.max(0, Math.min(1, (window.innerHeight - journeyRect.top) / (window.innerHeight + journeyRect.height)));
    timelineLine.style.setProperty('--progress', progress);

    // Update timeline fill height
    if (timelineProgress) {
      timelineProgress.style.height = (progress * 100) + '%';
    }

    // Update active phase based on scroll position
    const viewportCenter = window.innerHeight / 2;

    phases.forEach((phase, index) => {
      const phaseRect = phase.getBoundingClientRect();
      const phaseCenter = phaseRect.top + phaseRect.height / 2;
      const distanceToCenter = Math.abs(phaseCenter - viewportCenter);

      if (distanceToCenter < 150) {
        phase.classList.add('active');
        phase.classList.remove('prev');
      } else if (phaseRect.top < viewportCenter) {
        phase.classList.remove('active');
        phase.classList.add('prev');
      } else {
        phase.classList.remove('active', 'prev');
      }
    });

    // Ensure first phase is active when section comes into view
    if (phases[0] && phases[0].getBoundingClientRect().top < window.innerHeight * 0.8) {
      phases[0].classList.add('active');
    }
  }

  ticking = false;
}

function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateJourneyTimeline);
    ticking = true;
  }
}

if (journeySection) {
  window.addEventListener('scroll', requestTick, { passive: true });
  updateJourneyTimeline();
}

// Observe proficiency bars
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bars = entry.target.querySelectorAll('.prof-bar-fill');
      bars.forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.width + '%';
        }, i * 150);
      });
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.proficiency-bars').forEach(el => barObserver.observe(el));

// ===== COMMAND PALETTE =====
const cmdPalette = document.getElementById('cmd-palette');
const cmdInput = document.getElementById('cmd-input');
let cmdOpen = false;

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (cmdOpen) {
      closeCmd();
    } else {
      cmdPalette.classList.add('open');
      cmdInput.focus();
      cmdOpen = true;
    }
  }
  if (e.key === 'Escape' && cmdOpen) {
    closeCmd();
  }
});

function closeCmd() {
  cmdPalette.classList.remove('open');
  cmdInput.value = '';
  cmdOpen = false;
}

cmdInput.addEventListener('input', (e) => {
  const val = e.target.value.toLowerCase();
  document.querySelectorAll('.cmd-result').forEach(item => {
    item.style.display = item.textContent.toLowerCase().includes(val) ? 'flex' : 'none';
  });
});

// ===== ACTIVE NAV LINK TRACKING =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (scrollY >= top) current = section.id;
  });
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.style.color = '';
    link.style.textShadow = '';
    if (link.getAttribute('href') === '#' + current) {
      link.style.color = 'var(--accent-cyan)';
      link.style.textShadow = '0 0 20px var(--accent-glow-cyan)';
    }
  });
});

// ===== HERO CANVAS — AI GRID PARTICLES =====
const canvas = document.getElementById('hero-canvas');
const ctx = canvas?.getContext('2d');
let particles = [];
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

if (canvas) {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

if (canvas && ctx) {
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Mouse interaction
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 * (1 - dist / 150)})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx2 = p.x - p2.x;
        const dy2 = p.y - p2.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.08 * (1 - dist2 / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(drawParticles);
  }
  drawParticles();
}

// ===== METRICS COUNTER ANIMATION =====
function animateMetrics() {
  animateValue('metric-years', 0, 3, 1200, '');
  animateValue('metric-projects', 0, 8, 1200, '');
  animateValue('metric-certs', 0, 6, 1200, '');
}

function animateValue(id, start, end, duration, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * eased);
    el.innerHTML = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const metricsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateMetrics();
      metricsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

metricsObserver.observe(document.querySelector('.hero-stats'));

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== EXPANDABLE SECTIONS =====
function toggleExpand(btn) {
  const content = btn.nextElementSibling;
  const isOpen = content.classList.contains('open');

  document.querySelectorAll('.expand-content.open').forEach(el => {
    el.classList.remove('open');
  });

  document.querySelectorAll('.expand-toggle').forEach(b => {
    b.textContent = b.textContent.replace('▾', '▸');
  });

  if (!isOpen) {
    content.classList.add('open');
    btn.textContent = '▾ Research Findings';
  } else {
    btn.textContent = '▸ Research Findings';
  }
}

// ===== HERO PARTICLES (DOM-based floating particles) =====
const heroParticles = document.getElementById('particles');
if (heroParticles) {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.setProperty('--dx', (Math.random() - 0.5) * 100 + 'px');
    p.style.setProperty('--dy', (Math.random() - 0.5) * 100 + 'px');
    p.style.animationName = 'particleDrift';
    p.style.animationDelay = Math.random() * 15 + 's';
    p.style.animationDuration = (10 + Math.random() * 20) + 's';
    p.style.animationTimingFunction = 'linear';
    p.style.animationIterationCount = 'infinite';
    heroParticles.appendChild(p);
  }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === '1') scrollToSection('hero');
  if (e.altKey && e.key === '2') scrollToSection('about');
  if (e.altKey && e.key === '3') scrollToSection('projects');
  if (e.altKey && e.key === '4') scrollToSection('research');
  if (e.altKey && e.key === '5') scrollToSection('startup');
  if (e.altKey && e.key === '6') scrollToSection('journey');
  if (e.altKey && e.key === '7') scrollToSection('techstack');
  if (e.altKey && e.key === '8') scrollToSection('certifications');
  if (e.altKey && e.key === '9') scrollToSection('contact');
});

// ===== RAG CHATBOT WIDGET =====
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotStatus = document.getElementById('chatbotStatus');

if (chatbotToggle) chatbotToggle.addEventListener('click', () => {
  chatbotPanel.classList.toggle('open');
  if (chatbotPanel.classList.contains('open')) chatbotInput.focus();
});

if (chatbotClose) chatbotClose.addEventListener('click', () => {
  chatbotPanel.classList.remove('open');
});

async function sendChatbotMessage() {
  const query = chatbotInput.value.trim();
  if (!query) return;
  chatbotInput.value = '';
  appendChatbotMessage('user', query);
  chatbotStatus.textContent = 'Thinking...';
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    appendChatbotMessage('bot', data.error ? '⚠️ ' + data.error : data.response);
  } catch (err) {
    appendChatbotMessage('bot', '⚠️ Unable to connect. Ensure Flask backend is running.');
  }
  chatbotStatus.textContent = 'Ready';
}

if (chatbotSend) chatbotSend.addEventListener('click', sendChatbotMessage);
if (chatbotInput) chatbotInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatbotMessage();
});

function appendChatbotMessage(sender, text) {
  const div = document.createElement('div');
  div.className = `chatbot-message ${sender}`;
  const p = document.createElement('p');
  p.textContent = text;
  div.appendChild(p);
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Initialize animations on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Any additional initialization
});
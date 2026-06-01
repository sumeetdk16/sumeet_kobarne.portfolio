/* ═══════════════════════════════════════════
   PORTFOLIO INTERACTIONS
   1. Scroll progress bar
   2. Stat counter animation
   3. Skill tag ripple on click
   4. Hero floating particles
   5. Section entrance stagger
   6. External link security
   ═══════════════════════════════════════════ */

/* ── 6. EXTERNAL LINK SECURITY ──────────── */
/* Ensure all target="_blank" links include noreferrer to prevent tab-napping */
(function () {
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    var rel = (a.getAttribute('rel') || '').split(' ').filter(Boolean);
    if (!rel.includes('noreferrer')) rel.push('noreferrer');
    if (!rel.includes('noopener'))   rel.push('noopener');
    a.setAttribute('rel', rel.join(' '));
  });
})();

/* ── 1. SCROLL PROGRESS BAR ─────────────── */
(function () {
  const bar = document.createElement('div');
  bar.id = 'scroll-bar';
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'height:2px',
    'width:0%', 'z-index:9998', 'pointer-events:none',
    'background:linear-gradient(90deg,#fb923c,#facc15,#f472b6)',
    'transition:width 0.1s linear',
    'box-shadow:0 0 8px rgba(251,146,60,0.6)',
  ].join(';');
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? `${(scrolled / total) * 100}%` : '0%';
  }, { passive: true });
})();

/* ── 2. STAT COUNTER ANIMATION ──────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function animateCount(el) {
    const raw   = el.textContent.trim();
    // Match: optional prefix, digits, optional suffix (e.g. "700+", "3★", "1600+")
    const match = raw.match(/^([^\d]*)(\d+)(\D*)$/);
    if (!match) return;

    const prefix   = match[1] || '';
    const target   = parseInt(match[2], 10);
    const suffix   = match[3] || '';
    const duration = 2200;
    const start    = performance.now();

    // Smooth cubic ease-in-out: slow start, cruise, slow finish
    function easeCubicInOut(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Always count from 0 for a satisfying full sweep
    const startVal = 0;

    // Subtle blur-to-sharp: starts soft, resolves cleanly
    el.style.filter     = 'blur(5px)';
    el.style.opacity    = '0.2';
    el.style.transition = 'none';

    function tick(now) {
      const t     = Math.min((now - start) / duration, 1);
      const eased = easeCubicInOut(t);
      const value = Math.round(startVal + eased * (target - startVal));

      el.textContent = prefix + value + suffix;

      // Blur and opacity clear gradually — most of the clearing happens in the last 30%
      const blurPx  = (1 - eased) * 5;
      const opacity = 0.2 + eased * 0.8;
      el.style.filter  = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none';
      el.style.opacity = opacity.toFixed(3);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent  = prefix + target + suffix;
        el.style.filter  = 'none';
        el.style.opacity = '1';
      }
    }

    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const statNums = e.target.querySelectorAll('.stat-n');
      // Stagger each stat so they cascade left-to-right
      statNums.forEach((el, i) => {
        setTimeout(() => animateCount(el), i * 160);
      });
      obs.unobserve(e.target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.stats').forEach(el => obs.observe(el));
})();

/* ── 3. SKILL TAG RIPPLE ─────────────────── */
(function () {
  document.querySelectorAll('.skill').forEach(skill => {
    skill.style.position = 'relative';
    skill.style.overflow = 'hidden';

    skill.addEventListener('click', function (e) {
      const rect   = this.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const ripple = document.createElement('span');

      ripple.style.cssText = [
        'position:absolute',
        `left:${x}px`, `top:${y}px`,
        'width:0', 'height:0',
        'border-radius:50%',
        'background:rgba(251,146,60,0.35)',
        'transform:translate(-50%,-50%)',
        'pointer-events:none',
        'animation:skill-ripple 0.55s ease-out forwards',
      ].join(';');

      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
})();

/* ── 4. HERO FLOATING PARTICLES ─────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Desktop only — particles are a visual luxury, not worth the GPU cost on touch devices
  if (window.innerWidth < 1024) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'pointer-events:none', 'z-index:2',
    'opacity:0.55',
  ].join(';');
  hero.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2
    W   = hero.offsetWidth;
    H   = hero.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150); // debounce resize
  });

  const COLORS = ['#fb923c', '#facc15', '#f472b6', '#a78bfa'];
  const COUNT  = 18; // reduced from 28

  const mouse = { x: W / 2, y: H / 2 };
  window.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });

  const particles = Array.from({ length: COUNT }, () => ({
    x:    Math.random() * 1200,
    y:    Math.random() * 700,
    r:    Math.random() * 2.2 + 0.8,
    vx:   (Math.random() - 0.5) * 0.3,
    vy:   (Math.random() - 0.5) * 0.3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.45 + 0.18,
    pulse: Math.random() * Math.PI * 2,
  }));

  // 30fps cap — particles don't need 60fps
  let lastTs = 0;
  let paused = false;

  function draw(ts) {
    requestAnimationFrame(draw);
    if (paused) return;
    if (ts - lastTs < 33) return; // ~30fps
    lastTs = ts;

    ctx.clearRect(0, 0, W, H);
    const t = ts * 0.001;

    // Update + draw particles — no shadowBlur (huge GPU cost eliminated)
    particles.forEach(p => {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 180 && dist > 0) {
        p.vx += (dx / dist) * 0.01;
        p.vy += (dy / dist) * 0.01;
      }
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x  += p.vx;
      p.y  += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      const alpha = p.alpha * (0.7 + 0.3 * Math.sin(t * 1.4 + p.pulse));
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Connecting lines — single pass, no ctx.save/restore per line
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const d2   = dx * dx + dy * dy; // avoid sqrt unless close
        if (d2 < 8100) { // 90² = 8100
          ctx.globalAlpha = (1 - Math.sqrt(d2) / 90) * 0.1;
          ctx.strokeStyle = particles[i].color;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(draw);

  // Truly pause rAF work when hero is scrolled out of view
  const heroObs = new IntersectionObserver(entries => {
    paused = !entries[0].isIntersecting;
    canvas.style.display = paused ? 'none' : 'block';
  }, { threshold: 0 });
  heroObs.observe(hero);
})();

/* ── 5. SECTION ENTRANCE STAGGER ────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Stagger children of xp-list, skills, plat-grid on entrance
  const staggerTargets = [
    { selector: '.xp-list',   child: '.xp-item',   delay: 80  },
    { selector: '.skills',    child: '.skill',      delay: 40  },
    { selector: '.plat-grid', child: '.plat',       delay: 60  },
    { selector: '.proj-grid-new', child: '.r',      delay: 80  },
  ];

  staggerTargets.forEach(({ selector, child, delay }) => {
    document.querySelectorAll(selector).forEach(container => {
      const children = container.querySelectorAll(child);
      children.forEach((el, i) => {
        el.style.transitionDelay = `${i * delay}ms`;
      });

      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        children.forEach(el => el.classList.add('in'));
        obs.unobserve(container);
      }, { threshold: 0.1 });

      obs.observe(container);
    });
  });
})();

/* ── 6. CONTACT ME DROPDOWN ─────────────── */
(function () {
  const btn      = document.getElementById('contact-dropdown-btn');
  const dropdown = document.getElementById('contact-dropdown');
  if (!btn || !dropdown) return;

  function open() {
    dropdown.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    dropdown.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.contains('open') ? close() : open();
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) close();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();

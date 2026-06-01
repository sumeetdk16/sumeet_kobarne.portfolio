/* ═══════════════════════════════════════════
   PAPER DESIGN GRAIN GRADIENT — Hero Background only
   Uses @paper-design/shaders GrainGradient
   Colors: orange hsl(14,100%,57%) · yellow hsl(45,100%,51%) · pink hsl(340,82%,52%)
   ═══════════════════════════════════════════ */
import {
  ShaderMount,
  grainGradientFragmentShader,
  grainGradientMeta,
  getShaderColorFromString,
  getShaderNoiseTexture,
  GrainGradientShapes,
} from '@paper-design/shaders';

(function () {
  // Always mark page as ready so CSS opacity gates don't block content
  document.documentElement.classList.add('shader-ready');

  // Only run shader on pages that have a hero section
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  /*
   * Mount on a fixed full-viewport div so ShaderMount's ResizeObserver
   * always sees real pixel dimensions. We control visibility via opacity
   * based on scroll position — fades out as user scrolls past the hero.
   */
  const shaderWrapper = document.createElement('div');
  shaderWrapper.id = 'hero-shader';
  shaderWrapper.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100vw',
    'height:100vh',
    'z-index:0',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.6s ease',
  ].join(';');
  document.body.insertBefore(shaderWrapper, document.body.firstChild);

  // Add fallback gradient background
  const isDarkTheme = document.documentElement.dataset.theme !== 'light';
  shaderWrapper.style.background = isDarkTheme 
    ? 'radial-gradient(ellipse at 30% 40%, rgba(251, 146, 60, 0.09) 0%, rgba(250, 204, 21, 0.06) 25%, rgba(244, 114, 182, 0.05) 50%, transparent 70%)'
    : 'radial-gradient(ellipse at 30% 40%, rgba(251, 146, 60, 0.05) 0%, rgba(250, 204, 21, 0.03) 25%, rgba(244, 114, 182, 0.02) 50%, transparent 70%)';

  // Store color conversion function globally for theme switching
  window.__getShaderColor = getShaderColorFromString;

  // Color palette — adapts to current theme
  const isDark = document.documentElement.dataset.theme !== 'light';
  const colorBack = getShaderColorFromString(
    isDark ? 'hsl(0, 0%, 0%)' : 'hsl(30, 33%, 96%)'
  );
  const colors = [
    getShaderColorFromString('hsl(14, 100%, 57%)'),   // orange
    getShaderColorFromString('hsl(45, 100%, 51%)'),   // yellow
    getShaderColorFromString('hsl(340, 82%, 52%)'),   // pink/red
  ];

  const paddedColors = [...colors];
  while (paddedColors.length < grainGradientMeta.maxColorCount) {
    paddedColors.push([0, 0, 0, 0]);
  }

  const noiseTexture = getShaderNoiseTexture();

  const uniforms = {
    u_colorBack: colorBack,
    u_colors: paddedColors,
    u_colorsCount: colors.length,
    u_softness: 0.76,
    u_intensity: 0.28,
    u_noise: 0,
    u_shape: GrainGradientShapes.corners,
    u_offsetX: 0,
    u_offsetY: 0,
    u_scale: 1,
    u_rotation: 0,
    u_noiseTexture: noiseTexture,
    u_originX: 0.5,
    u_originY: 0.5,
    u_worldWidth: 0,
    u_worldHeight: 0,
    u_fit: 0,
  };

  let shaderMount;
  let shaderInitialized = false;
  
  // (shader-ready already set at top of IIFE)
  function initShader(retryCount = 0) {
    try {
      shaderMount = new ShaderMount(shaderWrapper, grainGradientFragmentShader, uniforms, {}, 1);
      window.__shaderMount = shaderMount;
      // Store initial background color for smooth theme transitions
      window.__shaderCurrentBg = [...colorBack];
      window.__shaderBgRaf = null;
      shaderInitialized = true;
      
      // Fade in shader once initialized
      requestAnimationFrame(() => {
        shaderWrapper.style.opacity = '1';
      });
      
      console.log('Paper Shaders: GrainGradient initialized successfully');
    } catch (e) {
      console.warn('Paper Shaders: initialization attempt failed', e);
      
      // Retry up to 3 times with increasing delays
      if (retryCount < 3) {
        const delay = (retryCount + 1) * 500; // 500ms, 1000ms, 1500ms
        console.log(`Retrying shader initialization in ${delay}ms...`);
        setTimeout(() => initShader(retryCount + 1), delay);
      } else {
        console.warn('Paper Shaders: could not initialize after 3 attempts, using fallback gradient');
        // Keep fallback gradient visible
        shaderWrapper.style.opacity = '1';
      }
    }
  }
  
  // Wait for DOM to be fully ready before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initShader());
  } else {
    // DOM already loaded, initialize immediately
    initShader();
  }

  // Fade shader out as user scrolls past the hero section
  function updateShaderVisibility() {
    if (!shaderWrapper) return;
    
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const fadeStart = window.innerHeight * 0.6;
    const fadeEnd = 0;
    
    if (heroBottom >= fadeStart) {
      if (shaderInitialized) {
        shaderWrapper.style.opacity = '1';
        if (shaderMount) shaderMount.setSpeed(1);
      }
    } else if (heroBottom <= fadeEnd) {
      shaderWrapper.style.opacity = '0';
      if (shaderMount) shaderMount.setSpeed(0); // pause when invisible
    } else {
      const t = heroBottom / fadeStart;
      const opacity = Math.max(0, Math.min(1, t));
      shaderWrapper.style.opacity = String(opacity);
      if (shaderMount) shaderMount.setSpeed(1);
    }
  }

  window.addEventListener('scroll', updateShaderVisibility, { passive: true });
  
  // Initial visibility check after a short delay to ensure shader is ready
  setTimeout(updateShaderVisibility, 100);

  document.addEventListener('visibilitychange', () => {
    if (!shaderMount) return;
    shaderMount.setSpeed(document.hidden ? 0 : 1);
  });
})();

/* ═══════════════════════════════════════════
   THEME
═══════════════════════════════════════════ */
(function () {
  const html = document.documentElement;
  const KEY = 'rbp-theme';
  const saved = localStorage.getItem(KEY) || 'dark';
  html.dataset.theme = saved;
  const btn = document.getElementById('theme-btn');

  const ICON_SUN  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z"/></svg>`;
  const ICON_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7zm-6 5a8 8 0 0 0 15.062 3.762A9 9 0 0 1 8.238 4.938 7.999 7.999 0 0 0 4 12z"/></svg>`;

  if (btn) btn.innerHTML = saved === 'dark' ? ICON_SUN : ICON_MOON;

  window.__setTheme = function (t) {
    // Add transitioning class to coordinate all theme changes
    html.classList.add('theme-transitioning');
    
    html.dataset.theme = t;
    localStorage.setItem(KEY, t);
    const b = document.getElementById('theme-btn');
    if (b) b.innerHTML = t === 'dark' ? ICON_SUN : ICON_MOON;

    // Update fallback gradient background on the shader wrapper
    const shaderWrapper = document.getElementById('hero-shader');
    if (shaderWrapper) {
      const fallbackGradient = t === 'light'
        ? 'radial-gradient(ellipse at 30% 40%, rgba(251, 146, 60, 0.05) 0%, rgba(250, 204, 21, 0.03) 25%, rgba(244, 114, 182, 0.02) 50%, transparent 70%)'
        : 'radial-gradient(ellipse at 30% 40%, rgba(251, 146, 60, 0.09) 0%, rgba(250, 204, 21, 0.06) 25%, rgba(244, 114, 182, 0.05) 50%, transparent 70%)';
      shaderWrapper.style.background = fallbackGradient;
    }

    // Update shader background colour — cancel any in-flight animation first
    if (window.__shaderMount && window.__getShaderColor) {
      try {
        // Cancel previous animation frame if one is running
        if (window.__shaderBgRaf) {
          cancelAnimationFrame(window.__shaderBgRaf);
          window.__shaderBgRaf = null;
        }

        const targetBg = t === 'light'
          ? window.__getShaderColor('hsl(30, 33%, 96%)')
          : window.__getShaderColor('hsl(0, 0%, 0%)');

        // Always snapshot the CURRENT live value (updated every frame)
        const snapBg = window.__shaderCurrentBg
          ? [...window.__shaderCurrentBg]
          : (t === 'light'
              ? window.__getShaderColor('hsl(0, 0%, 0%)')
              : window.__getShaderColor('hsl(30, 33%, 96%)'));

        const duration = 500;
        const startTime = performance.now();

        // Force-set u_colorBack by wiping the cache entry first
        function forceSetColorBack(color) {
          const sm = window.__shaderMount;
          if (!sm) return;
          if (sm.uniformCache) sm.uniformCache['u_colorBack'] = null;
          sm.setUniforms({ u_colorBack: color });
        }

        function animateShaderBg(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const interpolated = snapBg.map((v, i) => v + (targetBg[i] - v) * eased);

          // Keep live snapshot updated every frame
          window.__shaderCurrentBg = [...interpolated];
          forceSetColorBack(interpolated);

          if (progress < 1) {
            window.__shaderBgRaf = requestAnimationFrame(animateShaderBg);
          } else {
            window.__shaderBgRaf = null;
            window.__shaderCurrentBg = [...targetBg];
            forceSetColorBack(targetBg);
          }
        }

        window.__shaderBgRaf = requestAnimationFrame(animateShaderBg);
      } catch (e) {
        console.warn('Failed to update shader theme:', e);
      }
    }
    
    // Remove transitioning class after transition completes
    setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 500);
  };
  if (btn) btn.addEventListener('click', () => {
    window.__setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  });
})();

/* ═══════════════════════════════════════════
   NAV INDICATOR (spring slide)
═══════════════════════════════════════════ */
(function () {
  const pill = document.querySelector('.nav-pill');
  const ind = document.querySelector('.nav-ind');
  const links = document.querySelectorAll('.nav-a');
  if (!pill || !ind || !links.length) return;

  function moveTo(el) {
    const pr = pill.getBoundingClientRect(), lr = el.getBoundingClientRect();
    ind.style.cssText += `;left:${lr.left - pr.left}px;top:${lr.top - pr.top}px;width:${lr.width}px;height:${lr.height}px`;
  }
  const active = document.querySelector('.nav-a.on');
  if (active) { ind.style.transition = 'none'; moveTo(active); requestAnimationFrame(() => { ind.style.transition = ''; }); }

  links.forEach(a => {
    a.addEventListener('mouseenter', () => moveTo(a));
    a.addEventListener('mouseleave', () => { const on = document.querySelector('.nav-a.on'); if (on) moveTo(on); });
  });
})();

/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
(function () {
  const els = document.querySelectorAll('.r');

  // Fallback: if IntersectionObserver never fires (e.g. elements already in view
  // on load, or observer blocked), reveal everything after 800ms
  const fallback = setTimeout(() => {
    els.forEach(el => el.classList.add('in'));
  }, 800);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
    // If all elements are revealed, clear the fallback
    if (document.querySelectorAll('.r:not(.in)').length === 0) {
      clearTimeout(fallback);
    }
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  els.forEach(el => obs.observe(el));

  // Also immediately reveal elements already in the viewport on load
  requestAnimationFrame(() => {
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in');
      }
    });
  });
})();

/* ═══════════════════════════════════════════
   COPY EMAIL
═══════════════════════════════════════════ */
window.copyMail = function (email) {
  navigator.clipboard.writeText(email).then(() => {
    document.querySelectorAll('.copy-btn').forEach(b => {
      const span = b.querySelector('span');
      b.classList.add('copy-ok');
      if (span) { const old = span.textContent; span.textContent = 'Copied!'; setTimeout(() => { span.textContent = old; b.classList.remove('copy-ok'); }, 2400); }
    });
  });
};

/* ═══════════════════════════════════════════
   PORTRAIT MAGNETIC
═══════════════════════════════════════════ */
(function () {
  const wrap = document.querySelector('.portrait');
  const img = wrap && wrap.querySelector('img');
  if (!wrap || !img) return;
  wrap.addEventListener('mousemove', e => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    img.style.transform = `translate(${x * 10}px,${y * 10}px) scale(1.04)`;
  });
  wrap.addEventListener('mouseleave', () => { img.style.transform = ''; });
})();

/* Smooth anchor scroll */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ═══════════════════════════════════════════
   PROJECT CARD MOUSE TRACKING & TILT
   ═══════════════════════════════════════════ */
(function () {
  const cards = document.querySelectorAll('.proj-card-new');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
      
      // Subtle tilt effect
      const centerX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const centerY = (e.clientY - rect.top - rect.height / 2) / rect.height;
      const rotateX = centerY * -5; // max 5deg tilt
      const rotateY = centerX * 5;
      card.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════
   CONTACT FORM SUBMISSION HANDLER
   ═══════════════════════════════════════════ */
window.handleContactFormSubmit = function (event) {
  event.preventDefault();
  const form    = event.target;
  const name    = document.getElementById('contact-name').value;
  const email   = document.getElementById('contact-email').value;
  const message = document.getElementById('contact-message').value;
  const subject = encodeURIComponent(`Message from ${name}`);
  const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  window.location.href = `mailto:kobarne21@gmail.com?subject=${subject}&body=${body}`;

  // Reset form + show polite feedback after a brief delay
  setTimeout(function () {
    form.reset();
    var status = form.querySelector('.form-status');
    if (status) {
      status.textContent = 'Email client opened — your message is pre-filled and ready to send.';
      status.classList.add('visible');
      setTimeout(function () {
        status.classList.remove('visible');
      }, 6000);
    }
  }, 600);
};


/* ═══════════════════════════════════════════
   MOBILE NAV — Hamburger drawer
═══════════════════════════════════════════ */
(function () {
  const hamburger = document.getElementById('nav-hamburger');
  const drawer    = document.getElementById('nav-drawer');
  const backdrop  = document.getElementById('nav-drawer-backdrop');
  const drawerThemeBtn = document.getElementById('nav-drawer-theme-btn');

  if (!hamburger || !drawer) return;

  // Sync drawer theme button icon with main theme button
  function syncDrawerThemeIcon() {
    if (!drawerThemeBtn) return;
    const mainBtn = document.getElementById('theme-btn');
    if (mainBtn) drawerThemeBtn.innerHTML = mainBtn.innerHTML;
  }
  syncDrawerThemeIcon();

  // Observe main theme button changes to keep drawer in sync
  const mainBtn = document.getElementById('theme-btn');
  if (mainBtn) {
    new MutationObserver(syncDrawerThemeIcon).observe(mainBtn, { childList: true, subtree: true });
  }

  function openDrawer() {
    drawer.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  // Close on backdrop click
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Close button (× inside the drawer panel)
  const closeBtn = document.getElementById('drawer-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Drawer theme button triggers main theme toggle
  if (drawerThemeBtn) {
    drawerThemeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      window.__setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
      syncDrawerThemeIcon();
      closeDrawer();
    });
  }

  // Close drawer on link click (navigation)
  drawer.querySelectorAll('.nav-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
})();

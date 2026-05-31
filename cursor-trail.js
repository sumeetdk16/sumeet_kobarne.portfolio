/* ═══════════════════════════════════════════
   CURSOR RIBBON EFFECT
   Faithful port of ReactBits Ribbons component
   Config: colors=F97316, baseThickness=5,
           maxAge=600, speedMultiplier=0.5,
           enableShaderEffect=true, enableFade=true
   ═══════════════════════════════════════════ */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth <= 1024) return; // Disable on tablets and mobile

  /* ── Config (mirrors ReactBits props) ── */
  const CONFIG = {
    colors:             ['#FF9800'],
    baseSpring:         0.03,
    baseFriction:       0.9,
    baseThickness:      5,
    offsetFactor:       0.05,
    maxAge:             600,
    pointCount:         50,
    speedMultiplier:    0.5,
    enableFade:         true,
    enableShaderEffect: true,
    effectAmplitude:    2,
  };

  /* ── Canvas setup ── */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:100vw', 'height:100vh',
    'pointer-events:none', 'z-index:9999',
  ].join(';');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Mouse tracking (normalised –1..1 like OGL) ── */
  const mouse = { x: 0, y: 0 };
  let mouseInited = false;

  document.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / W) * 2 - 1;
    mouse.y = -(e.clientY / H) * 2 + 1;
    mouseInited = true;
  });
  document.addEventListener('touchmove', e => {
    if (!e.touches.length) return;
    mouse.x =  (e.touches[0].clientX / W) * 2 - 1;
    mouse.y = -(e.touches[0].clientY / H) * 2 + 1;
    mouseInited = true;
  }, { passive: true });

  /* ── Build one ribbon per color ── */
  const center = (CONFIG.colors.length - 1) / 2;

  const ribbons = CONFIG.colors.map((hex, index) => {
    const spring    = CONFIG.baseSpring    + (Math.random() - 0.5) * 0.01;
    const friction  = CONFIG.baseFriction  + (Math.random() - 0.5) * 0.01;
    const thickness = CONFIG.baseThickness + (Math.random() - 0.5) * 1;

    // offset so multiple ribbons fan out slightly
    const offsetX = (index - center) * CONFIG.offsetFactor + (Math.random() - 0.5) * 0.005;
    const offsetY = (Math.random() - 0.5) * 0.05;

    // points in normalised space
    const points = Array.from({ length: CONFIG.pointCount }, () => ({ x: 0, y: 0 }));

    // parse hex → rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return {
      spring, friction, thickness,
      offsetX, offsetY,
      points,
      vx: 0, vy: 0,   // velocity of head point
      r, g, b,
    };
  });

  /* ── Convert normalised coords → screen px ── */
  function toScreen(nx, ny) {
    return {
      sx: (nx + 1) * 0.5 * W,
      sy: (1 - (ny + 1) * 0.5) * H,
    };
  }

  /* ── Animation loop ── */
  let lastTime = performance.now();

  function update() {
    requestAnimationFrame(update);

    const now = performance.now();
    const dt  = now - lastTime;
    lastTime  = now;

    ctx.clearRect(0, 0, W, H);

    if (!mouseInited) return;

    ribbons.forEach(ribbon => {
      const { points, spring, friction, offsetX, offsetY, thickness, r, g, b } = ribbon;

      /* spring physics on head point (mirrors OGL impl exactly) */
      const targetX = mouse.x + offsetX;
      const targetY = mouse.y + offsetY;

      const ax = (targetX - points[0].x) * spring;
      const ay = (targetY - points[0].y) * spring;

      ribbon.vx = (ribbon.vx + ax) * friction;
      ribbon.vy = (ribbon.vy + ay) * friction;

      points[0].x += ribbon.vx;
      points[0].y += ribbon.vy;

      /* each subsequent point lerps toward the one ahead of it */
      for (let i = 1; i < points.length; i++) {
        const segmentDelay = CONFIG.maxAge / (points.length - 1);
        const alpha = Math.min(1, (dt * CONFIG.speedMultiplier) / segmentDelay);
        points[i].x += (points[i - 1].x - points[i].x) * alpha;
        points[i].y += (points[i - 1].y - points[i].y) * alpha;
      }

      /* ── Draw as a smooth polyline ── */
      if (points.length < 2) return;

      // convert all points to screen space
      const sp = points.map(p => toScreen(p.x, p.y));

      // shader-effect: sinusoidal lateral wobble (mirrors GLSL)
      const t = now * 0.001;
      if (CONFIG.enableShaderEffect) {
        for (let i = 0; i < sp.length; i++) {
          const progress = i / (sp.length - 1);
          // compute normal direction from neighbours
          const prev = sp[Math.max(0, i - 1)];
          const next = sp[Math.min(sp.length - 1, i + 1)];
          const dx = next.sx - prev.sx;
          const dy = next.sy - prev.sy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny =  dx / len;
          // wobble magnitude tapers toward tail
          const wobble = Math.sin(t + sp[i].sx * 0.01) * CONFIG.effectAmplitude * (1 - progress);
          sp[i].sx += nx * wobble;
          sp[i].sy += ny * wobble;
        }
      }

      // draw with per-segment opacity for fade
      for (let i = 1; i < sp.length; i++) {
        const progress = i / (sp.length - 1);   // 0 = head, 1 = tail

        let opacity = 1;
        if (CONFIG.enableFade) {
          // smoothstep fade matching GLSL: 1 - smoothstep(0,1,vUV.y)
          const s = progress;
          opacity = 1 - s * s * (3 - 2 * s);
        }
        if (opacity < 0.01) continue;

        // taper thickness toward tail
        const w = thickness * (1 - progress * 0.6);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = `rgb(${r},${g},${b})`;
        ctx.lineWidth   = Math.max(0.5, w);
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        // glow (shader effect)
        if (CONFIG.enableShaderEffect) {
          ctx.shadowColor = `rgba(${r},${g},${b},${opacity * 0.6})`;
          ctx.shadowBlur  = w * 3;
        }

        ctx.beginPath();
        ctx.moveTo(sp[i - 1].sx, sp[i - 1].sy);
        ctx.lineTo(sp[i].sx,     sp[i].sy);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  update();

  /* ── Pause when tab hidden ── */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) lastTime = performance.now();
  });
})();

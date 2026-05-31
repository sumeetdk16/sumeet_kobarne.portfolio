/* ═══════════════════════════════════════════
   MAGNET LINES — Vanilla JS port of ReactBits MagnetLines
   Line color: #ffa530 (orange, matching site accent)
   ═══════════════════════════════════════════ */
(function () {
  const LINE_COLOR  = '#FF9800';
  const LINE_WIDTH  = '2px';
  const LINE_HEIGHT = '24px';
  const ROWS        = 13;
  const COLS        = 13;
  const BASE_ANGLE  = -10;

  function initMagnetLines(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    container.style.gridTemplateRows    = `repeat(${ROWS}, 1fr)`;

    const total = ROWS * COLS;
    const spans = [];

    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.style.setProperty('--rotate', `${BASE_ANGLE}deg`);
      span.style.backgroundColor = LINE_COLOR;
      span.style.width  = LINE_WIDTH;
      span.style.height = LINE_HEIGHT;
      container.appendChild(span);
      spans.push(span);
    }

    function onPointerMove(e) {
      const pointer = { x: e.clientX, y: e.clientY };
      spans.forEach(item => {
        const rect = item.getBoundingClientRect();
        const cx = rect.x + rect.width  / 2;
        const cy = rect.y + rect.height / 2;
        const b  = pointer.x - cx;
        const a  = pointer.y - cy;
        const c  = Math.sqrt(a * a + b * b) || 1;
        const r  = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > cy ? 1 : -1);
        item.style.setProperty('--rotate', `${r}deg`);
      });
    }

    window.addEventListener('pointermove', onPointerMove);

    // Seed initial angle from center span
    if (spans.length) {
      const mid  = spans[Math.floor(spans.length / 2)];
      const rect = mid.getBoundingClientRect();
      onPointerMove({ clientX: rect.x, clientY: rect.y });
    }
  }

  // Init all magnet-lines containers on the page
  document.querySelectorAll('.magnet-lines-container').forEach(el => {
    initMagnetLines(el.id);
  });
})();

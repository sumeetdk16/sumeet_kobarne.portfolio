/**
 * ASCII Wave Effect — theme-aware
 * Reads --bg / --fg CSS variables so it matches dark ↔ light toggle.
 */
(function () {
  function getThemeColors() {
    var style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim() || '#0a0a0a',
      fg: style.getPropertyValue('--fg').trim() || '#f0f0f0'
    };
  }

  function initAsciiWave() {
    var container = document.getElementById('ascii-wave-container');
    if (!container) return;

    var canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var ASCII_CHARS = '@%#*+=-:. ';
    // Larger chars on small screens = fewer cells = less work per frame
    var CHAR_SIZE = window.innerWidth < 600 ? 13 : 10;
    var SPEED = 1;

    var width, height, cols, rows;
    var time = 0;
    var ORANGE = '#FB943B';
    var colors = getThemeColors();
    var visible = true;  // paused when off-screen
    var lastTs  = 0;     // 30fps throttle

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2x
      var rect = container.getBoundingClientRect();
      width  = rect.width;
      height = rect.height;
      canvas.width  = Math.round(width  * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width  = width  + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = CHAR_SIZE + 'px monospace';
      ctx.textBaseline = 'top';
      cols = Math.floor(width  / CHAR_SIZE);
      rows = Math.floor(height / CHAR_SIZE);
    }

    function draw(ts) {
      requestAnimationFrame(draw);
      if (!visible) return;        // don't draw when scrolled off-screen
      if (ts - lastTs < 33) return; // ~30fps cap
      lastTs = ts;

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = ORANGE;

      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var w1 = Math.sin((x * 0.10) + (time * 0.020 * SPEED));
          var w2 = Math.sin((y * 0.10) + (time * 0.030 * SPEED));
          var w3 = Math.sin((x * 0.05 + y * 0.05) + (time * 0.010 * SPEED));
          var combined = (w1 + w2 + w3) / 3;

          var idx  = Math.floor(((combined + 1) / 2) * (ASCII_CHARS.length - 1));
          var char = ASCII_CHARS[Math.max(0, Math.min(idx, ASCII_CHARS.length - 1))];
          var waveFactor = Math.max(0, 1 - (y / (rows - 1)));
          var yOff = Math.sin((x * 0.2) + (time * 0.02 * SPEED)) * 5 * waveFactor;

          ctx.globalAlpha = 0.25 + Math.abs(combined) * 0.75;
          ctx.fillText(char, x * CHAR_SIZE, y * CHAR_SIZE + yOff);
        }
      }
      ctx.globalAlpha = 1;
      time++;
    }

    // Pause rendering when not in viewport
    new IntersectionObserver(function(entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(container);

    // Re-read theme colours on toggle
    new MutationObserver(function () {
      colors = getThemeColors();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    var resizeTimer;
    resize();
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150); // debounce
    });
    requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAsciiWave);
  } else {
    initAsciiWave();
  }
})();

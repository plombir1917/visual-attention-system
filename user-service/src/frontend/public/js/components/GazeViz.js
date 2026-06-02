const { ref, onMounted, onUnmounted } = Vue;

export const GazeViz = {
  setup() {
    const canvas = ref(null);
    let raf;
    let mouseX = -1,
      mouseY = -1;
    let isInsideCanvas = false;
    let hasEnteredOnce = false;
    let _onMove, _onEnter, _onLeave;

    onMounted(() => {
      const c = canvas.value;
      const ctx = c.getContext('2d');
      const W = (c.width = 560);
      const H = (c.height = 500);

      _onMove = (e) => {
        const r = c.getBoundingClientRect();
        mouseX = (e.clientX - r.left) * (W / r.width);
        mouseY = (e.clientY - r.top) * (H / r.height);
      };
      _onEnter = () => {
        isInsideCanvas = true;
        hasEnteredOnce = true;
      };
      _onLeave = () => {
        isInsideCanvas = false;
        mouseX = -1;
        mouseY = -1;
      };
      c.addEventListener('mousemove', _onMove, { passive: true });
      c.addEventListener('mouseenter', _onEnter);
      c.addEventListener('mouseleave', _onLeave);

      const BLUE = '#2563eb';
      const BLUE_A = 'rgba(37,99,235,0.6)';
      const BLUE_DIM = 'rgba(37,99,235,0.1)';
      const BLACK = '#0b0e1a';
      const GRAY = '#64748b';
      const GREEN = '#16a34a';
      const RED = '#dc2626';

      let t = 0;
      const autoPts = [
        [W * 0.5, H * 0.48],
        [W * 0.34, H * 0.38],
        [W * 0.66, H * 0.38],
        [W * 0.5, H * 0.58],
        [W * 0.62, H * 0.34],
        [W * 0.4, H * 0.62],
      ];
      let autoIdx = 0;
      let gx = W / 2,
        gy = H / 2;
      let theta = 4.2,
        alpha = 12.8;
      let attention = true;

      const ease = (a, b, k) => a + (b - a) * k;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      }

      function draw() {
        t += 0.012;
        ctx.clearRect(0, 0, W, H);

        ctx.fillStyle = '#f7f8fc';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(37,99,235,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
          ctx.stroke();
        }
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }

        const hasRealMouse = isInsideCanvas && mouseX >= 0;
        const isDistracted = hasEnteredOnce && !isInsideCanvas;

        if (hasRealMouse) {
          gx = ease(gx, clamp(mouseX, 10, W - 10), 0.12);
          gy = ease(gy, clamp(mouseY, 10, H - 10), 0.12);
          attention = true;
        } else if (isDistracted) {
          // взгляд заморожен — gx/gy не обновляются
          attention = false;
        } else {
          // начальное блуждание до первого входа курсора
          const [ax, ay] = autoPts[autoIdx];
          if (Math.hypot(gx - ax, gy - ay) < 4)
            autoIdx = (autoIdx + 1) % autoPts.length;
          gx = ease(gx, ax, 0.022);
          gy = ease(gy, ay, 0.022);
          attention = true;
        }

        theta = +(theta + (Math.random() - 0.5) * 0.06).toFixed(1);
        alpha = +(alpha + (Math.random() - 0.5) * 0.08).toFixed(1);

        const fx = W / 2,
          fy = H / 2 - 10,
          fw = 210,
          fh = 260;

        // face detection box
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 1.5;
        const cn = 24;
        [
          [fx - fw / 2, fy - fh / 2],
          [fx + fw / 2, fy - fh / 2],
          [fx + fw / 2, fy + fh / 2],
          [fx - fw / 2, fy + fh / 2],
        ].forEach(([cx2, cy2], i) => {
          const sx = i === 1 || i === 2 ? -1 : 1,
            sy = i >= 2 ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(cx2, cy2 + sy * cn);
          ctx.lineTo(cx2, cy2);
          ctx.lineTo(cx2 + sx * cn, cy2);
          ctx.stroke();
        });
        ctx.fillStyle = BLUE;
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillText('ЛИЦО ОБНАРУЖЕНО', fx - fw / 2 + 4, fy - fh / 2 - 7);

        // scan line
        const sl = ((t * 55) % (fh + 20)) - 10 + fy - fh / 2;
        const sg = ctx.createLinearGradient(fx - fw / 2, sl, fx + fw / 2, sl);
        sg.addColorStop(0, 'rgba(37,99,235,0)');
        sg.addColorStop(0.5, 'rgba(37,99,235,.35)');
        sg.addColorStop(1, 'rgba(37,99,235,0)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx - fw / 2, sl);
        ctx.lineTo(fx + fw / 2, sl);
        ctx.stroke();

        // landmarks
        const lm = [
          [fx - 55, fy - 65],
          [fx + 55, fy - 65],
          [fx, fy - 5],
          [fx - 32, fy + 65],
          [fx + 32, fy + 65],
          [fx, fy + 86],
          [fx - 85, fy - 40],
          [fx + 85, fy - 40],
        ];
        ctx.fillStyle = 'rgba(37,99,235,0.65)';
        lm.forEach(([lx, ly]) => {
          ctx.beginPath();
          ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // eyes
        [
          [fx - 55, fy - 65],
          [fx + 55, fy - 65],
        ].forEach(([ex, ey]) => {
          ctx.strokeStyle = BLUE;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 24, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(37,99,235,.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ex, ey, 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = BLUE;
          ctx.beginPath();
          ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // gaze vector
        const emx = fx,
          emy = fy - 65;
        ctx.strokeStyle = BLUE_A;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(emx, emy);
        ctx.lineTo(gx, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        const ang = Math.atan2(gy - emy, gx - emx);
        ctx.fillStyle = BLUE_A;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(
          gx - 10 * Math.cos(ang - 0.4),
          gy - 10 * Math.sin(ang - 0.4),
        );
        ctx.lineTo(
          gx - 10 * Math.cos(ang + 0.4),
          gy - 10 * Math.sin(ang + 0.4),
        );
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = BLUE_DIM;
        ctx.beginPath();
        ctx.arc(gx, gy, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // head pose axes
        const hx = fx + 84,
          hy = fy - 18;
        [
          { dx: 1, dy: -0.1, c: 'rgba(220,38,38,.7)', l: 'X' },
          { dx: 0, dy: -1, c: 'rgba(22,163,74,.7)', l: 'Y' },
          { dx: 0.15, dy: 0.5, c: 'rgba(37,99,235,.7)', l: 'Z' },
        ].forEach(({ dx, dy, c, l }) => {
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + dx * 30, hy + dy * 30);
          ctx.stroke();
          ctx.fillStyle = c;
          ctx.font = '9px Inter';
          ctx.fillText(l, hx + dx * 35, hy + dy * 35 + 3);
        });

        // pulse rings
        [64, 105, 148].forEach((r, i) => {
          const a = (Math.sin(t * 0.7 + i * 1.2) * 0.5 + 0.5) * 0.07 + 0.015;
          ctx.strokeStyle = `rgba(37,99,235,${a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2 - 10, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        // status card
        const statusColor = attention ? GREEN : RED;
        const statusText = attention ? 'ФОКУС' : 'ОТВЛЕЧЕНИЕ';
        const cardW = 150;

        roundRect(W - cardW - 14, 14, cardW, 62, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const dotA = 0.5 + 0.5 * Math.sin(t * 3);
        ctx.fillStyle = statusColor
          .replace(')', `, ${dotA})`)
          .replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(W - cardW - 14 + 16, 14 + 20, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = GRAY;
        ctx.font = '600 9px Inter';
        ctx.fillText('СТАТУС', W - cardW - 14 + 26, 14 + 24);
        ctx.fillStyle = statusColor;
        ctx.font = '800 17px Inter';
        ctx.fillText(statusText, W - cardW - 14 + 10, 14 + 50);

        // angles card
        roundRect(12, H - 78, 148, 64, 10);
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = GRAY;
        ctx.font = '600 9px Inter';
        ctx.fillText('ПОВОРОТ ГОЛОВЫ', 24, H - 56);
        ctx.fillStyle = BLACK;
        ctx.font = '600 11px Inter';
        ctx.fillText(
          'θ ' + theta.toFixed(1) + '°  α ' + alpha.toFixed(1) + '°',
          24,
          H - 38,
        );
        ctx.fillStyle = BLUE;
        ctx.font = '600 9px Inter';
        ctx.fillText('ВЗГЛЯД · ЗАФИКСИРОВАН', 24, H - 20);

        raf = requestAnimationFrame(draw);
      }

      draw();
    });

    onUnmounted(() => {
      cancelAnimationFrame(raf);
      const c = canvas.value;
      if (c && _onMove) {
        c.removeEventListener('mousemove', _onMove);
        c.removeEventListener('mouseenter', _onEnter);
        c.removeEventListener('mouseleave', _onLeave);
      }
    });

    return { canvas };
  },
  template: `
    <canvas ref="canvas"
      style="max-width:100%;height:auto;border-radius:20px;cursor:crosshair;
             box-shadow:0 8px 48px rgba(37,99,235,.1),0 2px 12px rgba(0,0,0,.07)">
    </canvas>
  `,
};

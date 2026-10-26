// Scriptura - draws a verse card as a 1080×1350 PNG for saving or sharing

const CARD_STYLES = {
  night: { from: '#1E2858', to: '#0B1026', ink: '#EEF0FA', accent: '#E9C46F', muted: 'rgba(238, 240, 250, 0.5)', edge: 'rgba(233, 196, 111, 0.38)', grain: 255 },
  paper: { from: '#FFFFFF', to: '#F1EFE8', ink: '#151A30', accent: '#3343B0', muted: 'rgba(21, 26, 48, 0.45)', edge: 'rgba(51, 67, 176, 0.22)', grain: 0 },
  olive: { from: '#4B5A33', to: '#263019', ink: '#F3F1E3', accent: '#E6CD8C', muted: 'rgba(243, 241, 227, 0.55)', edge: 'rgba(230, 205, 140, 0.34)', grain: 255 }
};

const SERIF = 'Fraunces, "Noto Serif Telugu", "Iowan Old Style", Georgia, serif';
const SANS = 'Geist, system-ui, sans-serif';

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function grainPattern(ctx, tone, strength) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = tone;
    img.data[i + 3] = Math.random() * 255 * strength;
  }
  tctx.putImageData(img, 0, 0);
  return ctx.createPattern(tile, 'repeat');
}

function spacedText(ctx, text, x, y, spacing) {
  let cursor = x;
  [...text].forEach(ch => {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  });
}

export async function renderVerseCard({ text, reference, style = 'night' }) {
  // Telugu has no italic; set it upright
  const fontStyle = /[ఀ-౿]/.test(text) ? 'normal' : 'italic';
  const s = CARD_STYLES[style] || CARD_STYLES.night;
  const W = 1080;
  const H = 1350;
  const PAD = 128;

  try {
    await Promise.all([
      document.fonts.load(`${fontStyle} 400 60px ${SERIF}`, text),
      document.fonts.load(`600 36px ${SERIF}`),
      document.fonts.load(`600 30px ${SANS}`)
    ]);
  } catch { /* fall back to system fonts */ }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createRadialGradient(W * 0.15, 0, 0, W * 0.15, 0, H * 1.15);
  bg.addColorStop(0, s.from);
  bg.addColorStop(0.62, s.to);
  bg.addColorStop(1, s.to);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = grainPattern(ctx, s.grain, s.grain ? 0.06 : 0.07);
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = s.edge;
  ctx.lineWidth = 2;
  roundedRect(ctx, 44, 44, W - 88, H - 88, 34);
  ctx.stroke();

  // Fit the verse: shrink the type until it sits comfortably in the frame
  const quote = `“${text}”`;
  const maxWidth = W - PAD * 2;
  let size = 78;
  let lines = [];
  for (; size >= 32; size -= 2) {
    ctx.font = `${fontStyle} 400 ${size}px ${SERIF}`;
    lines = wrapLines(ctx, quote, maxWidth);
    if (lines.length * size * 1.4 <= H - 560) break;
  }
  const lineHeight = size * 1.4;
  const blockHeight = 92 + lines.length * lineHeight + 64;
  let y = Math.max(200, (H - blockHeight) / 2 - 20);

  // Cross mark
  ctx.strokeStyle = s.accent;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(PAD + 24, y);
  ctx.lineTo(PAD + 24, y + 64);
  ctx.moveTo(PAD + 2, y + 22);
  ctx.lineTo(PAD + 46, y + 22);
  ctx.stroke();
  y += 92 + size;

  ctx.fillStyle = s.ink;
  ctx.font = `${fontStyle} 400 ${size}px ${SERIF}`;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    // Hang the opening quote mark into the margin
    const indent = i === 0 ? -ctx.measureText('“').width * 0.9 : 0;
    ctx.fillText(line, PAD + indent, y);
    y += lineHeight;
  });

  ctx.fillStyle = s.accent;
  ctx.font = `600 30px ${SANS}`;
  spacedText(ctx, reference.toUpperCase(), PAD, y + 34, 4);

  ctx.fillStyle = s.muted;
  ctx.font = `600 36px ${SERIF}`;
  ctx.textAlign = 'right';
  ctx.fillText('The Bible', W - PAD, H - 116);
  ctx.font = `500 25px ${SANS}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText('Designed by DC', W - PAD, H - 74);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not draw the card'))), 'image/png');
  });
}

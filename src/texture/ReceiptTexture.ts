import * as THREE from 'three';

// ============================================================
// Personal info - replace these with real data
// ============================================================
const INFO = {
  name: 'ZHANG SAN',
  title: 'Full-Stack Pixel Alchemist',
  bio: '"Turning caffeine into pixels since 2018"',
  role: 'SENIOR_DEV',
  register: 'PIPELINE_03',
  date: '2026-04-16',
  skills: [
    { name: 'React.js', price: '$49.99' },
    { name: 'Three.js / WebGL', price: '$42.00' },
    { name: 'TypeScript', price: '$38.50' },
    { name: 'Node.js', price: '$35.99' },
    { name: 'Shader Programming', qty: 2, price: '$29.99' },
    { name: 'Docker & K8s', price: '$22.00' },
    { name: 'CSS Wizardry', qty: 3, price: '$9.99' },
    { name: 'Git Fu', price: '$15.00' },
  ],
  subtotal: '$243.46',
  tax: '$17.04',
  total: '$264.00',
  openSource: [
    { name: 'cool-project', stars: '1.2k' },
    { name: 'awesome-tool', stars: '856' },
    { name: 'fun-library', stars: '420' },
  ],
  email: 'name@example.com',
};
// ============================================================

function addPaperGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, _w: number, h: number): void {
  const barWidths = [2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3];
  let cx = x;
  let isBlack = true;
  for (const bw of barWidths) {
    if (isBlack) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(cx, y, bw * 2, h);
    }
    cx += bw * 2;
    isBlack = !isBlack;
  }
}

export function createReceiptTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 1536;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f4efe5';
  ctx.fillRect(0, 0, W, H);

  // Paper grain
  addPaperGrain(ctx, W, H);

  // Re-apply background with slight opacity to tint the grain
  ctx.fillStyle = 'rgba(244, 239, 229, 0.35)';
  ctx.fillRect(0, 0, W, H);

  // Text settings
  const TEXT_COLOR = '#1a1a1a';
  const DIM_COLOR = '#777777';
  const PAD = 32;
  const INNER_W = W - PAD * 2;
  let y = 44;

  // Font size constants (px)
  const SZ_LARGE = 36;
  const SZ_BOLD = 26;
  const SZ_NORMAL = 22;
  const SZ_SMALL = 18;

  const applyFont = (size: number, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px "Courier New", Courier, monospace`;
    return size;
  };

  const line = (text: string, size = SZ_NORMAL, bold = false, color?: string, align?: CanvasTextAlign) => {
    applyFont(size, bold);
    ctx.fillStyle = color || TEXT_COLOR;
    ctx.textAlign = align || 'left';
    const tx = align === 'center' ? W / 2 : align === 'right' ? W - PAD : PAD;
    ctx.fillText(text, tx, y);
    y += size * 1.6;
  };

  const divider = (char = '─') => {
    applyFont(SZ_SMALL);
    ctx.fillStyle = DIM_COLOR;
    ctx.textAlign = 'left';
    const charW = ctx.measureText(char).width;
    const count = Math.floor(INNER_W / charW);
    ctx.fillText(char.repeat(count), PAD, y);
    y += 24;
  };

  const twoCol = (left: string, right: string, size = SZ_NORMAL, bold = false, color?: string) => {
    applyFont(size, bold);
    ctx.fillStyle = color || TEXT_COLOR;
    ctx.textAlign = 'left';
    ctx.fillText(left, PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(right, W - PAD, y);
    y += size * 1.6;
  };

  // ── Header ──
  y += 12;
  line(INFO.name, SZ_LARGE, true, TEXT_COLOR, 'center');
  line(INFO.title, SZ_NORMAL, false, '#444444', 'center');
  y += 4;

  // Bio (word wrap with small font)
  applyFont(SZ_SMALL);
  ctx.fillStyle = DIM_COLOR;
  ctx.textAlign = 'center';
  const bioWords = INFO.bio.split(' ');
  let bioLine = '';
  for (const word of bioWords) {
    const test = bioLine ? bioLine + ' ' + word : word;
    if (ctx.measureText(test).width > INNER_W - 20) {
      ctx.fillText(bioLine, W / 2, y);
      y += SZ_SMALL * 1.5;
      bioLine = word;
    } else {
      bioLine = test;
    }
  }
  if (bioLine) { ctx.fillText(bioLine, W / 2, y); y += SZ_SMALL * 1.6; }

  y += 8;
  divider('═');

  // ── Meta ──
  line(`Date: ${INFO.date}`, SZ_SMALL, false, DIM_COLOR);
  line(`Cashier: ${INFO.role}`, SZ_SMALL, false, DIM_COLOR);
  line(`Register: ${INFO.register}`, SZ_SMALL, false, DIM_COLOR);
  y += 4;
  divider();

  // ── Skills ──
  line('SKILLS PURCHASED:', SZ_BOLD, true, '#333333');
  divider();
  y += 2;

  for (const skill of INFO.skills) {
    const label = skill.qty ? `${skill.qty}x ${skill.name}` : `1x ${skill.name}`;
    twoCol(label, skill.price);
  }

  y += 6;
  divider();
  twoCol('SUBTOTAL', INFO.subtotal);
  twoCol('TAX (GL_FLOAT 7%)', INFO.tax);
  twoCol('CAFFEINE SURCHARGE', '$3.50', SZ_SMALL);
  divider();
  twoCol('TOTAL', INFO.total, SZ_BOLD, true);
  divider('═');

  // ── Open Source ──
  y += 6;
  line('★ OPEN SOURCE REWARDS ★', SZ_BOLD, true, '#333333', 'center');
  divider();
  for (const proj of INFO.openSource) {
    twoCol(`> ${proj.name}`, `★ ${proj.stars}`);
  }
  y += 4;
  divider();

  // ── Contact ──
  line('CONTACT:', SZ_BOLD, true, '#333333');
  line(`EMAIL: ${INFO.email}`, SZ_NORMAL, false, TEXT_COLOR);
  y += 6;
  divider();

  // ── Return policy ──
  applyFont(SZ_SMALL);
  ctx.fillStyle = DIM_COLOR;
  ctx.textAlign = 'left';
  const policy = [
    'RETURN POLICY:',
    'No refunds on compiled shaders.',
    'Fragment disputes must be filed',
    'within one render pass.',
    'All sales final upon gl.flush().',
  ];
  for (const l of policy) {
    ctx.fillText(l, PAD, y);
    y += SZ_SMALL * 1.5;
  }
  y += 10;
  divider();

  // ── Barcode ──
  y += 10;
  drawBarcode(ctx, PAD, y, INNER_W, 52);
  y += 68;

  applyFont(SZ_SMALL);
  ctx.fillStyle = DIM_COLOR;
  ctx.textAlign = 'center';
  ctx.fillText('*4096-BEEF-CAFE-F00D*', W / 2, y);
  y += SZ_SMALL * 1.6;

  divider();
  line('Thank you for visiting!', SZ_SMALL, false, DIM_COLOR, 'center');
  line('Follow us @GLEmporium', SZ_SMALL, false, DIM_COLOR, 'center');

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

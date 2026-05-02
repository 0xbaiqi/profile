import * as THREE from 'three';

export interface ProfileData {
  title: string;
  name: string;
  identity: string;
  status: string;
  quote: string[];
  skills: string[];
  github: string;
  email: string;
  links: { label: string; href: string }[];
}

const DEFAULT_PROFILE: ProfileData = {
  title: 'WANTED',
  name: '',
  identity: '',
  status: '',
  quote: [],
  skills: [],
  github: '',
  email: '',
  links: [],
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function addParchmentGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i]     = Math.min(255, Math.max(0, d[i]     + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * 0.8));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.5));
  }
  ctx.putImageData(id, 0, 0);
}

function addLightAgingEffects(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.78);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(18,8,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 35; i++) {
    ctx.beginPath();
    ctx.arc(rand(0,w), rand(0,h), rand(1,5), 0, Math.PI*2);
    ctx.fillStyle = `rgba(${rand(30,55)},${rand(12,25)},0,1)`;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSwirls(ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: 1|-1) {
  ctx.save();
  ctx.strokeStyle = '#2a1200';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const ox = cx + dir * 10;
  ctx.beginPath();
  ctx.moveTo(ox, cy - 12);
  ctx.bezierCurveTo(ox+dir*26, cy-12, ox+dir*34, cy+1, ox+dir*16, cy+3);
  ctx.bezierCurveTo(ox+dir*4,  cy+5,  ox+dir*12, cy+15, ox+dir*28, cy+13);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ox+dir*28, cy+13, 2.5, 0, Math.PI*2);
  ctx.fillStyle = '#2a1200';
  ctx.fill();
  ctx.restore();
}

/** Draw portrait: real photo if provided, otherwise silhouette */
function drawPortrait(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  avatarImg?: HTMLImageElement
) {
  // Background
  const bg = ctx.createLinearGradient(x, y, x+w, y+h);
  bg.addColorStop(0, '#d4b880');
  bg.addColorStop(1, '#b09050');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  if (avatarImg) {
    // Draw real photo, cover-fit into the portrait rect
    const srcW = avatarImg.naturalWidth;
    const srcH = avatarImg.naturalHeight;
    const srcAspect = srcW / srcH;
    const dstAspect = w / h;
    let sx = 0, sy = 0, sw = srcW, sh = srcH;
    if (srcAspect > dstAspect) {
      sw = srcH * dstAspect;
      sx = (srcW - sw) / 2;
    } else {
      sh = srcW / dstAspect;
      sy = (srcH - sh) / 2;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(avatarImg, sx, sy, sw, sh, x, y, w, h);
    // Sepia/aged overlay on photo
    ctx.fillStyle = 'rgba(120,70,10,0.22)';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else {
    // Silhouette fallback (no red anywhere)
    const cx = x + w/2;
    ctx.fillStyle = '#4a2c0e';
    ctx.beginPath();
    ctx.moveTo(cx-w*0.30, y+h);
    ctx.quadraticCurveTo(cx-w*0.34, y+h*0.50, cx, y+h*0.44);
    ctx.quadraticCurveTo(cx+w*0.34, y+h*0.50, cx+w*0.30, y+h);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y+h*0.30, w*0.19, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#7a5520';
    ctx.beginPath();
    ctx.ellipse(cx, y+h*0.175, w*0.34, w*0.064, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y+h*0.125, w*0.19, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#5a3a00';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx-w*0.19, y+h*0.178);
    ctx.lineTo(cx+w*0.19, y+h*0.178);
    ctx.stroke();
  }

  // Portrait border
  ctx.strokeStyle = '#1e0d00';
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 2;
  ctx.strokeRect(x+5, y+5, w-10, h-10);
}

/** Main entry — call with optional preloaded image */
export function drawWantedPoster(
  canvas: HTMLCanvasElement,
  avatarImg?: HTMLImageElement,
  profile: ProfileData = DEFAULT_PROFILE
) {
  const INFO = profile;
  const W = 600;
  const H = 1175;  // matches mesh ratio COLS=22 ROWS=42
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Parchment base
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#f5edcc');
  bg.addColorStop(0.4, '#ede0b0');
  bg.addColorStop(0.8, '#e4d098');
  bg.addColorStop(1,   '#d8c080');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  addParchmentGrain(ctx, W, H);

  const INK = '#1e0d00';
  const PAD = 26;

  // Outer border
  ctx.strokeStyle = INK; ctx.lineWidth = 9;
  ctx.strokeRect(8, 8, W-16, H-16);
  ctx.lineWidth = 2.5;
  ctx.strokeRect(17, 17, W-34, H-34);
  for (const [cx2, cy2] of [[22,22],[W-22,22],[22,H-22],[W-22,H-22]] as [number,number][]) {
    ctx.lineWidth = 1.8; ctx.strokeStyle = INK;
    ctx.strokeRect(cx2-7, cy2-7, 14, 14);
    ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI*2);
    ctx.fillStyle = INK; ctx.fill();
  }

  let y = 22;

  const hdiv = (thickness = 2, padX = PAD) => {
    ctx.strokeStyle = INK; ctx.lineWidth = thickness;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(W-padX, y); ctx.stroke();
    y += thickness + 5;
  };

  // ── HIRE ME ──
  y += 8;
  ctx.font = 'bold 120px "Times New Roman",serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(10,4,0,0.28)';
  ctx.fillText(INFO.title, W/2+4, y+112+3, W-PAD*2);
  ctx.fillStyle = '#1a0900';
  ctx.fillText(INFO.title, W/2, y+112, W-PAD*2);
  y += 126;

  hdiv(2.5);
  y += 4;

  // ── Portrait ──
  const pPad = 24;
  const pW   = W - pPad*2;
  const pH   = 430;          // portrait height
  drawPortrait(ctx, pPad, y, pW, pH, avatarImg);
  y += pH + 10;

  hdiv(2.5);
  y += 8;

  // ── 引言 ──
  const quoteLines = INFO.quote;
  const quoteFontSize = 19;
  ctx.font = `italic ${quoteFontSize}px "STKaiti","KaiTi","Kaiti SC","Times New Roman",serif`;
  ctx.fillStyle = '#3a1e00';
  ctx.textAlign = 'center';
  const qLineH = quoteFontSize * 1.7;
  const qTotalH = quoteLines.length * qLineH;
  // small swirls flanking first line
  drawSwirls(ctx, W/2 - (W - PAD*2)*0.42, y + qLineH*0.6, -1);
  drawSwirls(ctx, W/2 + (W - PAD*2)*0.42, y + qLineH*0.6,  1);
  for (let i = 0; i < quoteLines.length; i++) {
    ctx.fillText(quoteLines[i], W/2, y + (i + 1) * qLineH - 4, W - PAD*2);
  }
  y += qTotalH + 10;

  // ── 姓名 ──
  ctx.font = 'bold 76px "STKaiti","KaiTi","Kaiti SC","Times New Roman",serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(10,4,0,0.26)';
  ctx.fillText(INFO.name, W/2+3, y+70+3, W-PAD*2);
  ctx.fillStyle = '#1a0900';
  ctx.fillText(INFO.name, W/2, y+70, W-PAD*2);
  y += 80;

  // Identity line
  ctx.font = '18px "Times New Roman",serif';
  ctx.fillStyle = '#3a2200';
  ctx.textAlign = 'center';
  ctx.fillText(INFO.identity, W/2, y+18, W-PAD*2);
  y += 32;

  hdiv(1.5, PAD+15);
  y += 4;

  // ── 专业技能 (single column, larger text) ──
  ctx.font = 'bold 14px "STKaiti","KaiTi",serif';
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText('专业技能', W/2, y+13);
  y += 22;

  ctx.fillStyle = '#2a1400';
  ctx.textAlign = 'left';
  for (const skill of INFO.skills) {
    ctx.font = '15px "STSong","SimSun","PingFang SC",serif';
    ctx.fillText(`·  ${skill}`, PAD+4, y+14, W-PAD*2-8);
    y += 22;
  }
  y += 4;

  hdiv(2);
  y += 6;

  // ── Footer: contact ──
  // Contact left, status right — no 海军
  ctx.font = '14px "Courier New",monospace';
  ctx.fillStyle = '#2a1400';
  ctx.textAlign = 'left';
  ctx.fillText(`✉  ${INFO.email}`, PAD, y+15);
  ctx.fillText(`⌥  ${INFO.github}`, PAD, y+33);

  ctx.font = 'bold 20px "STKaiti","KaiTi",serif';
  ctx.fillStyle = INK;
  ctx.textAlign = 'right';
  ctx.fillText(INFO.status, W-PAD, y+24);

  y += 44;
  hdiv(2.5);

  addLightAgingEffects(ctx, W, H);
}

/** Async: fetches profile.json + avatar, then draws — returns a live-updating CanvasTexture */
export function createWantedPosterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  drawWantedPoster(canvas, undefined, DEFAULT_PROFILE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const base = import.meta.env.BASE_URL;
  const profileUrl = import.meta.env.VITE_PROFILE_URL || (base + 'profile.json');

  // Load profile.json + avatar in parallel, then redraw
  Promise.all([
    fetch(profileUrl).then(r => r.json()).then(d => ({ ...DEFAULT_PROFILE, ...d })).catch(() => DEFAULT_PROFILE),
    new Promise<HTMLImageElement | undefined>(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(undefined);
      img.src = base + 'images/avatar.jpg';
    }),
  ]).then(([profile, img]) => {
    drawWantedPoster(canvas, img, profile as ProfileData);
    texture.needsUpdate = true;
  });

  return texture;
}

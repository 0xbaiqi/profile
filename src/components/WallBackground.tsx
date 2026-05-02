import { useMemo } from 'react';
import * as THREE from 'three';

// ── helpers ────────────────────────────────────────────────
const r = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number) => Math.min(255, Math.max(0, v));

function glow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  color: string, alpha = 0.35
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// ── Cork board ──────────────────────────────────────────────
function drawCorkBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Base cork color
  const bg = ctx.createLinearGradient(x, y, x + w, y + h);
  bg.addColorStop(0, '#b5813e');
  bg.addColorStop(0.5, '#a8722e');
  bg.addColorStop(1, '#9a6520');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Cork grain stipple
  for (let i = 0; i < 2800; i++) {
    const px = x + r(0, w);
    const py = y + r(0, h);
    const pr = r(0.5, 2.8);
    const alpha = r(0.08, 0.28);
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(60,30,5,${alpha})`
      : `rgba(220,160,60,${alpha * 0.6})`;
    ctx.fill();
  }

  // Subtle horizontal fiber lines
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 24; i++) {
    const fy = y + r(0, h);
    ctx.strokeStyle = '#3a1a00';
    ctx.lineWidth = r(0.5, 2);
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.bezierCurveTo(x + w * 0.3, fy + r(-3, 3), x + w * 0.7, fy + r(-3, 3), x + w, fy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Wooden frame around cork board
  ctx.strokeStyle = '#4a2c0a';
  ctx.lineWidth = 10;
  ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);
  ctx.strokeStyle = '#7a4a18';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 13, y - 13, w + 26, h + 26);

  // Corner pins
  for (const [px, py] of [
    [x + 18, y + 18], [x + w - 18, y + 18],
    [x + 18, y + h - 18], [x + w - 18, y + h - 18],
    [x + w / 2, y + 18],
  ] as [number, number][]) {
    // Pin shadow
    ctx.beginPath();
    ctx.arc(px + 2, py + 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    // Pin head
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    const pinGrad = ctx.createRadialGradient(px - 1, py - 1, 0, px, py, 5);
    pinGrad.addColorStop(0, '#ff6060');
    pinGrad.addColorStop(1, '#aa1010');
    ctx.fillStyle = pinGrad;
    ctx.fill();
  }
}

// ── Monitor screen ──────────────────────────────────────────
function drawScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Screen bezel
  ctx.fillStyle = '#111118';
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 8, y - 8, w + 16, h + 16);

  // Screen glow
  const sg = ctx.createLinearGradient(x, y, x, y + h);
  sg.addColorStop(0, '#050a1a');
  sg.addColorStop(1, '#020510');
  ctx.fillStyle = sg;
  ctx.fillRect(x, y, w, h);

  // Scanlines
  ctx.globalAlpha = 0.06;
  for (let sy = y; sy < y + h; sy += 3) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, sy, w, 1);
  }
  ctx.globalAlpha = 1;
}

function drawKLineChart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  drawScreen(ctx, x, y, w, h);

  const PAD = 12;
  const ch = h - PAD * 2;
  const cw = w - PAD * 2;

  // Grid lines
  ctx.strokeStyle = 'rgba(0,200,255,0.12)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = y + PAD + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(x + PAD, gy); ctx.lineTo(x + w - PAD, gy); ctx.stroke();
  }

  // Candlesticks
  const candles = [
    [0.38, 0.42, 0.28, 0.58, true],
    [0.42, 0.40, 0.35, 0.52, false],
    [0.40, 0.52, 0.36, 0.58, true],
    [0.52, 0.48, 0.44, 0.60, false],
    [0.48, 0.60, 0.44, 0.66, true],
    [0.60, 0.55, 0.50, 0.68, false],
    [0.55, 0.65, 0.52, 0.70, true],
    [0.65, 0.58, 0.52, 0.72, false],
    [0.58, 0.72, 0.55, 0.78, true],
    [0.72, 0.68, 0.65, 0.80, false],
    [0.68, 0.80, 0.65, 0.85, true],
    [0.80, 0.75, 0.70, 0.88, false],
  ];
  const N = candles.length;
  const cw2 = cw / (N * 1.6);

  for (let i = 0; i < N; i++) {
    const [o, c, lo, hi, bull] = candles[i] as [number, number, number, number, boolean];
    const cx2 = x + PAD + (i + 0.5) * (cw / N);
    const toY = (v: number) => y + PAD + ch * (1 - v);
    const color = bull ? '#00ff88' : '#ff4444';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    // Wick
    ctx.beginPath();
    ctx.moveTo(cx2, toY(hi)); ctx.lineTo(cx2, toY(lo));
    ctx.stroke();
    // Body
    ctx.fillStyle = color;
    const bodyTop = toY(Math.max(o, c));
    const bodyH = Math.abs(toY(o) - toY(c)) || 2;
    ctx.fillRect(cx2 - cw2 / 2, bodyTop, cw2, bodyH);
  }

  // Trend line
  ctx.strokeStyle = 'rgba(255,200,0,0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x + PAD, y + PAD + ch * 0.65);
  ctx.lineTo(x + w - PAD, y + PAD + ch * 0.15);
  ctx.stroke();
  ctx.setLineDash([]);

  // 龙头战法 label
  ctx.save();
  ctx.shadowColor = '#ffaa00';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 15px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillStyle = '#ffcc00';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('龙头战法', x + PAD, y + PAD + 2);
  ctx.restore();

  // Big number display (price)
  ctx.save();
  ctx.font = 'bold 20px "Courier New",monospace';
  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'right';
  ctx.fillText('▲ 99,999.00', x + w - PAD, y + PAD + 2);
  ctx.restore();
}

// ── Dragon silhouette ──────────────────────────────────────
function drawDragon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 80, size / 80);

  const neonColor = 'rgba(255,160,0,0.85)';
  ctx.strokeStyle = neonColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur = 12;
  ctx.lineCap = 'round';

  // Dragon body - S curve
  ctx.beginPath();
  ctx.moveTo(-35, 20);
  ctx.bezierCurveTo(-20, -10, 10, 30, 30, 0);
  ctx.bezierCurveTo(50, -25, 60, 10, 50, 30);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.moveTo(-35, 20);
  ctx.bezierCurveTo(-50, 5, -55, -10, -42, -18);
  ctx.bezierCurveTo(-30, -25, -20, -15, -25, -5);
  ctx.stroke();

  // Horn
  ctx.beginPath();
  ctx.moveTo(-45, -12);
  ctx.lineTo(-52, -28);
  ctx.stroke();

  // Wing
  ctx.beginPath();
  ctx.moveTo(5, 15);
  ctx.bezierCurveTo(-5, -15, 25, -30, 35, -15);
  ctx.bezierCurveTo(25, -5, 15, 5, 5, 15);
  ctx.stroke();

  ctx.restore();
}

// ── Edison bulb ────────────────────────────────────────────
function drawEdisonBulb(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Wire
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 80);
  ctx.lineTo(x, y - 20);
  ctx.stroke();

  // Warm glow bloom
  glow(ctx, x, y + 10, 110, 'rgb(255,160,50)', 0.22);
  glow(ctx, x, y + 10, 60, 'rgb(255,200,80)', 0.35);

  // Bulb glass
  ctx.save();
  ctx.shadowColor = 'rgba(255,180,60,0.8)';
  ctx.shadowBlur = 20;
  const bulbGrad = ctx.createRadialGradient(x - 8, y - 10, 2, x, y + 5, 28);
  bulbGrad.addColorStop(0, 'rgba(255,240,160,0.9)');
  bulbGrad.addColorStop(0.6, 'rgba(255,160,40,0.6)');
  bulbGrad.addColorStop(1, 'rgba(180,80,10,0.2)');
  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.arc(x, y + 5, 28, 0, Math.PI * 2);
  ctx.fill();
  // Glass outline
  ctx.strokeStyle = 'rgba(255,200,80,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Base/socket
  ctx.fillStyle = '#443322';
  ctx.fillRect(x - 10, y + 26, 20, 12);
  ctx.restore();

  // Filament
  ctx.strokeStyle = 'rgba(255,240,100,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 20);
  ctx.bezierCurveTo(x - 2, y + 5, x + 2, y + 5, x + 6, y + 20);
  ctx.stroke();
}

// ── Jade seal ─────────────────────────────────────────────
function drawJadeSeal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  // Seal body (octagonal jade)
  const jadeGrad = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 2, x, y, size * 0.7);
  jadeGrad.addColorStop(0, '#a0e8c0');
  jadeGrad.addColorStop(0.4, '#4aaa78');
  jadeGrad.addColorStop(0.8, '#226644');
  jadeGrad.addColorStop(1, '#1a4a30');
  ctx.fillStyle = jadeGrad;
  ctx.shadowColor = 'rgba(0,200,100,0.4)';
  ctx.shadowBlur = 16;

  // Octagon
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,255,160,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Carved "白起" text
  ctx.shadowBlur = 0;
  ctx.font = `bold ${size * 0.38}px "STKaiti","KaiTi","Kaiti SC",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText('白', x + 1, y - size * 0.22 + 1);
  ctx.fillText('起', x + 1, y + size * 0.22 + 1);
  ctx.fillStyle = '#c8ffe0';
  ctx.fillText('白', x, y - size * 0.22);
  ctx.fillText('起', x, y + size * 0.22);

  // Seal frame line
  ctx.strokeStyle = 'rgba(150,255,180,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(x - size * 0.45, y - size * 0.55, size * 0.9, size * 1.1);
  ctx.stroke();
  ctx.restore();
}

// ── Ethereum coins ────────────────────────────────────────
function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r2: number, label: string, color1: string, color2: string) {
  const cg = ctx.createRadialGradient(x - r2 * 0.3, y - r2 * 0.3, 1, x, y, r2);
  cg.addColorStop(0, color1);
  cg.addColorStop(1, color2);
  ctx.fillStyle = cg;
  ctx.shadowColor = color1;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, r2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `bold ${r2 * 0.65}px "Courier New",monospace`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
}

// ── Network topology (Docker) ─────────────────────────────
function drawDockerTopology(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const nodes: [number, number, string][] = [
    [x + w * 0.15, y + h * 0.2,  'nginx'],
    [x + w * 0.5,  y + h * 0.1,  'api'],
    [x + w * 0.85, y + h * 0.2,  'redis'],
    [x + w * 0.5,  y + h * 0.5,  'db'],
    [x + w * 0.15, y + h * 0.7,  'mq'],
    [x + w * 0.85, y + h * 0.7,  'go'],
    [x + w * 0.5,  y + h * 0.85, 'k8s'],
  ];
  const edges = [[0,1],[1,2],[1,3],[3,4],[3,5],[4,6],[5,6],[0,4]];

  ctx.save();
  ctx.globalAlpha = 0.75;

  // Edges
  ctx.strokeStyle = 'rgba(0,200,255,0.25)';
  ctx.lineWidth = 1;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(nodes[a][0], nodes[a][1]);
    ctx.lineTo(nodes[b][0], nodes[b][1]);
    ctx.stroke();
  }

  // Nodes
  for (const [nx, ny, label] of nodes) {
    // Node circle
    ctx.fillStyle = 'rgba(0,180,255,0.15)';
    ctx.strokeStyle = 'rgba(0,200,255,0.6)';
    ctx.lineWidth = 1.2;
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(nx, ny, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Label
    ctx.font = '9px "Courier New",monospace';
    ctx.fillStyle = 'rgba(100,220,255,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, nx, ny);
  }
  ctx.restore();
}

// ── Solidity code snippet ─────────────────────────────────
function drawCodeSnippet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const lines = [
    { text: 'pragma solidity ^0.8.0;', color: 'rgba(100,200,255,0.7)' },
    { text: 'contract Baiqi {',        color: 'rgba(255,220,80,0.7)'  },
    { text: '  mapping(addr=>uint)',   color: 'rgba(200,200,200,0.6)' },
    { text: '  function deploy() {',  color: 'rgba(100,255,180,0.7)'  },
    { text: '    emit Hired(msg);',   color: 'rgba(200,200,200,0.6)' },
    { text: '  }',                    color: 'rgba(255,220,80,0.7)'  },
    { text: '}',                      color: 'rgba(255,220,80,0.7)'  },
  ];
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.font = '11px "Courier New",monospace';
  ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = lines[i].color;
    ctx.fillText(lines[i].text, x, y + i * 16, w);
  }
  ctx.restore();
}

// ── Keyboard ──────────────────────────────────────────────
function drawKeyboard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#1a1a2e';
  ctx.strokeStyle = '#334466';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  const rows = [14, 13, 12, 11];
  let ky = y + 5;
  for (const count of rows) {
    const kw = (w - 10) / count - 2;
    for (let i = 0; i < count; i++) {
      const kx = x + 5 + i * (kw + 2);
      ctx.fillStyle = `rgba(${Math.round(r(20,50))},${Math.round(r(30,60))},${Math.round(r(80,120))},0.9)`;
      ctx.fillRect(kx, ky, kw, h / 5 - 2);
      // Random key glow
      if (Math.random() < 0.15) {
        ctx.fillStyle = 'rgba(0,200,255,0.25)';
        ctx.fillRect(kx, ky, kw, h / 5 - 2);
      }
    }
    ky += h / 5;
  }
}

// ── Holographic frame ──────────────────────────────────────
function drawHoloFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  // Corner ticks
  const s = 14;
  for (const [cx2, cy2, sx, sy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]] as number[][]) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(cx2, cy2 + sy*s); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2 + sx*s, cy2); ctx.stroke();
  }
  ctx.restore();
}

// ── Main texture builder ───────────────────────────────────
function createCyberpunkBackground(): THREE.CanvasTexture {
  const W = 1024;
  const H = 768;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark gradient base
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, '#060810');
  base.addColorStop(0.4, '#080c18');
  base.addColorStop(1, '#040608');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle grid
  ctx.strokeStyle = 'rgba(0,80,180,0.08)';
  ctx.lineWidth = 0.5;
  for (let gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
  for (let gy = 0; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

  // 3. Cork board (center — behind poster)
  const corkX = 360, corkY = 18, corkW = 304, corkH = 730;
  drawCorkBoard(ctx, corkX, corkY, corkW, corkH);
  drawHoloFrame(ctx, corkX - 30, corkY - 30, corkW + 60, corkH + 60, 'rgba(0,200,255,1)');

  // 4. TOP: K-line monitors
  const monW = 310, monH = 160;
  // Left monitor
  drawKLineChart(ctx, 18, 8, monW, monH);
  // Right monitor
  drawKLineChart(ctx, W - monW - 18, 8, monW, monH);
  // Dragon between monitors
  drawDragon(ctx, W / 2, 80, 90);
  // "龙头战法" neon label below dragon
  ctx.save();
  ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffcc00';
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur = 14;
  ctx.fillText('龙头战法', W / 2, 140);
  ctx.restore();

  // 5. LEFT: Edison bulb
  drawEdisonBulb(ctx, 140, 300);

  // Left: Docker network topology
  drawDockerTopology(ctx, 18, 340, 310, 320);
  drawHoloFrame(ctx, 18, 340, 310, 320, 'rgba(0,200,255,1)');
  ctx.save();
  ctx.font = 'bold 10px "Courier New",monospace';
  ctx.fillStyle = 'rgba(0,200,255,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('DOCKER TOPOLOGY', 22, 346);
  ctx.restore();

  // 6. RIGHT: Jade seal
  drawJadeSeal(ctx, W - 100, 270, 48);
  ctx.save();
  ctx.font = '11px "Courier New",monospace';
  ctx.fillStyle = 'rgba(100,255,180,0.7)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,200,100,0.5)';
  ctx.shadowBlur = 6;
  ctx.fillText('大将令', W - 100, 336);
  ctx.restore();

  // Right: Coins shelf
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(W - 320, 360, 300, 8);

  drawCoin(ctx, W - 290, 340, 22, 'Ξ', '#c0c0ff', '#4040aa');
  drawCoin(ctx, W - 235, 340, 22, '₿', '#ffd060', '#c06010');
  drawCoin(ctx, W - 180, 340, 18, 'OP', '#ff6060', '#aa1010');

  // Gold dragon figurine hint
  ctx.save();
  ctx.globalAlpha = 0.7;
  drawDragon(ctx, W - 100, 400, 52);
  ctx.restore();

  // Right: Solidity code
  drawCodeSnippet(ctx, W - 315, 460, 290);
  drawHoloFrame(ctx, W - 318, 456, 296, 130, 'rgba(100,255,180,1)');
  ctx.save();
  ctx.font = 'bold 10px "Courier New",monospace';
  ctx.fillStyle = 'rgba(100,255,180,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('SOLIDITY CONTRACT', W - 314, 462);
  ctx.restore();

  // 7. BOTTOM: Desk surface
  const deskGrad = ctx.createLinearGradient(0, 650, 0, H);
  deskGrad.addColorStop(0, '#150e05');
  deskGrad.addColorStop(1, '#1e1408');
  ctx.fillStyle = deskGrad;
  ctx.fillRect(0, 650, W, H - 650);
  ctx.strokeStyle = '#332211';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 650); ctx.lineTo(W, 650); ctx.stroke();

  // Keyboard
  drawKeyboard(ctx, 200, 665, 380, 75);

  // Oscilloscope box
  ctx.fillStyle = '#0d1a0d';
  ctx.strokeStyle = '#224422';
  ctx.lineWidth = 1.5;
  ctx.fillRect(W - 200, 655, 170, 90);
  ctx.strokeRect(W - 200, 655, 170, 90);
  // Oscilloscope screen
  ctx.fillStyle = '#001a00';
  ctx.fillRect(W - 192, 662, 100, 55);
  ctx.strokeStyle = '#00ff44';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W - 192, 689);
  for (let px = 0; px <= 100; px += 5) {
    ctx.lineTo(W - 192 + px, 689 + Math.sin(px * 0.3) * 12);
  }
  ctx.stroke();
  // "龙头战法" label sticker
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(W - 190, 724, 75, 16);
  ctx.font = 'bold 10px "PingFang SC",sans-serif';
  ctx.fillStyle = '#1a0800';
  ctx.textAlign = 'center';
  ctx.fillText('龙头战法', W - 152, 735);

  // 8. Ambient neon glow accents
  glow(ctx, 140, 310, 160, 'rgb(255,160,40)', 0.18);  // bulb
  glow(ctx, W - 100, 270, 90,  'rgb(0,200,100)', 0.15); // jade
  glow(ctx, W / 2, 80, 100, 'rgb(255,140,0)', 0.12);    // dragon
  glow(ctx, W / 2, H / 2, 200, 'rgb(0,100,255)', 0.06); // center ambient

  // 9. Scanlines overlay
  ctx.globalAlpha = 0.04;
  for (let sy = 0; sy < H; sy += 2) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, sy, W, 1);
  }
  ctx.globalAlpha = 1;

  // 10. Noise grain
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    d[i] = clamp(d[i] + n); d[i+1] = clamp(d[i+1] + n); d[i+2] = clamp(d[i+2] + n);
  }
  ctx.putImageData(id, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export default function WallBackground() {
  const tex = useMemo(() => createCyberpunkBackground(), []);

  return (
    <mesh position={[0, 0.1, -0.8]} receiveShadow>
      {/* Large enough to always fill viewport */}
      <planeGeometry args={[10, 7.5]} />
      <meshStandardMaterial
        map={tex}
        roughness={0.9}
        metalness={0.0}
        color="#ffffff"
        emissive="#111122"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

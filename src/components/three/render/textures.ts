import * as THREE from 'three';

/**
 * Procedural surface textures, painted once on canvases.
 * UVs are box-projected in metres, so `repeat` sets the real-world size of one tile.
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')!] as const;
}

function speckle(ctx: CanvasRenderingContext2D, size: number, r: () => number, n: number, alpha: number, light: boolean) {
  for (let i = 0; i < n; i++) {
    const s = r() * 2.2 + 0.4;
    ctx.fillStyle = light ? `rgba(255,255,255,${r() * alpha})` : `rgba(0,0,0,${r() * alpha})`;
    ctx.fillRect(r() * size, r() * size, s, s);
  }
}

function blotches(ctx: CanvasRenderingContext2D, size: number, r: () => number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = 30 + r() * 140;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > 0.5;
    g.addColorStop(0, dark ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    // draw the wrapped copies too, so the tile repeats without seams
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        ctx.restore();
      }
  }
}

function toTexture(c: HTMLCanvasElement, metres: number, srgb: boolean) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / metres, 1 / metres);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fair-faced concrete: 2.4 m tile, plywood panel joints and form-tie holes. */
function concrete(base: string, seed: number) {
  const S = 512;
  const r = rng(seed);
  const [c, ctx] = canvas(S);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, r, 20, 0.035);
  speckle(ctx, S, r, 7000, 0.08, false);
  speckle(ctx, S, r, 4000, 0.1, true);
  // panel joints every 1.2 m (half the tile)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1.5;
  for (const p of [0, S / 2]) {
    ctx.beginPath();
    ctx.moveTo(0, p + 0.75);
    ctx.lineTo(S, p + 0.75);
    ctx.moveTo(p + 0.75, 0);
    ctx.lineTo(p + 0.75, S);
    ctx.stroke();
  }
  // faint form-tie holes on a 0.6 m grid
  for (let x = S / 8; x < S; x += S / 4)
    for (let y = S / 8; y < S; y += S / 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  const [rc, rctx] = canvas(256);
  rctx.fillStyle = '#d0d0d0';
  rctx.fillRect(0, 0, 256, 256);
  speckle(rctx, 256, rng(seed + 1), 5000, 0.25, false);
  return { map: toTexture(c, 2.4, true), roughnessMap: toTexture(rc, 2.4, false) };
}

/** Lime-rendered coral stone (kashir): pale render with courses and stones showing where it has worn. 2 m tile. */
function coralStone() {
  const S = 512;
  const r = rng(7);
  const [c, ctx] = canvas(S);
  const pxPerM = S / 2;
  ctx.fillStyle = '#d6c9ae';
  ctx.fillRect(0, 0, S, S);
  // stones under the render, very low contrast
  const tones = ['#cdbd9b', '#c7b591', '#d3c4a3', '#c2af8a'];
  let y = 0;
  while (y < S) {
    const h = (0.26 + r() * 0.08) * pxPerM;
    let x = -r() * 0.3 * pxPerM;
    while (x < S) {
      const w = (0.38 + r() * 0.36) * pxPerM;
      ctx.fillStyle = tones[Math.floor(r() * tones.length)];
      ctx.globalAlpha = 0.55;
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 18; k++) {
        ctx.fillStyle = `rgba(70,52,30,${0.06 + r() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x + r() * w, y + r() * h, r() * 1.4 + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      x += w;
    }
    ctx.fillStyle = 'rgba(120,100,70,0.12)';
    ctx.fillRect(0, y, S, 1.5);
    y += h;
  }
  // render patches
  blotches(ctx, S, r, 22, 0.05);
  speckle(ctx, S, r, 5000, 0.06, false);
  const [rc, rctx] = canvas(128);
  rctx.fillStyle = '#f2f2f2';
  rctx.fillRect(0, 0, 128, 128);
  return { map: toTexture(c, 2, true), roughnessMap: toTexture(rc, 2, false) };
}

/** Mashrabiya lattice on a teak frame, for the roshan windows: 0.6 m tile. */
function lattice() {
  const S = 256;
  const r = rng(23);
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(0, 0, S, S);
  const frame = 16;
  const cell = (S / 2 - frame * 1.5) / 6;
  for (const ox of [frame, S / 2 + frame / 2]) {
    ctx.fillStyle = '#2b1a0d';
    ctx.fillRect(ox, frame, S / 2 - frame * 1.5, S - frame * 2);
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 14; j++) {
        ctx.fillStyle = `rgba(150,105,62,${0.75 + r() * 0.2})`;
        ctx.save();
        ctx.translate(ox + i * cell + cell / 2, frame + j * cell * 1.35 + cell / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-cell * 0.22, -cell * 0.22, cell * 0.44, cell * 0.44);
        ctx.restore();
      }
  }
  ctx.strokeStyle = 'rgba(40,24,12,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, S - 2, S - 2);
  return { map: toTexture(c, 0.6, true) };
}

/** Teak-like timber with grain running along the member: 1 m tile. */
function timber() {
  const S = 512;
  const r = rng(11);
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#7c5637';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 140; i++) {
    const y0 = r() * S;
    const amp = 2 + r() * 6;
    const freq = 0.004 + r() * 0.01;
    ctx.strokeStyle = r() > 0.5 ? `rgba(40,22,10,${0.12 + r() * 0.2})` : `rgba(190,140,90,${0.08 + r() * 0.12})`;
    ctx.lineWidth = 0.6 + r() * 1.6;
    ctx.beginPath();
    for (let x = 0; x <= S; x += 8) ctx.lineTo(x, y0 + Math.sin(x * freq + i) * amp);
    ctx.stroke();
  }
  speckle(ctx, S, r, 2000, 0.1, false);
  return { map: toTexture(c, 1, true) };
}

/** Lime screed for heritage floor tops. */
function screed() {
  const S = 256;
  const r = rng(19);
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#d8cfbe';
  ctx.fillRect(0, 0, S, S);
  blotches(ctx, S, r, 14, 0.06);
  speckle(ctx, S, r, 3000, 0.1, false);
  return { map: toTexture(c, 1.5, true) };
}

let cache: ReturnType<typeof build> | null = null;
function build() {
  return {
    concrete: concrete('#c4c0b8', 3),
    footing: concrete('#9e998f', 5),
    stone: coralStone(),
    lattice: lattice(),
    timber: timber(),
    screed: screed(),
  };
}

export function textures() {
  cache ??= build();
  return cache;
}

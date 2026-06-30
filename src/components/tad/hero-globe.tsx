'use client';

import React, { useEffect, useRef } from 'react';
import GPS_SATELLITES from '@/data/gps-satellites.json';

/* TAD-PAK hero globe — ported from the design pack (track-any-device-ui-guidelines › Globe).
   2D-canvas dotted globe whose dots form continents (point-in-polygon land test), with city pins
   across every continent, 31 orbiting satellites and signal arcs. Brand green, scroll-reactive.
   Hovering a satellite freezes its orbit and shows its name. */

// Satellite reference data — loaded from src/data/gps-satellites.json (the real GPS constellation:
// PRN, SVN, name/designation, block, launch origin). The number of orbiting satellites is driven by
// this list, and hovering one shows its name plus a PRN/SVN/block sub-line.
interface SatRecord { prn: number; svn: number; name: string; block: string; origin: string }
const SATS_DATA = GPS_SATELLITES as SatRecord[];
const SAT_COUNT = SATS_DATA.length;
const satTitle = (i: number) => SATS_DATA[i]?.name ?? `SAT-${String(i + 1).padStart(2, '0')}`;
const satSub = (i: number) => { const s = SATS_DATA[i]; return s ? `PRN ${s.prn} · SVN ${s.svn} · ${s.block}` : ''; };

// Draws a satellite's name (+ a mono sub-line) in a brand-green pill beside it. Canvas can't read CSS
// vars, so the font/colours are literal; the pill flips to the left of the marker near the right edge.
function drawSatLabel(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, sub: string, dpr: number, w: number) {
  const fs = 11 * dpr, sfs = 9 * dpr, padX = 8 * dpr, padY = 6 * dpr, gap = 12 * dpr, rr = 7 * dpr, lineGap = 3 * dpr;
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${fs}px "DM Mono", ui-monospace, monospace`;
  const tw = ctx.measureText(title).width;
  ctx.font = `500 ${sfs}px "DM Mono", ui-monospace, monospace`;
  const sw = sub ? ctx.measureText(sub).width : 0;
  const bw = Math.max(tw, sw) + padX * 2;
  const bh = (sub ? fs + sfs + lineGap : fs) + padY * 2;
  let bx = x + gap;
  if (bx + bw > w) bx = x - gap - bw;
  const by = y - bh / 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, rr); else ctx.rect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(1,65,28,0.94)';
  ctx.fill();
  ctx.font = `600 ${fs}px "DM Mono", ui-monospace, monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, bx + padX, by + padY + fs / 2);
  if (sub) {
    ctx.font = `500 ${sfs}px "DM Mono", ui-monospace, monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.fillText(sub, bx + padX, by + padY + fs + lineGap + sfs / 2);
  }
}

export function HeroGlobe({ cxFactor = 0.64, radiusFactor = 0.36 }: { cxFactor?: number; radiusFactor?: number } = {}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const N = 3000;
    const pts: number[][] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * 2.399963229;
      pts.push([Math.cos(phi) * r, y, Math.sin(phi) * r]);
    }
    const RAD = 180 / Math.PI;
    const COASTS: number[][][] = [
      [[-166, 65], [-156, 71], [-130, 70], [-110, 69], [-95, 69], [-81, 73], [-78, 62], [-64, 60], [-55, 52], [-67, 47], [-70, 43], [-74, 40], [-81, 31], [-80, 25], [-90, 29], [-97, 28], [-97, 22], [-105, 22], [-110, 23], [-117, 32], [-123, 38], [-124, 48], [-133, 55], [-147, 60], [-160, 56], [-165, 60]],
      [[-92, 16], [-87, 13], [-83, 8], [-78, 8], [-72, 11], [-62, 10], [-50, 0], [-35, -5], [-39, -13], [-48, -25], [-54, -34], [-58, -39], [-65, -43], [-69, -52], [-74, -50], [-72, -42], [-71, -30], [-71, -18], [-76, -14], [-81, -6], [-80, 2], [-78, 8], [-83, 9], [-88, 13], [-92, 16]],
      [[-16, 15], [-10, 28], [-5, 36], [10, 37], [20, 33], [25, 32], [32, 31], [35, 24], [43, 12], [51, 12], [48, 5], [41, -2], [40, -15], [35, -22], [27, -34], [20, -35], [18, -29], [12, -17], [9, -1], [5, 5], [-4, 5], [-8, 10]],
      [[-10, 37], [-9, 44], [-2, 49], [2, 51], [-5, 58], [7, 63], [18, 69], [28, 71], [30, 60], [28, 55], [40, 48], [47, 45], [42, 41], [28, 41], [24, 40], [19, 42], [13, 45], [8, 44], [3, 43]],
      [[42, 42], [50, 40], [50, 30], [57, 25], [67, 25], [72, 19], [77, 8], [80, 13], [90, 22], [97, 8], [104, 1], [106, 10], [110, 20], [120, 23], [122, 31], [121, 39], [127, 43], [133, 38], [140, 36], [142, 46], [135, 55], [160, 61], [170, 68], [155, 71], [110, 74], [80, 73], [68, 73], [55, 70], [50, 66], [58, 60], [58, 50], [50, 46]],
      [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [150, -25], [153, -32], [146, -38], [140, -38], [135, -35], [129, -32], [122, -34], [115, -34], [114, -28]],
      [[-45, 60], [-30, 60], [-20, 70], [-25, 80], [-40, 83], [-55, 80], [-55, 70], [-50, 64]],
      [[130, 31], [136, 34], [141, 40], [143, 43], [140, 36], [133, 33]],
      [[167, -46], [171, -44], [174, -41], [175, -37], [173, -41], [169, -44]],
      [[44, -16], [50, -15], [50, -25], [46, -25]],
    ];
    const pip = (lon: number, lat: number, poly: number[][]) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) c = !c;
      }
      return c;
    };
    const isLand = (p: number[]) => {
      const lat = Math.asin(Math.max(-1, Math.min(1, p[1]))) * RAD;
      if (lat < -62) return true;
      const lon = Math.atan2(p[2], p[0]) * RAD;
      for (const poly of COASTS) if (pip(lon, lat, poly)) return true;
      return false;
    };
    const land = pts.map(isLand);
    const toXYZ = (lat: number, lon: number) => {
      const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180;
      return [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)];
    };
    const pins = [
      // Pakistan (brand home — kept dense)
      [31.5, 74.3], [24.8, 67.0], [33.6, 73.0], [34.0, 71.5], [30.2, 67.0], [30.2, 71.5], [31.4, 73.1], [25.4, 68.4],
      // Asia / Middle East
      [25.2, 55.3], [24.7, 46.7], [25.3, 51.5], [21.5, 39.2], [19.1, 72.9], [28.6, 77.2], [13.7, 100.5], [3.1, 101.7], [1.3, 103.8], [-6.2, 106.8], [22.3, 114.2], [31.2, 121.5], [35.7, 139.7], [37.6, 127.0], [39.9, 116.4], [14.6, 121.0], [23.8, 90.4], [41.0, 29.0], [35.7, 51.4],
      // Europe
      [51.5, -0.1], [48.9, 2.3], [52.5, 13.4], [40.4, -3.7], [41.9, 12.5], [55.8, 37.6], [52.4, 4.9], [59.3, 18.1], [52.2, 21.0], [38.7, -9.1], [38.0, 23.7],
      // Africa
      [-1.3, 36.8], [-6.8, 39.3], [6.5, 3.4], [-26.2, 28.0], [30.0, 31.2], [33.6, -7.6], [5.6, -0.2], [9.0, 38.7], [-33.9, 18.4], [14.7, -17.4],
      // North America
      [40.7, -74.0], [37.8, -122.4], [34.0, -118.2], [41.9, -87.6], [43.7, -79.4], [47.6, -122.3], [29.8, -95.4], [25.8, -80.2], [19.4, -99.1], [45.5, -73.6], [49.3, -123.1],
      // South America
      [-23.5, -46.6], [-34.6, -58.4], [4.7, -74.1], [-12.0, -77.0], [-33.4, -70.7], [10.5, -66.9], [-22.9, -43.2],
      // Oceania
      [-33.9, 151.2], [-37.8, 144.9], [-36.8, 174.8], [-31.9, 115.9], [-27.5, 153.0],
    ].map((p) => toXYZ(p[0], p[1]));
    // 31 satellites: [speed (signed → direction), orbit-radius factor, inclination y-offset, phase].
    const SATS: number[][] = Array.from({ length: SAT_COUNT }, (_, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const speed = dir * (0.7 + (i % 5) * 0.12);
      const radiusF = 1.04 + ((i * 7) % 12) / 18;     // ~1.04 .. 1.65
      const yOff = -0.62 + ((i * 13) % 25) / 19;       // ~-0.62 .. 0.69
      const phase = (i * 2.3999632) % (Math.PI * 2);   // golden-angle spread
      return [speed, radiusF, yOff, phase];
    });
    // Per-satellite orbit angle, advanced each frame — a hovered satellite stops advancing (freezes).
    const satAngles = SATS.map((S) => S[3]);
    let hovered = -1;                  // satellite index under the cursor, or -1
    const satScreen: number[][] = [];  // latest [x, y, index] of each visible satellite, for hit-testing

    let raf = 0, t = 0;

    const resize = () => { canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; };
    resize();
    window.addEventListener('resize', resize);

    // The canvas stays pointer-events:none (so it never blocks the hero copy/CTAs); we hit-test the
    // satellites against a window-level mousemove using the canvas bounding rect.
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) { hovered = -1; return; }
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const hit = 16 * dpr; let best = -1, bd = hit * hit;
      for (const s of satScreen) { const dx = s[0] - mx, dy = s[1] - my, d2 = dx * dx + dy * dy; if (d2 < bd) { bd = d2; best = s[2]; } }
      hovered = best;
    };
    const onLeave = () => { hovered = -1; };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    const draw = () => {
      t += 0.0033;
      const w = canvas.width, hh = canvas.height;
      ctx.clearRect(0, 0, w, hh);
      const st = Math.min(1, (window.scrollY || 0) / ((window.innerHeight || 700) * 0.9));
      const cx = w * (cxFactor - st * 0.05), cy = hh * 0.5 + st * hh * 0.12;
      const R = Math.min(w, hh) * radiusFactor * (1 - st * 0.22);
      const Rg = R * 0.8;
      const rotY = t + 0.27 + st * 2.4, tilt = -0.42;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const proj = (p: number[]) => {
        const x = p[0], y = p[1], z = p[2];
        const x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
        const y1 = y * cosT - z1 * sinT, z2 = y * sinT + z1 * cosT;
        const dr = 1 + st * 0.4 * Math.sin((p[0] + p[2]) * 5 + t * 5);
        return [cx + x1 * Rg * dr, cy + y1 * Rg * dr * (1 - st * 0.2), z2];
      };
      for (let i = 0; i < pts.length; i++) {
        const q = proj(pts[i]); const front = (q[2] + 1) / 2; const isL = land[i];
        const op = isL ? (0.22 + front * 0.78) * (1 - st * 0.5) : 0;
        if (op <= 0.012) continue;
        ctx.beginPath(); ctx.fillStyle = 'rgba(1,65,28,' + op.toFixed(3) + ')';
        ctx.arc(q[0], q[1], ((isL ? 0.72 : 0.5) + front * 1.3) * dpr, 0, 6.2832); ctx.fill();
      }
      const op = 1 - st * 0.7;
      const others: Array<[number[], boolean]> = [];
      for (let i = 0; i < pins.length; i++) { const q = proj(pins[i]); others.push([q, q[2] > 0.06]); }
      // Advance each satellite's orbit; the hovered one freezes in place.
      for (let i = 0; i < SATS.length; i++) { if (i !== hovered) satAngles[i] += 0.0033 * SATS[i][0]; }
      const sop = 1 - st * 0.6; const satsVis: number[][] = [];
      satScreen.length = 0;
      for (let i = 0; i < SATS.length; i++) {
        const S = SATS[i];
        const oa = satAngles[i];
        const px = Math.cos(oa) * R * S[1], py0 = S[2] * R, pz0 = Math.sin(oa) * R * S[1];
        const ssx = cx + px, ssy = cy + (py0 * cosT - pz0 * sinT), depth = py0 * sinT + pz0 * cosT;
        if (sop <= 0.05 || (depth < 0 && Math.hypot(ssx - cx, ssy - cy) < Rg * 0.96)) continue;
        const hov = i === hovered;
        const bs = (hov ? 5.2 : 4.4) * dpr;
        ctx.fillStyle = 'rgba(91,164,121,' + sop.toFixed(3) + ')'; ctx.fillRect(ssx - bs * 3.2, ssy - bs * 0.5, bs * 1.8, bs); ctx.fillRect(ssx + bs * 1.4, ssy - bs * 0.5, bs * 1.8, bs);
        ctx.fillStyle = (hov ? 'rgba(47,182,122,' : 'rgba(1,65,28,') + sop.toFixed(3) + ')'; ctx.fillRect(ssx - bs, ssy - bs * 0.6, bs * 2, bs * 1.2);
        if (hov) { ctx.strokeStyle = 'rgba(47,182,122,' + sop.toFixed(3) + ')'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(ssx, ssy, bs * 2.4, 0, 6.2832); ctx.stroke(); }
        satsVis.push([ssx, ssy]);
        satScreen.push([ssx, ssy, i]);
      }
      if (op > 0.02) {
        for (const it of others) {
          if (!it[1]) continue; const q = it[0];
          let satConn: number[] | null = null, bd = Infinity;
          for (const s of satsVis) { const d = Math.hypot(s[0] - q[0], s[1] - q[1]); if (d < bd) { bd = d; satConn = s; } }
          if (satConn && bd < R * 1.5) {
            ctx.strokeStyle = 'rgba(120,120,120,' + (0.55 * op).toFixed(3) + ')'; ctx.lineWidth = dpr; ctx.setLineDash([2 * dpr, 4 * dpr]);
            ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(satConn[0], satConn[1]); ctx.stroke(); ctx.setLineDash([]);
          }
        }
        const pr = 4 * dpr, pulse = (Math.sin(t * 3) + 1) / 2;
        for (const it of others) {
          if (!it[1]) continue; const q = it[0];
          ctx.beginPath(); ctx.fillStyle = 'rgba(47,182,122,' + (0.22 * op).toFixed(3) + ')'; ctx.arc(q[0], q[1], pr + pr * pulse * 1.6, 0, 6.2832); ctx.fill();
          ctx.beginPath(); ctx.fillStyle = 'rgba(47,182,122,' + op.toFixed(3) + ')'; ctx.arc(q[0], q[1], pr, 0, 6.2832); ctx.fill();
          ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,' + op.toFixed(3) + ')'; ctx.arc(q[0], q[1], pr * 0.4, 0, 6.2832); ctx.fill();
        }
      }
      // Hovered satellite's name label, drawn on top of everything.
      if (hovered >= 0) { const s = satScreen.find((p) => p[2] === hovered); if (s) drawSatLabel(ctx, s[0], s[1], satTitle(hovered), satSub(hovered), dpr, w); }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [cxFactor, radiusFactor]);

  return <canvas ref={ref} className="tad-hero-globe" aria-hidden="true" />;
}

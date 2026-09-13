/**
 * Okładka flat-lay — płatność / trial (styl blog-budzet-cover).
 * Uruchom: node scripts/generate-platnosc-cover.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/blog/covers/blog-platnosc-trial-cover.png");
const W = 1376;
const H = 768;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="linen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8f6f2"/>
      <stop offset="50%" stop-color="#f3f0ea"/>
      <stop offset="100%" stop-color="#ebe6de"/>
    </linearGradient>
    <linearGradient id="goldCard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4bc8a"/>
      <stop offset="45%" stop-color="#b89a62"/>
      <stop offset="100%" stop-color="#9a8554"/>
    </linearGradient>
    <linearGradient id="creamPaper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffefb"/>
      <stop offset="100%" stop-color="#f5f1ea"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#2d3824" flood-opacity="0.12"/>
    </filter>
    <filter id="linenNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.94  0 0 0 0 0.91  0 0 0 0.04 0"/>
      <feBlend in="SourceGraphic" in2="n" mode="multiply"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#linen)" filter="url(#linenNoise)"/>
  <ellipse cx="200" cy="120" rx="280" ry="180" fill="#c4b08a" opacity="0.08"/>
  <ellipse cx="1180" cy="680" rx="320" ry="200" fill="#7d8d6e" opacity="0.06"/>

  <!-- eucalyptus left -->
  <g opacity="0.85" transform="translate(48,520) rotate(-8)">
    <ellipse cx="0" cy="0" rx="18" ry="32" fill="#8fa38a" transform="rotate(-25)"/>
    <ellipse cx="28" cy="-12" rx="16" ry="28" fill="#a8b598" transform="rotate(15)"/>
    <ellipse cx="52" cy="8" rx="14" ry="26" fill="#7d8d6e" transform="rotate(-10)"/>
    <circle cx="70" cy="-4" r="5" fill="#c4b08a" opacity="0.6"/>
    <circle cx="82" cy="6" r="4" fill="#c4b08a" opacity="0.5"/>
  </g>

  <!-- cream planner notebook -->
  <g filter="url(#softShadow)" transform="translate(720,140) rotate(2)">
    <rect x="0" y="0" width="340" height="460" rx="6" fill="url(#creamPaper)"/>
    <rect x="0" y="0" width="18" height="460" fill="#e8e2d8"/>
    <line x1="48" y1="80" x2="300" y2="80" stroke="#d8d0c4" stroke-width="2"/>
    <line x1="48" y1="120" x2="280" y2="120" stroke="#e5ddd2" stroke-width="1.5"/>
    <line x1="48" y1="150" x2="260" y2="150" stroke="#e5ddd2" stroke-width="1.5"/>
    <line x1="48" y1="180" x2="290" y2="180" stroke="#e5ddd2" stroke-width="1.5"/>
  </g>

  <!-- gold credit card -->
  <g filter="url(#softShadow)" transform="translate(380,280) rotate(-6)">
    <rect x="0" y="0" width="320" height="200" rx="16" fill="url(#goldCard)"/>
    <rect x="28" y="36" width="52" height="40" rx="6" fill="#e8dcc0" opacity="0.85"/>
    <rect x="28" y="130" width="120" height="10" rx="5" fill="#f5f0e6" opacity="0.5"/>
    <rect x="28" y="152" width="80" height="8" rx="4" fill="#f5f0e6" opacity="0.35"/>
    <circle cx="270" cy="150" r="22" fill="#c9a96e" opacity="0.5"/>
    <circle cx="250" cy="150" r="22" fill="#d4bc8a" opacity="0.45"/>
  </g>

  <!-- wedding ring -->
  <g transform="translate(300,180)">
    <ellipse cx="0" cy="0" rx="34" ry="38" fill="none" stroke="url(#goldCard)" stroke-width="7"/>
    <ellipse cx="0" cy="0" rx="34" ry="38" fill="none" stroke="#f5f0e6" stroke-width="2" opacity="0.4"/>
  </g>

  <!-- coins jar -->
  <g filter="url(#softShadow)" transform="translate(180,320)">
    <ellipse cx="50" cy="95" rx="58" ry="14" fill="#d8d0c4" opacity="0.5"/>
    <path d="M 8 40 Q 8 20 50 20 Q 92 20 92 40 L 92 88 Q 92 108 50 108 Q 8 108 8 88 Z" fill="rgba(255,255,255,0.55)" stroke="#d4c8b8" stroke-width="1.5"/>
    <ellipse cx="38" cy="72" rx="22" ry="6" fill="#c9a96e"/>
    <ellipse cx="62" cy="68" rx="20" ry="5" fill="#b89a62"/>
    <ellipse cx="50" cy="58" rx="18" ry="5" fill="#d4bc8a"/>
  </g>

  <!-- gold pen -->
  <g filter="url(#softShadow)" transform="translate(1040,200) rotate(75)">
    <rect x="0" y="0" width="14" height="220" rx="7" fill="url(#goldCard)"/>
    <polygon points="7,220 0,248 14,248" fill="#9a8554"/>
  </g>

  <!-- subtle florals top right -->
  <g opacity="0.35" transform="translate(1180,80)">
    <circle cx="0" cy="0" r="28" fill="#f5ebe3"/>
    <circle cx="24" cy="16" r="22" fill="#f0e6dc"/>
    <circle cx="-16" cy="20" r="18" fill="#faf6f1"/>
  </g>
</svg>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log("✓", OUT);

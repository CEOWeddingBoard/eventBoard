/**
 * Ilustracje SVG do slajdów Instagram — paleta Wedding Board.
 * Styl: editorial line-art, wyrazista skala na coverze karuzeli.
 */
export function platnoscCoverArtSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" fill="none" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="wb-gold-soft" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d4bc8a"/>
      <stop offset="100%" stop-color="#9a8554"/>
    </linearGradient>
    <linearGradient id="wb-gold-fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8d5b0" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#c9a96e" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="wb-glow" cx="50%" cy="50%" r="52%">
      <stop offset="0%" stop-color="#c29564" stop-opacity="0.14"/>
      <stop offset="65%" stop-color="#7d8d6e" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#f5f3ee" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="260" cy="158" rx="228" ry="132" fill="url(#wb-glow)"/>

  <circle cx="260" cy="148" r="118" stroke="#9a8554" stroke-width="1.5" opacity="0.22"/>
  <circle cx="260" cy="148" r="96" stroke="#7d8d6e" stroke-width="1" opacity="0.14"/>

  <!-- karta -->
  <g transform="translate(118,88) rotate(-7)">
    <rect x="0" y="0" width="220" height="136" rx="14" fill="#fffefb" stroke="url(#wb-gold-soft)" stroke-width="2.2"/>
    <rect x="0" y="0" width="220" height="136" rx="14" fill="url(#wb-gold-fill)"/>
    <rect x="20" y="24" width="38" height="28" rx="4" stroke="#b89a62" stroke-width="1.6" fill="none"/>
    <line x1="20" y1="88" x2="98" y2="88" stroke="#c29564" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>
    <line x1="20" y1="104" x2="68" y2="104" stroke="#d8d0c4" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="182" cy="96" r="14" stroke="#c29564" stroke-width="1.4" fill="none" opacity="0.45"/>
    <circle cx="164" cy="96" r="14" stroke="#d4bc8a" stroke-width="1.4" fill="none" opacity="0.4"/>
  </g>

  <!-- planer -->
  <g transform="translate(292,58) rotate(5)">
    <rect x="0" y="0" width="156" height="206" rx="6" fill="#fffefb" stroke="#c29564" stroke-width="1.6" opacity="0.95"/>
    <line x1="24" y1="0" x2="24" y2="206" stroke="#e5ddd2" stroke-width="1.2"/>
    <line x1="38" y1="48" x2="132" y2="48" stroke="#d8d0c4" stroke-width="1.4"/>
    <line x1="38" y1="72" x2="118" y2="72" stroke="#e5ddd2" stroke-width="1.1"/>
    <line x1="38" y1="96" x2="126" y2="96" stroke="#e5ddd2" stroke-width="1.1"/>
    <rect x="38" y="120" width="14" height="14" rx="3" stroke="#9a8554" stroke-width="1.4" fill="none"/>
    <path d="M58 126 L63 131 L80 118" stroke="#7d8d6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="38" y1="150" x2="112" y2="150" stroke="#e5ddd2" stroke-width="1.1"/>
    <rect x="38" y="168" width="14" height="14" rx="3" stroke="#9a8554" stroke-width="1.4" fill="none" opacity="0.5"/>
  </g>

  <!-- pierścionek -->
  <ellipse cx="252" cy="46" rx="26" ry="30" stroke="url(#wb-gold-soft)" stroke-width="2.2" fill="none"/>

  <!-- eukaliptus -->
  <g stroke="#7d8d6e" stroke-width="1.4" stroke-linecap="round" opacity="0.7" transform="translate(52,210)">
    <path d="M0 0 Q10 -22 6 -44"/>
    <path d="M6 -16 Q24 -10 36 -26"/>
    <path d="M6 -28 Q-12 -22 -20 -36"/>
    <ellipse cx="6" cy="-44" rx="7" ry="12" fill="#a8b598" fill-opacity="0.35" stroke="none"/>
    <ellipse cx="36" cy="-26" rx="6" ry="11" fill="#8fa38a" fill-opacity="0.3" stroke="none"/>
    <ellipse cx="-20" cy="-36" rx="5.5" ry="10" fill="#7d8d6e" fill-opacity="0.28" stroke="none"/>
  </g>

  <!-- moneta -->
  <g transform="translate(78,138)">
    <ellipse cx="0" cy="20" rx="24" ry="6" fill="#d8d0c4" opacity="0.45"/>
    <ellipse cx="0" cy="0" rx="22" ry="22" fill="#fffefb" stroke="#b89a62" stroke-width="1.8"/>
    <text x="0" y="8" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="18" font-weight="600" fill="#9a8554">zł</text>
  </g>

  <!-- 30 dni — duży badge -->
  <g transform="translate(418,128)">
    <circle r="48" fill="#fffefb" stroke="#b89a62" stroke-width="2"/>
    <circle r="48" fill="url(#wb-gold-fill)"/>
    <text x="0" y="8" text-anchor="middle" font-family="Playfair Display, Georgia, serif" font-size="42" font-weight="600" fill="#2d3824">30</text>
    <text x="0" y="28" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="10" font-weight="600" letter-spacing="0.24em" fill="#7d8d6e">DNI</text>
  </g>
</svg>`;
}

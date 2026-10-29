/* ═══════════════════════════════════════════════════════════
   art.js — dynamic SVG graphics library
   Cartoon-style art with gradients, shading and layered shapes.
   Every function RETURNS an SVG string, drawn on the fly.
   ═══════════════════════════════════════════════════════════ */

const ART = {

  wrap(inner, vb = '0 0 200 160', defs = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">
      <defs>${defs}</defs>${inner}</svg>`;
  },

  /* shared gradient definitions (ids are unique per function to avoid clashes) */
  chestDefs() {
    return `
      <linearGradient id="chWood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b5793a"/><stop offset="1" stop-color="#8a5423"/>
      </linearGradient>
      <linearGradient id="chLid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9a6330"/><stop offset="1" stop-color="#6f4118"/>
      </linearGradient>
      <linearGradient id="chGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f5a623"/>
      </linearGradient>
      <radialGradient id="chGlow" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stop-color="#fff3b0" stop-opacity=".95"/>
        <stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
      </radialGradient>`;
  },

  /* ── Treasure chest (closed / open) ── */
  chest(open = false) {
    const lid = open
      ? `<g transform="rotate(-34 20 60)">
           <rect x="18" y="28" width="104" height="34" rx="16" fill="url(#chLid)" stroke="#5d3a1a" stroke-width="4"/>
           <path d="M22 45 q48 -16 96 0" fill="none" stroke="#5d3a1a" stroke-width="3" opacity=".7"/>
           <rect x="30" y="28" width="10" height="34" rx="4" fill="#5d3a1a" opacity=".55"/>
           <rect x="100" y="28" width="10" height="34" rx="4" fill="#5d3a1a" opacity=".55"/>
         </g>`
      : `<rect x="18" y="30" width="104" height="32" rx="15" fill="url(#chLid)" stroke="#5d3a1a" stroke-width="4"/>
         <path d="M22 46 q48 -14 96 0" fill="none" stroke="#5d3a1a" stroke-width="3" opacity=".7"/>`;
    const loot = open
      ? `<ellipse cx="70" cy="66" rx="46" ry="12" fill="url(#chGlow)"/>
         <circle cx="52" cy="58" r="7" fill="url(#chGold)" stroke="#c77f00" stroke-width="2"/>
         <circle cx="88" cy="57" r="7" fill="url(#chGold)" stroke="#c77f00" stroke-width="2"/>
         <circle cx="70" cy="52" r="8" fill="url(#chGold)" stroke="#c77f00" stroke-width="2"/>
         <path d="M70 36 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffd75e" stroke="#e8a100" stroke-width="1.5"/>
         <circle cx="98" cy="42" r="2.5" fill="#fff" opacity=".9"/>
         <circle cx="44" cy="40" r="2" fill="#fff" opacity=".9"/>`
      : '';
    return ART.wrap(`
      <ellipse cx="70" cy="116" rx="60" ry="9" fill="#1f2a44" opacity=".22"/>
      ${lid}${loot}
      <rect x="18" y="58" width="104" height="48" rx="9" fill="url(#chWood)" stroke="#5d3a1a" stroke-width="4"/>
      <path d="M20 74 h100 M20 88 h100" stroke="#5d3a1a" stroke-width="2" opacity=".45"/>
      <rect x="30" y="58" width="11" height="48" fill="#5d3a1a" opacity=".5"/>
      <rect x="99" y="58" width="11" height="48" fill="#5d3a1a" opacity=".5"/>
      <rect x="58" y="54" width="24" height="26" rx="6" fill="url(#chGold)" stroke="#b87700" stroke-width="3"/>
      <circle cx="70" cy="64" r="3.5" fill="#5d3a1a"/>
      <rect x="68.5" y="66" width="3" height="8" rx="1.5" fill="#5d3a1a"/>
      <circle cx="26" cy="63" r="1.8" fill="#5d3a1a"/><circle cx="114" cy="63" r="1.8" fill="#5d3a1a"/>
      <circle cx="26" cy="101" r="1.8" fill="#5d3a1a"/><circle cx="114" cy="101" r="1.8" fill="#5d3a1a"/>`,
      '0 0 140 130', ART.chestDefs());
  },

  /* ── Pirate parrot buddy (side view, facing left) ── */
  parrot() {
    return ART.wrap(`
      <defs>
        <linearGradient id="pBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f2555f"/><stop offset="1" stop-color="#c92f3c"/>
        </linearGradient>
        <linearGradient id="pWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#37b3a4"/><stop offset="1" stop-color="#1f6f65"/>
        </linearGradient>
      </defs>
      <!-- tail feathers -->
      <path d="M112 82 C 140 96, 152 122, 147 146 C 133 134, 120 114, 113 96 Z" fill="#1f6f65"/>
      <path d="M108 74 C 134 84, 150 106, 152 130 C 137 120, 121 100, 110 86 Z" fill="#2a9d8f"/>
      <path d="M104 68 C 130 72, 146 88, 152 108 C 136 100, 116 86, 106 76 Z" fill="#e63946"/>
      <!-- body + head -->
      <path d="M95 42 C 121 42, 136 64, 133 90 C 130 114, 111 128, 92 127 C 70 126, 56 108, 58 85 C 60 61, 73 42, 95 42 Z"
            fill="url(#pBody)" stroke="#8f1f2b" stroke-width="3"/>
      <!-- belly -->
      <path d="M72 86 C 68 106, 79 121, 93 123 C 107 125, 120 113, 124 97 C 110 108, 86 103, 72 86 Z" fill="#ffe3cf" opacity=".92"/>
      <!-- wing -->
      <path d="M99 62 C 122 60, 136 78, 132 100 C 128 116, 114 125, 101 123 C 114 104, 115 82, 99 62 Z"
            fill="url(#pWing)" stroke="#155650" stroke-width="2.5"/>
      <path d="M104 74 C 116 78, 122 90, 120 102" fill="none" stroke="#155650" stroke-width="2" opacity=".7"/>
      <!-- head crest -->
      <path d="M86 40 C 88 28, 100 22, 110 26 C 102 30, 96 36, 96 44 Z" fill="#2a9d8f" stroke="#155650" stroke-width="2"/>
      <!-- eye -->
      <circle cx="78" cy="60" r="10" fill="#fff" stroke="#8f1f2b" stroke-width="1.5"/>
      <circle cx="75" cy="61" r="5.2" fill="#20304d"/>
      <circle cx="73" cy="58.5" r="1.8" fill="#fff"/>
      <!-- beak -->
      <path d="M56 52 C 46 52, 40 60, 43 68 C 46 74, 52 76, 58 72 C 54 66, 54 58, 58 52 Z" fill="#ffb703" stroke="#c77f00" stroke-width="2"/>
      <path d="M46 70 C 50 74, 55 74, 58 72" fill="none" stroke="#c77f00" stroke-width="2"/>
      <!-- feet -->
      <path d="M84 127 v9 M98 126 v10" stroke="#c77f00" stroke-width="5" stroke-linecap="round"/>
      <path d="M78 138 h10 M94 138 h10" stroke="#c77f00" stroke-width="4" stroke-linecap="round"/>
    `, '0 0 190 160');
  },

  /* ── Pirate captain (bust, facing forward) ── */
  captain() {
    return ART.wrap(`
      <defs>
        <radialGradient id="cSkin" cx="0.4" cy="0.35" r="0.9">
          <stop offset="0" stop-color="#ffdcb8"/><stop offset="1" stop-color="#eab387"/>
        </radialGradient>
        <linearGradient id="cCoat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3c5088"/><stop offset="1" stop-color="#26335c"/>
        </linearGradient>
      </defs>
      <!-- coat & shoulders -->
      <path d="M36 160 C 40 126, 66 110, 100 110 C 134 110, 160 126, 164 160 Z"
            fill="url(#cCoat)" stroke="#1a2542" stroke-width="3"/>
      <path d="M84 112 L100 134 L116 112" fill="none" stroke="#1a2542" stroke-width="3"/>
      <path d="M100 134 L100 160" stroke="#1a2542" stroke-width="3"/>
      <circle cx="100" cy="143" r="3" fill="#ffd75e" stroke="#c77f00"/>
      <circle cx="100" cy="154" r="3" fill="#ffd75e" stroke="#c77f00"/>
      <!-- ears + earring -->
      <circle cx="65" cy="78" r="7" fill="#eab387"/><circle cx="135" cy="78" r="7" fill="#eab387"/>
      <circle cx="66" cy="88" r="4" fill="none" stroke="#f5a623" stroke-width="2.5"/>
      <!-- head -->
      <circle cx="100" cy="72" r="33" fill="url(#cSkin)"/>
      <!-- eyes -->
      <circle cx="87" cy="70" r="4.6" fill="#20304d"/><circle cx="113" cy="70" r="4.6" fill="#20304d"/>
      <circle cx="85.5" cy="68.5" r="1.5" fill="#fff"/><circle cx="111.5" cy="68.5" r="1.5" fill="#fff"/>
      <!-- brows -->
      <path d="M80 61 C 84 58, 91 58, 94 61" stroke="#4a3526" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M106 61 C 109 58, 116 58, 120 61" stroke="#4a3526" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- nose, smile, cheeks -->
      <path d="M98 76 C 96 82, 96 85, 100 87 C 104 85, 104 82, 102 76" fill="#f0a878"/>
      <path d="M88 94 C 93 100, 107 100, 112 94" stroke="#8a4b2b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="79" cy="85" r="5" fill="#f4a9a0" opacity=".75"/>
      <circle cx="121" cy="85" r="5" fill="#f4a9a0" opacity=".75"/>
      <!-- tricorn hat -->
      <path d="M62 52 C 58 28, 82 16, 100 16 C 118 16, 142 28, 138 52
               C 126 44, 74 44, 62 52 Z" fill="#2c3654" stroke="#1a2542" stroke-width="3"/>
      <ellipse cx="100" cy="50" rx="48" ry="10" fill="#232c45" stroke="#1a2542" stroke-width="3"/>
      <path d="M58 50 C 76 42, 124 42, 142 50" fill="none" stroke="#f5a623" stroke-width="3"/>
      <!-- skull emblem -->
      <circle cx="100" cy="33" r="7" fill="#f4efe4"/>
      <circle cx="97.5" cy="32" r="1.6" fill="#2c3654"/><circle cx="102.5" cy="32" r="1.6" fill="#2c3654"/>
      <path d="M97 38 h6 M100 38 v3" stroke="#f4efe4" stroke-width="2"/>
    `, '0 0 200 165');
  },

  /* ── Ship sailing ── */
  ship(x = 0, y = 0, s = 1) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <defs>
        <linearGradient id="shHull${x}${y}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a0692f"/><stop offset="1" stop-color="#6f4118"/>
        </linearGradient>
      </defs>
      <path d="M2 22 C 14 32, 54 32, 66 22 L 58 40 C 42 48, 24 48, 10 40 Z" fill="url(#shHull${x}${y})" stroke="#5d3a1a" stroke-width="3"/>
      <path d="M12 34 C 26 40, 42 40, 56 34" fill="none" stroke="#5d3a1a" stroke-width="2" opacity=".6"/>
      <rect x="32" y="-34" width="4.5" height="56" fill="#5d3a1a"/>
      <path d="M37 -30 C 58 -22, 58 -4, 37 2 Z" fill="#fff8e7" stroke="#d9cba8" stroke-width="2"/>
      <path d="M36 -26 C 20 -20, 20 -6, 36 0 Z" fill="#e63946" stroke="#a4232e" stroke-width="2"/>
      <path d="M33 -40 l10 5 -10 5z" fill="#232c45"/>
      <circle cx="34" cy="12" r="4" fill="#ffd75e" stroke="#c77f00" stroke-width="2"/>
    </g>`;
  },

  /* ── Island for the map (centered on 0,0) ── */
  island() {
    return `
      <defs>
        <linearGradient id="isSand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe9b3"/><stop offset="1" stop-color="#e8c477"/>
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="4" rx="58" ry="20" fill="url(#isSand)" stroke="#cfa254" stroke-width="3"/>
      <ellipse cx="0" cy="-2" rx="42" ry="12" fill="#fff3d6"/>
      <!-- palm -->
      <path d="M-2 -6 C -4 -22, -2 -34, 4 -42" fill="none" stroke="#8a5423" stroke-width="7" stroke-linecap="round"/>
      <path d="M4 -42 C -10 -54, -24 -54, -34 -44 C -22 -47, -10 -46, 2 -38 Z" fill="#2f9e83"/>
      <path d="M4 -42 C 18 -54, 32 -54, 42 -44 C 30 -47, 18 -46, 6 -38 Z" fill="#2f9e83"/>
      <path d="M4 -42 C -2 -60, -12 -68, -24 -68 C -12 -60, -4 -50, 0 -40 Z" fill="#37b3a4"/>
      <path d="M4 -42 C 12 -60, 24 -66, 34 -66 C 24 -58, 14 -50, 10 -40 Z" fill="#37b3a4"/>
      <path d="M4 -42 C 6 -58, 14 -66, 24 -70 C 16 -58, 10 -50, 8 -40 Z" fill="#45c2b0"/>
      <circle cx="0" cy="-35" r="3.5" fill="#6f4118"/><circle cx="9" cy="-33" r="3.5" fill="#6f4118"/>
      <!-- starfish + rock -->
      <path d="M30 8 l2.5 4 4.5 .5 -3 3.5 .8 4.5 -4.3 -2.2 -4.3 2.2 .8 -4.5 -3 -3.5 4.5 -.5z" fill="#f4845f"/>
      <ellipse cx="-32" cy="6" rx="7" ry="4" fill="#b9a689"/>`;
  },

  /* ── Padlock for locked islands ── */
  lock() {
    return `<g transform="translate(-14,-38)">
      <path d="M5 16 v-7 a10 10 0 0 1 20 0 v7" fill="none" stroke="#4a4a4a" stroke-width="4.5"/>
      <rect x="0" y="15" width="30" height="23" rx="6" fill="#4a4a4a" stroke="#2e2e2e" stroke-width="2"/>
      <circle cx="15" cy="24" r="3.5" fill="#cfcfcf"/><rect x="13.2" y="25" width="3.6" height="7" rx="1.5" fill="#cfcfcf"/>
    </g>`;
  },

  /* ── Golden coin ── */
  coin(x = 0, y = 0, s = 1) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <circle r="15" fill="#f5a623" stroke="#c77f00" stroke-width="3"/>
      <circle r="10.5" fill="#ffd75e"/>
      <path d="M0 -6 l2 4.5 5 .5 -3.7 3.4 1 5 -4.3 -2.5 -4.3 2.5 1 -5 -3.7 -3.4 5 -.5z" fill="#e8940a"/>
    </g>`;
  },

  /* ── Map decorations ── */
  compass(x = 0, y = 0, s = 1) {
    return `<g transform="translate(${x},${y}) scale(${s})">
      <circle r="30" fill="#fff8e7" stroke="#8a5423" stroke-width="3"/>
      <circle r="24" fill="none" stroke="#cfa254" stroke-width="1.5"/>
      <path d="M0 -20 L5 0 L0 20 L-5 0 Z" fill="#e63946"/>
      <path d="M-20 0 L0 -5 L20 0 L0 5 Z" fill="#2c3654"/>
      <circle r="4" fill="#ffd75e" stroke="#c77f00" stroke-width="2"/>
      <text y="-34" text-anchor="middle" font-size="14" font-weight="bold" fill="#5d3a1a">N</text>
    </g>`;
  },
  wave(x = 0, y = 0, s = 1, o = .5) {
    return `<g transform="translate(${x},${y}) scale(${s})" opacity="${o}">
      <path d="M0 6 C 5 -2, 12 -2, 17 6 C 22 14, 29 14, 34 6" fill="none" stroke="#fff8e7" stroke-width="4" stroke-linecap="round"/>
    </g>`;
  },

  /* ── Question-helping art ─────────────────────────────── */

  svgAngle(deg) {
    const r = 70, cx = 40, cy = 100;
    const rad = -deg * Math.PI / 180;
    const x = cx + r * Math.cos(rad), y = cy + r * Math.sin(rad);
    const arc = Math.min(deg, 60) * Math.PI / 180;
    const ax = cx + 26 * Math.cos(-arc), ay = cy + 26 * Math.sin(-arc);
    return ART.wrap(`
      <line x1="${cx}" y1="${cy}" x2="${cx + 85}" y2="${cy}" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>
      <path d="M ${cx + 26} ${cy} A 26 26 0 0 0 ${ax.toFixed(1)} ${ay.toFixed(1)}" fill="none" stroke="#e63946" stroke-width="3"/>
      <text x="${cx + 34}" y="${cy - 10}" font-size="15" fill="#e63946" font-weight="bold">?</text>
    `, '0 0 180 130');
  },

  svgTriangle(a, b) {
    return ART.wrap(`
      <polygon points="30,110 160,110 95,25" fill="#d4f0f7" stroke="#1f2a44" stroke-width="4" stroke-linejoin="round"/>
      <text x="46" y="103" font-size="15" font-weight="bold" fill="#e63946">${a}°</text>
      <text x="128" y="103" font-size="15" font-weight="bold" fill="#2a9d8f">${b}°</text>
      <text x="89" y="62" font-size="15" font-weight="bold" fill="#c77f00">?</text>
    `, '0 0 190 130');
  },

  svgRect(w, h) {
    const cw = 22;
    const W = w * cw, H = h * cw;
    let grid = '';
    for (let i = 1; i < w; i++) grid += `<line x1="${i * cw}" y1="0" x2="${i * cw}" y2="${H}" stroke="#9ec9dd" stroke-width="1.5"/>`;
    for (let j = 1; j < h; j++) grid += `<line x1="0" y1="${j * cw}" x2="${W}" y2="${j * cw}" stroke="#9ec9dd" stroke-width="1.5"/>`;
    return ART.wrap(`
      <rect x="0" y="0" width="${W}" height="${H}" fill="#d4f0f7" stroke="#1f2a44" stroke-width="4"/>
      ${grid}
      <text x="${W / 2}" y="${H + 20}" text-anchor="middle" font-size="15" font-weight="bold" fill="#1f2a44">${w} cm</text>
      <text x="-12" y="${H / 2}" text-anchor="middle" font-size="15" font-weight="bold" fill="#1f2a44" transform="rotate(-90 -12 ${H / 2})">${h} cm</text>
    `, `-30 -8 ${W + 55} ${H + 30}`);
  },

  svgPie(n, k) {
    const cx = 65, cy = 65, r = 52;
    let slices = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      slices += `<path d="M${cx} ${cy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}z"
        fill="${i < k ? '#ffb703' : '#fff8e7'}" stroke="#1f2a44" stroke-width="2.5"/>`;
    }
    return ART.wrap(`${slices}`, '0 0 130 130');
  },

  svgRightAngle() {
    return ART.wrap(`
      <line x1="30" y1="105" x2="150" y2="105" stroke="#1f2a44" stroke-width="4"/>
      <line x1="30" y1="105" x2="30" y2="20" stroke="#1f2a44" stroke-width="4"/>
      <rect x="30" y="83" width="20" height="20" fill="none" stroke="#e63946" stroke-width="3"/>
      <text x="58" y="98" font-size="15" font-weight="bold" fill="#e63946">?</text>
    `, '0 0 180 130');
  },

  /* ── Victory treasure pile ── */
  treasure() {
    return ART.wrap(`
      <defs>
        <radialGradient id="tGlow" cx="0.5" cy="0.45" r="0.65">
          <stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/>
          <stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="150" rx="95" ry="13" fill="#1f2a44" opacity=".22"/>
      <ellipse cx="110" cy="88" rx="100" ry="72" fill="url(#tGlow)"/>
      <path d="M110 14 l7 15 17 3 -12 13 3 17 -15 -8 -15 8 3 -17 -12 -13 17 -3z" fill="#ffd75e" stroke="#e8a100" stroke-width="2"/>
      <text x="42" y="46" font-size="20">💎</text><text x="164" y="42" font-size="20">💎</text>
      <text x="72" y="28" font-size="16">⭐</text><text x="140" y="26" font-size="16">⭐</text>
      ${ART.coin(52, 116, 1.5)}${ART.coin(168, 112, 1.6)}${ART.coin(110, 124, 1.7)}${ART.coin(78, 132, 1.2)}${ART.coin(144, 132, 1.2)}
      <g transform="translate(40,54)">${ART.chest(true).replace(/<\/?svg[^>]*>/g, '').replace(/id="ch/g, 'id="tc').replace(/url\(#ch/g, 'url(#tc')}</g>
    `, '0 0 220 170');
  },

  /* ── Home hero: one coherent island scene ── */
  hero() {
    const sub = s => s.replace(/<\/?svg[^>]*>/g, '')
      .replace(/id="(ch|p|c)([A-Za-z]+)"/g, (m, a, b) => `id="h${a}${b}"`).replace(/url\(#(ch|p|c)/g, 'url(#h$1');
    return ART.wrap(`
      <defs>
        <linearGradient id="hSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7fd4f0"/><stop offset="1" stop-color="#3d97cc"/>
        </linearGradient>
        <radialGradient id="hSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffd75e" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- sun + clouds -->
      <circle cx="46" cy="42" r="34" fill="url(#hSun)"/>
      <circle cx="46" cy="42" r="15" fill="#ffe08a"/>
      <g fill="#ffffff" opacity=".92">
        <ellipse cx="238" cy="38" rx="26" ry="11"/><ellipse cx="256" cy="32" rx="18" ry="9"/><ellipse cx="220" cy="33" rx="14" ry="8"/>
        <ellipse cx="128" cy="22" rx="18" ry="8"/><ellipse cx="142" cy="18" rx="12" ry="6"/>
      </g>
      <!-- gulls -->
      <path d="M186 52 c3 -4 7 -4 9 0 M196 52 c3 -4 7 -4 9 0 M268 74 c3 -4 7 -4 9 0" fill="none" stroke="#4a6a8a" stroke-width="2.5" stroke-linecap="round"/>
      <!-- sea -->
      <ellipse cx="160" cy="196" rx="158" ry="42" fill="url(#hSea)"/>
      <path d="M30 190 q12 -7 24 0 M92 206 q12 -7 24 0 M212 208 q12 -7 24 0 M268 188 q12 -7 24 0"
            fill="none" stroke="#fff8e7" stroke-width="4" stroke-linecap="round" opacity=".55"/>
      <!-- island -->
      <ellipse cx="160" cy="182" rx="104" ry="30" fill="#e8c477"/>
      <ellipse cx="160" cy="176" rx="86" ry="21" fill="#ffe9b3"/>
      <ellipse cx="160" cy="172" rx="64" ry="14" fill="#fff3d6"/>
      <!-- palm tree -->
      <path d="M96 168 C 90 146, 92 122, 104 104" fill="none" stroke="#8a5423" stroke-width="9" stroke-linecap="round"/>
      <path d="M104 104 C 84 92, 66 94, 56 106 C 72 100, 90 100, 102 110 Z" fill="#2f9e83"/>
      <path d="M104 104 C 124 90, 142 92, 152 104 C 136 98, 118 100, 106 110 Z" fill="#2f9e83"/>
      <path d="M104 104 C 100 86, 108 72, 120 66 C 112 78, 108 92, 108 106 Z" fill="#37b3a4"/>
      <path d="M104 104 C 96 88, 82 80, 70 82 C 84 88, 96 94, 102 106 Z" fill="#37b3a4"/>
      <circle cx="100" cy="112" r="5" fill="#6f4118"/><circle cx="110" cy="114" r="5" fill="#6f4118"/>
      <!-- treasure chest -->
      <g transform="translate(140,84) scale(1.15)">${sub(ART.chest(true))}</g>
      <!-- parrot perched beside the chest, facing it -->
      <g transform="translate(158,74) scale(-.62,.62)">${sub(ART.parrot())}</g>
    `, '0 0 320 240');
  }
};

/* Node (unit-test) support */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ART;
}

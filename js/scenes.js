// Animierte Zwischensequenzen mit Noah & Lauri
(function () {
  'use strict';

  // Aussehen der Figuren (nach Fotos von Noah & Lauri)
  const LOOK = {
    noah: { skin: '#f0c4a0', hair: '#5e3f26', hair2: '#8a6340', eyes: '#4a2c17', pants: '#2a3040', shoes: '#f2f2f2' },
    lauri: { skin: '#f6d2b8', hair: '#b8925a', hair2: '#dcbd86', eyes: '#4a2c17', dress: '#d8323f', shoes: '#f2e6d8' }
  };
  const DEFS = `<defs>
    <pattern id="nStripe" width="8" height="7" patternUnits="userSpaceOnUse"><rect width="8" height="7" fill="#1f2a44"/><rect y="4" width="8" height="2.2" fill="#f4f4f0"/></pattern>
    <pattern id="lFlower" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#fbf4ee"/>
      <path d="M6,1 Q8,4 6,6 Q4,4 6,1 M11,6 Q8,8 6,6 Q8,4 11,6 M6,11 Q4,8 6,6 Q8,8 6,11 M1,6 Q4,4 6,6 Q4,8 1,6" fill="#d8323f"/></pattern>
  </defs>`;

  function face(L, smile) {
    return `<ellipse class="eye" cx="-7" cy="-116" rx="2.4" ry="2.8" fill="${L.eyes}"/><ellipse class="eye" cx="7" cy="-116" rx="2.4" ry="2.8" fill="${L.eyes}"/>
      <circle cx="-6.2" cy="-117" r=".8" fill="#fff"/><circle cx="7.8" cy="-117" r=".8" fill="#fff"/>
      <circle cx="-12" cy="-108" r="3.5" fill="#ff8a9a" opacity=".4"/><circle cx="12" cy="-108" r="3.5" fill="#ff8a9a" opacity=".4"/>
      <path class="mouth" d="M-6,-106 Q0,-99 6,-106" fill="${smile ? '#fff' : 'none'}" stroke="#7a3b2e" stroke-width="1.8" stroke-linecap="round"/>`;
  }

  function person(who, o = {}) {
    const L = Object.assign({}, LOOK[who], o.look || {});
    const pose = o.pose || '';
    if (who === 'noah') {
      return `<g class="pp ${pose}" transform="scale(1.07)">
        <g class="leg ll"><rect x="-12" y="-52" width="10" height="50" rx="4" fill="${L.pants}"/><ellipse cx="-8" cy="-1" rx="9" ry="4" fill="${L.shoes}"/></g>
        <g class="leg lr"><rect x="2" y="-52" width="10" height="50" rx="4" fill="${L.pants}"/><ellipse cx="8" cy="-1" rx="9" ry="4" fill="${L.shoes}"/></g>
        <g class="arm al"><rect x="-27" y="-95" width="9" height="20" rx="4" fill="url(#nStripe)"/><rect x="-26" y="-78" width="7" height="27" rx="3.5" fill="${L.skin}"/><circle cx="-22.5" cy="-51" r="4.6" fill="${L.skin}"/></g>
        <rect x="-19" y="-98" width="38" height="50" rx="10" fill="url(#nStripe)"/>
        <g class="arm ar"><rect x="18" y="-95" width="9" height="20" rx="4" fill="url(#nStripe)"/><rect x="19" y="-78" width="7" height="27" rx="3.5" fill="${L.skin}"/>
          <rect x="18.5" y="-60" width="8" height="3.2" rx="1.5" fill="#151515"/><circle cx="22.5" cy="-51" r="4.6" fill="${L.skin}"/></g>
        <rect x="-5" y="-104" width="10" height="9" fill="${L.skin}"/>
        <ellipse cx="0" cy="-118" rx="18" ry="21" fill="${L.skin}"/>
        <ellipse cx="-18" cy="-116" rx="3" ry="5" fill="${L.skin}"/><ellipse cx="18" cy="-116" rx="3" ry="5" fill="${L.skin}"/>
        <path d="M-20,-117 Q-24,-132 -16,-140 Q-14,-150 -4,-148 Q2,-156 10,-149 Q20,-151 21,-140 Q27,-132 20,-118
                 Q18,-128 12,-130 Q14,-124 8,-122 Q8,-128 2,-128 Q-2,-122 -8,-123 Q-6,-129 -12,-129 Q-16,-126 -20,-117 Z" fill="${L.hair}"/>
        <path d="M-12,-142 Q-6,-147 0,-144 M4,-146 Q10,-149 14,-143 M-16,-133 Q-12,-138 -6,-136" stroke="${L.hair2}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M-12,-110 Q-6,-112 -2,-110 M2,-110 Q6,-112 12,-110" stroke="none" fill="none"/>
        <path d="M-10,-122 L-4,-121 M4,-121 L10,-122" stroke="${L.hair}" stroke-width="2" stroke-linecap="round"/>
        ${face(L, true)}
      </g>`;
    }
    // Lauri
    return `<g class="pp ${pose}">
      <g class="leg ll"><rect x="-10" y="-40" width="8" height="38" rx="4" fill="${L.skin}"/><ellipse cx="-7" cy="-1" rx="8" ry="3.5" fill="${L.shoes}"/></g>
      <g class="leg lr"><rect x="2" y="-40" width="8" height="38" rx="4" fill="${L.skin}"/><ellipse cx="7" cy="-1" rx="8" ry="3.5" fill="${L.shoes}"/></g>
      <path d="M-21,-124 Q-25,-90 -22,-68 Q-10,-62 0,-64 Q10,-62 22,-68 Q25,-90 21,-124 Q18,-142 0,-142 Q-18,-142 -21,-124 Z" fill="${L.hair}"/>
      <g class="arm al"><rect x="-25" y="-92" width="7" height="42" rx="3.5" fill="${L.skin}"/><circle cx="-21.5" cy="-50" r="4.3" fill="${L.skin}"/></g>
      <path d="M-15,-96 Q0,-99 15,-96 L17,-68 L27,-34 Q0,-28 -27,-34 L-17,-68 Z" fill="url(#lFlower)"/>
      <path d="M-27,-34 Q0,-28 27,-34 L27,-37 Q0,-31 -27,-37 Z" fill="${L.dress}"/>
      <line x1="-10" y1="-96" x2="-12" y2="-104" stroke="${L.dress}" stroke-width="1.6"/><line x1="10" y1="-96" x2="12" y2="-104" stroke="${L.dress}" stroke-width="1.6"/>
      <g class="arm ar"><rect x="18" y="-92" width="7" height="42" rx="3.5" fill="${L.skin}"/><circle cx="21.5" cy="-50" r="4.3" fill="${L.skin}"/></g>
      <path d="M-6,-104 L-6,-97 Q0,-94 6,-97 L6,-104 Z" fill="${L.skin}"/>
      <path d="M-6,-99 Q0,-92 6,-99" stroke="#e2b54a" stroke-width="1" fill="none"/><path d="M0,-94 v4 M-1.5,-92.5 h3" stroke="#e2b54a" stroke-width="1"/>
      <ellipse cx="0" cy="-118" rx="17" ry="20" fill="${L.skin}"/>
      <path d="M0,-140 Q-14,-139 -18,-126 Q-20,-110 -19,-92 L-15,-92 Q-15,-112 -12,-124 Q-7,-136 0,-136 Z" fill="${L.hair}"/>
      <path d="M0,-140 Q14,-139 18,-126 Q20,-110 19,-92 L15,-92 Q15,-112 12,-124 Q7,-136 0,-136 Z" fill="${L.hair}"/>
      <path d="M-15,-128 Q-18,-115 -17,-96 M15,-128 Q18,-115 17,-96 M-6,-139 Q-12,-137 -15,-130 M6,-139 Q12,-137 15,-130" stroke="${L.hair2}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <line x1="0" y1="-140" x2="0" y2="-137" stroke="${L.skin}" stroke-width="1"/>
      <circle cx="-17.5" cy="-108" r="2.6" fill="#e2b54a"/><circle cx="17.5" cy="-108" r="2.6" fill="#e2b54a"/>
      <path d="M-11,-123 Q-7,-125 -3,-123 M3,-123 Q7,-125 11,-123" stroke="#8a6a44" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      ${face(L, true)}
    </g>`;
  }

  // Ein Akteur: Wrapper mit Bewegung (CSS-Animation), innen die Figur
  function actor(who, x, y, o = {}) {
    const s = o.scale || 1, flip = o.flip ? -1 : 1;
    return `<g style="transform:translate(${x}px,${y}px)"><g class="mv" style="${o.anim ? 'animation:' + o.anim + ';' : ''}">
      <g style="transform:scale(${s * flip},${s})">${person(who, o)}</g></g>
      ${o.label ? '' : ''}</g>`;
  }

  const heart = (x, y, s = 1, d = 0, c = '#ff4d6a') =>
    `<g style="transform:translate(${x}px,${y}px)"><g class="hfloat" style="animation-delay:${d}s"><path transform="scale(${s})" d="M0,6 C-10,-4 -14,-12 -7,-16 C-3,-18 0,-15 0,-12 C0,-15 3,-18 7,-16 C14,-12 10,-4 0,6 Z" fill="${c}"/></g></g>`;

  const sky = (top, bottom) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="600" height="340" fill="url(#sky)"/>`;
  const stars = n => Array.from({ length: n }, (_, i) => `<circle class="twinkle" style="animation-delay:${(i % 7) * 0.3}s" cx="${(i * 97) % 600}" cy="${(i * 53) % 160}" r="${1 + (i % 3) * 0.5}" fill="#fff"/>`).join('');

  const SCENES = {
    0: {
      cap: 'Frankfurt ↔ Alicante. Zwei Bildschirme, ein Team. 📞',
      svg: () => `${sky('#1b1030', '#3a1a40')}${stars(40)}
        <path d="M150,250 Q300,90 450,250" fill="none" stroke="#d9ad5b" stroke-width="3" stroke-dasharray="8 8" class="dash"/>
        <text x="150" y="300" text-anchor="middle" fill="#f3e9df" font-size="15" font-family="Inter" font-weight="700">🇩🇪 Frankfurt</text>
        <text x="450" y="300" text-anchor="middle" fill="#f3e9df" font-size="15" font-family="Inter" font-weight="700">🇪🇸 Alicante</text>
        ${actor('lauri', 150, 275, { pose: 'phone', anim: 'pop .6s both' })}
        ${actor('noah', 450, 275, { pose: 'phone', flip: true, anim: 'pop .6s .3s both' })}
        <g class="sig"><text x="300" y="150" text-anchor="middle" font-size="34">📞</text></g>
        ${heart(300, 120, 1.3, 1.2)}`
    },
    1: {
      cap: 'Am Tag danach: Lauri am Steuer ihres schwarzen Mercedes. Erst zu Luis vortrinken, dann ins Pik Dame! 🚗🎶',
      svg: () => `${sky('#ff9e7a', '#5a2a5a')}${stars(12)}
        ${[[20, 150, 70], [100, 120, 60], [170, 170, 50], [430, 140, 60], [500, 110, 80]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${270 - y}" fill="#2a1a33"/><rect x="${x + 10}" y="${y + 15}" width="10" height="12" fill="#ffd76b" opacity=".6"/><rect x="${x + w - 22}" y="${y + 40}" width="10" height="12" fill="#ffd76b" opacity=".45"/>`).join('')}
        <rect x="380" y="150" width="90" height="120" fill="#3a2f4a"/><text x="425" y="185" text-anchor="middle" font-size="13" fill="#fff" font-family="Inter" font-weight="700">LUIS</text>
        <rect x="408" y="210" width="34" height="60" fill="#d9ad5b"/><text x="425" y="140" text-anchor="middle" font-size="22" class="pop" style="animation-delay:3.4s">🍻</text>
        <rect y="270" width="600" height="70" fill="#2b2633"/><rect class="lane" y="302" width="600" height="4" fill="#d9ad5b" opacity=".5"/>
        <g class="car"><g style="transform:translate(0,0)">
          <g style="transform:translate(100px,262px) scale(.62)">${person('noah', { pose: '' })}</g>
          <g style="transform:translate(172px,262px) scale(.62)">${person('lauri', { pose: '' })}</g>
          <path d="M40,250 L70,212 Q80,200 100,200 L190,200 Q208,200 220,214 L248,250 Z" fill="rgba(160,190,220,.25)" stroke="#111114" stroke-width="7"/>
          <line x1="140" y1="200" x2="140" y2="250" stroke="#111114" stroke-width="6"/>
          <circle cx="196" cy="236" r="9" fill="none" stroke="#222" stroke-width="3"/>
          <rect x="14" y="246" width="266" height="40" rx="14" fill="#141418"/><path d="M24,258 H270" stroke="#c9ccd4" stroke-width="2" opacity=".8"/><rect x="30" y="252" width="60" height="4" rx="2" fill="#fff" opacity=".18"/><rect x="268" y="270" width="14" height="6" rx="2" fill="#c9ccd4"/>
          <circle cx="266" cy="262" r="6" fill="#ffe7a0"/>
          <circle cx="75" cy="288" r="17" fill="#222"/><circle cx="75" cy="288" r="7" fill="#999"/><circle cx="220" cy="288" r="17" fill="#222"/><circle cx="220" cy="288" r="7" fill="#999"/>
          <text x="145" y="276" text-anchor="middle" font-size="11" font-family="Inter" font-weight="700" fill="#fff">+ Luis & Freundin an Bord</text>
        </g></g>
        <text class="note" x="160" y="160" font-size="24" fill="#ffd76b">♪</text><text class="note" style="animation-delay:.9s" x="220" y="150" font-size="24" fill="#ff8fb1">♫</text>`
    },
    beach: {
      cap: 'Alles begann im April. Beachvolleyball im Sand. 🏐',
      svg: () => `${sky('#7cc6f2', '#cdeefc')}<circle cx="520" cy="60" r="32" fill="#ffd84d" class="sun"/>
        <rect y="250" width="600" height="90" fill="#f0d39a"/><path d="M0,250 Q150,240 300,250 T600,250 V260 H0Z" fill="#e7c27c"/>
        <line x1="300" y1="160" x2="300" y2="300" stroke="#333" stroke-width="4"/><rect x="230" y="158" width="140" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>
        ${actor('noah', 180, 290, { pose: 'jump1', anim: 'hop 1.2s ease-in-out infinite' })}
        ${actor('lauri', 420, 290, { pose: 'jump1', flip: true, anim: 'hop 1.2s .6s ease-in-out infinite' })}
        <g class="ball"><text font-size="26" text-anchor="middle">🏐</text></g>
        <g style="transform:translate(70px,90px)"><g class="cupid"><text font-size="34">👼</text><text x="30" y="-4" font-size="14" font-family="Inter" fill="#2a1d16" font-weight="700">Luis</text></g></g>
        ${heart(300, 120, 1.4, 2.4)}`
    },
    2: {
      cap: 'Pik Dame. Die Nacht gehört euch. ♠',
      svg: () => `<rect width="600" height="340" fill="#0d0710"/>
        ${[0, 1, 2, 3, 4].map(i => `<polygon class="beam" style="animation-delay:${i * 0.3}s;transform-origin:${80 + i * 110}px 0px" points="${80 + i * 110},0 ${40 + i * 110},340 ${120 + i * 110},340" fill="${['#ff4d6a', '#7b2cff', '#d9ad5b', '#2ec4ff', '#ff4d6a'][i]}" opacity=".18"/>`).join('')}
        <circle cx="300" cy="40" r="22" fill="#ccc" class="disco"/><text x="300" y="48" text-anchor="middle" font-size="22">🪩</text>
        ${Array.from({ length: 25 }, (_, i) => `<rect class="tileb" style="animation-delay:${(i * 0.13) % 1}s" x="${150 + (i % 5) * 60}" y="${262 + Math.floor(i / 5) * 16}" width="56" height="13" fill="#ff4d6a"/>`).join('')}
        ${actor('noah', 250, 270, { pose: 'dance', anim: 'bob .45s ease-in-out infinite alternate' })}
        ${actor('lauri', 350, 270, { pose: 'dance', flip: true, anim: 'bob .45s .22s ease-in-out infinite alternate' })}
        <text class="note" x="200" y="120" font-size="26" fill="#d9ad5b">♪</text><text class="note" style="animation-delay:.8s" x="400" y="110" font-size="26" fill="#ff8fb1">♫</text>
        <text x="300" y="200" text-anchor="middle" font-size="44" fill="#fff" opacity=".9" class="pulse">♠</text>`
    },
    3: {
      cap: '5 Uhr morgens. Jacken an, ab zu Luis. 🌙',
      svg: () => `${sky('#0b1030', '#2a2050')}${stars(50)}<circle cx="500" cy="60" r="26" fill="#f4efd0"/><circle cx="510" cy="54" r="24" fill="#16183a"/>
        <rect y="270" width="600" height="70" fill="#2b2633"/><rect y="292" width="600" height="4" fill="#d9ad5b" opacity=".4"/>
        ${[40, 160, 420].map(x => `<rect x="${x}" y="150" width="70" height="120" fill="#1d1a2b"/><rect x="${x + 12}" y="170" width="14" height="16" fill="#ffd76b" opacity=".7"/><rect x="${x + 42}" y="200" width="14" height="16" fill="#ffd76b" opacity=".5"/>`).join('')}
        <rect x="520" y="140" width="80" height="130" fill="#3a2f4a"/><text x="560" y="180" text-anchor="middle" font-size="13" fill="#fff" font-family="Inter" font-weight="700">LUIS</text><rect x="545" y="200" width="30" height="70" fill="#d9ad5b"/>
        <g class="walkacross">${actor('lauri', 0, 280, { pose: 'walking' })}${actor('noah', 50, 280, { pose: 'walking' })}</g>`
    },
    4: {
      cap: 'Bei Luis. „Papa, ich schlaf bei Luis ❤️“ … gesendet! 📱',
      svg: () => `${sky('#ffb37a', '#ffe3b8')}<circle cx="300" cy="250" r="70" fill="#ffd84d" class="rise"/>
        <rect y="250" width="600" height="90" fill="#8a6a54"/>
        <rect x="70" y="120" width="140" height="110" fill="#c9e4f5" stroke="#fff" stroke-width="6"/><line x1="140" y1="120" x2="140" y2="230" stroke="#fff" stroke-width="4"/>
        <rect x="380" y="230" width="140" height="18" fill="#6b4a33"/><rect x="400" y="208" width="70" height="22" fill="#c9a26b"/><text x="435" y="224" text-anchor="middle" font-size="10" font-family="Inter" font-weight="800" fill="#7a2a1a">🎲 SPIELE</text>
        ${actor('noah', 240, 300, { pose: 'yawn' })}
        ${actor('lauri', 320, 300, { pose: 'phone', flip: true })}
        <g style="transform:translate(350px,140px)"><g class="pop" style="animation-delay:1.2s"><rect x="-70" y="-20" width="140" height="34" rx="16" fill="#fff"/><text x="0" y="2" text-anchor="middle" font-size="12" font-family="Inter" font-weight="700" fill="#2a1d16">Papa, ich schlaf bei Luis ❤️</text></g></g>
        <g style="transform:translate(400px,180px)"><g class="pop" style="animation-delay:2.2s"><text font-size="14" font-family="Inter" font-weight="700" fill="#2a8a4a">✓✓ gesendet</text></g></g>
        <text x="270" y="150" font-size="22" class="zz">💤</text>`
    },
    5: {
      cap: 'Eine Nachricht auf Instagram … und dann noch eine. 💬',
      svg: () => `${sky('#2a1640', '#5a2350')}
        ${actor('noah', 120, 300, { pose: 'phone' })}${actor('lauri', 480, 300, { pose: 'phone', flip: true })}
        <g class="msg1"><rect x="0" y="0" width="80" height="34" rx="16" fill="#262629"/><text x="40" y="22" text-anchor="middle" font-size="16">Hey 🙈</text></g>
        <g class="msg2"><rect x="0" y="0" width="80" height="34" rx="16" fill="#c1358a"/><text x="40" y="22" text-anchor="middle" font-size="16">😄❤️</text></g>
        ${heart(300, 160, 1.5, 1.5)}${heart(260, 190, 1, 2)}${heart(340, 200, 1.1, 2.5)}`
    },
    6: {
      cap: 'Spaziergang durch Preungesheim. Hand in Hand. 🌳',
      svg: () => `${sky('#a6dbf7', '#e6f6ff')}<rect y="260" width="600" height="80" fill="#8ccf6a"/><path d="M0,290 Q300,270 600,290 L600,310 Q300,290 0,310Z" fill="#e8d9b5"/>
        ${[60, 200, 360, 520].map((x, i) => `<g class="tree" style="animation-delay:${i * 0.4}s;transform-origin:${x}px 260px"><rect x="${x - 6}" y="200" width="12" height="62" fill="#7a5233"/><circle cx="${x}" cy="190" r="${34 + i % 2 * 8}" fill="${i % 2 ? '#5fae4a' : '#4a9a3c'}"/></g>`).join('')}
        <g class="walkslow">${actor('lauri', 0, 298, { pose: 'walking hold' })}${actor('noah', 42, 298, { pose: 'walking hold2' })}</g>
        <text class="leaf" x="100" y="0" font-size="18">🍃</text><text class="leaf" style="animation-delay:2s" x="420" y="0" font-size="18">🍂</text>`
    },
    7: {
      cap: 'Billard in Bornheim. Volltreffer. 🎱',
      svg: () => `<rect width="600" height="340" fill="#2a1a14"/><rect x="0" y="0" width="600" height="80" fill="#3a2418"/>
        <polygon points="250,60 350,60 380,100 220,100" fill="#ffd76b" opacity=".25"/>
        <rect x="120" y="190" width="360" height="90" rx="14" fill="#5a2e17"/><rect x="136" y="200" width="328" height="70" rx="6" fill="#0f6b3a"/>
        <circle cx="462" cy="204" r="9" fill="#000"/>
        <g class="cue"><circle cx="0" cy="0" r="8" fill="#fbfaf5"/></g>
        <g class="b8"><circle cx="0" cy="0" r="8" fill="#111"/><circle cx="0" cy="0" r="3.5" fill="#fff"/></g>
        ${actor('noah', 80, 300, { pose: 'cheer', anim: 'hop .8s 1.6s ease-in-out 3' })}
        ${actor('lauri', 530, 300, { pose: 'cheer', flip: true, anim: 'hop .8s 1.7s ease-in-out 3' })}
        ${heart(462, 180, 1.6, 1.6)}`
    },
    8: {
      cap: 'Bowling in Oberursel. Strike! (Und am Ende 13 Pins Vorsprung 😏)',
      svg: () => `<rect width="600" height="340" fill="#1a1230"/><polygon points="230,330 370,330 330,120 270,120" fill="#c8945a"/>
        ${[[300, 130], [290, 138], [310, 138], [280, 146], [300, 146], [320, 146]].map(([x, y], i) => `<g class="pin" style="transform-origin:${x}px ${y + 14}px;animation-delay:${1.2 + i * 0.05}s"><ellipse cx="${x}" cy="${y}" rx="5" ry="12" fill="#fff"/><rect x="${x - 4}" y="${y - 6}" width="8" height="2" fill="#d11f3c"/></g>`).join('')}
        <g class="bball"><circle cx="0" cy="0" r="16" fill="#7b2cff"/><circle cx="-4" cy="-5" r="2.4" fill="#2a0a50"/><circle cx="3" cy="-6" r="2.4" fill="#2a0a50"/></g>
        ${actor('noah', 120, 310, { pose: 'cheer', anim: 'hop .7s 1.4s ease-in-out 4' })}
        ${actor('lauri', 480, 310, { pose: 'arms', flip: true })}
        <g style="transform:translate(470px,150px)"><g class="pop" style="animation-delay:1.8s"><rect x="-38" y="-22" width="76" height="36" rx="10" fill="#fff"/><text x="0" y="3" text-anchor="middle" font-size="16" font-family="Inter" font-weight="800" fill="#d11f3c">2:1 😤</text></g></g>`
    },
    9: {
      cap: '1. September. Bis bald … ✈️💛',
      svg: () => `${sky('#ff9a6b', '#ffd9a8')}<rect y="250" width="600" height="90" fill="#7d7f86"/><rect y="290" width="600" height="6" fill="#fff" opacity=".6"/>
        <rect x="20" y="130" width="160" height="120" fill="#4a5568"/><rect x="30" y="140" width="140" height="80" fill="#9fd3f0" opacity=".7"/>
        ${actor('lauri', 100, 248, { pose: 'waving', scale: 0.8 })}
        <g class="plane"><text font-size="60">✈️</text></g>
        <text x="96" y="122" font-size="20" class="tear">💧</text>
        <path d="M200,230 Q380,60 560,40" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 8" opacity=".7" class="dash"/>`
    },
    10: {
      cap: '6. September. Ding Dong: Überraschung! 💐',
      svg: () => `${sky('#ffe3b8', '#fff4dc')}<rect x="200" y="60" width="200" height="260" fill="#e8d2b0"/><rect y="300" width="600" height="40" fill="#c8a982"/>
        <rect x="250" y="120" width="100" height="180" fill="#3a2418"/>
        <g class="doorleaf"><rect x="250" y="120" width="100" height="180" fill="#8a5a33"/><circle cx="335" cy="215" r="5" fill="#d9ad5b"/></g>
        ${actor('noah', 300, 300, { pose: 'shock', anim: 'pop .5s 1.3s both' })}
        ${actor('lauri', 440, 300, { pose: 'flowers', flip: true, anim: 'slidein 1s both' })}
        <text x="395" y="210" font-size="30" class="pop" style="animation-delay:.9s">💐</text>
        ${heart(300, 90, 1.8, 2)}${heart(250, 110, 1.1, 2.3)}${heart(350, 105, 1.2, 2.6)}
        <text x="300" y="50" text-anchor="middle" font-size="22" font-family="Inter" font-weight="800" fill="#d11f3c" class="pop" style="animation-delay:1.6s">ÜBERRASCHUNG!</text>`
    },
    11: {
      cap: 'Alicante & Valencia. Shakshuka bei Sonnenuntergang. 🍳🌅',
      svg: () => `${sky('#ff7e5f', '#feb47b')}<circle cx="300" cy="230" r="60" fill="#ffd84d" opacity=".9"/>
        <rect y="230" width="600" height="110" fill="#2b6f9e"/><path d="M0,240 Q75,232 150,240 T300,240 T450,240 T600,240" stroke="#fff" stroke-width="2" fill="none" opacity=".5" class="wave"/>
        <path d="M20,230 L40,170 L60,230 Z M70,230 L95,150 L120,230Z" fill="#6b3a2a" opacity=".6"/>
        <rect x="220" y="255" width="160" height="10" fill="#6b4a33"/><rect x="235" y="265" width="8" height="60" fill="#6b4a33"/><rect x="357" y="265" width="8" height="60" fill="#6b4a33"/>
        <ellipse cx="300" cy="250" rx="38" ry="10" fill="#222"/><text x="300" y="254" text-anchor="middle" font-size="16">🍳</text>
        <text class="steam" x="290" y="230" font-size="18" fill="#fff">~</text><text class="steam" style="animation-delay:.7s" x="305" y="230" font-size="18" fill="#fff">~</text>
        ${actor('noah', 180, 325, { pose: 'eat' })}${actor('lauri', 420, 325, { pose: 'eat', flip: true })}
        ${heart(300, 150, 1.3, 1.8)}`
    },
    12: {
      cap: 'Heute. Vier Monate. ♠❤️',
      svg: () => `${sky('#1b1030', '#3a1422')}${stars(60)}
        ${actor('lauri', 220, 300, { pose: 'hug', anim: 'meetL 1.6s both' })}${actor('noah', 380, 300, { pose: 'hug', flip: true, anim: 'meetR 1.6s both' })}
        <g style="transform:translate(300px,120px)"><g class="pop" style="animation-delay:1.6s"><rect x="-30" y="-44" width="60" height="88" rx="8" fill="#fff"/><text x="0" y="10" text-anchor="middle" font-size="40">♠</text><text x="-20" y="-28" font-size="14" font-weight="800">D</text></g></g>
        ${heart(240, 150, 1.4, 2)}${heart(360, 140, 1.2, 2.3)}${heart(300, 60, 1.6, 2.6)}`
    }
  };

  const CSS = `
  .scene{position:relative;width:100%;max-width:640px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px -30px #000;background:#000}
  .scene svg{display:block;width:100%;height:auto}
  .scene .mv,.scene .pp,.scene .pp *{transform-box:fill-box}
  .scene .leg,.scene .arm{transform-origin:50% 5%}
  .pp.walking .ll{animation:swing .5s ease-in-out infinite alternate}
  .pp.walking .lr{animation:swing .5s ease-in-out infinite alternate-reverse}
  .pp.walking .al{animation:swing .5s ease-in-out infinite alternate-reverse}
  .pp.walking .ar{animation:swing .5s ease-in-out infinite alternate}
  .pp.hold2 .al,.pp.hold .ar{animation:none;transform:rotate(-35deg)}
  .pp.dance .al{animation:armup .45s ease-in-out infinite alternate}
  .pp.dance .ar{animation:armup2 .45s ease-in-out infinite alternate}
  .pp.jump1 .al,.pp.jump1 .ar{transform:rotate(180deg)}
  .pp.jump1 .ar{transform:rotate(-180deg)}
  .pp.cheer .al{transform:rotate(160deg)} .pp.cheer .ar{transform:rotate(-160deg)}
  .pp.waving .ar{animation:wave .4s ease-in-out infinite alternate}
  .pp.phone .ar{transform:rotate(-120deg)}
  .pp.stretch .al{transform:rotate(170deg)} .pp.stretch .ar{transform:rotate(-170deg)}
  .pp.yawn .ar{transform:rotate(-150deg)} .pp.yawn .mouth{d:path("M-4,-104 Q0,-98 4,-104 Q0,-110 -4,-104")}
  .pp.shock .al{transform:rotate(130deg)} .pp.shock .ar{transform:rotate(-130deg)} .pp.shock .mouth{d:path("M-4,-104 Q0,-97 4,-104 Q0,-109 -4,-104")}
  .pp.flowers .ar{transform:rotate(-80deg)}
  .pp.arms .al{transform:rotate(25deg)} .pp.arms .ar{transform:rotate(-25deg)}
  .pp.eat .ar{animation:eat 1s ease-in-out infinite alternate}
  .pp.hug .ar{transform:rotate(-80deg)} .pp.hug .al{transform:rotate(-60deg)}
  .eye{animation:blink 4s infinite;transform-origin:center}
  @keyframes swing{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}
  @keyframes armup{from{transform:rotate(140deg)}to{transform:rotate(175deg)}}
  @keyframes armup2{from{transform:rotate(-175deg)}to{transform:rotate(-140deg)}}
  @keyframes wave{from{transform:rotate(-150deg)}to{transform:rotate(-110deg)}}
  @keyframes eat{from{transform:rotate(-20deg)}to{transform:rotate(-110deg)}}
  @keyframes blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
  @keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-40px)}}
  @keyframes bob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-10px) rotate(3deg)}}
  @keyframes pop{from{transform:scale(0);opacity:0}70%{transform:scale(1.15)}to{transform:scale(1);opacity:1}}
  @keyframes slidein{from{transform:translateX(200px)}to{transform:translateX(0)}}
  @keyframes meetL{from{transform:translateX(-200px)}to{transform:translateX(40px)}}
  @keyframes meetR{from{transform:translateX(200px)}to{transform:translateX(-40px)}}
  .hfloat{opacity:0;animation:hf 2.6s ease-out infinite}
  @keyframes hf{0%{opacity:0;transform:translateY(20px) scale(.4)}20%{opacity:1}100%{opacity:0;transform:translateY(-70px) scale(1.2)}}
  .twinkle{animation:tw 2s ease-in-out infinite alternate} @keyframes tw{from{opacity:.2}to{opacity:1}}
  .dash{stroke-dashoffset:200;animation:dash 3s linear infinite} @keyframes dash{to{stroke-dashoffset:0}}
  .sig{animation:pop .5s 1s both}
  .sun{animation:pulse 2s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
  .pulse{animation:pulse .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
  @keyframes pulse{from{transform:scale(1)}to{transform:scale(1.12)}}
  .ball{animation:ball 1.2s ease-in-out infinite alternate}
  @keyframes ball{0%{transform:translate(200px,180px)}50%{transform:translate(300px,70px)}100%{transform:translate(400px,180px)}}
  .cupid{animation:cupid 3s ease-in-out infinite alternate} @keyframes cupid{from{transform:translate(0,0)}to{transform:translate(380px,20px)}}
  .beam{animation:beam 1.6s ease-in-out infinite alternate} @keyframes beam{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
  .tileb{animation:tile .9s steps(2) infinite} @keyframes tile{0%{fill:#ff4d6a}50%{fill:#7b2cff}100%{fill:#d9ad5b}}
  .note{animation:note 2s ease-out infinite} @keyframes note{from{transform:translateY(0);opacity:1}to{transform:translateY(-80px);opacity:0}}
  .walkacross{animation:across 6s linear both} @keyframes across{from{transform:translateX(-80px)}to{transform:translateX(470px)}}
  .walkslow{animation:across2 7s linear both} @keyframes across2{from{transform:translateX(-60px)}to{transform:translateX(560px)}}
  .rise{animation:rise 3s ease-out both;transform-box:fill-box} @keyframes rise{from{transform:translateY(80px)}to{transform:translateY(0)}}
  .zz{animation:note 2.4s ease-out infinite}
  .msg1{animation:msg1 3s ease-in-out infinite} @keyframes msg1{0%{transform:translate(140px,150px);opacity:0}15%{opacity:1}60%{transform:translate(360px,120px);opacity:1}70%,100%{opacity:0;transform:translate(380px,120px)}}
  .msg2{animation:msg2 3s 1.5s ease-in-out infinite;opacity:0} @keyframes msg2{0%{transform:translate(380px,180px);opacity:0}15%{opacity:1}60%{transform:translate(160px,150px);opacity:1}70%,100%{opacity:0;transform:translate(140px,150px)}}
  .tree{animation:sway 3s ease-in-out infinite alternate} @keyframes sway{from{transform:rotate(-2deg)}to{transform:rotate(2deg)}}
  .leaf{animation:leaf 5s linear infinite} @keyframes leaf{from{transform:translate(0,0) rotate(0)}to{transform:translate(-60px,340px) rotate(360deg)}}
  .cue{animation:cue 1.6s ease-in both} @keyframes cue{from{transform:translate(170px,250px)}to{transform:translate(380px,220px)}}
  .b8{animation:b8 1.2s 1.4s ease-out both;transform:translate(390px,218px)} @keyframes b8{from{transform:translate(390px,218px)}to{transform:translate(462px,204px) scale(.3)}}
  .bball{animation:bball 1.4s ease-in both} @keyframes bball{from{transform:translate(300px,330px) scale(1.4)}to{transform:translate(300px,150px) scale(.6)}}
  .pin{animation:pin .6s ease-out both} @keyframes pin{from{transform:rotate(0)}to{transform:rotate(80deg) translateY(-6px);opacity:.3}}
  .pop{animation:pop .5s both;transform-box:fill-box;transform-origin:center}
  .plane{animation:plane 4s ease-in both} @keyframes plane{from{transform:translate(180px,260px) rotate(-10deg) scale(.6)}to{transform:translate(560px,20px) rotate(-25deg) scale(.25)}}
  .tear{animation:note 2s 1.5s ease-in infinite;opacity:0}
  .doorleaf{animation:door 1s .8s ease-in-out both;transform-box:fill-box;transform-origin:0 50%} @keyframes door{to{transform:scaleX(.1)}}
  .wave{animation:wv 2s ease-in-out infinite alternate} @keyframes wv{to{transform:translateX(-20px)}}
  .steam{animation:note 2s ease-out infinite}
  .car{animation:car 3.4s cubic-bezier(.3,.7,.4,1) both} @keyframes car{from{transform:translateX(-300px)}to{transform:translateX(150px)}}
  .lane{stroke-dasharray:0}
  .scap{font-family:Caveat,cursive;font-size:1.7rem;line-height:1.15;margin:14px 0 6px;min-height:2.2em}
  .scap span{opacity:0;animation:fadein .05s forwards}
  @keyframes fadein{to{opacity:1}}
  @media (prefers-reduced-motion: reduce){.scene *{animation-duration:.01s!important;animation-iteration-count:1!important}}
  `;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  window.Scenes = {
    LOOK,
    has: n => !!SCENES[n],
    html(n) {
      const s = SCENES[n];
      const cap = s.cap.split('').map((c, i) => `<span style="animation-delay:${0.6 + i * 0.035}s">${c}</span>`).join('');
      return `<div class="scene"><svg viewBox="0 0 600 340">${DEFS}${s.svg()}</svg></div><div class="scap">${cap}</div>`;
    },
    person
  };
})();

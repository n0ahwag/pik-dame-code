(function () {
  'use strict';

  // ---------- Hilfen ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NAME = { p1: 'Noah', p2: 'Lauri' };
  const norm = s => String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');

  let D;
  (function decode() {
    const key = new TextEncoder().encode('pik-dame:lauri+noah');
    const raw = Uint8Array.from(atob(window.__PD), c => c.charCodeAt(0));
    const out = raw.map((b, i) => b ^ key[i % key.length] ^ ((i * 7) & 255));
    D = JSON.parse(new TextDecoder().decode(out));
  })();

  const LS = {
    get(k, d) { try { const v = localStorage.getItem('pd_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pd_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- Sound ----------
  let actx = null;
  function beep(freqs, dur = 0.15, type = 'sine', vol = 0.15) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      freqs.forEach(f => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.9;
      });
    } catch (e) {}
  }
  const sndOk = () => beep([660, 880, 1320], 0.16, 'triangle');
  const sndBad = () => beep([220, 160], 0.16, 'sawtooth', 0.07);

  // ---------- Zustand ----------
  const S = {
    me: LS.get('me', null),
    room: LS.get('room', 'lauri-noah'),
    joined: false,
    stage: 0,
    epoch: 0,
    shownStage: -1,
    cleanups: [],
    updaters: []
  };
  const K = k => 'e' + S.epoch + '/' + k;
  const get = (k, d) => Net.get(K(k), d);
  const set = (k, v) => Net.set(K(k), v);
  const other = () => (S.me === 'p1' ? 'p2' : 'p1');

  function addCleanup(fn) { S.cleanups.push(fn); }
  function runCleanups() { S.cleanups.forEach(f => { try { f(); } catch (e) {} }); S.cleanups = []; S.updaters = []; }
  function later(fn, ms) { const t = setTimeout(fn, ms); addCleanup(() => clearTimeout(t)); return t; }

  // ---------- Daten für die Rätsel (öffentlich, verraten nichts allein) ----------
  const PAT = (s => s.replace(/\s/g, '').split('').map(c => (c === '#' ? 1 : 0)));
  const SPADE = PAT('..#.. .###. ##### #.#.# ..#..');
  const SWITCHES = [
    { lab: 'A', name: 'Ass', p: PAT('#...# .#.#. ..#.. .#.#. #...#') },
    { lab: 'K', name: 'König', p: PAT('..#.. .#.#. #...# .#.#. ..#..') },
    { lab: 'D', name: 'Dame', p: PAT('..... ##.## .###. ..... .....') },
    { lab: 'B', name: 'Bube', p: PAT('..... .###. .#.#. .###. .....') },
    { lab: '10', name: 'Zehn', p: PAT('..... ##### ..... ##### .....') },
    { lab: '9', name: 'Neun', p: PAT('..#.. ..#.. ..#.. ..#.. ..#..') }
  ];
  function floorFrom(sw) {
    const f = new Array(25).fill(0);
    SWITCHES.forEach((s, i) => { if (sw[i]) s.p.forEach((v, j) => { f[j] ^= v; }); });
    return f;
  }

  // Spaziergang: Gitter 6x6, y=0 ist Süden
  const WALK_ROWS = ['MRTEKI', 'GOLCSA', 'FUZEPN', 'BSIWOH', 'NELDVR', 'KTEOMU']; // index = y
  const LANDMARKS = [
    { x: 0, y: 0, e: '🚏', n: 'Bushaltestelle' },
    { x: 0, y: 3, e: '⛪', n: 'Kirche' },
    { x: 2, y: 1, e: '🥐', n: 'Bäcker' },
    { x: 5, y: 1, e: '⛲', n: 'Brunnen' },
    { x: 3, y: 4, e: '🛝', n: 'Spielplatz' },
    { x: 4, y: 2, e: '💊', n: 'Apotheke' },
    { x: 1, y: 5, e: '🍦', n: 'Eisdiele' }
  ];
  const DIRS = ['Norden', 'Osten', 'Süden', 'Westen'];
  const DV = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  // Billard-Farben
  const BALL = { 1: '#f2c014', 2: '#1d4ed8', 3: '#dc2626', 4: '#6b21a8', 5: '#f97316', 6: '#15803d', 7: '#7f1d1d', 8: '#111111' };
  function ballSVG(n, cx, cy, r, num) {
    const base = n > 8 ? n - 8 : n, col = BALL[base], striped = n > 8;
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    let s = '';
    if (striped) {
      s += `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbfaf5"/>`;
      s += `<rect x="${cx - r}" y="${cy - r * 0.55}" width="${2 * r}" height="${r * 1.1}" fill="${col}" clip-path="url(#${id})"/>`;
    } else {
      s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
    if (num) {
      s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="#fff"/>`;
      s += `<text x="${cx}" y="${cy + r * 0.2}" text-anchor="middle" font-size="${r * 0.6}" font-weight="700" font-family="Inter,sans-serif" fill="#111">${n}</text>`;
    }
    s += `<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.4}" r="${r * 0.18}" fill="rgba(255,255,255,.55)"/>`;
    return s;
  }

  function pcard(v, suit) {
    const red = suit === '♥' || suit === '♦';
    return `<div class="pcard ${red ? 'red' : ''}"><div class="c1">${v}<br>${suit}</div><div class="mid">${suit}</div><div class="c2">${v}<br>${suit}</div></div>`;
  }

  // Bowling
  const BOWL = {
    p1: { name: 'Noah', g1: 124, g3: 112, g2: ['X', '7/', '9-', 'X', 'X', '8/', '72', 'X', '9/', 'X81'] },
    p2: { name: 'Lauri', g1: 139, g3: 119, g2: ['8/', '72', 'X', '9-', '6/', '81', '7/', 'X', '9-', '8/7'] }
  };

  // ---------- Kapitel ----------
  const STAGES = {};

  STAGES[1] = {
    k: 'Kapitel 1', title: 'Luis\' Masterplan', when: 'April · Volleyball', icon: '🏐',
    cap: 'April, Volleyball. Luis\' Plan ist aufgegangen.',
    story: `<p>Alles begann in einer Turnhalle. Ich hatte da so eine Idee: Wenn ich euch zwei geschickt aufstelle, stehen
      ihr irgendwann zusammen vorne am Netz. Und genau dann rufe ich <b>Time-out</b> und stelle euch einander vor. 😏</p>
      <p>Aber bei welchem Spielstand war es so weit?</p>`,
    p2(el) {
      el.innerHTML = `
        <div class="you">Du hast <b>Luis' Whiteboard</b> mit der Startaufstellung eures Teams.</div>
        <div class="paper">
          <h3>Startaufstellung</h3>
          <svg viewBox="0 0 360 330" style="width:100%;max-width:420px;display:block;margin:0 auto">
            <rect x="30" y="40" width="300" height="250" fill="#e9a35b" stroke="#fff" stroke-width="4"/>
            <line x1="30" y1="123" x2="330" y2="123" stroke="#fff" stroke-width="3"/>
            <rect x="20" y="30" width="320" height="10" fill="#222"/>
            <text x="180" y="24" text-anchor="middle" font-size="14" font-family="Inter" fill="#2a1d16" font-weight="700">NETZ</text>
            ${[[80, 85, '?'], [180, 85, 'Luis'], [280, 85, '?'], [80, 215, '?'], [180, 215, 'Lauri'], [280, 215, 'Noah']].map(([x, y, n]) =>
              `<circle cx="${x}" cy="${y}" r="30" fill="${n === '?' ? '#fff' : n === 'Luis' ? '#2a1d16' : '#d11f3c'}" stroke="#2a1d16" stroke-width="2"/>
               <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="${n === '?' ? 20 : 14}" font-weight="700" font-family="Inter" fill="${n === '?' ? '#2a1d16' : '#fff'}">${n}</text>`).join('')}
            <text x="330" y="314" text-anchor="end" font-size="13" font-family="Inter" fill="#2a1d16">↻ Rotation im Uhrzeigersinn</text>
          </svg>
          <p class="hand" style="font-size:1.4rem;margin:.4em 0 0">Wir rotieren nur, wenn wir dem Gegner den Aufschlag abnehmen.
          Dann rückt jeder eine Position weiter, <u>im Uhrzeigersinn</u>.</p>
          <p class="hand" style="font-size:1.4rem;margin:.2em 0 0">Sobald N. &amp; L. beide vorne am Netz direkt nebeneinander stehen: TIME-OUT! 😏</p>
        </div>
        <div class="waitnote">Noah hat den Spielbericht und gibt die Lösung ein.</div>`;
    },
    p1(el, api) {
      const seq = 'GGWWGWWWGGGGWWGWWGWG'.split('');
      let w = 0, g = 0;
      el.innerHTML = `
        <div class="you">Du hast den <b>Spielbericht</b> des Satzes. Lauri hat Luis' Whiteboard mit der Aufstellung.</div>
        <div class="paper">
          <h3>Spielbericht · 1. Satz</h3>
          <p class="small" style="margin-top:0">Den ersten Aufschlag hatte der <b>Gegner</b>. Wer einen Ballwechsel gewinnt, schlägt als Nächstes auf.</p>
          <div class="scroll-x"><table class="score"><tr><th>Ballwechsel</th>${seq.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>
          <tr><td><b>Punkt für</b></td>${seq.map(p => `<td style="font-weight:700;color:${p === 'W' ? '#c8102e' : '#555'}">${p === 'W' ? 'Wir' : 'Geg.'}</td>`).join('')}</tr></table></div>
        </div>
        <h3 style="margin-top:18px">Bei welchem Spielstand rief Luis „Time-out“?</h3>
        <p class="muted small">Format: Wir : Gegner, also zum Beispiel 3:5</p>`;
      api.answer(el, 'z. B. 3:5');
    }
  };

  STAGES[2] = {
    k: 'Kapitel 2', title: 'Die Tanzfläche', when: 'Dieselbe Nacht · Club Pik Dame', icon: '♠',
    cap: 'Pik Dame. Die Tanzfläche gehörte euch.',
    story: `<p>Nach dem Volleyball sind wir weitergezogen, ins <b>Pik Dame</b>. Der DJ dort ist eigen: Er legt erst auf,
      wenn die Tanzfläche das Zeichen des Clubs zeigt.</p>`,
    p1(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst <b>auf der Tanzfläche</b> und siehst die Lichter. Lauri steht am Lichtpult, sie sieht die Fläche nicht.</div>
        <div class="floor" id="floor">${'<div class="tile"></div>'.repeat(25)}</div>
        <p class="center muted small" style="margin-top:12px">Sag Lauri genau, was passiert, wenn sie etwas umschaltet.</p>`;
      const draw = () => {
        const f = floorFrom(get('s2/sw', [0, 0, 0, 0, 0, 0]));
        $$('.tile', el).forEach((t, i) => t.classList.toggle('on', !!f[i]));
        const win = f.every((v, i) => v === SPADE[i]);
        $('#floor', el).classList.toggle('win', win);
        if (win) later(() => api.solve(), 900);
      };
      draw(); api.onUpdate(k => { if (k === 's2/sw') draw(); });
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst am <b>Lichtpult</b>. Was die Regler machen, sieht nur Noah auf der Tanzfläche.</div>
        <div class="mixer">${SWITCHES.map((s, i) => `<button class="sw" data-i="${i}"><div class="lab">${s.lab}</div><div class="tog"></div><div class="small muted">${s.name}</div></button>`).join('')}</div>`;
      const draw = () => {
        const sw = get('s2/sw', [0, 0, 0, 0, 0, 0]);
        $$('.sw', el).forEach((b, i) => b.classList.toggle('on', !!sw[i]));
        const f = floorFrom(sw);
        if (f.every((v, i) => v === SPADE[i])) later(() => api.solve(), 900);
      };
      $$('.sw', el).forEach(b => b.onclick = () => {
        const sw = get('s2/sw', [0, 0, 0, 0, 0, 0]).slice();
        sw[+b.dataset.i] = sw[+b.dataset.i] ? 0 : 1;
        set('s2/sw', sw); beep([440 + 60 * +b.dataset.i], 0.08, 'square', 0.05);
      });
      draw(); api.onUpdate(k => { if (k === 's2/sw') draw(); });
    }
  };

  STAGES[3] = {
    k: 'Kapitel 3', title: 'Die Garderobe', when: 'Pik Dame · kurz nach 3 Uhr', icon: '🧥',
    cap: 'Jacken geholt. Nächster Halt?',
    story: `<p>Irgendwann wolltet ihr eure Jacken holen. Der Türsteher an der Garderobe gibt sie aber nur gegen ein Passwort raus.
      Ich habe es euch auf die Garderobenmarken geschrieben, natürlich verschlüsselt. 🃏</p>`,
    p1(el) {
      const c = [['A', '♦'], ['6', '♥'], ['D', '♠'], ['6', '♥'], ['9', '♣'], ['8', '♦']];
      el.innerHTML = `
        <div class="you">Du hast die <b>sechs Garderobenmarken</b>. Lauri steht beim Türsteher.</div>
        <div class="cards">${c.map(([v, s], i) => `<div class="ticket">${pcard(v, s)}<div class="no">Marke ${i + 1}</div></div>`).join('')}</div>
        <p class="center muted small" style="margin-top:14px">D = Dame, B = Bube, K = König, A = Ass</p>
        <div class="waitnote">Lauri gibt das Passwort beim Türsteher ein.</div>`;
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst beim <b>Türsteher</b>. Die Garderobenmarken hat Noah.</div>
        <div class="paper">
          <p style="margin-top:0">Der Türsteher verschränkt die Arme und brummt:</p>
          <p class="hand" style="font-size:1.6rem;line-height:1.25;margin:.2em 0">„Schwarz läuft vorwärts durch das ABC,<br>
          Rot läuft rückwärts, vom Z zum A.<br>
          Das Ass macht immer den Anfang,<br>und die Bilder zählen weiter.“</p>
          <p class="small" style="margin-bottom:0"><b>Ass</b> = 1 · 2 … 10 · <b>Bube</b> = 11 · <b>Dame</b> = 12 · <b>König</b> = 13</p>
        </div>
        <h3 style="margin-top:18px">Passwort</h3>`;
      api.answer(el, 'Passwort …');
    }
  };

  STAGES[4] = {
    k: 'Kapitel 4', title: 'Die Nacht bei Luis', when: 'Bei Luis zu Hause · irgendwann morgens', icon: '🍕',
    cap: 'Die Nacht bei Luis. Mit Pizza um 4 Uhr.',
    story: `<p>Danach seid ihr mit zu mir gekommen. Am nächsten Morgen habe ich euch eine Frühstücksbox mit Zahlenschloss hingestellt,
      denn ohne Rätsel gibt's bei mir nichts. 😄 Mein Wohnzimmer war allerdings noch ziemlich dunkel.</p>`,
    p1(el) {
      el.innerHTML = `
        <div class="you">Du stehst in <b>Luis' dunklem Wohnzimmer</b> und hast eine Taschenlampe (Maus bzw. Finger bewegen).
        Das Licht im Zimmer steuert Lauri.</div>
        <div class="room" id="room">
          <svg viewBox="0 0 900 520">
            <rect width="900" height="520" fill="#3b2e2a"/>
            <rect y="380" width="900" height="140" fill="#5a4334"/>
            <rect x="40" y="60" width="200" height="130" fill="#20304a" stroke="#c9b28b" stroke-width="6"/>
            <text x="140" y="140" font-size="40" text-anchor="middle">🌙</text>
            <!-- Uhr -->
            <circle cx="470" cy="110" r="52" fill="#f4efe6" stroke="#2a1d16" stroke-width="6"/>
            ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${470 + Math.sin(a) * 40}" y1="${110 - Math.cos(a) * 40}" x2="${470 + Math.sin(a) * 46}" y2="${110 - Math.cos(a) * 46}" stroke="#2a1d16" stroke-width="3"/>`; }).join('')}
            <line x1="470" y1="110" x2="${470 + Math.sin(5 * Math.PI / 6) * 26}" y2="${110 - Math.cos(5 * Math.PI / 6) * 26}" stroke="#2a1d16" stroke-width="6" stroke-linecap="round"/>
            <line x1="470" y1="110" x2="470" y2="72" stroke="#2a1d16" stroke-width="4" stroke-linecap="round"/>
            <text x="470" y="185" font-size="20" text-anchor="middle" fill="#e9dcc6" font-family="Inter" font-weight="700">8</text>
            <!-- Sofa -->
            <text x="160" y="400" font-size="170" text-anchor="middle">🛋️</text>
            <text x="110" y="330" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">7</text>
            <!-- Fernseher -->
            <text x="740" y="230" font-size="130" text-anchor="middle">📺</text>
            <text x="780" y="128" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">3</text>
            <!-- Tisch -->
            <rect x="380" y="360" width="260" height="22" fill="#7a5233"/>
            <rect x="395" y="382" width="14" height="70" fill="#5e3e26"/><rect x="611" y="382" width="14" height="70" fill="#5e3e26"/>
            <!-- Pizzakarton -->
            <rect x="400" y="320" width="120" height="40" fill="#c9a26b" stroke="#8a6a40" stroke-width="3"/>
            <text x="460" y="347" font-size="16" text-anchor="middle" fill="#7a2a1a" font-family="Inter" font-weight="800">PIZZA</text>
            <text x="508" y="314" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">9</text>
            <!-- Spielkarte -->
            <g transform="rotate(-14 585 335)"><rect x="560" y="300" width="48" height="66" rx="5" fill="#fff" stroke="#333"/>
            <text x="584" y="330" font-size="20" text-anchor="middle" font-family="Georgia" font-weight="700">D</text>
            <text x="584" y="354" font-size="22" text-anchor="middle">♠</text></g>
            <text x="620" y="300" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">6</text>
            <!-- Volleyball -->
            <text x="330" y="490" font-size="70" text-anchor="middle">🏐</text>
            <text x="370" y="440" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">2</text>
            <!-- Pflanze, Gitarre, Lampe -->
            <text x="860" y="480" font-size="90" text-anchor="middle">🪴</text>
            <text x="815" y="400" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">5</text>
            <text x="640" y="500" font-size="100" text-anchor="middle" transform="rotate(-10 640 460)">🎸</text>
            <text x="690" y="420" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">1</text>
            <text x="300" y="250" font-size="70" text-anchor="middle">💡</text>
            <text x="335" y="200" font-size="20" fill="#e9dcc6" font-family="Inter" font-weight="700">0</text>
            <!-- Schwarzlicht-Ziffern -->
            <g class="uvl" font-family="Inter" font-weight="800" font-size="24" fill="#7dfcff" style="filter:drop-shadow(0 0 6px #7dfcff)">
              <text x="430" y="300">4</text>
              <text x="296" y="420">7</text>
              <text x="550" y="392">1</text>
              <text x="410" y="70">5</text>
            </g>
          </svg>
          <div class="dark"></div>
        </div>
        <div class="waitnote">Lauri hat Luis' Zettel und das Zahlenschloss der Frühstücksbox.</div>`;
      const room = $('#room', el);
      const move = e => {
        const r = room.getBoundingClientRect();
        room.style.setProperty('--x', (e.clientX - r.left) + 'px');
        room.style.setProperty('--y', (e.clientY - r.top) + 'px');
      };
      room.addEventListener('pointermove', move);
      room.addEventListener('pointerdown', move);
      const draw = () => room.classList.toggle('uv', !!get('s4/uv', false));
      draw(); STAGES.__api.onUpdate(k => { if (k === 's4/uv') draw(); });
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du hast <b>Luis' Zettel vom Kühlschrank</b> und die Frühstücksbox. Das Zimmer sieht nur Noah.</div>
        <div class="paper note">
          <p class="hand" style="font-size:1.55rem;line-height:1.25;margin:0">Guten Morgen, ihr Turteltauben! 🐦<br>
          Der Code für die Frühstücksbox steht im Wohnzimmer, in dieser Reihenfolge:<br>
          1. Was ihr um 4 Uhr nachts noch gegessen habt<br>
          2. Womit alles angefangen hat<br>
          3. Wo ihr gestern Abend wart<br>
          4. Wann ihr endlich eingeschlafen seid<br>
          <br>PS: Normale Zahlen lügen. Die Wahrheit leuchtet nur im Partylicht. ✨</p>
        </div>
        <div class="uvswitch"><span>Partylicht (Schwarzlicht)</span><button class="big-toggle" id="uv" aria-label="Schwarzlicht"></button></div>
        <h3>Frühstücksbox 🔒</h3>`;
      const draw = () => $('#uv', el).classList.toggle('on', !!get('s4/uv', false));
      $('#uv', el).onclick = () => { set('s4/uv', !get('s4/uv', false)); beep([300], 0.1, 'square', 0.05); };
      draw(); api.onUpdate(k => { if (k === 's4/uv') draw(); });
      api.keypad(el, 4);
    }
  };

  STAGES[5] = {
    k: 'Kapitel 5', title: 'Die erste Nachricht', when: 'Ein paar Tage später · Instagram', icon: '💬',
    cap: 'Die ersten Nachrichten. Herzklopfen inklusive.',
    story: `<p>Ein paar Tage später kam die erste Nachricht. Ich habe den Chat natürlich nie gesehen, ehrlich! 🙈
      Aber ich weiß, dass darin versteckt steht, was ihr als Nächstes vorhattet.</p>`,
    p1(el, api) {
      el.innerHTML = `
        <div class="you">Auf deinem Handy ist eine <b>Nachricht von Luis</b>. Den Chat sieht nur Lauri.</div>
        <div class="paper">
          <p style="margin-top:0"><b>Luis:</b> Bro. Bei ihr zählt jede Minute. 😉 Und denk dran: A ist die 1.</p>
          <div class="abc">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => `<div>${c} = ${i + 1}</div>`).join('')}</div>
        </div>
        <h3 style="margin-top:18px">Was hattet ihr vor?</h3>`;
      api.answer(el, 'Ein Wort …');
    },
    p2(el) {
      const M = [
        ['Mittwoch'],
        ['l', '20:47', 'Hey, hier ist Noah 🙈 Luis hat mir deinen Insta gegeben, ich hoffe, das ist okay'],
        ['r', '21:19', 'Haha klar ist das okay 😄'],
        ['l', '21:52', 'War echt ein schöner Abend. Auch wenn mein Aufschlag peinlich war'],
        ['r', '22:16', 'Dein Aufschlag war … kreativ 😂'],
        ['l', '22:33', 'Autsch. Ich trainiere noch'],
        ['r', '23:01', 'Ich bin gespannt 😏 Gute Nacht!'],
        ['Donnerstag'],
        ['l', '07:42', 'Guten Morgen ☀️'],
        ['r', '08:26', 'Morgen! Ich bin noch so müde von Samstag 😴'],
        ['l', '12:03', 'Same 😅'],
        ['r', '13:09', 'Luis hat mich schon dreimal gefragt, ob wir schreiben 🙄'],
        ['l', '13:22', 'Haha typisch Luis. Sag ihm nichts!'],
        ['r', '14:05', 'Niemals 🤐'],
        ['Freitag'],
        ['l', '18:37', 'Hast du am Wochenende Zeit? Ich würde dich gerne wiedersehen'],
        ['r', '19:18', 'Ja, Sonntag hätte ich Zeit 😊'],
        ['l', '19:44', 'Perfekt! Was wollen wir machen?'],
        ['r', '20:05', 'Ich kenn da eine schöne Ecke in Preungesheim 🌳'],
        ['l', '20:12', 'Deal. Ich freu mich ❤️'],
        ['r', '21:14', 'Ich mich auch 🥰']
      ];
      el.innerHTML = `
        <div class="you">Das ist <b>dein Chat mit Noah</b> von damals. Noah hat einen Hinweis von Luis.</div>
        <div class="phone"><div class="scr">
          <div class="hd"><div class="ava">N</div><div><b>noah</b><div class="small muted">Instagram</div></div></div>
          <div class="msgs">${M.map(m => m.length === 1 ? `<div class="day">${m[0]}</div>` :
            `<div class="bub ${m[0]}">${m[2]}<span class="t">${m[1]}</span></div>`).join('')}</div>
        </div></div>
        <div class="waitnote">Noah gibt die Lösung ein.</div>`;
    }
  };

  STAGES[6] = {
    k: 'Kapitel 6', title: 'Spaziergang', when: 'Ein Sonntag · Preungesheim', icon: '🌳',
    cap: 'Der erste Spaziergang durch Preungesheim.',
    story: `<p>Euer erstes richtiges Date: ein Spaziergang durch Preungesheim. Ich habe euch eine Route aufgeschrieben.
      Bei jedem 📸 macht ihr ein Foto, und die Fotos verraten, wohin es danach ging.</p>`,
    p1(el, api) {
      const C = 70, O = 45;
      const px = x => O + x * C, py = y => O + (5 - y) * C;
      el.innerHTML = `
        <div class="you">Du hast die <b>Karte von Preungesheim</b>. Lauri läuft und sieht die Karte nicht.</div>
        <div class="card" style="padding:10px;background:#efe6d3">
          <svg viewBox="0 0 440 440" style="width:100%;max-width:520px;display:block;margin:0 auto" id="map">
            <rect width="440" height="440" fill="#efe6d3"/>
            ${Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => `<rect x="${px(i) + 9}" y="${py(5 - j) + 9}" width="${C - 18}" height="${C - 18}" rx="6" fill="${(i + j) % 3 === 0 ? '#bcd9a8' : '#d9cdb6'}"/>`).join('')).join('')}
            ${Array.from({ length: 6 }, (_, i) => `<line x1="${px(i)}" y1="${py(0)}" x2="${px(i)}" y2="${py(5)}" stroke="#fff" stroke-width="9" stroke-linecap="round"/><line x1="${px(0)}" y1="${py(i)}" x2="${px(5)}" y2="${py(i)}" stroke="#fff" stroke-width="9" stroke-linecap="round"/>`).join('')}
            ${LANDMARKS.map(l => `<text x="${px(l.x) - 13}" y="${py(l.y) + 24}" font-size="20">${l.e}</text>`).join('')}
            <g id="walker"><circle r="13" fill="#d11f3c" stroke="#fff" stroke-width="3"/><path d="M0,-9 L6,3 L-6,3 z" fill="#fff"/></g>
            <text x="420" y="22" text-anchor="end" font-size="13" font-family="Inter" font-weight="700" fill="#2a1d16">N ↑</text>
          </svg>
          <div class="row small" style="justify-content:center;color:#2a1d16;margin-top:6px">${LANDMARKS.map(l => `<span>${l.e} ${l.n}</span>`).join('')}</div>
        </div>
        <h3 style="margin-top:16px">Fotostreifen</h3>
        <div class="strip" id="strip"></div>
        <h3 style="margin-top:12px">Wohin ging es danach?</h3>`;
      const draw = () => {
        const w = get('s6/walk', { x: 0, y: 0, d: 0, ph: [] });
        $('#walker', el).setAttribute('transform', `translate(${px(w.x)},${py(w.y)}) rotate(${w.d * 90})`);
        $('#strip', el).innerHTML = w.ph.length ? w.ph.map(c => `<div class="ph"><div>${c}</div></div>`).join('') : '<span class="muted small">Noch keine Fotos</span>';
      };
      draw(); api.onUpdate(k => { if (k === 's6/walk') draw(); });
      api.answer(el, 'Ein Wort …');
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du <b>läufst</b>. Die Karte hat Noah, er sagt dir, wo du gerade bist.</div>
        <div class="paper note">
          <p class="hand" style="font-size:1.45rem;margin:0 0 .2em">Luis' Route ✍️</p>
          <ol class="steps hand" style="font-size:1.35rem;line-height:1.2">
            <li>Start an der Bushaltestelle, Blick nach Norden. Geradeaus, bis du an der Kirche stehst. 📸</li>
            <li>Rechts abbiegen und zwei Kreuzungen weiter. 📸</li>
            <li>Links abbiegen, eine Kreuzung weiter. 📸</li>
            <li>Umdrehen und geradeaus bis zum Bäcker. 📸</li>
            <li>Links abbiegen und weiter bis zum Brunnen. 📸</li>
            <li>Links abbiegen, drei Kreuzungen weiter. 📸</li>
            <li>Links abbiegen, bis du am Spielplatz bist. 📸</li>
          </ol>
        </div>
        <div style="margin-top:16px"><div class="compass"><div class="n">N</div><div class="needle" id="needle"></div></div>
        <p class="center small muted" id="wstat"></p></div>
        <div class="walkpad">
          <button data-a="l">↺ Links drehen</button><button data-a="f">⬆ Eine Kreuzung vor</button><button data-a="r">↻ Rechts drehen</button>
          <button data-a="p" class="wide">📸 Foto machen</button>
          <button data-a="reset" class="wide" style="opacity:.75">↩ Zurück zum Start (Fotos löschen)</button>
        </div>`;
      const draw = (msg) => {
        const w = get('s6/walk', { x: 0, y: 0, d: 0, ph: [] });
        $('#needle', el).style.transform = `rotate(${w.d * 90}deg)`;
        $('#wstat', el).textContent = msg || `Blickrichtung: ${DIRS[w.d]} · Fotos: ${w.ph.length}`;
      };
      $$('.walkpad button', el).forEach(b => b.onclick = () => {
        const w = JSON.parse(JSON.stringify(get('s6/walk', { x: 0, y: 0, d: 0, ph: [] })));
        const a = b.dataset.a; let msg = '';
        if (a === 'l') w.d = (w.d + 3) % 4;
        if (a === 'r') w.d = (w.d + 1) % 4;
        if (a === 'f') {
          const nx = w.x + DV[w.d][0], ny = w.y + DV[w.d][1];
          if (nx < 0 || ny < 0 || nx > 5 || ny > 5) { msg = '🚧 Da geht es nicht weiter.'; sndBad(); }
          else { w.x = nx; w.y = ny; beep([520], 0.05, 'triangle', 0.05); }
        }
        if (a === 'p') { w.ph.push(WALK_ROWS[w.y][w.x]); beep([1200, 1500], 0.06, 'square', 0.04); msg = '📸 Klick! Foto ' + w.ph.length + ' gemacht.'; }
        if (a === 'reset') { w.x = 0; w.y = 0; w.d = 0; w.ph = []; msg = 'Zurück an der Bushaltestelle, Blick nach Norden.'; }
        set('s6/walk', w); draw(msg);
      });
      draw(); api.onUpdate(k => { if (k === 's6/walk') draw(); });
      const n = document.createElement('div'); n.className = 'waitnote'; n.textContent = 'Noah sieht die Fotos und gibt die Lösung ein.'; el.appendChild(n);
    }
  };

  STAGES[7] = {
    k: 'Kapitel 7', title: 'Die Kugeln', when: 'Billard · Bornheim', icon: '🎱',
    cap: 'Billard in Bornheim. Die Kugeln haben es verraten.',
    story: `<p>In Bornheim habt ihr Billard gespielt. Jemand hat dabei heimlich eine Nachricht hinterlassen, auf einem Kreidezettel neben dem Tisch.
      Es ist eine Reihe Kugeln, aber ohne Nummern. 🎱</p>`,
    p1(el) {
      const pos = [[120, 90, 11], [210, 70, 3], [300, 120, 14], [420, 80, 8], [520, 140, 1], [640, 90, 9], [700, 200, 6], [590, 250, 13],
                   [460, 220, 2], [350, 260, 12], [230, 200, 5], [130, 260, 15], [260, 330, 7], [480, 330, 4], [650, 330, 10]];
      el.innerHTML = `
        <div class="you">Du stehst am <b>Billardtisch</b>. Lauri hat den Kreidezettel.</div>
        <svg viewBox="0 0 800 420" style="width:100%;display:block">
          <rect x="0" y="0" width="800" height="420" rx="26" fill="#5a2e17"/>
          <rect x="30" y="30" width="740" height="360" rx="10" fill="#0f6b3a"/>
          ${[[36, 36], [400, 30], [764, 36], [36, 384], [400, 390], [764, 384]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="#0a0a0a"/>`).join('')}
          ${pos.map(([x, y, n]) => ballSVG(n, x, y, 24, true)).join('')}
        </svg>
        <div class="waitnote">Lauri gibt die Lösung ein.</div>`;
    },
    p2(el, api) {
      const seq = [9, 3, 8, 12, 9, 5, 2, 5, 4, 9, 3, 8];
      el.innerHTML = `
        <div class="you">Du hast den <b>Kreidezettel</b>. Die Kugeln mit Nummern sieht Noah auf dem Tisch.</div>
        <div class="paper" style="background:#1e3a2a;color:#eef">
          <svg viewBox="0 0 ${seq.length * 60 + 20} 90" style="width:100%;display:block">
            ${seq.map((n, i) => ballSVG(n, 40 + i * 60, 45, 24, false)).join('')}
          </svg>
          <p class="hand center" style="font-size:1.6rem;margin:.3em 0 0;color:#fff">1 = A</p>
        </div>
        <h3 style="margin-top:18px">Die Nachricht</h3>`;
      api.answer(el, 'Nachricht …');
    }
  };

  function bowlTable(b) {
    const fr = b.g2.map(f => f.split(''));
    return `<div class="scroll-x"><table class="score">
      <tr>${fr.map((_, i) => `<th colspan="${i === 9 ? 3 : 2}">${i + 1}</th>`).join('')}</tr>
      <tr>${fr.map((f, i) => { const n = i === 9 ? 3 : 2; return Array.from({ length: n }, (_, j) => `<td>${f[j] || (j === 1 && f[0] === 'X' && i < 9 ? '' : '')}</td>`).join(''); }).join('')}</tr>
      <tr>${fr.map((_, i) => `<td colspan="${i === 9 ? 3 : 2}" style="height:32px;color:#aaa">?</td>`).join('')}</tr>
    </table></div>`;
  }

  STAGES[8] = {
    k: 'Kapitel 8', title: 'Die Bowling-Wette', when: 'Bowling · Oberursel', icon: '🎳',
    cap: 'Bowling in Oberursel. 2:1 für Lauri, aber insgesamt …',
    story: `<p>Beim Bowling in Oberursel habt ihr drei Runden gespielt. <b>Lauri hat zwei Runden gewonnen, Noah nur eine.</b>
      Trotzdem behauptet Noah bis heute, er hätte <i>insgesamt</i> gewonnen. Ich habe gewettet, um wie viele Pins. 🎳
      Leider fehlen auf beiden Zetteln die Punkte der 2. Runde.</p>`,
    p1(el, api) {
      const b = BOWL.p1;
      el.innerHTML = `
        <div class="you">Du hast <b>deinen Bowling-Zettel</b> und die halbe Regelkarte. Lauri hat ihren Zettel und die andere Hälfte.</div>
        <div class="paper">
          <h3>Noah</h3>
          <div class="totals"><div>Runde 1<b>${b.g1}</b></div><div>Runde 2<b>?</b></div><div>Runde 3<b>${b.g3}</b></div></div>
          <p class="small" style="margin:.2em 0">Runde 2, Wurf für Wurf:</p>
          ${bowlTable(b)}
          <div class="paper note" style="margin-top:14px">
            <b>Regelkarte (Teil 1)</b><br>
            • Pro Frame hast du bis zu 2 Würfe. Ohne Strike oder Spare zählen einfach die umgeworfenen Pins.<br>
            • <b>X = Strike</b> (alle 10 mit dem ersten Wurf): 10 Punkte <b>plus die Pins der nächsten zwei Würfe</b>.
          </div>
        </div>
        <h3 style="margin-top:18px">Mit wie vielen Pins Vorsprung hat Noah insgesamt gewonnen?</h3>`;
      api.answer(el, 'Zahl …');
    },
    p2(el) {
      const b = BOWL.p2;
      el.innerHTML = `
        <div class="you">Du hast <b>deinen Bowling-Zettel</b> und die halbe Regelkarte. Noah hat seinen Zettel und die andere Hälfte.</div>
        <div class="paper">
          <h3>Lauri</h3>
          <div class="totals"><div>Runde 1<b>${b.g1}</b></div><div>Runde 2<b>?</b></div><div>Runde 3<b>${b.g3}</b></div></div>
          <p class="small" style="margin:.2em 0">Runde 2, Wurf für Wurf:</p>
          ${bowlTable(b)}
          <div class="paper note" style="margin-top:14px">
            <b>Regelkarte (Teil 2)</b><br>
            • <b>/ = Spare</b> (mit dem zweiten Wurf alle 10 abgeräumt): 10 Punkte <b>plus die Pins des nächsten Wurfs</b>.<br>
            • <b>–</b> bedeutet 0 Pins.<br>
            • Im 10. Frame gibt es nach einem Strike oder Spare Extrawürfe. Die zählen nur als Bonus für diesen Frame.
          </div>
        </div>
        <div class="waitnote">Noah gibt die Lösung ein.</div>`;
    }
  };

  const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };

  STAGES[9] = {
    k: 'Kapitel 9', title: 'Der Abschied', when: '1. September · Flughafen', icon: '✈️',
    cap: '1. September. Der große Abschied.',
    story: `<p>Dann kam der 1. September und damit der große Abschied. Noah ist nach Spanien geflogen. Beim Rollen zur Startbahn
      hat er mit der Leselampe aus dem Fenster geblinkt, eine Nachricht nur für Lauri. ✈️💛</p>`,
    p1(el) {
      let stars = '';
      for (let i = 0; i < 60; i++) stars += `<div class="star" style="left:${(i * 37) % 100}%;top:${(i * 53) % 70}%"></div>`;
      el.innerHTML = `
        <div class="you">Du siehst <b>das Flugzeug in der Nacht</b>. Lauri hat eine Morse-Tabelle.</div>
        <div class="night">${stars}<div class="plane">✈️</div><div class="beacon" id="beacon"></div></div>
        <div class="row" style="justify-content:center;margin-top:12px">
          <button class="btn ghost small" id="slow">🐢 Langsamer</button>
          <span class="muted small" id="spd">Tempo: normal</span>
        </div>
        <div class="waitnote">Lauri gibt die Lösung ein.</div>`;
      let factor = 1, alive = true, t = null;
      addCleanup(() => { alive = false; clearTimeout(t); });
      $('#slow', el).onclick = () => { factor = factor === 1 ? 1.7 : 1; $('#spd', el).textContent = 'Tempo: ' + (factor === 1 ? 'normal' : 'langsam'); };
      const bc = $('#beacon', el);
      const steps = [];
      D.morse.split('').forEach((ch, li) => {
        MORSE[ch].split('').forEach((s, si) => {
          steps.push([1, s === '.' ? 380 : 1150]);
          steps.push([0, si === MORSE[ch].length - 1 ? 1700 : 420]);
        });
      });
      steps[steps.length - 1][1] = 4800;
      let i = 0;
      const tick = () => {
        if (!alive) return;
        const [on, ms] = steps[i];
        bc.classList.toggle('on', !!on);
        i = (i + 1) % steps.length;
        t = setTimeout(tick, ms * factor);
      };
      t = setTimeout(tick, 1500);
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst am Flughafen und hast eine <b>Morse-Tabelle</b>. Das Licht sieht nur Noah.</div>
        <div class="paper">
          <p style="margin-top:0"><b>·</b> = kurz &nbsp;&nbsp; <b>–</b> = lang</p>
          <div class="morse">${Object.entries(MORSE).map(([k, v]) => `<div><b>${k}</b> ${v.replace(/\./g, '·').replace(/-/g, '–')}</div>`).join('')}</div>
        </div>
        <h3 style="margin-top:18px">Die Nachricht</h3>`;
      api.answer(el, 'Ein Wort …');
    }
  };

  const BELLS = [
    ['4', [['Molina', '🐕'], ['Castillo', ''], ['Rubio', '🐕']]],
    ['3', [['', ''], ['Vidal', ''], ['', '']]],
    ['2', [['Romero', ''], ['', ''], ['Navarro', '']]],
    ['1', [['García', ''], ['Ortiz', '🐕'], ['Serrano', '']]]
  ];
  const REPLIES = {
    Molina: '„¿Sí? … ¿Noah? ¡Aquí no hay ningún Noah!“ (Hier gibt es keinen Noah.) 🐕 Wuff!',
    Castillo: '„¿Quién es? … No, no, cariño, te equivocas.“ (Du hast dich vertan.)',
    Rubio: '„¡Son las diez de la mañana, es domingo!“ (Es ist Sonntag, 10 Uhr!) 🐕🐕',
    Vidal: '… Herr Vidal drückt einfach auf und legt wieder auf. Er grüßt ja nie.',
    Romero: '„¿Hola? ¿Una sorpresa? ¡Qué bonito! Pero no es aquí.“ (Wie schön! Aber nicht hier.)',
    Navarro: '„¿Noah? El chico nuevo vive arriba, creo …“ (Der Neue wohnt oben, glaube ich …) 🥘',
    'García': '„¿Eh? ¿Qué? No oigo nada.“ (Ich höre nichts.)',
    Ortiz: '🐕 Wuff wuff wuff! … sonst passiert nichts.',
    Serrano: '„Aquí no. Buena suerte.“ (Hier nicht. Viel Glück.)'
  };

  STAGES[10] = {
    k: 'Kapitel 10', title: 'Die Überraschung', when: 'Sonntag, 6. September · Spanien', icon: '💐',
    cap: '6. September. Die Überraschung!',
    story: `<p>Fünf Tage später, an einem Sonntag, stand Lauri plötzlich in Spanien vor Noahs Haus, und Noah ahnte nichts. 🤫
      Es gab nur ein Problem: Noah wohnte erst seit ein paar Tagen dort.</p>`,
    p1(el, api) {
      el.innerHTML = `
        <div class="you">Du sitzt in <b>deiner neuen Wohnung</b>. Lauri steht unten vor dem Klingelbrett.</div>
        <div class="paper note">
          <p class="hand" style="font-size:1.5rem;margin:0;line-height:1.25">Meine neuen Nachbarn 📝<br>
          • Mein Klingelschild ist immer noch leer. Die Hausverwaltung braucht ewig. 🙄<br>
          • Direkt über mir bellt jeden Morgen um 7 ein Hund.<br>
          • Direkt unter mir wohnt Señor Navarro, im ganzen Treppenhaus riecht es nach Paella.<br>
          • Vidal von nebenan grüßt nie.</p>
        </div>
        <div class="door" id="door" style="margin-top:16px">
          <div class="ic">🚪</div>
          <p id="dmsg" class="muted">Alles ruhig. Sonntagmorgen.</p>
          <button class="btn gold" id="open" disabled>🔓 Tür öffnen</button>
        </div>`;
      let ringingUntil = 0, lastRing = (get('s10/ring', null) || {}).t;
      const draw = () => {
        const ringing = Date.now() < ringingUntil;
        $('#door', el).classList.toggle('ring', !!ringing);
        $('#dmsg', el).textContent = ringing ? '🔔 Ding Dong! Es klingelt bei dir!' : 'Alles ruhig. Sonntagmorgen.';
        $('#open', el).disabled = !ringing;
      };
      api.onUpdate(k => {
        if (k === 's10/ring') {
          const r = get('s10/ring', null);
          if (r && r.t === lastRing) return;
          lastRing = r && r.t;
          if (r && r.bell === D.bell) { beep([880, 660, 880, 660], 0.25, 'sine', 0.2); ringingUntil = Date.now() + 20000; later(draw, 20100); }
          draw();
        }
      });
      $('#open', el).onclick = () => { set('s10/open', Date.now()); api.solve(); };
      draw();
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst heimlich <b>vor Noahs Haus</b>. Er weiß nichts davon. Aber welche Klingel ist seine?</div>
        <div class="panel">
          ${BELLS.map(([fl, row]) => `<div class="fl"><div class="lv">${fl}º</div>${row.map(([n, st], i) => {
            const id = fl + 'ABC'[i];
            return `<button class="bell" data-id="${id}" data-n="${n}"><span class="nm ${n ? '' : 'empty'}">${n || '(leer)'}</span><span>${st}</span><span class="btnc"></span><span class="small" style="color:#777">${fl}º ${'ABC'[i]}</span></button>`;
          }).join('')}</div>`).join('')}
        </div>
        <p class="reply" id="reply"></p>`;
      $$('.bell', el).forEach(b => b.onclick = () => {
        const id = b.dataset.id, n = b.dataset.n;
        beep([660, 520], 0.2, 'sine', 0.12);
        set('s10/ring', { bell: id, t: Date.now() });
        const rep = $('#reply', el);
        if (id === D.bell) rep.textContent = 'Bzzzz … Du hörst Schritte. Jetzt muss nur noch jemand öffnen …';
        else if (n) rep.textContent = REPLIES[n];
        else rep.textContent = '… Stille. Niemand macht auf.';
      });
    }
  };

  const ING = [
    ['kartoffeln', '🥔', 'Kartoffeln'], ['oel', '🫒', 'Olivenöl'], ['milch', '🥛', 'Milch'], ['tomaten', '🍅', 'Tomaten'],
    ['kreuzkuemmel', '🟤', 'Kreuzkümmel'], ['garnelen', '🦐', 'Garnelen'], ['zwiebel', '🧅', 'Zwiebel'], ['eier', '🥚', 'Eier'],
    ['paprikapulver', '🌶️', 'Paprikapulver'], ['kaese', '🧀', 'Käse'], ['knoblauch', '🧄', 'Knoblauch'], ['zucker', '🍬', 'Zucker'],
    ['paprika', '🫑', 'Paprika (Schote)'], ['petersilie', '🌿', 'Petersilie']
  ];
  const ACT = [['ruehren', '🥄', 'Umrühren'], ['deckel', '🍲', 'Deckel drauf']];
  const PAN_E = Object.fromEntries([...ING, ...ACT].map(([id, e]) => [id, e]));

  STAGES[11] = {
    k: 'Kapitel 11', title: 'Shakshuka', when: 'Oktober · Valencia', icon: '🍳',
    cap: 'Valencia. Die beste Shakshuka der Welt.',
    story: `<p>Im Oktober der zweite Besuch, diesmal geplant, und zusammen nach Valencia. In einem kleinen Café gab es diese
      unglaubliche Shakshuka. Der Kellner hat das Rezept verraten, allerdings nur auf Spanisch. 🍳</p>`,
    p1(el, api) {
      el.innerHTML = `
        <div class="you">Du hast <b>das Rezept vom Kellner</b>. Lauri steht in der Küche.</div>
        <div class="paper receta">
          <h3>Shakshuka · receta del café</h3>
          <ol>
            <li>Calienta un poco de <b>aceite</b> de oliva en la sartén.</li>
            <li>Añade la <b>cebolla</b> picada.</li>
            <li>Añade el <b>pimiento</b> rojo.</li>
            <li>Añade el <b>ajo</b>.</li>
            <li>Echa una cucharadita de <b>comino</b>.</li>
            <li>Echa una cucharadita de <b>pimentón</b>.</li>
            <li>Añade los <b>tomates</b>.</li>
            <li><b>Remueve</b> bien.</li>
            <li>Casca cuatro <b>huevos</b> encima.</li>
            <li><b>Tapa</b> la sartén.</li>
            <li>Al final, decora con <b>perejil</b>. ¡Buen provecho!</li>
          </ol>
        </div>
        <h3 style="margin-top:16px">Die Pfanne (live)</h3>
        <div class="pan" id="pan"></div>
        <p class="center muted" id="pmsg"></p>`;
      const draw = () => {
        const p = get('s11/pan', { items: [], burnt: false });
        const pan = $('#pan', el);
        pan.classList.toggle('burnt', !!p.burnt);
        pan.classList.toggle('lid', p.items.includes('deckel') && !p.items.includes('petersilie'));
        pan.innerHTML = p.burnt ? '🔥💨' : p.items.filter(i => i !== 'ruehren' && i !== 'deckel').map(i => PAN_E[i]).join('');
        $('#pmsg', el).textContent = p.burnt ? 'Oh nein, angebrannt! Lauri muss von vorne anfangen.' : p.items.length ? p.items.length + ' Schritte geschafft' : 'Die Pfanne ist noch leer.';
      };
      draw(); api.onUpdate(k => { if (k === 's11/pan') draw(); });
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst <b>in der Küche</b>. Das Rezept hat Noah. Die Speisekarte vom Café hilft beim Übersetzen.</div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr);gap:16px">
          <div class="paper menu-card">
            <h3>Café · La Carta</h3>
            <div class="it"><span>Tostada con tomate y aceite de oliva</span><i>Toast mit Tomate und Olivenöl</i></div>
            <div class="it"><span>Tortilla de patatas con cebolla</span><i>Kartoffel-Tortilla mit Zwiebeln</i></div>
            <div class="it"><span>Pimientos rellenos</span><i>Gefüllte Paprika</i></div>
            <div class="it"><span>Gambas al ajo</span><i>Garnelen mit Knoblauch</i></div>
            <div class="it"><span>Hummus con comino</span><i>Hummus mit Kreuzkümmel</i></div>
            <div class="it"><span>Pulpo con pimentón</span><i>Oktopus mit Paprikapulver</i></div>
            <div class="it"><span>Huevos rotos</span><i>„Kaputte Eier“: Spiegeleier auf Pommes</i></div>
            <div class="it"><span>Patatas con perejil</span><i>Kartoffeln mit Petersilie</i></div>
            <div class="it"><span>Café con leche</span><i>Milchkaffee (¡remueve bien! = gut umrühren!)</i></div>
            <p class="small" style="margin-bottom:0"><i>Schon gewusst? „Tapas“ kommt von <b>tapar</b> (zudecken): Früher hat man das Glas mit einer Scheibe Brot zugedeckt.</i></p>
          </div>
          <div>
            <div class="kitchen">${ING.map(([id, e, n]) => `<button data-id="${id}"><span class="e">${e}</span>${n}</button>`).join('')}
            ${ACT.map(([id, e, n]) => `<button class="act" data-id="${id}"><span class="e">${e}</span>${n}</button>`).join('')}</div>
            <p class="center" id="kmsg"></p>
          </div>
        </div>`;
      let busy = false;
      $$('.kitchen button', el).forEach(b => b.onclick = () => {
        if (busy) return;
        const p = JSON.parse(JSON.stringify(get('s11/pan', { items: [], burnt: false })));
        if (p.burnt) return;
        const id = b.dataset.id;
        if (D.cook[p.items.length] === id) {
          p.items.push(id); set('s11/pan', p); beep([500 + p.items.length * 40], 0.08, 'triangle', 0.06);
          $('#kmsg', el).textContent = '✔ ' + b.textContent.trim();
          if (p.items.length === D.cook.length) later(() => api.solve(), 1200);
        } else {
          busy = true; sndBad();
          set('s11/pan', { items: [], burnt: true });
          $('#kmsg', el).textContent = '🔥 Oh nein, angebrannt! Gleich nochmal von vorne …';
          later(() => { set('s11/pan', { items: [], burnt: false }); busy = false; $('#kmsg', el).textContent = 'Neue Pfanne, neues Glück.'; }, 2500);
        }
      });
    }
  };

  STAGES[12] = {
    k: 'Kapitel 12', title: 'Die Pik Dame', when: 'Heute · 6. November', icon: '♠',
    cap: '',
    story: `<p>Und jetzt sind wir bei heute angekommen. Ihr habt eure ganze Geschichte noch einmal erlebt. Die Pik Dame liegt in meinem Tresor,
      und der braucht zwei Schlüssel: euren Code und euch beide gleichzeitig.</p>`,
    p1(el, api) {
      el.innerHTML = `
        <div class="you">Du hast <b>Luis' letzten Brief</b>. Lauri steht vor dem Tresor.</div>
        <div class="paper">
          <p class="hand" style="font-size:1.6rem;line-height:1.25;margin:0">Noah,<br>
          mein Job als Amor war an einem ganz bestimmten Tag offiziell erledigt: an dem Tag, an dem aus
          „die vom Volleyball“ <i>deine Freundin</i> wurde. Genau dieser Tag öffnet den Tresor.<br>
          Vier Ziffern: Tag und Monat.<br><br>– Luis ♠</p>
        </div>
        <div id="holdzone"></div>`;
      api.holdZone($('#holdzone', el));
    },
    p2(el, api) {
      el.innerHTML = `
        <div class="you">Du stehst vor <b>Luis' Tresor</b>. Den Hinweis zum Code hat Noah.</div>
        <div id="vault"></div>
        <div id="holdzone"></div>`;
      const v = $('#vault', el);
      const drawV = () => {
        if (get('s12/vault', false)) { v.innerHTML = '<p class="center" style="color:var(--ok);font-weight:700">🔓 Code richtig! Der Tresor braucht jetzt noch euch beide.</p>'; }
        else if (!v.dataset.k) { v.dataset.k = 1; v.innerHTML = '<h3 class="center">Tresor 🔒</h3>'; api.keypad(v, 4, () => set('s12/vault', true)); }
      };
      drawV(); api.onUpdate(k => { if (k === 's12/vault') drawV(); });
      api.holdZone($('#holdzone', el));
    }
  };

  // ---------- API für Kapitel ----------
  function makeApi(n) {
    const api = {
      solve() {
        if (S.stage === n) {
          set('solved/' + n, Date.now());
          set('stage', n + 1);
        }
      },
      onUpdate(fn) { S.updaters.push(fn); },
      answer(el, ph) {
        const f = document.createElement('form');
        f.className = 'answer';
        f.innerHTML = `<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${ph}"><button class="btn" type="submit">Prüfen</button><div class="msg"></div>`;
        f.onsubmit = e => {
          e.preventDefault();
          const v = norm($('input', f).value);
          if (!v) return;
          if ((D.answers[n] || []).includes(v)) { api.solve(); }
          else {
            sndBad(); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
            $('.msg', f).className = 'msg bad'; $('.msg', f).textContent = 'Leider nicht richtig. Redet nochmal miteinander. 💬';
            set('wrong/' + n, { v: $('input', f).value, t: Date.now(), by: S.me });
          }
        };
        el.appendChild(f);
      },
      keypad(el, len, onOk) {
        const w = document.createElement('div');
        w.innerHTML = `<div class="display">____</div><div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map(k => `<button type="button">${k}</button>`).join('')}</div>`;
        el.appendChild(w);
        let code = '';
        const disp = $('.display', w);
        const show = () => { disp.classList.remove('bad'); disp.textContent = (code + '____').slice(0, len); };
        $$('.keypad button', w).forEach(b => b.onclick = () => {
          const k = b.textContent;
          if (k === '⌫') code = code.slice(0, -1);
          else if (k === '✔') {
            if ((D.answers[n] || []).includes(code)) { sndOk(); onOk ? onOk() : api.solve(); }
            else { sndBad(); disp.textContent = 'FALSCH'; disp.classList.add('bad'); code = ''; setTimeout(show, 900); return; }
          } else if (code.length < len) code += k;
          beep([700], 0.04, 'square', 0.04);
          show();
        });
        show();
      },
      holdZone(zone) {
        let holding = false, prog = 0, iv = null;
        const draw = () => {
          if (!get('s12/vault', false)) { zone.innerHTML = ''; return; }
          if (!zone.dataset.k) {
            zone.dataset.k = 1;
            zone.innerHTML = `<div class="card center" style="margin-top:18px">
              <h3>Zwei Schlüssel</h3>
              <p class="muted">Haltet <b>beide gleichzeitig</b> euren Knopf gedrückt, bis der Balken voll ist.</p>
              <button class="hold" id="hold">GEDRÜCKT<br>HALTEN</button>
              <div class="holdbar"><div id="hb"></div></div>
              <p class="small" id="hs"></p></div>`;
            const b = $('#hold', zone);
            const down = e => { e.preventDefault(); if (holding) return; holding = true; b.classList.add('down'); set('hold/' + S.me, { d: true, t: Date.now() }); };
            const up = () => { if (!holding) return; holding = false; b.classList.remove('down'); set('hold/' + S.me, { d: false, t: Date.now() }); };
            b.addEventListener('pointerdown', down);
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, up));
            b.addEventListener('contextmenu', e => e.preventDefault());
            iv = setInterval(() => {
              const o = get('hold/' + other(), { d: false });
              const both = holding && o.d;
              prog = both ? Math.min(100, prog + 100 / 30) : Math.max(0, prog - 4);
              $('#hb', zone).style.width = prog + '%';
              $('#hs', zone).textContent = both ? 'Beide drücken … weiter so! 💞' : holding ? `Warte auf ${NAME[other()]} …` : o.d ? `${NAME[other()]} drückt schon!` : '';
              if (prog >= 100) { clearInterval(iv); api.solve(); }
            }, 100);
            addCleanup(() => clearInterval(iv));
          }
        };
        draw(); api.onUpdate(k => { if (k === 's12/vault') draw(); });
      }
    };
    return api;
  }
  STAGES.__api = { onUpdate(fn) { S.updaters.push(fn); } };

  // ---------- Bildschirme ----------
  const app = $('#app');

  function renderStart() {
    runCleanups();
    S.shownStage = -1;
    app.innerHTML = `
      <div class="start">
        <div class="logo">♠</div>
        <h1>Der Pik-Dame-Code</h1>
        <div class="sub">Ein Escape Room für zwei · Lauri &amp; Noah · 4 Monate</div>
        <div class="pick">
          <button data-p="p1" class="${S.me === 'p1' ? 'sel' : ''}"><span class="suit" style="color:#c8102e">♥</span><div class="p">Spieler 1</div><div class="n">Noah</div><div class="small" style="color:#8a6b5b">Der Herzbube</div></button>
          <button data-p="p2" class="${S.me === 'p2' ? 'sel' : ''}"><span class="suit">♠</span><div class="p">Spieler 2</div><div class="n">Lauri</div><div class="small" style="color:#8a6b5b">Die Pik Dame</div></button>
        </div>
        <div class="roombox"><span class="muted">Raumcode</span><input id="room" value="${S.room}" maxlength="32"><span class="muted small">(muss bei euch beiden gleich sein)</span></div>
        <button class="btn gold" id="go" ${S.me ? '' : 'disabled'}>Raum betreten →</button>
        <p class="muted small" style="margin-top:28px">Ruft euch an, bevor ihr startet. Ihr werdet viel reden müssen. 📞<br>
        Jeder sieht nur seinen eigenen Bildschirm, also nicht schummeln. 😉 Dauer: ca. 2 Stunden.</p>
      </div>`;
    $$('.pick button').forEach(b => b.onclick = () => {
      S.me = b.dataset.p; $$('.pick button').forEach(x => x.classList.toggle('sel', x === b)); $('#go').disabled = false;
    });
    $('#go').onclick = () => {
      S.room = norm($('#room').value) ? $('#room').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : 'lauri-noah';
      LS.set('me', S.me); LS.set('room', S.room);
      join();
    };
  }

  function join() {
    S.joined = true;
    S.joinedAt = Date.now();
    Net.connect(S.room, S.me, updateStatus);
    renderGame();
  }

  function fmtTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }

  function topbar() {
    return `<div class="top">
      <div class="brand"><span>♠</span> Der Pik-Dame-Code</div>
      <div class="spacer"></div>
      <div class="timer" id="timer"></div>
      <div class="status" id="status"></div>
      <button class="menu-btn" id="menu">☰</button>
    </div><div class="progress"><div id="prog" style="width:${Math.min(100, (S.stage - 1) / 12 * 100)}%"></div></div>`;
  }

  function updateStatus() {
    const el = $('#status');
    if (!el) return;
    const c = Net.connectedCount(), n = Net.brokerCount();
    const po = Net.partnerOnline();
    el.innerHTML = `<span class="dot ${c ? 'on' : 'warn'}" title="Server: ${c}/${n}"></span>${c ? 'verbunden' : 'verbinde …'}
      &nbsp;<span class="dot ${po ? 'on' : ''}"></span>${NAME[other()]} ${po ? 'online' : 'offline'}`;
    const lob = $('#lobby-partner');
    if (lob) lob.innerHTML = po ? `<span class="ok">● ${NAME[other()]} ist da</span>` : `<span class="muted">○ ${NAME[other()]} noch nicht verbunden</span>`;
  }

  function hintsPanel(n) {
    const lvl = get('hint/' + n, 0);
    const H = D.hints[n] || [];
    const labels = ['Tipp 1', 'Tipp 2', 'Lösung'];
    let s = `<div class="card hints"><h3>💡 Tipps</h3><p class="small muted" style="margin-top:0">Tipps sieht ihr beide. Erst probieren, dann nachschauen!</p>`;
    for (let i = 0; i < lvl && i < 3; i++) s += `<div class="hint ${i === 2 ? 'sol' : ''}"><div class="lbl">${labels[i]}</div>${H[i]}</div>`;
    if (lvl < 3) s += `<button class="btn ghost small" id="hintbtn" style="margin-top:8px">${labels[lvl]} anzeigen</button>`;
    s += `</div>`;
    return s;
  }

  function renderGame() {
    runCleanups();
    S.shownStage = S.stage;
    const n = S.stage;
    if (n >= 13) return renderFinale();
    if (n === 0) return renderLobby();
    const st = STAGES[n];
    app.innerHTML = topbar() + `
      <div class="wrap">
        <div class="chapter"><span class="k">${st.k} von 12</span><h2>${st.title}</h2></div>
        <div class="when">${st.when}</div>
        <div class="grid">
          <div>
            <div class="story"><div class="from">Aus Luis' geheimer Akte</div>${st.story}</div>
            <div id="mine"></div>
          </div>
          <div id="side">${hintsPanel(n)}
            <div class="card small muted" style="margin-top:16px">Du spielst als <b style="color:var(--text)">${NAME[S.me]}</b>.
            ${NAME[other()]} sieht einen anderen Bildschirm. Beschreibt euch gegenseitig, was ihr seht!</div>
          </div>
        </div>
      </div>`;
    st[S.me]($('#mine'), makeApi(n));
    bindHints(n);
    bindTop();
  }

  function bindHints(n) {
    const b = $('#hintbtn');
    if (!b) return;
    b.onclick = () => {
      const lvl = get('hint/' + n, 0);
      const q = lvl === 2 ? 'Wirklich die LÖSUNG anzeigen? Sie wird auch bei ' + NAME[other()] + ' angezeigt.' : 'Tipp anzeigen? Er wird auch bei ' + NAME[other()] + ' angezeigt.';
      if (confirm(q)) set('hint/' + n, lvl + 1);
    };
  }
  function refreshHints() {
    const side = $('#side');
    if (!side || S.stage < 1 || S.stage > 12) return;
    const first = side.firstElementChild;
    const tmp = document.createElement('div'); tmp.innerHTML = hintsPanel(S.stage);
    side.replaceChild(tmp.firstElementChild, first);
    bindHints(S.stage);
  }

  function bindTop() {
    updateStatus();
    const tick = () => {
      const t0 = get('start', 0), t1 = get('finish', 0);
      const el = $('#timer'); if (el) el.textContent = t0 ? '⏱ ' + fmtTime((t1 || Date.now()) - t0) : '';
    };
    tick(); const iv = setInterval(tick, 1000); addCleanup(() => clearInterval(iv));
    const m = $('#menu');
    if (m) m.onclick = () => {
      showModal(`<h3>Menü</h3><p class="muted small">Raum: <b>${S.room}</b> · Du bist ${NAME[S.me]}</p>
        <div style="display:grid;gap:10px;margin-top:16px">
          <button class="btn ghost" id="m-close">Weiterspielen</button>
          <button class="btn ghost" id="m-switch">Spieler oder Raum wechseln</button>
          <button class="btn ghost" id="m-reset" style="color:var(--red2)">Spiel komplett neu starten</button>
        </div>`);
      $('#m-close').onclick = hideModal;
      $('#m-switch').onclick = () => { hideModal(); Net.disconnect(); S.joined = false; location.reload(); };
      $('#m-reset').onclick = () => {
        if (confirm('Wirklich alles zurücksetzen? Der Fortschritt geht für euch BEIDE verloren.')) { Net.set('epoch', (Net.get('epoch', 0) || 0) + 1); hideModal(); }
      };
    };
  }

  function renderLobby() {
    app.innerHTML = topbar() + `
      <div class="wrap" style="max-width:760px">
        <div class="chapter"><span class="k">Prolog</span><h2>Eine Nachricht von Luis</h2></div>
        <div class="story" style="margin-top:14px"><div class="from">Aus Luis' geheimer Akte</div>
          <p>Hallo ihr zwei, hier ist Luis. 👋</p>
          <p>Ihr wisst ja: Ohne mich wärt ihr heute nicht hier. 😏 Ich habe alles aufgeschrieben, von Anfang an, in meiner geheimen Akte.
          Darin habe ich auch die wertvollste Karte des ganzen Spiels versteckt: <b>die Pik Dame</b>.</p>
          <p>Leider ist die Akte ziemlich durcheinandergeraten, und die Pik Dame ist verschwunden. Um sie zu finden, müsst ihr eure Geschichte
          noch einmal erleben, Kapitel für Kapitel, vom ersten Volleyball bis heute.</p>
          <p>Die Sache hat einen Haken: <b>Jeder von euch sieht nur die Hälfte.</b> Ihr müsst also beschreiben, zuhören und zusammen tüfteln.
          Das könnt ihr ja inzwischen ziemlich gut, auch über ein paar hundert Kilometer. ♠</p>
          <p>Viel Glück!<br>– Luis</p>
        </div>
        <div class="lobby-ready">
          <div><b>Noah</b><br><span id="r-p1"></span></div>
          <div><b>Lauri</b><br><span id="r-p2"></span></div>
        </div>
        <p class="center" id="lobby-partner"></p>
        <div class="center"><button class="btn gold" id="ready">Ich bin bereit ♠</button></div>
        <p class="center muted small" style="margin-top:20px">Das Spiel startet, sobald ihr beide bereit seid. Für jedes Kapitel gibt es drei Tipps, der dritte ist die Lösung.</p>
      </div>`;
    const draw = () => {
      ['p1', 'p2'].forEach(p => { $('#r-' + p).innerHTML = get('ready/' + p, false) ? '<span class="ok">✔ bereit</span>' : '<span class="muted">wartet …</span>'; });
      const mine = get('ready/' + S.me, false);
      $('#ready').disabled = mine; $('#ready').textContent = mine ? 'Warte auf ' + NAME[other()] + ' …' : 'Ich bin bereit ♠';
      if (get('ready/p1', false) && get('ready/p2', false) && S.stage === 0 && Date.now() - S.joinedAt > 2500) {
        if (!get('start', 0)) set('start', Date.now());
        set('stage', 1);
      }
    };
    $('#ready').onclick = () => { set('ready/' + S.me, true); };
    S.updaters.push(k => { if (k.startsWith('ready/')) draw(); });
    draw();
    later(draw, Math.max(0, 2600 - (Date.now() - S.joinedAt)));
    bindTop();
  }

  function renderFinale() {
    if (!get('finish', 0)) set('finish', Date.now());
    const t0 = get('start', 0), t1 = get('finish', Date.now());
    let hints = 0; for (let i = 1; i <= 12; i++) hints += get('hint/' + i, 0);
    app.innerHTML = `
      <div class="finale">
        <p class="muted" style="letter-spacing:.14em;text-transform:uppercase;font-size:.8rem">Fall gelöst</p>
        <h1 style="font-size:clamp(2rem,6vw,3.2rem)">Die Pik Dame ist gefunden</h1>
        <div class="qcard"><div class="in"><div class="b"></div><div class="f"><div class="c1">D<br>♠</div><div class="q">♠</div><div class="nm">Lauri</div><div class="small" style="color:#888">die wertvollste Karte</div><div class="c2">D<br>♠</div></div></div></div>
        <div class="story" style="text-align:left"><div class="from">Aus Luis' geheimer Akte · letzte Seite</div>
          <p>Die Pik Dame war nie verschwunden. Sie saß die ganze Zeit am anderen Ende der Leitung. 😉
          Volleyball, Pik Dame, die Nacht bei mir, die erste Nachricht, Preungesheim, Bornheim, Oberursel, der Abschied,
          die Überraschung, Valencia, und heute vier Monate. Ich würde sagen: Mission Amor erfüllt. ♠❤️</p></div>
        <div class="stats"><div>Zeit<b>${t0 ? fmtTime(t1 - t0) : '–'}</b></div><div>Tipps genutzt<b>${hints}</b></div><div>Monate<b>4</b></div></div>
        <div class="letter">${String(window.NACHRICHT || '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</div>
        <a class="btn gold" href="https://www.youtube.com/results?search_query=Blumengarten+Gloria" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">🎵 Jetzt euer Lied: „Gloria“ von Blumengarten</a>
        <p class="muted small" style="margin-top:30px">Alles Liebe zum Monatstag, 6. November ♠</p>
      </div>`;
    hearts();
  }

  function hearts() {
    let i = 0;
    const iv = setInterval(() => {
      const h = document.createElement('div');
      h.className = 'heart';
      h.textContent = ['❤️', '♠', '💕', '♥', '✨'][i % 5];
      h.style.left = Math.random() * 100 + 'vw';
      h.style.fontSize = (16 + Math.random() * 26) + 'px';
      h.style.animationDuration = (4 + Math.random() * 4) + 's';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 9000);
      if (++i > 70) clearInterval(iv);
    }, 140);
    addCleanup(() => clearInterval(iv));
  }

  function showModal(html) { const o = $('#overlay'); o.innerHTML = `<div class="modal">${html}</div>`; o.hidden = false; }
  function hideModal() { const o = $('#overlay'); o.hidden = true; o.innerHTML = ''; }

  function showSolved(n, then) {
    const st = STAGES[n];
    if (!st || !st.cap) return then();
    sndOk();
    showModal(`<div class="polaroid"><div class="img">${st.icon}</div><div class="cap">${st.cap}</div></div>
      <h3>✓ ${st.k} gelöst!</h3><p class="muted small">${n < 12 ? 'Weiter geht\'s mit dem nächsten Kapitel.' : ''}</p>
      <button class="btn gold" id="next">Weiter →</button>`);
    $('#next').onclick = () => { hideModal(); then(); };
  }

  // ---------- Nachrichten vom Netz ----------
  Net.on((key, v) => {
    if (!S.joined) return;
    if (key === 'epoch') {
      if (v !== S.epoch) { S.epoch = v; S.stage = Net.get(K('stage'), 0); hideModal(); renderGame(); }
      return;
    }
    const pre = 'e' + S.epoch + '/';
    if (!key.startsWith(pre)) return;
    const k = key.slice(pre.length);
    if (k === 'stage') {
      if (typeof v === 'number' && v > S.stage) {
        const prev = S.stage;
        S.stage = v;
        if (prev >= 1 && v === prev + 1 && S.shownStage === prev) showSolved(prev, renderGame);
        else { hideModal(); renderGame(); }
      }
      return;
    }
    if (k.startsWith('hint/')) { refreshHints(); return; }
    S.updaters.forEach(fn => { try { fn(k, v); } catch (e) { console.error(e); } });
  });

  // Test-Hilfe (nur für automatische Tests)
  window.__PDT = { S, get, set };

  if (S.me && new URLSearchParams(location.search).get('auto') === '1') join();
  else renderStart();
})();

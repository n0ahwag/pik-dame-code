// Echtzeit-Verbindung zwischen den beiden Bildschirmen.
// Verbindet sich gleichzeitig mit mehreren öffentlichen MQTT-Brokern,
// damit es auch klappt, wenn einer gerade nicht erreichbar ist.
(function () {
  const DEFAULT_BROKERS = [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];

  const store = {};          // key -> {v, seq, from}
  const handlers = [];
  let clients = [];
  let base = '';
  let me = '';
  let lastSeq = 0;
  let statusCb = () => {};
  const partnerSeen = { p1: 0, p2: 0 };
  let presenceTimer = null;

  function nextSeq() {
    lastSeq = Math.max(Date.now() * 1000, lastSeq + 1);
    return lastSeq;
  }

  function emit(key, v, msg) {
    handlers.forEach(h => { try { h(key, v, msg); } catch (e) { console.error(e); } });
  }

  function onMessage(topic, buf) {
    if (!topic.startsWith(base)) return;
    const key = topic.slice(base.length);
    let msg;
    try { msg = JSON.parse(new TextDecoder().decode(buf)); } catch (e) { return; }
    if (!msg || typeof msg.seq !== 'number') return;
    if (key.startsWith('presence/')) {
      const who = key.split('/')[1];
      if (who !== me) { partnerSeen[who] = Date.now(); statusCb(); }
      return;
    }
    const cur = store[key];
    if (cur && cur.seq >= msg.seq) return;
    // Fortschritt darf nie zurückgehen: bei "stage" gewinnt immer der höchste Wert
    if (/(^|\/)stage$/.test(key) && cur && typeof cur.v === 'number' && !(msg.v > cur.v)) {
      if (cur.v > msg.v) { cur.seq = nextSeq(); cur.from = me; publishRaw(key, cur, true); }
      return;
    }
    store[key] = msg;
    emit(key, msg.v, msg);
  }

  function publishRaw(key, msg, retain) {
    const payload = JSON.stringify(msg);
    clients.forEach(c => { if (c.connected) c.publish(base + key, payload, { retain, qos: 0 }); });
  }

  // Eigene Zustände lokal sichern, damit beim Neuladen nichts verloren geht
  function lsKey() { return 'pdnet_' + base + me; }
  function saveMine() {
    try {
      const mine = {};
      Object.keys(store).forEach(k => { if (store[k].from === me) mine[k] = store[k]; });
      localStorage.setItem(lsKey(), JSON.stringify(mine));
    } catch (e) {}
  }
  function loadMine() {
    try {
      const mine = JSON.parse(localStorage.getItem(lsKey()) || '{}');
      Object.keys(mine).forEach(k => {
        const m = mine[k];
        if (!m || typeof m.seq !== 'number') return;
        lastSeq = Math.max(lastSeq, m.seq);
        if (!store[k] || store[k].seq < m.seq) { store[k] = m; emit(k, m.v, m); }
      });
    } catch (e) {}
  }

  function resendMine() {
    Object.keys(store).forEach(k => { if (store[k].from === me) publishRaw(k, store[k], true); });
  }

  window.Net = {
    connect(room, player, onStatus) {
      me = player;
      statusCb = onStatus || (() => {});
      base = 'pikdame-code/v1/' + room.toLowerCase().replace(/[^a-z0-9-]/g, '') + '/';
      const q = new URLSearchParams(location.search);
      const list = q.get('broker') ? q.get('broker').split(',') : DEFAULT_BROKERS;
      clients = list.map(url => {
        const c = mqtt.connect(url, {
          clientId: 'pd_' + player + '_' + Math.random().toString(16).slice(2, 10),
          reconnectPeriod: 3000,
          connectTimeout: 10000,
          clean: true,
          keepalive: 30
        });
        c.on('connect', () => {
          c.subscribe(base + '#', { qos: 0 }, () => { resendMine(); statusCb(); });
        });
        c.on('close', () => statusCb());
        c.on('offline', () => statusCb());
        c.on('error', () => statusCb());
        c.on('message', onMessage);
        return c;
      });
      loadMine();
      clearInterval(presenceTimer);
      const ping = () => publishRaw('presence/' + me, { seq: nextSeq(), from: me }, false);
      presenceTimer = setInterval(() => { ping(); statusCb(); }, 3000);
      setTimeout(ping, 500);
    },
    disconnect() {
      clearInterval(presenceTimer);
      clients.forEach(c => c.end(true));
      clients = [];
    },
    set(key, v) {
      if (/(^|\/)stage$/.test(key) && store[key] && !(v > store[key].v)) return;
      const msg = { v, seq: nextSeq(), from: me };
      store[key] = msg;
      publishRaw(key, msg, true);
      saveMine();
      emit(key, v, msg);
    },
    get(key, def) {
      return store[key] ? store[key].v : def;
    },
    on(fn) { handlers.push(fn); },
    connectedCount() { return clients.filter(c => c.connected).length; },
    brokerCount() { return clients.length; },
    partnerOnline() {
      const other = me === 'p1' ? 'p2' : 'p1';
      return Date.now() - partnerSeen[other] < 10000;
    }
  };
})();

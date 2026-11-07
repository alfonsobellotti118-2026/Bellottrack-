(function () {
  'use strict';
  var DEFAULTS = { on: { carbs: 370, protein: 180, fat: 45 }, off: { carbs: 260, protein: 180, fat: 45 } };
  var MACROS = [
    { key: 'carbs', label: 'Carboidrati' },
    { key: 'protein', label: 'Proteine' },
    { key: 'fat', label: 'Grassi' }
  ];
  var DAY_LETTERS = ['D', 'L', 'M', 'M', 'G', 'V', 'S'];
  var ALLERGENS = {
    'gluten': 'glutine', 'milk': 'latte', 'eggs': 'uova', 'soybeans': 'soia', 'nuts': 'frutta a guscio',
    'peanuts': 'arachidi', 'fish': 'pesce', 'crustaceans': 'crostacei', 'molluscs': 'molluschi',
    'celery': 'sedano', 'mustard': 'senape', 'sesame-seeds': 'sesamo',
    'sulphur-dioxide-and-sulphites': 'solfiti', 'lupin': 'lupini'
  };
  /* Alimenti base: valori medi indicativi per 100 g (n nome, c carbo, p proteine, f grassi, s porzione tipica in g, a allergeni). */
  var BASE = [
    { n: 'Petto di pollo (crudo)', c: 0, p: 23, f: 2 },
    { n: 'Petto di tacchino (crudo)', c: 0, p: 24, f: 1 },
    { n: 'Manzo magro (crudo)', c: 0, p: 21, f: 4 },
    { n: 'Bresaola', c: 0, p: 32, f: 2 },
    { n: 'Prosciutto crudo', c: 0, p: 26, f: 18 },
    { n: 'Proteine whey concentrate (polvere)', k: 'whey why proteine proteina siero latte integratore', c: 7, p: 77, f: 6, s: 30, a: ['milk'] },
    { n: 'Proteine whey isolate (polvere)', k: 'whey why iso isolate proteine proteina siero latte integratore', c: 2, p: 89, f: 1, s: 30, a: ['milk'] },
    { n: 'Caseine micellari (polvere)', k: 'caseina caseine proteine proteina integratore', c: 3, p: 80, f: 2, s: 30, a: ['milk'] },
    { n: 'Proteine vegetali (polvere)', k: 'proteine proteina vegetali pisello riso soia integratore', c: 5, p: 75, f: 6, s: 30 },
    { n: 'Uovo intero', c: 0.7, p: 12.5, f: 9.5, s: 50, a: ['eggs'] },
    { n: 'Albume d’uovo', c: 0.7, p: 11, f: 0.2, a: ['eggs'] },
    { n: 'Tonno al naturale (sgocciolato)', c: 0, p: 25, f: 1, a: ['fish'] },
    { n: 'Salmone (crudo)', c: 0, p: 20, f: 13, a: ['fish'] },
    { n: 'Merluzzo o nasello (crudo)', c: 0, p: 17, f: 0.5, a: ['fish'] },
    { n: 'Riso (crudo)', c: 80, p: 7, f: 0.5 },
    { n: 'Riso (cotto)', c: 28, p: 2.5, f: 0.3 },
    { n: 'Pasta di semola (cruda)', c: 72, p: 12, f: 1.5, a: ['gluten'] },
    { n: 'Pasta di semola (cotta)', c: 31, p: 5.5, f: 1, a: ['gluten'] },
    { n: 'Pane comune', c: 58, p: 8.5, f: 0.5, a: ['gluten'] },
    { n: 'Fiocchi d’avena', c: 60, p: 13, f: 7, a: ['gluten'] },
    { n: 'Patate (crude)', c: 17, p: 2, f: 0.1 },
    { n: 'Patate dolci (crude)', c: 20, p: 1.6, f: 0.1 },
    { n: 'Quinoa (cruda)', c: 64, p: 14, f: 6 },
    { n: 'Cous cous (crudo)', c: 72, p: 13, f: 1.5, a: ['gluten'] },
    { n: 'Gallette di riso', c: 80, p: 8, f: 3 },
    { n: 'Lenticchie (cotte)', c: 16, p: 9, f: 0.4 },
    { n: 'Ceci (cotti)', c: 20, p: 8, f: 2.5 },
    { n: 'Fagioli (cotti)', c: 17, p: 8, f: 0.6 },
    { n: 'Banana', c: 21, p: 1, f: 0.2, s: 120 },
    { n: 'Mela', c: 12, p: 0.3, f: 0.2, s: 150 },
    { n: 'Arancia', c: 8, p: 0.7, f: 0.2, s: 150 },
    { n: 'Olio extravergine d’oliva', c: 0, p: 0, f: 100, s: 10 },
    { n: 'Mandorle', c: 9, p: 21, f: 50, a: ['nuts'] },
    { n: 'Noci', c: 7, p: 15, f: 65, a: ['nuts'] },
    { n: 'Burro di arachidi', c: 18, p: 25, f: 50, a: ['peanuts'] },
    { n: 'Parmigiano Reggiano', c: 0, p: 33, f: 28, a: ['milk'] },
    { n: 'Yogurt greco 0%', c: 4, p: 10, f: 0.2, s: 150, a: ['milk'] },
    { n: 'Latte parzialmente scremato', c: 5, p: 3.4, f: 1.6, a: ['milk'] },
    { n: 'Fiocchi di latte', c: 3, p: 11, f: 4, a: ['milk'] },
    { n: 'Ricotta vaccina', c: 3.5, p: 8.8, f: 8, a: ['milk'] },
    { n: 'Mozzarella', c: 1, p: 18, f: 17, a: ['milk'] },
    { n: 'Zucchero', c: 100, p: 0, f: 0 },
    { n: 'Miele', c: 80, p: 0.4, f: 0 },
    { n: 'Broccoli', c: 3, p: 3, f: 0.4 },
    { n: 'Spinaci', c: 1.5, p: 3, f: 0.7 },
    { n: 'Zucchine', c: 2.5, p: 1.3, f: 0.1 },
    { n: 'Insalata', c: 2, p: 1.5, f: 0.2 },
    { n: 'Pomodori', c: 3, p: 1, f: 0.2 },
    { n: 'Carote', c: 7, p: 1, f: 0.2 }
  ];

  var state = { meals: [], presets: JSON.parse(JSON.stringify(DEFAULTS)), modes: {}, profile: null, weights: [], goals: [], schedule: null, templates: [], favs: [], workouts: [], measures: [], plan: [], plans: [], daily: {}, suppList: null, waterGoal: 0, date: todayStr(), mealsReady: false, settingsReady: false };
  var DEFAULT_SCHEDULE = { days: [1, 3, 5], since: '2026-11-05' };
  var EXTRA_ARR = ['templates', 'favs', 'workouts', 'measures', 'plan', 'plans'];
  var listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function emit(evt, a) { (listeners[evt] || []).slice().forEach(function (fn) { try { fn(a); } catch (e) { if (window.console) console.error(e); } }); }
  var store = null;
  var product = null;
  var loaded = false;

  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr() { return ymd(new Date()); }
  function parts(s) { var p = s.split('-'); return [Number(p[0]), Number(p[1]), Number(p[2])]; }
  function addDays(s, n) { var p = parts(s); return ymd(new Date(p[0], p[1] - 1, p[2] + n)); }
  function toDate(s) { var p = parts(s); return new Date(p[0], p[1] - 1, p[2]); }
  function fmtLong(s) { return toDate(s).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function nf(n) { return Math.round(n).toLocaleString('it-IT'); }
  function num(v) {
    var x = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return isFinite(x) && x > 0 ? x : 0;
  }
  function round1(n) { return Math.round(n * 10) / 10; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function fmt1(n) { return round1(n).toLocaleString('it-IT'); }
  function fmtN(v) { return v === null || v === undefined ? '?' : fmt1(v); }
  var XK = ['sugar', 'sat', 'fiber', 'salt'];
  var XLAB = { sugar: 'Zuccheri', sat: 'Grassi saturi', fiber: 'Fibre', salt: 'Sale' };
  function xOf(o) { var r = {}; XK.forEach(function (k) { if (o && o[k] > 0) r[k] = o[k]; }); return r; }
  function xLine(o) { var a = []; XK.forEach(function (k) { if (o && o[k] > 0) a.push(XLAB[k] + ' ' + fmt1(o[k]) + ' g'); }); return a.join(' · '); }
  function kcalFromMacros(c, p, f) { return Math.round(4 * c + 4 * p + 9 * f); }
  function kcalOf(m) { return m.kcal > 0 ? Math.round(m.kcal) : kcalFromMacros(m.carbs || 0, m.protein || 0, m.fat || 0); }
  function scheduledOn(date) {
    var sc = state.schedule || DEFAULT_SCHEDULE;
    if (!sc.days || !sc.days.length || date < (sc.since || '0000')) return false;
    return sc.days.indexOf(toDate(date).getDay()) >= 0;
  }
  function modeOf(date) {
    var v = state.modes[date];
    if (v === 'on' || v === 'off') return v;
    return scheduledOn(date) ? 'on' : 'off';
  }
  function targetsFor(date) { return state.presets[modeOf(date)]; }
  function targetKcal(date) { var t = targetsFor(date || state.date); return kcalFromMacros(t.carbs, t.protein, t.fat); }
  function newId() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function dayMeals(date) {
    return state.meals.filter(function (m) { return m.date === date; })
      .sort(function (a, b) { return (a.createdAt || 0) - (b.createdAt || 0); });
  }
  function totalsOf(list) {
    var t = { kcal: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sat: 0, fiber: 0, salt: 0 };
    list.forEach(function (m) { t.kcal += kcalOf(m); t.carbs += m.carbs || 0; t.protein += m.protein || 0; t.fat += m.fat || 0; XK.forEach(function (k) { t[k] += m[k] || 0; }); });
    return t;
  }

  /* Barra che va dal freddo (inizio) al caldo (fine): il gradiente copre sempre tutta la barra, il riempimento ne mostra la parte raggiunta. */
  function setHeat(el, f) {
    var w = Math.max(0, Math.min(1, f));
    el.style.width = (w * 100) + '%';
    el.style.backgroundSize = (w > 0 ? 100 / w : 100) + '% 100%';
    el.classList.toggle('hot', f > 1);
  }

  /* ---------- Disegno della pagina ---------- */
  function render() {
    var isToday = state.date === todayStr();
    $('date-label').textContent = isToday ? 'Oggi, ' + fmtLong(state.date) : fmtLong(state.date);
    $('today').hidden = isToday;

    var list = dayMeals(state.date);
    var t = totalsOf(list);
    var tk = targetKcal();
    var tg = targetsFor(state.date);

    $('kcal-num').textContent = nf(t.kcal);
    $('kcal-of').textContent = '/ ' + nf(tk) + ' kcal';
    setHeat($('kcal-fill'), tk > 0 ? t.kcal / tk : 0);
    var left = tk - t.kcal;
    var leftEl = $('kcal-left');
    if (left >= 0) { leftEl.textContent = 'Ti restano ' + nf(left) + ' kcal'; leftEl.className = 'kcal-left'; }
    else { leftEl.textContent = 'Sei sopra di ' + nf(-left) + ' kcal'; leftEl.className = 'kcal-left over'; }

    var xt = $('xtot'); if (xt) { xt.textContent = xLine(t) ? xLine(t) : ''; xt.hidden = !xt.textContent; }
    var mc = $('macros');
    mc.textContent = '';
    MACROS.forEach(function (m) {
      var val = t[m.key], target = tg[m.key];
      var wrap = document.createElement('div');
      var head = document.createElement('div'); head.className = 'macro-head';
      var name = document.createElement('span'); name.className = 'name'; name.textContent = m.label;
      var v = document.createElement('span'); v.className = 'val';
      var b = document.createElement('b'); b.textContent = fmt1(val);
      v.appendChild(b);
      v.appendChild(document.createTextNode(' / ' + fmt1(target) + ' g'));
      if (val > target) {
        var o = document.createElement('span'); o.className = 'over'; o.textContent = '+' + fmt1(val - target) + ' g';
        v.appendChild(o);
      }
      head.appendChild(name); head.appendChild(v);
      var bar = document.createElement('div'); bar.className = 'bar';
      var fill = document.createElement('i');
      setHeat(fill, target > 0 ? val / target : 0);
      bar.appendChild(fill);
      wrap.appendChild(head); wrap.appendChild(bar);
      mc.appendChild(wrap);
    });

    renderMode();
    renderMeals(list);
    renderRecent();
    renderWeek();
    updatePreview();
    updateProductCalc();
    emit('render');
  }

  function renderMode() {
    var cur = modeOf(state.date);
    ['on', 'off'].forEach(function (m) {
      $('mode-' + m).setAttribute('aria-pressed', cur === m ? 'true' : 'false');
      var t = state.presets[m];
      $('mode-' + m + '-vals').textContent = fmt1(t.carbs) + ' C · ' + fmt1(t.protein) + ' P · ' + fmt1(t.fat) + ' G';
    });
  }

  function setMode(mode) {
    var modes = Object.assign({}, state.modes);
    modes[state.date] = mode;
    patchSettings({ modes: modes }).catch(function () {
      $('scan-msg').textContent = 'Non sono riuscito a salvare la scelta ON/OFF.';
    });
  }

  var armTimers = new WeakMap();
  function onDelete(btn, m) {
    if (!btn.classList.contains('armed')) {
      btn.classList.add('armed');
      btn.textContent = 'Conferma eliminazione';
      armTimers.set(btn, setTimeout(function () { btn.classList.remove('armed'); btn.textContent = 'Elimina'; }, 3000));
      return;
    }
    clearTimeout(armTimers.get(btn));
    btn.disabled = true;
    store.remove(m.id).catch(function () {
      btn.disabled = false; btn.classList.remove('armed'); btn.textContent = 'Elimina';
      $('msg').textContent = 'Non sono riuscito a eliminare l’alimento. Riprova.';
    });
  }

  /* Cambia il peso di un alimento e ricalcola calorie e macro del totale. */
  function onWeightChange(m, input) {
    var g = num(input.value);
    if (!(g > 0) || !m.per100) { input.value = String(m.grams || '').replace('.', ','); return; }
    var f = g / 100, p = m.per100;
    store.update(m.id, {
      grams: round1(g),
      carbs: round1(p.carbs * f), protein: round1(p.protein * f), fat: round1(p.fat * f),
      kcal: Math.round((p.kcal > 0 ? p.kcal : kcalFromMacros(p.carbs, p.protein, p.fat)) * f)
    }).then(function () {
      var up = {}; XK.forEach(function (k) { if (p[k] > 0) up[k] = round2(p[k] * f); });
      return Object.keys(up).length ? store.update(m.id, up) : null;
    }).catch(function () { $('msg').textContent = 'Non sono riuscito a cambiare il peso. Riprova.'; });
  }

  var SECTIONS = [
    { key: 'colazione', label: 'Colazione', sub: '' },
    { key: 'spuntino-1', label: 'Spuntino / Snack', sub: 'mattina' },
    { key: 'pranzo', label: 'Pranzo', sub: '' },
    { key: 'pre-allenamento', label: 'Pre-allenamento', sub: '' },
    { key: 'post-allenamento', label: 'Post-allenamento', sub: '' },
    { key: 'spuntino-2', label: 'Spuntino / Snack', sub: 'pomeriggio' },
    { key: 'cena', label: 'Cena', sub: '' },
    { key: 'pre-nanna', label: 'Pre-nanna', sub: '' }
  ];
  /* I pasti salvati con il vecchio nome «spuntino» finiscono nello spuntino piu' vicino all'orario. */
  var TRAIN_ONLY = { 'pre-allenamento': 1, 'post-allenamento': 1 };
  function sectionOf(m) {
    var s = m.slot, i;
    for (i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].key === s) return s;
    var h = new Date(m.createdAt || 0).getHours();
    return h < 15 ? 'spuntino-1' : 'spuntino-2';
  }
  function slotLabel(key) {
    for (var i = 0; i < SECTIONS.length; i++) {
      if (SECTIONS[i].key === key) return SECTIONS[i].label + (SECTIONS[i].sub ? ' (' + SECTIONS[i].sub + ')' : '');
    }
    return key;
  }

  function favKey(m) { return (m.name || '').toLowerCase() + '|' + (m.per100 ? JSON.stringify(m.per100) : m.carbs + '|' + m.protein + '|' + m.fat); }
  function buildMeal(m) {
    var li = document.createElement('li'); li.className = 'meal';
    var title = document.createElement('div'); title.className = 'title';
    title.appendChild(document.createTextNode(m.name || ''));
    var kc = document.createElement('div'); kc.className = 'kc'; kc.textContent = nf(kcalOf(m)) + ' kcal';
    var mac = document.createElement('div'); mac.className = 'mac';
    [['C', m.carbs], ['P', m.protein], ['G', m.fat]].forEach(function (x) {
      var s = document.createElement('span'); s.textContent = x[0] + ' ' + fmt1(x[1] || 0) + ' g'; mac.appendChild(s);
    });
    var xl = xLine(m), xr = null;
    if (xl) { xr = document.createElement('div'); xr.className = 'mac xmac'; xr.textContent = xl; }
    var tools = document.createElement('div'); tools.className = 'tools';
    if (m.per100 && m.grams > 0) {
      var lab = document.createElement('label'); lab.className = 'wg';
      lab.appendChild(document.createTextNode('Peso'));
      var inp = document.createElement('input');
      inp.type = 'text'; inp.inputMode = 'decimal'; inp.value = String(m.grams).replace('.', ',');
      inp.setAttribute('aria-label', 'Peso in grammi di ' + (m.name || 'alimento'));
      inp.addEventListener('change', function () { onWeightChange(m, inp); });
      lab.appendChild(inp);
      lab.appendChild(document.createTextNode('g'));
      tools.appendChild(lab);
    } else {
      tools.appendChild(document.createElement('span'));
    }
    var star = document.createElement('button');
    star.type = 'button'; star.className = 'star'; star.textContent = '\u2605';
    star.setAttribute('aria-label', 'Preferito: ' + (m.name || 'alimento'));
    star.setAttribute('data-fav', favKey(m));
    star.addEventListener('click', function () { emit('fav', m); });
    tools.appendChild(star);
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'del'; del.textContent = 'Elimina';
    del.setAttribute('aria-label', 'Elimina ' + (m.name || 'alimento'));
    del.addEventListener('click', function () { onDelete(del, m); });
    tools.appendChild(del);
    li.appendChild(title); li.appendChild(kc); li.appendChild(mac); if (xr) li.appendChild(xr); li.appendChild(tools);
    return li;
  }

  var openSecs = {};
  try { openSecs = JSON.parse(localStorage.getItem('bt-open-secs') || '{}') || {}; } catch (e) { openSecs = {}; }
  function renderMeals(list) {
    var box = $('sections');
    box.textContent = '';
    SECTIONS.forEach(function (sec) {
      var items = list.filter(function (m) { return sectionOf(m) === sec.key; });
      // Pre e post allenamento compaiono solo nei giorni ON (o se contengono gia' degli alimenti).
      if (TRAIN_ONLY[sec.key] && modeOf(state.date) !== 'on' && !items.length) return;
      var t = totalsOf(items);
      var card = document.createElement('section'); card.className = 'card msec';
      card.setAttribute('data-slot', sec.key);
      var open = !!openSecs[sec.key];
      var head = document.createElement('div'); head.className = 'mhead';
      var tog = document.createElement('button'); tog.type = 'button'; tog.className = 'mtog';
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      var h2 = document.createElement('h2'); h2.appendChild(document.createTextNode(sec.label));
      if (sec.sub) { var sub = document.createElement('span'); sub.className = 'msub'; sub.textContent = sec.sub; h2.appendChild(sub); }
      var sum = document.createElement('div'); sum.className = 'msum';
      sum.textContent = items.length ? items.length + (items.length === 1 ? ' alimento · ' : ' alimenti · ') + nf(t.kcal) + ' kcal · C ' + fmt1(t.carbs) + ' · P ' + fmt1(t.protein) + ' · G ' + fmt1(t.fat) : 'Nessun alimento';
      var chev = document.createElement('span'); chev.className = 'chev'; chev.setAttribute('aria-hidden', 'true');
      chev.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 9l6 6 6-6"/></svg>';
      tog.appendChild(h2); tog.appendChild(sum); tog.appendChild(chev);
      var add = document.createElement('button'); add.type = 'button'; add.className = 'addbtn';
      add.setAttribute('aria-label', 'Aggiungi a ' + slotLabel(sec.key));
      add.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>';
      add.addEventListener('click', function () { openSheet(sec.key); });
      head.appendChild(tog); head.appendChild(add);
      card.appendChild(head);
      var body = document.createElement('div'); body.className = 'mbody'; body.hidden = !open;
      if (items.length) {
        var ul = document.createElement('ul'); ul.className = 'meals';
        items.forEach(function (m) { ul.appendChild(buildMeal(m)); });
        body.appendChild(ul);
      }
      card.appendChild(body);
      (function (key, bodyEl, togEl) {
        togEl.addEventListener('click', function () {
          openSecs[key] = !openSecs[key];
          bodyEl.hidden = !openSecs[key];
          togEl.setAttribute('aria-expanded', openSecs[key] ? 'true' : 'false');
          try { localStorage.setItem('bt-open-secs', JSON.stringify(openSecs)); } catch (e) {}
        });
      })(sec.key, body, tog);
      box.appendChild(card);
    });
  }

  /* ---------- Finestra "Aggiungi" ---------- */
  var sheetFrom = null;
  function openSheet(slot) {
    $('f-slot').value = slot;
    $('add-title').textContent = 'Aggiungi a ' + slotLabel(slot);
    sheetFrom = document.activeElement;
    $('sheet').hidden = false;
    document.body.classList.add('noscroll');
    updateProductCalc();
    $('sheet-x').focus();
  }
  function closeSheet() {
    if ($('sheet').hidden) return;
    $('sheet').hidden = true;
    document.body.classList.remove('noscroll');
    if (sheetFrom && sheetFrom.focus) { try { sheetFrom.focus(); } catch (e) {} }
  }
  function afterAdd(meal) {
    $('results').textContent = '';
    $('search-status').textContent = '';
    closeSheet();
    openSecs[sectionOf(meal)] = true;
    try { localStorage.setItem('bt-open-secs', JSON.stringify(openSecs)); } catch (e) {}
    render();
    toast('Aggiunto a ' + slotLabel(sectionOf(meal)) + ': ' + (meal.name || ''));
  }

  function renderRecent() {
    var seen = {}, out = [];
    var sorted = state.meals.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    for (var i = 0; i < sorted.length && out.length < 6; i++) {
      var m = sorted[i];
      var k = (m.name || '').toLowerCase() + '|' + (m.per100 ? JSON.stringify(m.per100) : m.carbs + '|' + m.protein + '|' + m.fat);
      if (!m.name || seen[k]) continue;
      seen[k] = 1; out.push(m);
    }
    var box = $('recent');
    box.textContent = '';
    $('recent-wrap').hidden = out.length === 0;
    out.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.textContent = m.name + (m.grams ? ' · ' + fmt1(m.grams) + ' g' : '') + ' · ' + nf(kcalOf(m)) + ' kcal';
      b.addEventListener('click', function () { fillFormFromMeal(m); });
      box.appendChild(b);
    });
  }

  function fillExtras(o) {
    var any = false;
    XK.forEach(function (k) { var v = o && o[k] > 0 ? o[k] : 0; $('f-' + k).value = v ? String(v).replace('.', ',') : ''; if (v) any = true; });
    if (any) $('f-more').open = true;
  }
  function fillFormFromMeal(m) {
    $('f-code').value = m.barcode ? normCode(m.barcode) : '';
    function s(v) { return v ? String(v).replace('.', ',') : ''; }
    $('f-name').value = m.name;
    if (m.per100) {
      $('f-basis').value = 'per100';
      $('f-grams').value = s(m.grams);
      $('f-carbs').value = s(m.per100.carbs); $('f-protein').value = s(m.per100.protein); $('f-fat').value = s(m.per100.fat);
      $('f-kcal').value = m.per100.kcal > 0 ? String(m.per100.kcal).replace('.', ',') : '';
      fillExtras(m.per100);
    } else {
      $('f-basis').value = 'total';
      $('f-grams').value = s(m.grams);
      $('f-carbs').value = s(m.carbs); $('f-protein').value = s(m.protein); $('f-fat').value = s(m.fat);
      $('f-kcal').value = m.kcal > 0 ? String(m.kcal) : '';
      fillExtras(m);
    }
    updatePreview();
    $('add-btn').focus();
  }

  function renderWeek() {
    var wk = $('week');
    wk.textContent = '';
    var today = todayStr();
    for (var i = 6; i >= 0; i--) {
      var d = addDays(today, -i);
      var tot = totalsOf(dayMeals(d));
      var tk = targetKcal(d);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day' + (d === state.date ? ' sel' : '');
      btn.setAttribute('aria-label', fmtLong(d) + ', ' + nf(tot.kcal) + ' kcal');
      var col = document.createElement('div'); col.className = 'col';
      var fill = document.createElement('i');
      var w = tk > 0 ? Math.max(0, Math.min(1, tot.kcal / tk)) : 0;
      fill.style.height = (w * 100) + '%';
      fill.style.backgroundSize = '100% ' + (w > 0 ? 100 / w : 100) + '%';
      col.appendChild(fill);
      var dl = document.createElement('span'); dl.className = 'dl'; dl.textContent = DAY_LETTERS[toDate(d).getDay()];
      var dk = document.createElement('span'); dk.className = 'dk'; dk.textContent = tot.kcal ? nf(tot.kcal) : '–';
      btn.appendChild(col); btn.appendChild(dl); btn.appendChild(dk);
      (function (dd) { btn.addEventListener('click', function () { state.date = dd; render(); }); })(d);
      wk.appendChild(btn);
    }
  }

  /* ---------- Modulo a mano con peso ---------- */
  function readForm() {
    var c = num($('f-carbs').value), p = num($('f-protein').value), f = num($('f-fat').value), k = num($('f-kcal').value);
    return { c: c, p: p, f: f, k: k > 0 ? k : kcalFromMacros(c, p, f), anyValue: c > 0 || p > 0 || f > 0 || k > 0,
      grams: num($('f-grams').value), basis: $('f-basis').value,
      x: { sugar: num($('f-sugar').value), sat: num($('f-sat').value), fiber: num($('f-fiber').value), salt: num($('f-salt').value) } };
  }
  /* Calcola i totali del pasto a partire dal peso e dai valori inseriti. Restituisce null se manca il peso con valori per 100 g. */
  function mealValues(r) {
    if (r.basis === 'per100') {
      if (!(r.grams > 0)) return null;
      var f = r.grams / 100;
      var out = {
        grams: round1(r.grams),
        per100: Object.assign({ carbs: round2(r.c), protein: round2(r.p), fat: round2(r.f), kcal: Math.round(r.k) }, xOf(r.x)),
        carbs: round1(r.c * f), protein: round1(r.p * f), fat: round1(r.f * f), kcal: Math.round(r.k * f)
      };
      XK.forEach(function (k) { if (r.x[k] > 0) out[k] = round2(r.x[k] * f); });
      return out;
    }
    var res = { carbs: round1(r.c), protein: round1(r.p), fat: round1(r.f), kcal: Math.round(r.k) };
    XK.forEach(function (k) { if (r.x[k] > 0) res[k] = round2(r.x[k]); });
    if (r.grams > 0) {
      var inv = 100 / r.grams;
      res.grams = round1(r.grams);
      res.per100 = { carbs: round2(r.c * inv), protein: round2(r.p * inv), fat: round2(r.f * inv), kcal: Math.round(r.k * inv) };
      XK.forEach(function (k) { if (r.x[k] > 0) res.per100[k] = round2(r.x[k] * inv); });
    }
    return res;
  }
  function updatePreview() {
    var r = readForm();
    var v = mealValues(r);
    var el = $('preview');
    if (!r.anyValue) { el.textContent = ''; return; }
    if (!v) { el.textContent = 'Inserisci il peso per il totale'; return; }
    el.textContent = '≈ ' + nf(v.kcal) + ' kcal · C ' + fmt1(v.carbs) + ' · P ' + fmt1(v.protein) + ' · G ' + fmt1(v.fat);
  }

  async function onSubmit(e) {
    e.preventDefault();
    var msg = $('msg');
    msg.textContent = '';
    var name = $('f-name').value.trim();
    var r = readForm();
    if (!name) { msg.textContent = 'Scrivi cosa hai mangiato.'; $('f-name').focus(); return; }
    if (!r.anyValue) { msg.textContent = 'Inserisci almeno un valore tra carbo, proteine, grassi o calorie.'; $('f-carbs').focus(); return; }
    var v = mealValues(r);
    if (!v) { msg.textContent = 'Inserisci il peso in grammi, oppure scegli «tutta la porzione».'; $('f-grams').focus(); return; }
    var meal = Object.assign({ id: newId(), date: state.date, slot: $('f-slot').value, name: name, createdAt: Date.now() }, v);
    var bc = normCode($('f-code').value); if (bc.length >= 3) meal.barcode = bc;
    var btn = $('add-btn');
    btn.disabled = true;
    try {
      await store.add(meal);
      ['f-name', 'f-grams', 'f-carbs', 'f-protein', 'f-fat', 'f-kcal', 'f-sugar', 'f-sat', 'f-fiber', 'f-salt', 'f-code'].forEach(function (id) { $(id).value = ''; });
      updatePreview();
      afterAdd(meal);
    } catch (err) {
      msg.textContent = 'Non sono riuscito a salvare l’alimento. Riprova.';
    }
    btn.disabled = false;
  }

  function guessSlot() {
    var h = new Date().getHours();
    if (h < 10) return 'colazione';
    if (h < 12) return 'spuntino-1';
    if (h < 15) return 'pranzo';
    if (h < 18) return 'spuntino-2';
    if (h < 22) return 'cena';
    return 'pre-nanna';
  }

  /* ---------- Obiettivi ---------- */
  var T_IDS = [['on', 'carbs'], ['on', 'protein'], ['on', 'fat'], ['off', 'carbs'], ['off', 'protein'], ['off', 'fat']];
  function fillTargets() {
    T_IDS.forEach(function (x) { $('t-' + x[0] + '-' + x[1]).value = String(state.presets[x[0]][x[1]]).replace('.', ','); });
    updateTargetHint();
  }
  function updateTargetHint() {
    ['on', 'off'].forEach(function (m) {
      var c = num($('t-' + m + '-carbs').value), p = num($('t-' + m + '-protein').value), f = num($('t-' + m + '-fat').value);
      $('t-' + m + '-hint').textContent = 'Obiettivo ' + (m === 'on' ? 'ON' : 'OFF') + ': ' + nf(kcalFromMacros(c, p, f)) + ' kcal';
    });
  }
  async function onSaveTargets() {
    var m = $('t-msg');
    var presets = { on: {}, off: {} };
    var ok = true;
    T_IDS.forEach(function (x) {
      var v = num($('t-' + x[0] + '-' + x[1]).value);
      if (!(v > 0)) ok = false;
      presets[x[0]][x[1]] = v;
    });
    if (!ok) { m.style.color = 'var(--warn)'; m.textContent = 'Inserisci un valore maggiore di zero per ogni macro.'; return; }
    try {
      await patchSettings({ presets: presets });
      m.style.color = 'var(--muted)'; m.textContent = 'Obiettivi salvati.';
    } catch (err) {
      m.style.color = 'var(--warn)'; m.textContent = 'Non sono riuscito a salvare gli obiettivi.';
    }
  }

  /* ---------- Salvataggio sul telefono ---------- */
  function localStore() {
    var KEY = 'bellottrack-food-fit-v1';
    function read() {
      try {
        var raw = localStorage.getItem(KEY);
        var d = raw ? JSON.parse(raw) : null;
        return { meals: d && Array.isArray(d.meals) ? d.meals : [], settings: d && d.settings ? d.settings : null };
      } catch (e) { return { meals: [], settings: null }; }
    }
    var mem = read();
    function write() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) {} }
    var cb = null;
    return {
      kind: 'local',
      snapshot: function () { return JSON.parse(JSON.stringify(mem)); },
      watch: function (onMeals, onSettings) {
        cb = { m: onMeals, s: onSettings };
        onMeals(mem.meals.slice(), false); onSettings(mem.settings, !!mem.settings);
        return function () { cb = null; };
      },
      add: function (m) { mem.meals.push(m); write(); if (cb) cb.m(mem.meals.slice(), false); return Promise.resolve(); },
      update: function (id, patch) {
        mem.meals = mem.meals.map(function (x) { return x.id === id ? Object.assign({}, x, patch) : x; });
        write(); if (cb) cb.m(mem.meals.slice(), false); return Promise.resolve();
      },
      remove: function (id) { mem.meals = mem.meals.filter(function (x) { return x.id !== id; }); write(); if (cb) cb.m(mem.meals.slice(), false); return Promise.resolve(); },
      saveSettings: function (st) { mem.settings = st; write(); if (cb) cb.s(st, true); return Promise.resolve(); }
    };
  }
  function applySettings(st) {
    st = st || {};
    var presets = JSON.parse(JSON.stringify(DEFAULTS));
    if (st.presets) {
      ['on', 'off'].forEach(function (m) {
        ['carbs', 'protein', 'fat'].forEach(function (k) {
          var v = st.presets[m] && st.presets[m][k];
          if (v > 0) presets[m][k] = v;
        });
      });
    }
    state.presets = presets;
    state.modes = st.modes || {};
    state.profile = st.profile || null;
    state.weights = Array.isArray(st.weights) ? st.weights : [];
    state.goals = Array.isArray(st.goals) ? st.goals : [];
    state.schedule = st.schedule && Array.isArray(st.schedule.days) ? st.schedule : null;
    EXTRA_ARR.forEach(function (k) { state[k] = Array.isArray(st[k]) ? st[k] : []; });
    state.daily = st.daily && typeof st.daily === 'object' ? st.daily : {};
    state.suppList = Array.isArray(st.suppList) ? st.suppList : null;
    state.waterGoal = st.waterGoal > 0 ? st.waterGoal : 0;
    state.settingsReady = true;
    if (!$('targets-box').open) fillTargets();
    render();
  }
  function composeSettings() {
    return { presets: state.presets, modes: state.modes, profile: state.profile, weights: state.weights, goals: state.goals,
      schedule: state.schedule || DEFAULT_SCHEDULE, templates: state.templates, favs: state.favs, workouts: state.workouts, measures: state.measures, plan: state.plan, plans: state.plans,
      daily: state.daily, suppList: state.suppList, waterGoal: state.waterGoal || 0 };
  }
  /* Cambia una parte delle impostazioni, la applica subito e la salva. */
  function patchSettings(patch) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    render();
    return store.saveSettings(JSON.parse(JSON.stringify(composeSettings())));
  }
  function onMeals(list) {
    state.meals = list;
    state.mealsReady = true;
    if (!loaded) { loaded = true; }
    $('sync').textContent = store && store.kind === 'cloud' ? 'Sincronizzato con il tuo account' : 'Salvato su questo telefono';
    render();
  }
  var stopWatch = null;
  function storeError() { $('sync').textContent = 'Non riesco a leggere i dati salvati. Controlla la connessione.'; }
  function useStore(next) {
    if (stopWatch) { try { stopWatch(); } catch (e) {} stopWatch = null; }
    store = next;
    state.meals = []; state.mealsReady = false; state.settingsReady = false;
    state.profile = null; state.weights = []; state.goals = []; state.modes = {};
    state.schedule = null; state.templates = []; state.favs = []; state.workouts = []; state.measures = []; state.plan = []; state.plans = []; state.daily = {}; state.suppList = null; state.waterGoal = 0;
    state.presets = JSON.parse(JSON.stringify(DEFAULTS));
    $('sync').textContent = next.kind === 'cloud' ? 'Sincronizzazione…' : '';
    render();
    stopWatch = next.watch(onMeals, applySettings, storeError) || null;
    emit('store', next);
  }

  /* ---------- Prodotti: dati, ricerca e scheda ---------- */
  function parseProduct(code, pr) {
    var n = pr.nutriments || {};
    function g(k) { var v = n[k]; if (v === undefined || v === null || v === '') return null; v = Number(v); return isFinite(v) && v >= 0 ? v : null; }
    var kcal = g('energy-kcal_100g');
    if (kcal === null) { var kj = g('energy_100g'); if (kj !== null) kcal = kj / 4.184; }
    var serving = Number(pr.serving_quantity);
    var nm = pr.product_name_it || pr.product_name || pr.generic_name || '';
    return {
      code: code, hasName: !!String(nm).trim(),
      name: String(nm).trim() || ('Prodotto ' + code),
      brand: pr.brands ? String(pr.brands).split(',')[0].trim() : '',
      quantity: pr.quantity ? String(pr.quantity) : '',
      kcal: kcal, carbs: g('carbohydrates_100g'), protein: g('proteins_100g'), fat: g('fat_100g'),
      sugar: g('sugars_100g'), sat: g('saturated-fat_100g'), fiber: g('fiber_100g'),
      salt: g('salt_100g') !== null ? g('salt_100g') : (g('sodium_100g') !== null ? g('sodium_100g') * 2.5 : null),
      serving: isFinite(serving) && serving > 0 ? serving : 0,
      allergens: (pr.allergens_tags || []).map(function (t) { return String(t).replace(/^[a-z]{2}:/, ''); })
    };
  }
  function baseToProduct(b) {
    return { code: '', generic: true, hasName: true, name: b.n, brand: '', quantity: '', kcal: kcalFromMacros(b.c, b.p, b.f),
      carbs: b.c, protein: b.p, fat: b.f, sugar: b.z == null ? null : b.z, sat: null, fiber: b.fi == null ? null : b.fi, salt: null, serving: b.s || 0, allergens: b.a || [] };
  }
  function usable(p) { return p.hasName && (p.kcal !== null || p.carbs !== null || p.protein !== null || p.fat !== null); }
  function cacheGet(code) { try { var c = JSON.parse(localStorage.getItem('dp-products') || '{}'); return c[code] || null; } catch (e) { return null; } }
  function cachePut(code, p) {
    try {
      var c = JSON.parse(localStorage.getItem('dp-products') || '{}');
      c[code] = p;
      var keys = Object.keys(c);
      if (keys.length > 200) delete c[keys[0]];
      localStorage.setItem('dp-products', JSON.stringify(c));
    } catch (e) {}
  }

  var searchCache = {};
  var searchAbort = null;
  var searchSeq = 0;

  function localMatches(q) {
    var toks = tokensOf(q);
    if (!toks.length) return [];
    var scored = [];
    BASE.forEach(function (b, i) {
      var n = norm(b.n + ' ' + (b.k || '')), hit = 0;
      toks.forEach(function (t) { if (n.indexOf(t) !== -1) hit++; });
      if (hit) scored.push({ b: b, hit: hit, i: i });
    });
    var full = scored.filter(function (x) { return x.hit === toks.length; });
    // Se le corrispondenze complete sono poche, aggiungo quelle parziali (stesso tipo di alimento, taglio diverso).
    var pick = full.length >= 6 || toks.length < 2 ? full : scored;
    pick.sort(function (a, b) { return (b.hit - a.hit) || (a.i - b.i); });
    return pick.slice(0, 25).map(function (x) { return baseToProduct(x.b); });
  }
  /* Alimenti gia' usati o tra i preferiti: cosi' un prodotto inserito una volta si ritrova scrivendo il nome. */
  function ownMatches(q) {
    var toks = tokensOf(q);
    if (!toks.length) return [];
    var seen = {}, out = [];
    var pool = (state.favs || []).concat(state.meals.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }));
    pool.forEach(function (m) {
      if (!m || !m.name || out.length >= 8) return;
      var n = norm(m.name);
      if (!toks.every(function (t) { return n.indexOf(t) !== -1; })) return;
      var k = favKey(m); if (seen[k]) return; seen[k] = 1;
      var b = m.per100 || m;
      out.push({ own: true, src: m, hasName: true, name: m.name, brand: '', quantity: '', kcal: b.kcal > 0 ? b.kcal : kcalFromMacros(b.carbs || 0, b.protein || 0, b.fat || 0),
        carbs: b.carbs || 0, protein: b.protein || 0, fat: b.fat || 0, per: m.per100 ? 100 : 0, allergens: [] });
    });
    return out;
  }

  function resItem(p) {
    var li = document.createElement('li');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'res';
    var rn = document.createElement('span'); rn.className = 'rn'; rn.textContent = p.name;
    b.appendChild(rn);
    var sub = p.own ? (p.per ? 'Dai tuoi alimenti' : 'Dai tuoi alimenti · valori per porzione') : p.generic ? 'Alimento base' : [p.brand, p.quantity].filter(Boolean).join(' · ');
    if (sub) { var rb = document.createElement('span'); rb.className = 'rb'; rb.textContent = sub; b.appendChild(rb); }
    var rs = document.createElement('span'); rs.className = 'rs';
    rs.textContent = (p.own && !p.per ? 'Porzione: ' : 'Per 100 g: ') + (p.kcal === null ? '?' : nf(p.kcal)) + ' kcal · C ' + fmtN(p.carbs) + ' · P ' + fmtN(p.protein) + ' · G ' + fmtN(p.fat);
    b.appendChild(rs);
    b.addEventListener('click', function () {
      $('results').textContent = ''; $('search-status').textContent = '';
      if (p.own) { fillFormFromMeal(p.src); $('f-name').focus(); return; }
      showProduct(p);
    });
    li.appendChild(b);
    return li;
  }

  function renderResults(local, remote) {
    var own = ownMatches($('q').value.trim());
    var box = $('results');
    box.textContent = '';
    function section(title, arr) {
      if (!arr || !arr.length) return;
      var h = document.createElement('div'); h.className = 'reshead'; h.textContent = title; box.appendChild(h);
      var ul = document.createElement('ul'); ul.className = 'results';
      arr.forEach(function (p) { ul.appendChild(resItem(p)); });
      box.appendChild(ul);
    }
    section('I tuoi alimenti', own);
    section('Alimenti base', local);
    section('Database mondiale', remote);
  }

  var STOP = { del: 1, dal: 1, di: 1, da: 1, della: 1, dello: 1, dei: 1, delle: 1, dalla: 1, dalle: 1, il: 1, lo: 1, la: 1, le: 1, gli: 1, un: 1, una: 1, e: 1, al: 1, alla: 1, con: 1, the: 1 };
  function sigTokens(q) { return norm(q).split(/[^a-z0-9]+/).filter(function (t) { return t && !STOP[t]; }); }
  function scoreOf(p, toks) {
    var hay = norm(p.name + ' ' + p.brand + ' ' + p.quantity), sc = 0;
    toks.forEach(function (t) { if (hay.indexOf(t) !== -1) sc++; });
    return sc;
  }
  function offFetch(terms, italy, sig) {
    var fields = 'code,product_name,product_name_it,generic_name,brands,quantity,serving_quantity,nutriments,allergens_tags';
    var url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(terms) +
      '&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n&fields=' + fields +
      (italy ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=italy' : '');
    return fetch(url, { headers: { 'Accept': 'application/json' }, signal: sig }).then(function (res) {
      if (res.status === 429 || res.status === 503) throw new Error('busy');
      if (!res.ok) throw new Error('http');
      return res.json();
    }).then(function (d) { return { ok: true, list: d.products || [] }; }, function (e) {
      if (e && e.name === 'AbortError') throw e;
      return { ok: false, err: e };
    });
  }
  var STOP = { di: 1, del: 1, dal: 1, della: 1, dello: 1, dei: 1, delle: 1, da: 1, e: 1, il: 1, la: 1, lo: 1, le: 1, un: 1, una: 1, con: 1, al: 1, alla: 1, in: 1, a: 1, per: 1, the: 1, of: 1 };
  function tokensOf(q) {
    var all = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
    var t = all.filter(function (x) { return !STOP[x]; });
    return t.length ? t : all;
  }
  function scoreOf(p, toks) {
    var hay = norm(p.name + ' ' + (p.brand || '') + ' ' + (p.quantity || '')), n = 0;
    toks.forEach(function (t) { if (hay.indexOf(t) !== -1) n++; });
    return n;
  }
  async function remoteSearch(q) {
    if (searchAbort) { try { searchAbort.abort(); } catch (e) {} }
    searchAbort = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var sig = searchAbort ? searchAbort.signal : undefined;
    var toks = tokensOf(q);
    var fields = 'code,product_name,product_name_it,generic_name,brands,quantity,serving_quantity,nutriments,allergens_tags';
    function url(terms, italy) {
      return 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(terms) +
        '&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n&fields=' + fields +
        (italy ? '&tagtype_0=countries&tag_contains_0=contains&tag_0=italy' : '');
    }
    function run(u) {
      return fetch(u, { headers: { 'Accept': 'application/json' }, signal: sig }).then(function (res) {
        if (res.status === 429 || res.status === 503) throw new Error('busy');
        if (!res.ok) throw new Error('http');
        return res.json();
      }).then(function (d) { return { ok: true, list: d.products || [] }; }, function (e) {
        if (e && e.name === 'AbortError') throw e;
        return { ok: false, err: e };
      });
    }
    var seen = {}, out = [];
    function collect(results) {
      results.forEach(function (r) {
        (r.list || []).forEach(function (pr) {
          var code = String(pr.code || ''); if (seen[code]) return; seen[code] = 1;
          var p = parseProduct(code, pr); if (usable(p)) out.push(p);
        });
      });
    }
    var first = await Promise.all([run(url(toks.join(' '), true)), run(url(toks.join(' '), false))]);
    if (!first[0].ok && !first[1].ok) throw first[1].err || new Error('http');
    collect(first);
    var relaxed = false;
    // Pochi risultati: provo con meno parole (di solito la marca sta in fondo, il tipo di prodotto all'inizio).
    if (out.length < 6 && toks.length >= 2) {
      var tries = [];
      if (toks.length >= 3) { tries.push(toks.slice(0, -1).join(' ')); tries.push(toks.slice(-2).join(' ')); }
      else { tries.push(toks[toks.length - 1]); }
      var more = await Promise.all(tries.map(function (t) { return run(url(t, false)); }));
      var before = out.length; collect(more); relaxed = out.length > before;
    }
    out.forEach(function (p, i) { p._i = i; });
    out.sort(function (a, b) { return (scoreOf(b, toks) - scoreOf(a, toks)) || (a._i - b._i); });
    var res = out.slice(0, 30);
    res.relaxed = relaxed;
    return res;
  }

  function onSearchInput() {
    var q = $('q').value.trim();
    $('search-status').textContent = '';
    if (q.length < 2) { $('results').textContent = ''; return; }
    renderResults(localMatches(q), searchCache[norm(q)] || null);
  }

  async function onSearchSubmit(e) {
    e.preventDefault();
    var q = $('q').value.trim();
    var st = $('search-status');
    $('scan-msg').textContent = '';
    if (q.length < 2) { st.textContent = 'Scrivi almeno 2 lettere.'; return; }
    var local = localMatches(q);
    var key = norm(q);
    if (searchCache[key]) { renderResults(local, searchCache[key]); st.textContent = searchCache[key].length || local.length || ownMatches(q).length ? '' : 'Nessun risultato. Inserisci i valori a mano più sotto: l’app ricorderà il prodotto.'; return; }
    renderResults(local, null);
    st.textContent = 'Cerco nel database mondiale…';
    var seq = ++searchSeq;
    try {
      var remote = await remoteSearch(q);
      if (seq !== searchSeq) return;
      searchCache[key] = remote;
      renderResults(local, remote);
      st.textContent = remote.length || local.length || ownMatches(q).length ? (remote.relaxed && remote.length ? 'Non trovo l’esatto prodotto: ti mostro i più simili. Controlla marca e valori sull’etichetta.' : '') : 'Nessun risultato. Inserisci i valori a mano più sotto: l’app ricorderà il prodotto.';
    } catch (err) {
      if (seq !== searchSeq || (err && err.name === 'AbortError')) return;
      st.textContent = err && err.message === 'busy'
        ? 'Il database è occupato. Riprova tra un minuto.'
        : 'Non riesco a contattare il database mondiale. Controlla la connessione.';
    }
  }

  function normCode(c) { return String(c || '').replace(/[^A-Za-z0-9.\-_\/+]/g, '').toUpperCase().slice(0, 40); }
  function ownByCode(code) {
    var pool = (state.favs || []).concat(state.meals.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); }));
    for (var i = 0; i < pool.length; i++) if (pool[i] && pool[i].barcode && normCode(pool[i].barcode) === code) return pool[i];
    return null;
  }
  function notFound() {
    $('product').hidden = true; product = null;
    $('scan-msg').textContent = 'Prodotto non trovato nel database Open Food Facts. Inserisci i valori a mano qui sotto: il codice resta collegato al prodotto e la prossima volta lo ritrovi.';
    $('f-name').focus();
  }
  async function lookup(code) {
    code = normCode(code);
    var msg = $('scan-msg');
    if (code.length < 3) { msg.textContent = 'Scrivi il codice, almeno 3 caratteri.'; return; }
    // Prima i tuoi alimenti: un codice gia' usato si ritrova subito, anche se non standard.
    var mine = ownByCode(code);
    if (mine) { msg.textContent = 'Trovato tra i tuoi alimenti: ' + mine.name; $('product').hidden = true; fillFormFromMeal(mine); $('f-code').value = code; return; }
    if (!/^\d{8,14}$/.test(code)) {
      $('product').hidden = true; product = null;
      msg.textContent = 'Codice non standard (con lettere): non è nei database online. Inserisci i valori a mano qui sotto: la prossima volta, scrivendo o scansionando questo codice, ritroverai il prodotto.';
      $('f-code').value = code; $('f-name').focus();
      return;
    }
    msg.textContent = 'Cerco il prodotto…';
    $('product').hidden = true;
    var p = null;
    try {
      var url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) +
        '.json?fields=code,product_name,product_name_it,generic_name,brands,quantity,serving_quantity,nutriments,allergens_tags';
      var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.status === 404) { notFound(); return; }
      if (!res.ok) throw new Error('http');
      var data = await res.json();
      if (!data || data.status !== 1 || !data.product) { notFound(); return; }
      p = parseProduct(code, data.product);
      cachePut(code, p);
    } catch (e) {
      p = cacheGet(code);
      if (!p) { msg.textContent = 'Non riesco a contattare il database. Controlla la connessione e riprova.'; return; }
    }
    msg.textContent = '';
    showProduct(p);
  }

  function showProduct(p) {
    product = p;
    $('p-name').textContent = p.name;
    $('p-brand').textContent = p.generic ? 'Alimento base · valori medi indicativi' : [p.brand, p.quantity].filter(Boolean).join(' · ');
    $('p-100').textContent = 'Ogni 100 g: ' + (p.kcal === null ? '?' : nf(p.kcal)) + ' kcal · C ' + fmtN(p.carbs) + ' g · P ' + fmtN(p.protein) + ' g · G ' + fmtN(p.fat) + ' g';
    var xs = [];
    if (p.sugar !== null && p.sugar !== undefined) xs.push('di cui zuccheri ' + fmt1(p.sugar) + ' g');
    if (p.sat !== null && p.sat !== undefined) xs.push('saturi ' + fmt1(p.sat) + ' g');
    if (p.fiber !== null && p.fiber !== undefined) xs.push('fibre ' + fmt1(p.fiber) + ' g');
    if (p.salt !== null && p.salt !== undefined) xs.push('sale ' + fmt1(p.salt) + ' g');
    if (xs.length) { var xd = document.createElement('div'); xd.className = 'p100x'; xd.textContent = xs.join(' · '); $('p-100').appendChild(xd); }
    var al = p.allergens.map(function (a) { return ALLERGENS[a] || a; });
    var box = $('p-allerg');
    box.textContent = al.length ? 'Allergeni indicati: ' + al.join(', ') : 'Nessun allergene indicato nei dati.';
    var small = document.createElement('small');
    small.textContent = p.generic ? 'Sono valori medi: i prodotti reali possono variare.' : 'I dati sono inseriti dagli utenti: controlla sempre l’etichetta.';
    box.appendChild(small);
    $('p-grams').value = String(p.serving || 100).replace('.', ',');
    $('product').hidden = false;
    updateProductCalc();
    $('product').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function productValues() {
    var g = num($('p-grams').value);
    var c = product.carbs || 0, pr = product.protein || 0, f = product.fat || 0;
    var k = product.kcal !== null ? product.kcal : kcalFromMacros(c, pr, f);
    var x = g / 100;
    var out = {
      grams: round1(g),
      per100: Object.assign({ carbs: round2(c), protein: round2(pr), fat: round2(f), kcal: round2(k) }, xOf(product)),
      carbs: round1(c * x), protein: round1(pr * x), fat: round1(f * x), kcal: Math.round(k * x)
    };
    XK.forEach(function (k) { if (product[k] > 0) out[k] = round2(product[k] * x); });
    return out;
  }
  function updateProductCalc() {
    if (!product) return;
    var v = productValues();
    var calc = $('p-calc');
    calc.textContent = nf(v.kcal) + ' kcal';
    var sp = document.createElement('span');
    sp.textContent = 'C ' + fmt1(v.carbs) + ' · P ' + fmt1(v.protein) + ' · G ' + fmt1(v.fat);
    calc.appendChild(sp);
    var missing = product.carbs === null || product.protein === null || product.fat === null;
    $('p-note').textContent = (missing ? 'Alcuni valori mancano nel database: controllali sull’etichetta. ' : '') +
      'Si aggiunge a ' + slotLabel($('f-slot').value) + ' del giorno selezionato (' + fmtLong(state.date) + '). Il peso si può cambiare anche dopo, dall’elenco.';
  }
  async function addProduct() {
    if (!product) return;
    var v = productValues();
    if (!(v.grams > 0)) { $('scan-msg').textContent = 'Inserisci il peso in grammi.'; return; }
    var meal = Object.assign({
      id: newId(), date: state.date, slot: $('f-slot').value,
      name: (product.name + (product.brand && !product.generic ? ' (' + product.brand + ')' : '')).slice(0, 120),
      createdAt: Date.now()
    }, v);
    if (product.code) meal.barcode = product.code;
    try {
      await store.add(meal);
      $('scan-msg').textContent = '';
      $('product').hidden = true; $('f-code').value = ''; product = null;
      afterAdd(meal);
    } catch (e) {
      $('scan-msg').style.color = 'var(--warn)';
      $('scan-msg').textContent = 'Non sono riuscito a salvare l’alimento. Riprova.';
    }
  }
  function fillFromProduct() {
    if (!product) return;
    var v = productValues();
    $('f-name').value = (product.name + (product.brand && !product.generic ? ' (' + product.brand + ')' : '')).slice(0, 120);
    $('f-basis').value = 'per100';
    $('f-grams').value = String(v.grams).replace('.', ',');
    function s(x) { return x ? String(x).replace('.', ',') : ''; }
    $('f-carbs').value = s(v.per100.carbs); $('f-protein').value = s(v.per100.protein); $('f-fat').value = s(v.per100.fat);
    $('f-kcal').value = v.per100.kcal > 0 ? String(Math.round(v.per100.kcal)) : '';
    fillExtras(v.per100);
    updatePreview();
    $('product').hidden = true; product = null;
    $('f-name').focus();
  }

  /* ---------- Scanner codice a barre ---------- */
  var ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
  var scanState = { stream: null, reader: null, timer: null, active: false, handled: false };
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.ZXing) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = function () { resolve(); }; s.onerror = function () { reject(new Error('load')); };
      document.head.appendChild(s);
    });
  }
  function setScanStatus(t) { $('scan-status').textContent = t; }
  function stopScanner() {
    scanState.active = false;
    clearInterval(scanState.timer); scanState.timer = null;
    try { if (scanState.reader) scanState.reader.reset(); } catch (e) {}
    scanState.reader = null;
    if (scanState.stream) { scanState.stream.getTracks().forEach(function (t) { t.stop(); }); scanState.stream = null; }
    var v = $('scan-video');
    try { v.pause(); } catch (e) {}
    v.srcObject = null;
    $('scanner').hidden = true;
  }
  function onCode(raw) {
    if (scanState.handled) return;
    var code = normCode(raw);
    if (code.length < 3) return;
    scanState.handled = true;
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
    stopScanner();
    $('f-code').value = code;
    lookup(code);
  }
  async function openScanner() {
    $('scan-msg').textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('scan-msg').textContent = 'La fotocamera non è disponibile qui. Scrivi il codice a barre a mano.';
      return;
    }
    scanState.handled = false; scanState.active = true;
    $('scanner').hidden = false;
    setScanStatus('Avvio della fotocamera…');
    var video = $('scan-video');
    try {
      if ('BarcodeDetector' in window) {
        var detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf'] });
        scanState.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!scanState.active) { stopScanner(); return; }
        video.srcObject = scanState.stream;
        await video.play();
        setScanStatus('Inquadra il codice a barre');
        var busy = false;
        scanState.timer = setInterval(async function () {
          if (busy || !scanState.active) return;
          busy = true;
          try { var found = await detector.detect(video); if (found && found.length) onCode(found[0].rawValue); } catch (e) {}
          busy = false;
        }, 250);
      } else {
        await loadScript(ZXING_URL);
        if (!scanState.active) return;
        var Z = window.ZXing;
        var hints = new Map();
        hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39, Z.BarcodeFormat.CODE_93, Z.BarcodeFormat.CODABAR, Z.BarcodeFormat.ITF]);
        var reader = new Z.BrowserMultiFormatReader(hints, 250);
        scanState.reader = reader;
        await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video,
          function (result) { if (result) onCode(result.getText()); });
        setScanStatus('Inquadra il codice a barre');
      }
    } catch (err) {
      stopScanner();
      var name = err && err.name, text;
      if (name === 'NotAllowedError' || name === 'SecurityError') text = 'Non ho il permesso di usare la fotocamera. Consentilo dalle impostazioni del browser, oppure scrivi il codice a mano.';
      else if (err && err.message === 'load') text = 'La prima scansione richiede internet per scaricare lo scanner. Oppure scrivi il codice a mano.';
      else text = 'Non riesco ad avviare lo scanner. Scrivi il codice a barre a mano.';
      $('scan-msg').textContent = text;
    }
  }

  /* ---------- Installazione, backup, service worker ---------- */
  var deferredPrompt = null;
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  function setupInstall() {
    if (isStandalone()) return;
    var box = $('install'), btn = $('install-btn');
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; box.hidden = false; btn.hidden = false; });
    btn.addEventListener('click', async function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null; box.hidden = true;
    });
    window.addEventListener('appinstalled', function () { box.hidden = true; });
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (ios) { $('install-text').textContent = 'Per installare l’app: tocca Condividi in Safari, poi «Aggiungi alla schermata Home».'; box.hidden = false; }
  }
  function mergeSettings(inc) {
    var cur = composeSettings(), patch = {};
    if (inc.presets) patch.presets = inc.presets;
    if (inc.modes) patch.modes = Object.assign({}, cur.modes, inc.modes);
    if (inc.profile && !cur.profile) patch.profile = inc.profile;
    if (Array.isArray(inc.weights)) {
      var by = {};
      cur.weights.concat(inc.weights).forEach(function (w) { if (w && w.date && w.kg > 0) by[w.date] = { date: w.date, kg: w.kg }; });
      patch.weights = Object.keys(by).sort().map(function (k) { return by[k]; });
    }
    if (Array.isArray(inc.goals) && !cur.goals.length) patch.goals = inc.goals;
    return patchSettings(patch);
  }
  function setupBackup() {
    $('bk-export').addEventListener('click', function () {
      var payload = { app: 'bellottrack-food-fit', version: 2, exportedAt: new Date().toISOString(), meals: state.meals, settings: composeSettings() };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'bellottrack-food-fit-' + todayStr() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      $('bk-msg').textContent = 'Backup esportato.';
    });
    $('bk-import').addEventListener('click', function () { $('bk-file').click(); });
    $('bk-file').addEventListener('change', function () {
      var input = this;
      var file = input.files && input.files[0];
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var d = JSON.parse(r.result);
          if (!d || !Array.isArray(d.meals)) throw new Error('bad');
          var have = {};
          state.meals.forEach(function (m) { have[m.id] = 1; });
          var jobs = [], added = 0;
          d.meals.forEach(function (m) {
            if (m && m.id && typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date) && !have[m.id]) { jobs.push(store.add(m)); added++; }
          });
          Promise.all(jobs).then(function () {
            if (d.settings) mergeSettings(d.settings);
            $('bk-msg').textContent = 'Importati ' + added + ' alimenti.';
          });
        } catch (e) { $('bk-msg').textContent = 'File non valido.'; }
      };
      r.readAsText(file);
      input.value = '';
    });
  }
  function registerSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
  }

  /* ---------- Avvio ---------- */
  $('f-slot').value = guessSlot();
  $('sheet-x').addEventListener('click', closeSheet);
  $('sheet-back').addEventListener('click', closeSheet);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('scanner').hidden) closeSheet(); });
  $('prev').addEventListener('click', function () { state.date = addDays(state.date, -1); render(); });
  $('next').addEventListener('click', function () { state.date = addDays(state.date, 1); render(); });
  $('today').addEventListener('click', function () { state.date = todayStr(); render(); });
  $('mode-on').addEventListener('click', function () { setMode('on'); });
  $('mode-off').addEventListener('click', function () { setMode('off'); });
  $('meal-form').addEventListener('submit', onSubmit);
  ['f-grams', 'f-carbs', 'f-protein', 'f-fat', 'f-kcal'].forEach(function (id) { $(id).addEventListener('input', updatePreview); });
  $('f-basis').addEventListener('change', updatePreview);
  T_IDS.forEach(function (x) { $('t-' + x[0] + '-' + x[1]).addEventListener('input', updateTargetHint); });
  $('t-save').addEventListener('click', onSaveTargets);
  (function () {
    var chips = $('brand-chips'); if (!chips) return;
    ['Eurospin', 'Lidl', 'Coop', 'Conad', 'MD', 'Despar', 'Esselunga', 'Carrefour', 'Aldi', 'Penny'].forEach(function (b) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'chip'; c.textContent = b;
      c.addEventListener('click', function () {
        var q = $('q').value.trim();
        var re = new RegExp('(^|\\s)' + b + '(?=\\s|$)', 'i');
        $('q').value = re.test(q) ? q.replace(re, ' ').replace(/\s+/g, ' ').trim() : (q + ' ' + b).trim();
        if ($('q').value.length >= 2) $('search-form').requestSubmit ? $('search-form').requestSubmit() : onSearchSubmit({ preventDefault: function () {} });
        else $('q').focus();
      });
      chips.appendChild(c);
    });
  })();
  $('search-form').addEventListener('submit', onSearchSubmit);
  $('q').addEventListener('input', onSearchInput);
  $('scan-btn').addEventListener('click', openScanner);
  $('scan-close').addEventListener('click', stopScanner);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && scanState.active) stopScanner(); });
  $('code-go').addEventListener('click', function () { lookup($('f-code').value); });
  $('f-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); lookup($('f-code').value); } });
  $('p-grams').addEventListener('input', updateProductCalc);
  $('f-slot').addEventListener('change', updateProductCalc);
  $('p-add').addEventListener('click', addProduct);
  $('p-fill').addEventListener('click', fillFromProduct);
  fillTargets();
  render();

  var localStoreInstance = localStore();
  useStore(localStoreInstance);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  setupInstall();
  setupBackup();
  registerSW();

  /* ---------- Schede e interfaccia comune ---------- */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 5500);
  }
  var currentView = 'diario';
  function showView(name) {
    if (!document.querySelector('.view[data-view="' + name + '"]')) name = 'diario';
    currentView = name;
    Array.prototype.forEach.call(document.querySelectorAll('.view'), function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      if (t.getAttribute('data-tab') === name) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    try { localStorage.setItem('bt-tab', name); } catch (e) {}
    window.scrollTo(0, 0);
    emit('view', name);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-tab],[data-goto]'), function (b) {
    b.addEventListener('click', function () { showView(b.getAttribute('data-tab') || b.getAttribute('data-goto')); });
  });
  var firstTab = 'diario';
  try { firstTab = localStorage.getItem('bt-tab') || 'diario'; } catch (e) {}

  window.BT = {
    $: $, state: state, on: on, emit: emit, toast: toast, showView: showView, setHeat: setHeat,
    getView: function () { return currentView; },
    getStore: function () { return store; }, useStore: useStore, localStore: localStoreInstance,
    patchSettings: patchSettings, composeSettings: composeSettings,
    num: num, round1: round1, round2: round2, fmt1: fmt1, nf: nf, norm: norm,
    todayStr: todayStr, addDays: addDays, toDate: toDate, fmtLong: fmtLong, newId: newId,
    kcalFromMacros: kcalFromMacros, kcalOf: kcalOf, dayMeals: dayMeals, totalsOf: totalsOf,
    targetsFor: targetsFor, modeOf: modeOf, scheduledOn: scheduledOn, DEFAULT_SCHEDULE: DEFAULT_SCHEDULE, targetKcal: targetKcal, BASE: BASE, DEFAULTS: DEFAULTS,
    addMeal: function (m) { return store.add(m); }, fillFormFromMeal: fillFormFromMeal, favKey: favKey, openSheet: openSheet, closeSheet: closeSheet, slotLabel: slotLabel, sectionOf: sectionOf, SECTIONS: SECTIONS,
    setSync: function (t) { $('sync').textContent = t; }
  };
  emit('render');
  showView(firstTab);
})();

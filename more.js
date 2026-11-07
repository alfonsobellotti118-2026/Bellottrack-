/* Bellottrack food fit: giorni programmati, pasti salvati, allenamenti, acqua e integratori, misure, immagine da condividere. */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var $ = BT.$, state = BT.state;
  var DAYN = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function save(patch) {
    return BT.patchSettings(patch).catch(function () { BT.toast('Non sono riuscito a salvare.', 'err'); });
  }
  /* Salva senza ridisegnare (per i campi che si stanno scrivendo). */
  var saveTimer = null;
  function saveQuiet() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var st = BT.getStore();
      if (st) { try { st.saveSettings(clone(BT.composeSettings())); } catch (e) {} }
    }, 600);
  }

  /* ---------- Stile ---------- */
  var css = '' +
    '.tabbar{grid-template-columns:repeat(6,1fr)!important}' +
    '.tab span{overflow:hidden;text-overflow:ellipsis;max-width:100%}' +
    '@media (max-width:420px){.tab{font-size:9.5px!important;letter-spacing:0!important}.tab svg{width:22px!important;height:22px!important}}' +
    '.quick{display:flex;flex-wrap:wrap;gap:8px}.quick>button{flex:1 1 130px;min-height:44px;height:auto;padding-block:8px}' +
    '.sched{font-size:14px;color:var(--muted);margin:-4px 2px 0}.sched .linkbtn{display:inline;padding:0 0 0 6px}' +
    '.star{border:0;background:none;color:var(--muted);font-size:24px;line-height:1;min-width:44px;min-height:44px;padding:0}.star.on{color:var(--gold)}' +
    '.sbtn{border:1px solid var(--line);background:var(--raise);color:var(--ink);border-radius:8px;min-height:44px;padding:6px 12px;font-size:14px;font-weight:700}' +
    '.sbtn.on{border-color:var(--gold);color:var(--gold)}' +
    '.msec .mtools{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.msec .mtools .linkbtn{min-height:36px}' +
    '.watercount{font-family:var(--font-display);font-size:34px;font-variant-numeric:tabular-nums}' +
    '.wrow{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.wrow span{color:var(--muted);font-size:14px}' +
    '.suppl{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}' +
    '.dayrow{display:flex;gap:6px;flex-wrap:wrap}.dayrow .sbtn{flex:1 1 40px;min-width:44px;padding:6px 0;text-align:center}' +
    '.mback{position:fixed;inset:0;z-index:55;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}' +
    '.mcard{background:var(--surface);border:1px solid var(--line);border-radius:14px 14px 0 0;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}' +
    '.mcard h2{margin:0}.mlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}' +
    '.mitem{display:flex;gap:8px;align-items:center;justify-content:space-between;border:1px solid var(--line);background:var(--raise);border-radius:10px;padding:10px 12px}' +
    '.mitem .mt{font-weight:700;overflow-wrap:anywhere}.mitem .ms{font-size:13px;color:var(--muted)}' +
    '.ex{border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--raise);display:flex;flex-direction:column;gap:8px}' +
    '.exh{display:flex;justify-content:space-between;align-items:center;gap:8px}.exh b{overflow-wrap:anywhere}' +
    '.exlast{font-size:13px;color:var(--muted)}' +
    '.setrow{display:grid;grid-template-columns:28px 1fr 1fr 44px;gap:8px;align-items:center}.setrow input{height:44px;min-width:0;text-align:center}' +
    '.setrow .sn{color:var(--muted);text-align:center;font-weight:700}' +
    '.setrow .rm{border:0;background:none;color:var(--muted);font-size:20px;min-height:44px}' +
    '.setlab{display:grid;grid-template-columns:28px 1fr 1fr 44px;gap:8px;font-size:12px;color:var(--muted);text-align:center;text-transform:uppercase}' +
    '.prl{list-style:none;margin:8px 0 0;padding:0}.prl li{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--line);font-size:14px;font-variant-numeric:tabular-nums}' +
    '.prl li b{overflow-wrap:anywhere}.pr{color:var(--gold)}' +
    '.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.igprev{width:100%;height:auto;border-radius:10px;border:1px solid var(--line);display:block}' +
    '.mcard .pactions>button{min-height:44px}' +
    '[hidden]{display:none!important}' +
    '#lock{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:24px}#lock[hidden]{display:none}' +
    '.lockbox{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;max-width:360px}.lockbox h1{margin:0}.lockbox p{margin:0;color:var(--muted)}';
  var st = el('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- Finestra generica ---------- */
  var modalEl = null, modalFrom = null;
  function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; document.body.classList.remove('noscroll'); if (modalFrom && modalFrom.focus) { try { modalFrom.focus(); } catch (e) {} } } }
  function openModal(title, build) {
    closeModal();
    modalFrom = document.activeElement;
    var back = el('div', 'mback'); back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true'); back.setAttribute('aria-label', title);
    var card = el('div', 'mcard');
    var h = el('h2', null, title);
    card.appendChild(h);
    build(card);
    var x = el('button', 'secondary', 'Chiudi'); x.type = 'button'; x.addEventListener('click', closeModal);
    card.appendChild(x);
    back.appendChild(card);
    back.addEventListener('click', function (e) { if (e.target === back) closeModal(); });
    document.body.appendChild(back); document.body.classList.add('noscroll');
    modalEl = back;
    x.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modalEl) closeModal(); });

  /* ================= 1. Giorni di allenamento programmati ================= */
  function schedDays() { return (state.schedule || BT.DEFAULT_SCHEDULE).days; }
  function setScheduleDays(days) {
    // Congela gli ultimi 60 giorni con la regola vecchia, poi applica la nuova da oggi.
    var modes = Object.assign({}, state.modes), today = BT.todayStr();
    for (var i = 1; i <= 60; i++) { var d = BT.addDays(today, -i); if (!modes[d]) modes[d] = BT.modeOf(d); }
    save({ modes: modes, schedule: { days: days, since: today } });
  }
  function moveToTomorrow() {
    var d = state.date, n = BT.addDays(d, 1), modes = Object.assign({}, state.modes);
    modes[d] = 'off'; modes[n] = 'on';
    save({ modes: modes }).then(function () { BT.toast('Allenamento spostato a ' + BT.fmtLong(n) + '.'); });
  }
  function moveHere() {
    var d = state.date, p = BT.addDays(d, -1), modes = Object.assign({}, state.modes);
    modes[d] = 'on'; if (BT.modeOf(p) === 'on') modes[p] = 'off';
    save({ modes: modes }).then(function () { BT.toast('Oggi è giorno di allenamento.'); });
  }
  var schedP;
  function buildSchedNote() {
    var mode = $('mode-on').parentNode;
    schedP = el('p', 'sched'); schedP.id = 'sched-note';
    mode.parentNode.insertBefore(schedP, mode.nextSibling);
  }
  function renderSched() {
    if (!schedP) return;
    var d = state.date, mode = BT.modeOf(d), sched = BT.scheduledOn(d), explicit = state.modes[d];
    schedP.textContent = '';
    var t = mode === 'on' ? (sched && !explicit ? 'Giorno di allenamento secondo il tuo programma.' : explicit ? 'Hai scelto tu: oggi è ON.' : 'Giorno ON.')
      : (sched && explicit === 'off' ? 'Oggi in programma c’era l’allenamento, ma l’hai segnato OFF.' : explicit === 'off' ? 'Giorno di riposo (scelto da te).' : 'Giorno di riposo secondo il tuo programma.');
    schedP.appendChild(document.createTextNode(t));
    if (mode === 'on') {
      var b = el('button', 'linkbtn', 'Sposta l’allenamento a domani'); b.type = 'button'; b.addEventListener('click', moveToTomorrow); schedP.appendChild(b);
    } else {
      var prev = BT.addDays(d, -1);
      if (d <= BT.todayStr() && BT.modeOf(prev) === 'on' && !sessionOf(prev) && !explicit) {
        var c = el('button', 'linkbtn', 'Ieri non mi sono allenato: lo faccio oggi'); c.type = 'button'; c.addEventListener('click', moveHere); schedP.appendChild(c);
      }
    }
  }

  /* Profilo: scelta dei giorni */
  function buildScheduleCard() {
    var prof = document.querySelector('.view[data-view="profilo"]');
    var card = el('section', 'card'); card.id = 'sched-card';
    card.innerHTML = '<h2>Giorni di allenamento</h2><p class="hintline">Scegli i giorni in cui di solito ti alleni: in quei giorni l’app passa da sola a ON. Se un giorno salti, nel Diario tocca «Sposta l’allenamento a domani».</p><div class="dayrow" id="sched-days" style="margin-top:10px"></div>';
    var anchor = prof.querySelector('section.card:nth-of-type(3)');
    var cards = prof.querySelectorAll('section.card');
    prof.insertBefore(card, cards[2] || null);
  }
  function renderScheduleCard() {
    var box = $('sched-days'); if (!box) return;
    var cur = schedDays();
    box.textContent = '';
    DAY_ORDER.forEach(function (n) {
      var b = el('button', 'sbtn' + (cur.indexOf(n) >= 0 ? ' on' : ''), DAYN[n]); b.type = 'button';
      b.setAttribute('aria-pressed', cur.indexOf(n) >= 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        var c = schedDays().slice(), i = c.indexOf(n);
        if (i >= 0) c.splice(i, 1); else c.push(n);
        setScheduleDays(c.sort());
      });
      box.appendChild(b);
    });
  }

  /* ================= 2. Pasti salvati, preferiti, copia ieri ================= */
  function mealCore(m) {
    var o = clone(m); delete o.id; delete o.date; delete o.createdAt; delete o.slot; return o;
  }
  function addMealsTo(items, date, slot) {
    var base = Date.now(), jobs = items.map(function (it, i) {
      var m = Object.assign({}, clone(it), { id: BT.newId(), date: date, slot: slot || it.slot || 'spuntino-1', createdAt: base + i });
      return BT.addMeal(m);
    });
    return Promise.all(jobs);
  }
  function copyYesterday() {
    var from = BT.addDays(state.date, -1), list = BT.dayMeals(from);
    if (!list.length) { BT.toast('Ieri non hai registrato nessun alimento.', 'err'); return; }
    var here = BT.dayMeals(state.date).length;
    function go() {
      var base = Date.now();
      Promise.all(list.map(function (m, i) {
        var n = clone(m); n.id = BT.newId(); n.date = state.date; n.createdAt = base + i; n.slot = BT.sectionOf(m);
        return BT.addMeal(n);
      })).then(function () { BT.toast('Copiati ' + list.length + ' alimenti di ieri.'); }).catch(function () { BT.toast('Non sono riuscito a copiare.', 'err'); });
    }
    if (here) {
      openModal('Copiare ieri?', function (c) {
        c.appendChild(el('p', null, 'In questo giorno ci sono già ' + here + ' alimenti. Aggiungo anche i ' + list.length + ' di ieri?'));
        var b = el('button', 'primary', 'Copia lo stesso'); b.type = 'button'; b.addEventListener('click', function () { closeModal(); go(); }); c.appendChild(b);
      });
    } else go();
  }
  function saveSection(slot) {
    var items = BT.dayMeals(state.date).filter(function (m) { return BT.sectionOf(m) === slot; });
    if (!items.length) return;
    openModal('Salva questo pasto', function (c) {
      var lab = el('label', null, 'Come lo chiami?'); var inp = el('input'); inp.type = 'text'; inp.maxLength = 40; inp.placeholder = 'Es. Colazione classica';
      lab.appendChild(inp); c.appendChild(lab);
      c.appendChild(el('p', 'hintline', items.length + ' alimenti · ' + BT.nf(BT.totalsOf(items).kcal) + ' kcal'));
      var b = el('button', 'primary', 'Salva'); b.type = 'button';
      b.addEventListener('click', function () {
        var name = inp.value.trim(); if (!name) { inp.focus(); return; }
        var list = state.templates.slice(); if (list.length >= 40) list.shift();
        list.push({ id: BT.newId(), name: name.slice(0, 40), items: items.map(mealCore) });
        closeModal(); save({ templates: list }).then(function () { BT.toast('Pasto salvato: ' + name); });
      });
      c.appendChild(b); setTimeout(function () { inp.focus(); }, 50);
    });
  }
  function useTemplates(slot) {
    openModal('Pasti salvati', function (c) {
      if (!state.templates.length) { c.appendChild(el('p', 'hintline', 'Non hai ancora pasti salvati. In ogni sezione del Diario tocca «Salva questo pasto».')); return; }
      var ul = el('ul', 'mlist');
      state.templates.forEach(function (t) {
        var li = el('li', 'mitem'); var left = el('div');
        var tot = BT.totalsOf(t.items);
        left.appendChild(el('div', 'mt', t.name)); left.appendChild(el('div', 'ms', t.items.length + ' alimenti · ' + BT.nf(tot.kcal) + ' kcal · P ' + BT.fmt1(tot.protein)));
        var ins = el('button', 'primary', 'Aggiungi'); ins.type = 'button'; ins.style.height = '40px';
        ins.addEventListener('click', function () { closeModal(); addMealsTo(t.items, state.date, slot).then(function () { BT.toast('Aggiunto: ' + t.name); }); });
        var del = el('button', 'sbtn', '✕'); del.type = 'button'; del.setAttribute('aria-label', 'Elimina ' + t.name);
        del.addEventListener('click', function () { save({ templates: state.templates.filter(function (x) { return x.id !== t.id; }) }); closeModal(); });
        var right = el('div'); right.style.cssText = 'display:flex;gap:6px;flex:none'; right.appendChild(ins); right.appendChild(del);
        li.appendChild(left); li.appendChild(right); ul.appendChild(li);
      });
      c.appendChild(ul);
    });
  }
  function toggleFav(m) {
    var k = BT.favKey(m), list = state.favs.slice(), i = -1;
    list.forEach(function (f, j) { if (BT.favKey(f) === k) i = j; });
    if (i >= 0) list.splice(i, 1); else { if (list.length >= 40) list.shift(); list.push(mealCore(m)); }
    save({ favs: list });
    BT.toast(i >= 0 ? 'Tolto dai preferiti.' : 'Aggiunto ai preferiti ★');
  }
  function decorateMeals() {
    var favKeys = {}; state.favs.forEach(function (f) { favKeys[BT.favKey(f)] = 1; });
    Array.prototype.forEach.call(document.querySelectorAll('#sections .star'), function (b) {
      var on = !!favKeys[b.getAttribute('data-fav')];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('#sections .msec'), function (card) {
      if (card.querySelector('.mtools')) return;
      var slot = card.getAttribute('data-slot');
      var tools = el('div', 'mtools');
      var has = card.querySelector('.meal');
      var u = el('button', 'linkbtn', 'Inserisci un pasto salvato'); u.type = 'button'; u.addEventListener('click', function () { useTemplates(slot); }); tools.appendChild(u);
      if (has) { var s = el('button', 'linkbtn', 'Salva questo pasto'); s.type = 'button'; s.addEventListener('click', function () { saveSection(slot); }); tools.appendChild(s); }
      (card.querySelector('.mbody') || card).appendChild(tools);
    });
  }
  function renderFavsInSheet() {
    var wrap = $('fav-wrap'); if (!wrap) return;
    wrap.hidden = !state.favs.length;
    var box = $('fav-list'); box.textContent = '';
    state.favs.slice().reverse().forEach(function (f) {
      var b = el('button', 'chip', '★ ' + f.name + (f.grams ? ' · ' + BT.fmt1(f.grams) + ' g' : '') + ' · ' + BT.nf(BT.kcalOf(f)) + ' kcal'); b.type = 'button';
      b.addEventListener('click', function () { BT.fillFormFromMeal(f); });
      box.appendChild(b);
    });
  }
  function buildQuick() {
    var tot = document.querySelector('section[aria-label="Totale del giorno"]');
    var card = el('section', 'card'); card.id = 'quick-card';
    card.innerHTML = '<div class="quick"><button class="secondary" type="button" id="q-copy">Copia ieri</button><button class="secondary" type="button" id="q-share">Immagine per Instagram</button></div>';
    tot.parentNode.insertBefore(card, tot.nextSibling);
    $('q-copy').addEventListener('click', copyYesterday);
    $('q-share').addEventListener('click', openShare);
    var rw = $('recent-wrap');
    var fw = el('div'); fw.id = 'fav-wrap'; fw.hidden = true;
    fw.innerHTML = '<h3 class="sub">Preferiti ★</h3><div class="recent" id="fav-list"></div>';
    rw.parentNode.insertBefore(fw, rw);
  }

  /* ================= 3. Acqua e integratori ================= */
  var DEFAULT_SUPPS = [
    { n: 'Creatina', dose: 5, c: 0, p: 0, f: 0 },
    { n: 'Proteine in polvere', dose: 30, c: 7, p: 77, f: 6 },
    { n: 'Omega 3', dose: 2, c: 0, p: 0, f: 100 },
    { n: 'Multivitaminico', dose: 1, c: 0, p: 0, f: 0 }
  ];
  function dayInfo(d) { var x = state.daily[d]; return { w: x && x.w > 0 ? x.w : 0, s: x && Array.isArray(x.s) ? x.s : [] }; }
  function setDay(d, info) {
    var daily = Object.assign({}, state.daily); daily[d] = { w: info.w, s: info.s };
    var keys = Object.keys(daily).sort(); while (keys.length > 150) delete daily[keys.shift()];
    save({ daily: daily });
  }
  function buildWater() {
    var card = el('section', 'card'); card.id = 'water-card';
    card.innerHTML = '<h2>Acqua</h2><div class="wrow"><span class="watercount" id="w-ml">0</span><span id="w-goal"></span></div><div class="bar" aria-hidden="true" style="margin-top:8px"><i id="w-fill"></i></div>' +
      '<div class="quick" style="margin-top:10px"><button class="secondary" type="button" data-w="-250">−250 ml</button><button class="secondary" type="button" data-w="250">+250 ml</button><button class="secondary" type="button" data-w="500">+500 ml</button></div>' +
      '<div class="pactions" style="margin-top:10px"><button class="linkbtn" type="button" id="w-edit" style="flex:none">Modifica obiettivo acqua</button></div>';
    var sec = $('sections'); sec.parentNode.insertBefore(card, sec);
    Array.prototype.forEach.call(card.querySelectorAll('[data-w]'), function (b) {
      b.addEventListener('click', function () {
        var i = dayInfo(state.date); i.w = Math.max(0, i.w + Number(b.getAttribute('data-w'))); setDay(state.date, i);
      });
    });
    $('w-edit').addEventListener('click', editWater);
    var sc = el('section', 'card'); sc.id = 'supp-card';
    sc.innerHTML = '<h2>Integratori</h2><p class="hintline">Tocca un integratore e scrivi i grammi reali: finisce nel Diario come un alimento e conta nelle calorie e nei macro.</p><div class="suppl" id="supps"></div>' +
      '<div class="pactions" style="margin-top:10px"><button class="linkbtn" type="button" id="s-edit" style="flex:none">Modifica l’elenco integratori</button></div>';
    sec.parentNode.insertBefore(sc, sec);
    $('s-edit').addEventListener('click', editSuppList);
  }
  function suppItems() {
    var raw = state.suppList;
    if (!Array.isArray(raw)) return DEFAULT_SUPPS.map(clone);
    return raw.map(function (x) {
      if (typeof x === 'string') return { n: x, dose: 5, c: 0, p: 0, f: 0 };
      return { n: String(x.n || '').slice(0, 30), dose: x.dose > 0 ? x.dose : 5, c: x.c || 0, p: x.p || 0, f: x.f || 0, slot: x.slot };
    }).filter(function (x) { return x.n; });
  }
  function suppGramsToday(n) {
    var g = 0; BT.dayMeals(state.date).forEach(function (m) { if (m.supp === n) g += m.grams || 0; });
    return g;
  }
  function renderWater() {
    if (!$('w-ml')) return;
    var i = dayInfo(state.date), goal = state.waterGoal || 3000;
    $('w-ml').textContent = i.w >= 1000 ? BT.fmt1(i.w / 1000) + ' L' : i.w + ' ml';
    $('w-goal').textContent = 'su ' + BT.fmt1(goal / 1000) + ' L';
    BT.setHeat($('w-fill'), goal ? i.w / goal : 0);
    var box = $('supps'); box.textContent = '';
    suppItems().forEach(function (it) {
      var g = suppGramsToday(it.n), on = g > 0;
      var b = el('button', 'sbtn' + (on ? ' on' : ''), (on ? '✓ ' : '') + it.n + (on ? ' · ' + BT.fmt1(g) + ' g' : '')); b.type = 'button';
      b.addEventListener('click', function () { logSupp(it); });
      box.appendChild(b);
    });
    var o = el('button', 'sbtn', '+ Altro'); o.type = 'button'; o.addEventListener('click', function () { logSupp({ n: '', dose: 5, c: 0, p: 0, f: 0, isNew: true }); });
    box.appendChild(o);
  }
  function logSupp(it) {
    openModal(it.n ? 'Aggiungi ' + it.n : 'Nuovo integratore', function (c) {
      var fld = function (label, val, mode) { var l = el('label', null, label); var i = el('input'); i.type = 'text'; i.inputMode = mode || 'decimal'; i.value = val; l.appendChild(i); c.appendChild(l); return i; };
      var nameI = it.n ? null : fld('Nome', '', 'text');
      var gI = fld('Quantità presa (grammi)', String(it.dose).replace('.', ','));
      var sl = el('label', null, 'In quale pasto?'); var sel = el('select');
      BT.SECTIONS.forEach(function (s) { var o = el('option', null, BT.slotLabel(s.key)); o.value = s.key; sel.appendChild(o); });
      sel.value = it.slot || (BT.modeOf(state.date) === 'on' ? 'post-allenamento' : 'colazione'); sl.appendChild(sel); c.appendChild(sl);
      c.appendChild(el('p', 'hintline', 'Valori ogni 100 g, come sull’etichetta (facoltativi: lascia 0 per la creatina e simili).'));
      var row = el('div', 'mgrid'); c.appendChild(row);
      function sub(label, val) { var l = el('label', null, label); var i = el('input'); i.type = 'text'; i.inputMode = 'decimal'; i.value = val ? String(val).replace('.', ',') : ''; i.placeholder = '0'; l.appendChild(i); row.appendChild(l); return i; }
      var cI = sub('Carboidrati (g)', it.c), pI = sub('Proteine (g)', it.p), fI = sub('Grassi (g)', it.f);
      var msg = el('p', 'msg'); msg.setAttribute('role', 'alert'); c.appendChild(msg);
      var b = el('button', 'primary', 'Aggiungi al diario'); b.type = 'button';
      b.addEventListener('click', function () {
        var name = (nameI ? nameI.value : it.n).trim().slice(0, 30), g = BT.num(gI.value);
        if (!name) { msg.textContent = 'Scrivi il nome.'; return; }
        if (!(g > 0)) { msg.textContent = 'Scrivi i grammi, ad esempio 5.'; return; }
        var C = BT.num(cI.value), P = BT.num(pI.value), F = BT.num(fI.value), k100 = BT.kcalFromMacros(C, P, F), x = g / 100;
        var meal = { id: BT.newId(), date: state.date, slot: sel.value, name: name, createdAt: Date.now(), supp: name, grams: Math.round(g * 10) / 10,
          per100: { carbs: C, protein: P, fat: F, kcal: k100 }, carbs: Math.round(C * x * 10) / 10, protein: Math.round(P * x * 10) / 10, fat: Math.round(F * x * 10) / 10, kcal: Math.round(k100 * x) };
        var list = suppItems(), found = false;
        list = list.map(function (x2) { if (x2.n === name) { found = true; return { n: name, dose: g, c: C, p: P, f: F, slot: sel.value }; } return x2; });
        if (!found && list.length < 14) list.push({ n: name, dose: g, c: C, p: P, f: F, slot: sel.value });
        closeModal();
        save({ suppList: list });
        BT.addMeal(meal).then(function () { BT.toast('Aggiunto: ' + name + ' ' + BT.fmt1(g) + ' g'); }).catch(function () { BT.toast('Non sono riuscito ad aggiungerlo.', 'err'); });
      });
      c.appendChild(b); setTimeout(function () { (nameI || gI).focus(); }, 50);
    });
  }
  function editWater() {
    openModal('Obiettivo acqua', function (c) {
      var l1 = el('label', null, 'Litri al giorno'); var g = el('input'); g.type = 'text'; g.inputMode = 'decimal'; g.value = String((state.waterGoal || 3000) / 1000).replace('.', ','); l1.appendChild(g); c.appendChild(l1);
      var b = el('button', 'primary', 'Salva'); b.type = 'button';
      b.addEventListener('click', function () { var l = BT.num(g.value); closeModal(); save({ waterGoal: l > 0 && l < 15 ? Math.round(l * 1000) : 0 }); });
      c.appendChild(b);
    });
  }
  function editSuppList() {
    openModal('Elenco integratori', function (c) {
      var l2 = el('label', null, 'Un integratore per riga'); var t = el('textarea'); t.rows = 6; t.value = suppItems().map(function (x) { return x.n; }).join('\n');
      t.style.cssText = 'width:100%;font:inherit;background:var(--raise);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px'; l2.appendChild(t); c.appendChild(l2);
      var b = el('button', 'primary', 'Salva'); b.type = 'button';
      b.addEventListener('click', function () {
        var old = suppItems(), names = t.value.split('\n').map(function (x) { return x.trim().slice(0, 30); }).filter(Boolean).slice(0, 14), seen = {};
        var list = [];
        names.forEach(function (n) { if (seen[n.toLowerCase()]) return; seen[n.toLowerCase()] = 1; var f = old.filter(function (o) { return o.n === n; })[0]; list.push(f || { n: n, dose: 5, c: 0, p: 0, f: 0 }); });
        closeModal(); save({ suppList: list });
      });
      c.appendChild(b);
    });
  }

  /* ================= 4. Allenamento ================= */
  var EXS = ['Panca piana', 'Panca inclinata', 'Croci ai cavi', 'Distensioni con manubri', 'Lento avanti', 'Alzate laterali', 'Squat', 'Leg press', 'Leg extension', 'Leg curl', 'Stacco da terra', 'Stacco rumeno', 'Trazioni', 'Lat machine', 'Rematore con bilanciere', 'Rematore con manubrio', 'Curl con bilanciere', 'Curl con manubri', 'Push-down ai cavi', 'French press', 'Dip alle parallele', 'Hip thrust', 'Calf in piedi'];
  var wkEl;
  function buildWorkoutView() {
    var prof = document.querySelector('.view[data-view="profilo"]');
    var v = el('div', 'view'); v.setAttribute('data-view', 'allenamento'); v.hidden = true;
    v.innerHTML = '<header class="vhead"><svg class="ic" aria-hidden="true" focusable="false"><use href="#i-barbell"/></svg><h1>Allenamento</h1></header>' +
      '<section class="card"><h2>Scheda del giorno</h2><p class="hintline" id="wk-date"></p><label for="wk-name">Nome dell’allenamento<input id="wk-name" type="text" maxlength="40" placeholder="Es. Petto e tricipiti" autocomplete="off"></label>' +
      '<div id="wk-body" style="display:flex;flex-direction:column;gap:12px;margin-top:12px"></div>' +
      '<form class="searchform" id="wk-add" autocomplete="off" style="margin-top:12px"><input id="wk-ex" type="text" list="wk-exlist" placeholder="Aggiungi esercizio" aria-label="Nome esercizio" maxlength="40"><button class="primary" type="submit">Aggiungi</button></form><datalist id="wk-exlist"></datalist>' +
      '<div class="pactions" style="margin-top:10px"><button class="secondary" type="button" id="wk-repeat">Ripeti l’ultimo allenamento</button><button class="secondary" type="button" id="wk-clear">Svuota il giorno</button></div></section>' +
      '<section class="card"><h2>Progressi</h2><label for="wk-sel">Esercizio<select id="wk-sel"></select></label><div class="chartwrap"><svg id="wk-chart" viewBox="0 0 360 190" role="img" aria-label="Andamento del carico"></svg></div><p class="hintline" id="wk-note"></p></section>' +
      '<section class="card"><h2>Record personali</h2><ul class="prl" id="wk-pr"></ul><p class="empty" id="wk-pr-empty">Registra le serie e qui vedrai il carico massimo e la stima del massimale (formula di Epley, indicativa).</p></section>' +
      '<section class="card"><h2>Ultimi allenamenti</h2><ul class="hist" id="wk-hist" style="margin-top:6px"></ul></section>';
    prof.parentNode.insertBefore(v, prof);
    wkEl = v;
    var pc = el('section', 'card'); pc.id = 'plan-card';
    pc.innerHTML = '<h2>Le mie schede</h2><p class="hintline" id="plan-hint"></p><label for="plan-sel" id="plan-pick" hidden>Scheda in uso<select id="plan-sel"></select></label><div id="plan-days" style="display:flex;flex-direction:column;gap:10px;margin-top:10px"></div><div class="pactions" id="plan-actions" style="margin-top:10px"><button class="secondary" type="button" id="plan-new">Nuova scheda</button><button class="secondary" type="button" id="plan-edit">Modifica</button></div><div style="margin-top:6px"><button class="linkbtn" type="button" id="plan-del">Elimina scheda</button></div>';
    v.insertBefore(pc, v.querySelectorAll('section.card')[1]);
    $('plan-sel').addEventListener('change', function () { setSel($('plan-sel').value); renderPlan(); });
    $('plan-new').addEventListener('click', function () { editPlan(null); });
    $('plan-edit').addEventListener('click', function () { var c = selPlan(); if (c) editPlan(c.id); });
    $('plan-del').addEventListener('click', deletePlan);
    $('wk-add').addEventListener('submit', function (e) {
      e.preventDefault(); var n = $('wk-ex').value.trim(); if (!n) return;
      var s = ensureSession(); s.ex.push({ n: n.slice(0, 40), sets: [] }); $('wk-ex').value = ''; commitWorkout(true);
    });
    $('wk-name').addEventListener('input', function () { var s = ensureSession(); s.name = $('wk-name').value.slice(0, 40); saveQuiet(); });
    $('wk-repeat').addEventListener('click', repeatLast);
    $('wk-clear').addEventListener('click', function () {
      var s = sessionOf(state.date); if (!s) return;
      save({ workouts: state.workouts.filter(function (x) { return x.date !== state.date; }) });
    });
    $('wk-sel').addEventListener('change', drawProgress);
    v.addEventListener('focusout', function () { setTimeout(renderWorkout, 250); });
    var dl = $('wk-exlist'); EXS.forEach(function (n) { var o = el('option'); o.value = n; dl.appendChild(o); });
    // Icona nella barra in basso
    var tab = el('button', 'tab'); tab.type = 'button'; tab.setAttribute('data-tab', 'allenamento');
    tab.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/></svg><span>Scheda</span>';
    tab.addEventListener('click', function () { BT.showView('allenamento'); });
    var prev = document.querySelector('.tab[data-tab="profilo"]'); prev.parentNode.insertBefore(tab, prev);
    if (BT.getView() === 'allenamento') BT.showView('allenamento');
  }
  function sessionOf(d) { for (var i = 0; i < state.workouts.length; i++) if (state.workouts[i].date === d) return state.workouts[i]; return null; }
  function ensureSession() {
    var s = sessionOf(state.date);
    if (!s) { s = { id: BT.newId(), date: state.date, name: '', ex: [] }; state.workouts = state.workouts.concat([s]); }
    return s;
  }
  function commitWorkout(rebuild) {
    // limita le sessioni salvate per non superare lo spazio del documento
    if (state.workouts.length > 400) {
      state.workouts = state.workouts.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(-400);
    }
    if (rebuild) save({ workouts: state.workouts }); else saveQuiet();
  }
  function lastTime(name, before) {
    var best = null;
    state.workouts.forEach(function (w) {
      if (w.date >= before) return;
      w.ex.forEach(function (e) { if (e.n.toLowerCase() === name.toLowerCase() && e.sets.length && (!best || w.date > best.date)) best = { date: w.date, sets: e.sets }; });
    });
    return best;
  }
  function repeatLast() {
    var prev = null;
    state.workouts.forEach(function (w) { if (w.date < state.date && w.ex.length && (!prev || w.date > prev.date)) prev = w; });
    if (!prev) { BT.toast('Non c’è un allenamento precedente.', 'err'); return; }
    var s = ensureSession();
    prev.ex.forEach(function (e) {
      var have = s.ex.some(function (x) { return x.n.toLowerCase() === e.n.toLowerCase(); });
      if (!have) s.ex.push({ n: e.n, sets: e.sets.map(function (x) { return { r: x.r, kg: x.kg }; }) });
    });
    if (!s.name) s.name = prev.name || '';
    commitWorkout(true);
  }
  /* ---- Schede di allenamento (piu' schede, ognuna con piu' giorni) ---- */
  var SELK = 'bt-plan-sel';
  function selId() { try { return localStorage.getItem(SELK) || ''; } catch (e) { return ''; } }
  function setSel(id) { try { localStorage.setItem(SELK, id); } catch (e) {} }
  function selPlan() {
    var id = selId(), list = state.plans;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || null;
  }
  function normPlanObj(w) {
    var days = (w.days || []).map(function (d, i) {
      return { n: String(d.n || ('Giorno ' + (i + 1))).trim().slice(0, 40), ex: (d.ex || []).map(function (e) {
        var n = String(e.n || '').trim().slice(0, 40); if (!n) return null;
        return { n: n, sets: Math.max(1, Math.min(20, Math.round(BT.num(e.sets)) || 3)), reps: Math.max(0, Math.min(100, Math.round(BT.num(e.reps)) || 0)), kg: BT.num(e.kg) || 0 };
      }).filter(Boolean).slice(0, 25) };
    }).filter(function (d) { return d.ex.length; }).slice(0, 10);
    return { id: w.id || BT.newId(), name: String(w.name || 'Scheda').trim().slice(0, 40) || 'Scheda', days: days };
  }
  function addPlan(name, days) {
    var p = normPlanObj({ name: name, days: days });
    if (!p.days.length) return Promise.resolve();
    var list = state.plans.filter(function (x) { return x.id !== p.id; }).concat([p]).slice(-20);
    setSel(p.id);
    return save({ plans: list });
  }
  function useDay(day) {
    var s = ensureSession();
    if (!s.name) s.name = day.n || '';
    day.ex.forEach(function (e) {
      var have = s.ex.some(function (x) { return x.n.toLowerCase() === e.n.toLowerCase(); });
      if (have) return;
      var lt = lastTime(e.n, state.date), kg = (lt && lt.sets[0] && lt.sets[0].kg) || e.kg || 0, n = Math.max(1, Math.min(12, e.sets || 3));
      var sets = []; for (var i = 0; i < n; i++) sets.push({ r: e.reps || 0, kg: kg });
      s.ex.push({ n: e.n, sets: sets });
    });
    commitWorkout(true);
    BT.toast('Allenamento preparato: ' + (day.n || 'giorno'));
  }
  function migratePlan() {
    if (state.plan.length && !state.plans.length) {
      var p = normPlanObj({ name: 'La mia scheda', days: state.plan });
      state.plans = [p]; state.plan = [];
      save({ plans: [p], plan: [] });
    }
  }
  function renderPlan() {
    var days = $('plan-days'); if (!days) return;
    migratePlan();
    days.textContent = '';
    var sel = $('plan-sel'), cur = selPlan();
    sel.textContent = '';
    state.plans.forEach(function (p) { var o = el('option', null, p.name + ' (' + p.days.length + (p.days.length === 1 ? ' giorno' : ' giorni') + ')'); o.value = p.id; sel.appendChild(o); });
    $('plan-pick').hidden = !state.plans.length;
    $('plan-edit').hidden = !cur; $('plan-del').hidden = !cur;
    if (cur) sel.value = cur.id;
    $('plan-hint').textContent = cur ? 'Scegli la scheda e tocca «Usa oggi» sul giorno che fai: serie e ripetizioni sono già pronte, tu scrivi i chili.' :
      'Non hai ancora schede. Fotografa quella del tuo trainer, oppure creane una a mano con «Nuova scheda». Puoi tenerne quante vuoi.';
    if (!cur) return;
    cur.days.forEach(function (d, i) {
      var row = el('div', 'mitem'); var left = el('div');
      left.appendChild(el('div', 'mt', d.n || ('Giorno ' + (i + 1))));
      left.appendChild(el('div', 'ms', d.ex.length + (d.ex.length === 1 ? ' esercizio' : ' esercizi') + ': ' + d.ex.slice(0, 3).map(function (e) { return e.n; }).join(', ') + (d.ex.length > 3 ? '…' : '')));
      var b = el('button', 'primary', 'Usa oggi'); b.type = 'button'; b.style.height = '40px'; b.style.flex = 'none';
      b.addEventListener('click', function () { useDay(d); });
      row.appendChild(left); row.appendChild(b); days.appendChild(row);
    });
  }
  function editPlan(id) {
    var base = id ? state.plans.filter(function (p) { return p.id === id; })[0] : null;
    var work = base ? clone(base) : { id: BT.newId(), name: 'Nuova scheda', days: [{ n: 'Giorno A', ex: [{ n: '', sets: 3, reps: 10, kg: 0 }] }] };
    openModal(base ? 'Modifica scheda' : 'Nuova scheda', function (c) {
      var holder = el('div'); holder.style.cssText = 'display:flex;flex-direction:column;gap:12px'; c.appendChild(holder);
      var msg = el('p', 'msg'); msg.setAttribute('role', 'alert'); c.appendChild(msg);
      function tin(val, ph, mode, w) { var i = el('input'); i.type = 'text'; i.inputMode = mode || 'text'; i.value = (val === null || val === undefined || (mode === 'decimal' && !(val > 0))) ? '' : String(val).replace('.', ','); i.placeholder = ph || ''; if (w) i.style.minWidth = '0'; return i; }
      function draw() {
        holder.textContent = '';
        var l = el('label', null, 'Nome della scheda'); var ni = tin(work.name, 'Es. Scheda massa 4 giorni'); ni.maxLength = 40; ni.addEventListener('input', function () { work.name = ni.value; }); l.appendChild(ni); holder.appendChild(l);
        work.days.forEach(function (d, di) {
          var box = el('div', 'ex');
          var h = el('div', 'exh'); var dn = tin(d.n, 'Nome del giorno'); dn.maxLength = 40; dn.style.flex = '1'; dn.addEventListener('input', function () { d.n = dn.value; });
          var dd = el('button', 'sbtn', 'Elimina giorno'); dd.type = 'button'; dd.addEventListener('click', function () { work.days.splice(di, 1); draw(); });
          h.appendChild(dn); h.appendChild(dd); box.appendChild(h);
          d.ex.forEach(function (e, ei) {
            var er = el('div'); er.style.cssText = 'display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:8px';
            var en = tin(e.n, 'Esercizio'); en.maxLength = 40; en.setAttribute('list', 'wk-exlist'); en.addEventListener('input', function () { e.n = en.value; });
            var g = el('div'); g.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 44px;gap:8px;align-items:end';
            function num3(lbl, key) { var w = el('label', null, lbl); w.style.fontSize = '12px'; var i = tin(e[key] > 0 ? e[key] : '', '0', 'decimal', true); i.addEventListener('input', function () { e[key] = BT.num(i.value); }); w.appendChild(i); return w; }
            g.appendChild(num3('Serie', 'sets')); g.appendChild(num3('Ripetiz.', 'reps')); g.appendChild(num3('Kg', 'kg'));
            var rm = el('button', 'rm', '✕'); rm.type = 'button'; rm.setAttribute('aria-label', 'Elimina esercizio'); rm.style.cssText = 'border:0;background:none;color:var(--muted);font-size:20px;min-height:44px';
            rm.addEventListener('click', function () { d.ex.splice(ei, 1); draw(); });
            g.appendChild(rm); er.appendChild(en); er.appendChild(g); box.appendChild(er);
          });
          var ae = el('button', 'secondary', '+ Esercizio'); ae.type = 'button'; ae.addEventListener('click', function () { d.ex.push({ n: '', sets: 3, reps: 10, kg: 0 }); draw(); });
          box.appendChild(ae); holder.appendChild(box);
        });
        var ad = el('button', 'secondary', '+ Giorno'); ad.type = 'button'; ad.addEventListener('click', function () { work.days.push({ n: 'Giorno ' + String.fromCharCode(65 + work.days.length), ex: [{ n: '', sets: 3, reps: 10, kg: 0 }] }); draw(); });
        holder.appendChild(ad);
      }
      draw();
      var ok = el('button', 'primary', 'Salva la scheda'); ok.type = 'button';
      ok.addEventListener('click', function () {
        var p = normPlanObj(work);
        if (!p.days.length) { msg.textContent = 'Scrivi almeno un esercizio.'; return; }
        var list = state.plans.filter(function (x) { return x.id !== p.id; });
        if (base) { var idx = state.plans.indexOf(base); list = state.plans.slice(); list[idx] = p; } else list.push(p);
        setSel(p.id); closeModal(); save({ plans: list.slice(-20) }).then(function () { BT.toast('Scheda salvata: ' + p.name); });
      });
      c.appendChild(ok);
    });
  }
  var delArm = null;
  function deletePlan() {
    var cur = selPlan(); if (!cur) return;
    var b = $('plan-del');
    if (!b.getAttribute('data-armed')) { b.setAttribute('data-armed', '1'); b.textContent = 'Tocca ancora per eliminare'; clearTimeout(delArm); delArm = setTimeout(function () { b.removeAttribute('data-armed'); b.textContent = 'Elimina scheda'; }, 3000); return; }
    clearTimeout(delArm); b.removeAttribute('data-armed'); b.textContent = 'Elimina scheda';
    save({ plans: state.plans.filter(function (p) { return p.id !== cur.id; }) });
  }
  function e1rm(kg, r) { return r <= 1 ? kg : kg * (1 + r / 30); }
  function renderWorkout() {
    if (!wkEl || wkEl.hidden) return;
    var act = document.activeElement;
    if (act && wkEl.contains(act) && (act.tagName === 'INPUT' || act.tagName === 'TEXTAREA') && act.id !== 'wk-ex') return; // non ridisegnare mentre scrivi
    $('wk-date').textContent = BT.fmtLong(state.date) + (BT.modeOf(state.date) === 'on' ? ' · giorno ON' : ' · giorno OFF');
    var s = sessionOf(state.date);
    if (document.activeElement !== $('wk-name')) $('wk-name').value = s ? s.name || '' : '';
    var body = $('wk-body'); body.textContent = '';
    if (!s || !s.ex.length) body.appendChild(el('p', 'empty', 'Nessun esercizio per questo giorno. Aggiungine uno qui sotto o ripeti l’ultimo allenamento.'));
    else s.ex.forEach(function (ex, xi) {
      var box = el('div', 'ex');
      var h = el('div', 'exh'); h.appendChild(el('b', null, ex.n));
      var rmx = el('button', 'sbtn', 'Elimina'); rmx.type = 'button'; rmx.addEventListener('click', function () { var cs = sessionOf(state.date); cs.ex.splice(xi, 1); commitWorkout(true); });
      h.appendChild(rmx); box.appendChild(h);
      var lt = lastTime(ex.n, state.date);
      if (lt) box.appendChild(el('div', 'exlast', 'Ultima volta (' + BT.fmtLong(lt.date).replace(/^\S+ /, '') + '): ' + lt.sets.map(function (x) { return x.r + '×' + BT.fmt1(x.kg); }).join(', ') + ' kg'));
      if (ex.sets.length) { var lab = el('div', 'setlab'); lab.innerHTML = '<span>#</span><span>Ripetizioni</span><span>Kg</span><span></span>'; box.appendChild(lab); }
      ex.sets.forEach(function (set, si) {
        var row = el('div', 'setrow'); row.appendChild(el('span', 'sn', String(si + 1)));
        function field(key, val) {
          var i = el('input'); i.type = 'text'; i.inputMode = 'decimal'; i.value = val ? String(val).replace('.', ',') : ''; i.setAttribute('aria-label', (key === 'r' ? 'Ripetizioni' : 'Chili') + ' serie ' + (si + 1) + ' ' + ex.n);
          i.addEventListener('input', function () { var cs = sessionOf(state.date); if (!cs || !cs.ex[xi] || !cs.ex[xi].sets[si]) return; cs.ex[xi].sets[si][key] = BT.num(i.value); commitWorkout(false); });
          return i;
        }
        row.appendChild(field('r', set.r)); row.appendChild(field('kg', set.kg));
        var rm = el('button', 'rm', '✕'); rm.type = 'button'; rm.setAttribute('aria-label', 'Elimina serie ' + (si + 1));
        rm.addEventListener('click', function () { var cs = sessionOf(state.date); cs.ex[xi].sets.splice(si, 1); commitWorkout(true); });
        row.appendChild(rm); box.appendChild(row);
      });
      var add = el('button', 'secondary', '+ Serie'); add.type = 'button';
      add.addEventListener('click', function () {
        var cs = sessionOf(state.date), e = cs.ex[xi], last = e.sets[e.sets.length - 1], lt2 = lastTime(e.n, state.date);
        var ref = last || (lt2 && lt2.sets[0]) || { r: 0, kg: 0 };
        e.sets.push({ r: ref.r, kg: ref.kg }); commitWorkout(true);
      });
      box.appendChild(add); body.appendChild(box);
    });
    renderPR(); renderHist();
  }
  function allExNames() {
    var seen = {}, out = [];
    state.workouts.forEach(function (w) { w.ex.forEach(function (e) { if (e.sets.some(function (x) { return x.kg > 0 && x.r > 0; }) && !seen[e.n.toLowerCase()]) { seen[e.n.toLowerCase()] = 1; out.push(e.n); } }); });
    return out.sort();
  }
  function renderPR() {
    var names = allExNames(), ul = $('wk-pr'); ul.textContent = '';
    $('wk-pr-empty').hidden = names.length > 0;
    names.forEach(function (n) {
      var maxkg = 0, maxe = 0;
      state.workouts.forEach(function (w) { w.ex.forEach(function (e) { if (e.n.toLowerCase() !== n.toLowerCase()) return; e.sets.forEach(function (x) { if (x.kg > 0 && x.r > 0) { maxkg = Math.max(maxkg, x.kg); maxe = Math.max(maxe, e1rm(x.kg, x.r)); } }); }); });
      var li = el('li'); li.appendChild(el('b', null, n)); li.appendChild(el('span', 'pr', BT.fmt1(maxkg) + ' kg · 1RM stimato ' + BT.fmt1(maxe) + ' kg')); ul.appendChild(li);
    });
    var sel = $('wk-sel'), cur = sel.value; sel.textContent = '';
    names.forEach(function (n) { var o = el('option', null, n); o.value = n; sel.appendChild(o); });
    if (cur && names.indexOf(cur) >= 0) sel.value = cur;
    $('wk-sel').parentNode.parentNode.hidden = !names.length;
    drawProgress();
  }
  function drawProgress() {
    var svg = $('wk-chart'), n = $('wk-sel').value; if (!n) { svg.textContent = ''; return; }
    var pts = [];
    state.workouts.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).forEach(function (w) {
      var best = 0; w.ex.forEach(function (e) { if (e.n.toLowerCase() === n.toLowerCase()) e.sets.forEach(function (x) { if (x.kg > 0 && x.r > 0) best = Math.max(best, e1rm(x.kg, x.r)); }); });
      if (best) pts.push({ d: w.date, v: best });
    });
    pts = pts.slice(-20);
    var W = 360, H = 190, L = 36, R = 10, T = 14, B = 28;
    if (pts.length < 2) { svg.innerHTML = '<text x="180" y="95" text-anchor="middle" fill="var(--muted)" font-size="13">Servono almeno due allenamenti</text>'; $('wk-note').textContent = ''; return; }
    var min = Math.min.apply(null, pts.map(function (p) { return p.v; })), max = Math.max.apply(null, pts.map(function (p) { return p.v; }));
    var pad = Math.max(1, (max - min) * 0.2); min -= pad; max += pad;
    function X(i) { return L + (W - L - R) * i / (pts.length - 1); } function Y(v) { return T + (H - T - B) * (1 - (v - min) / (max - min)); }
    var g = '';
    for (var k = 0; k < 3; k++) { var v = min + (max - min) * k / 2; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"/><text x="' + (L - 4) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="var(--muted)" font-size="10">' + Math.round(v) + '</text>'; }
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
    g += '<path d="' + d + '" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linejoin="round"/>';
    pts.forEach(function (p, i) { g += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="3.5" fill="var(--gold)"/>'; });
    g += '<text x="' + L + '" y="' + (H - 8) + '" fill="var(--muted)" font-size="10">' + esc(pts[0].d.slice(5).split('-').reverse().join('/')) + '</text><text x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end" fill="var(--muted)" font-size="10">' + esc(pts[pts.length - 1].d.slice(5).split('-').reverse().join('/')) + '</text>';
    svg.innerHTML = g;
    var diff = pts[pts.length - 1].v - pts[0].v;
    $('wk-note').textContent = 'Massimale stimato (kg): ' + (diff >= 0 ? '+' : '') + BT.fmt1(diff) + ' da ' + BT.fmt1(pts[0].v) + ' a ' + BT.fmt1(pts[pts.length - 1].v) + '. Stima indicativa.';
  }
  function renderHist() {
    var ul = $('wk-hist'); ul.textContent = '';
    var list = state.workouts.filter(function (w) { return w.ex.length; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 10);
    if (!list.length) { ul.appendChild(el('li', null, 'Ancora nessun allenamento registrato.')); return; }
    list.forEach(function (w) {
      var sets = 0, vol = 0; w.ex.forEach(function (e) { e.sets.forEach(function (x) { sets++; vol += (x.r || 0) * (x.kg || 0); }); });
      var li = el('li'); li.style.gridTemplateColumns = '76px 1fr auto';
      li.appendChild(el('span', 'hd', w.date.slice(8) + '/' + w.date.slice(5, 7)));
      li.appendChild(el('span', null, (w.name || 'Allenamento') + ' · ' + w.ex.length + (w.ex.length === 1 ? ' esercizio' : ' esercizi')));
      li.appendChild(el('span', 'hk', sets + ' serie · ' + BT.nf(vol) + ' kg'));
      li.addEventListener('click', function () { state.date = w.date; BT.emit('render'); renderWorkout(); }); li.style.cursor = 'pointer';
      ul.appendChild(li);
    });
  }

  /* ================= 5. Misure corporee ================= */
  var MKEYS = [['waist', 'Vita'], ['neck', 'Collo'], ['hip', 'Fianchi'], ['chest', 'Petto'], ['arm', 'Braccio'], ['thigh', 'Coscia']];
  function buildMeasures() {
    var v = document.querySelector('.view[data-view="progressi"]');
    var card = el('section', 'card'); card.id = 'ms-card';
    card.innerHTML = '<h2>Misure corporee</h2><p class="hintline">Misura in centimetri, al mattino e sempre nello stesso punto. Vita e collo bastano per stimare il grasso corporeo.</p>' +
      '<form class="acct-form" id="ms-form" autocomplete="off"><div class="mgrid">' + MKEYS.map(function (k) { return '<label for="ms-' + k[0] + '">' + k[1] + ' (cm)<input id="ms-' + k[0] + '" type="text" inputmode="decimal" placeholder="0"></label>'; }).join('') + '</div><button class="primary" type="submit">Salva le misure di oggi</button></form>' +
      '<p class="msg" id="ms-msg" role="status"></p><div class="sil-stats" id="ms-bf" style="margin-top:10px"></div><div class="pactions" style="margin-top:8px"><button class="secondary" type="button" id="ms-use" hidden>Usa questo grasso nella sagoma</button></div><ul class="plain" id="ms-list"></ul>';
    var cards = v.querySelectorAll('section.card');
    v.insertBefore(card, cards[2] || null);
    $('ms-form').addEventListener('submit', function (e) {
      e.preventDefault(); var rec = { date: BT.todayStr() }, any = false;
      MKEYS.forEach(function (k) { var x = BT.num($('ms-' + k[0]).value); if (x > 0 && x < 300) { rec[k[0]] = x; any = true; } });
      if (!any) { $('ms-msg').textContent = 'Scrivi almeno una misura.'; return; }
      var list = state.measures.filter(function (m) { return m.date !== rec.date; }); var old = state.measures.filter(function (m) { return m.date === rec.date; })[0];
      list.push(Object.assign({}, old || {}, rec)); list.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      save({ measures: list.slice(-200) }).then(function () { $('ms-msg').textContent = 'Misure salvate.'; });
    });
    $('ms-use').addEventListener('click', function () {
      var bf = navyBf(lastMeasure()); var p = state.profile; if (!bf || !p) return;
      var np = Object.assign({}, p, { bf: Math.round(bf * 10) / 10 });
      save({ profile: np }).then(function () { BT.toast('Grasso corporeo aggiornato: ' + BT.fmt1(np.bf) + '%'); });
    });
  }
  function lastMeasure() { var o = {}; state.measures.forEach(function (m) { MKEYS.forEach(function (k) { if (m[k[0]] > 0) o[k[0]] = m[k[0]]; }); }); return o; }
  function navyBf(m) {
    var p = state.profile; if (!p || !p.height || !(m.waist > 0) || !(m.neck > 0)) return null;
    var r;
    if (p.sex === 'f') { if (!(m.hip > 0) || m.waist + m.hip <= m.neck) return null; r = 163.205 * Math.log10(m.waist + m.hip - m.neck) - 97.684 * Math.log10(p.height) - 78.387; }
    else { if (m.waist <= m.neck) return null; r = 86.010 * Math.log10(m.waist - m.neck) - 70.041 * Math.log10(p.height) + 36.76; }
    return r >= 3 && r <= 60 ? r : null;
  }
  function renderMeasures() {
    if (!$('ms-list')) return;
    var last = lastMeasure(), bf = navyBf(last), box = $('ms-bf'); box.textContent = '';
    if (bf) {
      var d = el('div', 'stat'); d.innerHTML = '<div class="sl">Grasso stimato (metodo Navy)</div><div class="sv">' + BT.fmt1(bf) + '%</div><div class="sd">Indicativo, margine di errore di alcuni punti.</div>'; box.appendChild(d);
    }
    $('ms-use').hidden = !(bf && state.profile);
    var ul = $('ms-list'); ul.textContent = '';
    var arr = state.measures.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    arr.forEach(function (m, i) {
      var prev = state.measures.filter(function (x) { return x.date < m.date; }).pop();
      var li = el('li'); var parts = [];
      MKEYS.forEach(function (k) { if (m[k[0]] > 0) { var df = prev && prev[k[0]] > 0 ? m[k[0]] - prev[k[0]] : null; parts.push(k[1] + ' ' + BT.fmt1(m[k[0]]) + (df ? ' (' + (df > 0 ? '+' : '') + BT.fmt1(df) + ')' : '')); } });
      li.appendChild(el('span', null, m.date.slice(8) + '/' + m.date.slice(5, 7))); var s = el('span', null, parts.join(' · ')); s.style.cssText = 'text-align:right;overflow-wrap:anywhere'; li.appendChild(s); ul.appendChild(li);
    });
  }

  /* ================= 6. Immagine per Instagram ================= */
  var CW = 1080, CH = 1350;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function heat(ctx, x, y, w, h, f) {
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#26262b'; ctx.fill();
    var fw = Math.max(h, w * Math.min(1, f)); if (f <= 0) return;
    var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3aa0ff'); g.addColorStop(0.5, '#f2b632'); g.addColorStop(1, '#e5342e');
    ctx.save(); rr(ctx, x, y, fw, h, h / 2); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function drawCard(kind) {
    var cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; var c = cv.getContext('2d');
    var bg = c.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#1a0b0c'); bg.addColorStop(1, '#0b0b0d'); c.fillStyle = bg; c.fillRect(0, 0, CW, CH);
    c.fillStyle = '#e5342e'; c.fillRect(0, 0, CW, 14); c.fillStyle = '#d4a63a'; c.fillRect(0, 14, CW, 4);
    var F = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    c.textBaseline = 'alphabetic'; c.fillStyle = '#d4a63a'; c.font = '800 34px ' + F; c.fillText('BELLOTTRACK FOOD FIT', 70, 100);
    var d = state.date, mode = BT.modeOf(d), tg = BT.targetsFor(d), tk = BT.targetKcal(d);
    if (kind === 'day') {
      var tot = BT.totalsOf(BT.dayMeals(d));
      c.fillStyle = '#f3f3f5'; c.font = '700 44px ' + F; c.fillText(BT.fmtLong(d).replace(/^./, function (x) { return x.toUpperCase(); }), 70, 175);
      rr(c, CW - 250, 130, 180, 60, 30); c.fillStyle = mode === 'on' ? '#e5342e' : '#2a2a30'; c.fill();
      c.fillStyle = '#fff'; c.font = '800 30px ' + F; c.textAlign = 'center'; c.fillText(mode === 'on' ? 'GIORNO ON' : 'GIORNO OFF', CW - 160, 171); c.textAlign = 'left';
      c.fillStyle = '#fff'; c.font = '800 190px ' + F; c.fillText(BT.nf(tot.kcal), 70, 420);
      var w = c.measureText(BT.nf(tot.kcal)).width; c.fillStyle = '#9a9aa3'; c.font = '600 44px ' + F; c.fillText('/ ' + BT.nf(tk) + ' kcal', 90 + w, 420);
      heat(c, 70, 460, CW - 140, 34, tk ? tot.kcal / tk : 0);
      var rows = [['Carboidrati', tot.carbs, tg.carbs], ['Proteine', tot.protein, tg.protein], ['Grassi', tot.fat, tg.fat]], y = 590;
      rows.forEach(function (r) {
        c.fillStyle = '#f3f3f5'; c.font = '700 42px ' + F; c.fillText(r[0], 70, y);
        c.textAlign = 'right'; c.fillStyle = '#d4a63a'; c.fillText(BT.fmt1(r[1]) + ' / ' + BT.fmt1(r[2]) + ' g', CW - 70, y); c.textAlign = 'left';
        heat(c, 70, y + 24, CW - 140, 26, r[2] ? r[1] / r[2] : 0); y += 140;
      });
      var inf = dayInfo(d), goal = state.waterGoal || 3000, s = sessionOf(d), extra = [];
      extra.push('Acqua ' + BT.fmt1(inf.w / 1000) + ' / ' + BT.fmt1(goal / 1000) + ' L');
      if (s && s.ex.length) extra.push((s.name || 'Allenamento') + ' · ' + s.ex.length + (s.ex.length === 1 ? ' esercizio' : ' esercizi'));
      c.fillStyle = '#9a9aa3'; c.font = '600 38px ' + F; extra.forEach(function (t, i) { c.fillText(t, 70, 1040 + i * 56); });
    } else {
      c.fillStyle = '#f3f3f5'; c.font = '700 44px ' + F; c.fillText('La mia settimana', 70, 175);
      var today = BT.todayStr(), days = [], on = 0, hit = 0, sumP = 0, cnt = 0;
      for (var i = 6; i >= 0; i--) { var dd = BT.addDays(today, -i), t = BT.totalsOf(BT.dayMeals(dd)), k = BT.targetKcal(dd); days.push({ d: dd, t: t, k: k, m: BT.modeOf(dd) }); if (BT.modeOf(dd) === 'on') on++; if (t.kcal > 0) { cnt++; sumP += t.protein; if (Math.abs(t.kcal - k) <= k * 0.1) hit++; } }
      var bx = 70, bw = 110, gap = 30, base = 800, mh = 420;
      days.forEach(function (x, i) {
        var f = x.k ? Math.min(1.2, x.t.kcal / x.k) : 0, h = mh * f / 1.2, px = bx + i * (bw + gap);
        rr(c, px, base - mh, bw, mh, 14); c.fillStyle = '#1d1d22'; c.fill();
        if (h > 0) { var g = c.createLinearGradient(0, base, 0, base - mh); g.addColorStop(0, '#3aa0ff'); g.addColorStop(0.5, '#f2b632'); g.addColorStop(1, '#e5342e'); c.save(); rr(c, px, base - mh, bw, mh, 14); c.clip(); c.fillStyle = g; c.fillRect(px, base - h, bw, h); c.restore(); }
        c.fillStyle = x.m === 'on' ? '#e5342e' : '#9a9aa3'; c.font = '800 32px ' + F; c.textAlign = 'center'; c.fillText(DAYN[BT.toDate(x.d).getDay()], px + bw / 2, base + 50); c.font = '600 26px ' + F; c.fillStyle = '#9a9aa3'; c.fillText(x.m === 'on' ? 'ON' : 'OFF', px + bw / 2, base + 86); c.textAlign = 'left';
      });
      c.fillStyle = '#f3f3f5'; c.font = '700 44px ' + F;
      [['Allenamenti (ON)', String(on)], ['Giorni nell’obiettivo calorie', hit + ' su ' + cnt], ['Proteine medie', cnt ? BT.nf(sumP / cnt) + ' g' : '–']].forEach(function (r, i) {
        c.fillStyle = '#f3f3f5'; c.font = '600 40px ' + F; c.fillText(r[0], 70, 1010 + i * 80); c.textAlign = 'right'; c.fillStyle = '#d4a63a'; c.font = '800 44px ' + F; c.fillText(r[1], CW - 70, 1010 + i * 80); c.textAlign = 'left';
      });
    }
    c.fillStyle = '#6d6d76'; c.font = '600 28px ' + F; c.fillText('Stime indicative, non è un consiglio medico.', 70, CH - 60);
    return cv;
  }
  function openShare() {
    var kind = 'day', cv = null;
    openModal('Immagine per Instagram', function (c) {
      var tabs = el('div', 'quick'); var bd = el('button', 'sbtn on', 'Giornata'), bw = el('button', 'sbtn', 'Settimana'); bd.type = bw.type = 'button'; tabs.appendChild(bd); tabs.appendChild(bw); c.appendChild(tabs);
      var holder = el('div'); c.appendChild(holder);
      var acts = el('div', 'pactions'); var sh = el('button', 'primary', 'Condividi'); sh.type = 'button'; var dl = el('button', 'secondary', 'Salva immagine'); dl.type = 'button'; acts.appendChild(sh); acts.appendChild(dl); c.appendChild(acts);
      function paint() { cv = drawCard(kind); cv.className = 'igprev'; holder.textContent = ''; holder.appendChild(cv); bd.classList.toggle('on', kind === 'day'); bw.classList.toggle('on', kind === 'week'); }
      bd.addEventListener('click', function () { kind = 'day'; paint(); }); bw.addEventListener('click', function () { kind = 'week'; paint(); });
      function blobOf(cb) { cv.toBlob(function (b) { cb(b); }, 'image/png'); }
      function download() { blobOf(function (b) { if (!b) return; var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'bellottrack-' + kind + '-' + state.date + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }); }
      dl.addEventListener('click', download);
      sh.addEventListener('click', function () {
        blobOf(function (b) {
          if (!b) return;
          var f = new File([b], 'bellottrack.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Bellottrack food fit' }).catch(function () {}); }
          else { download(); BT.toast('Immagine salvata: aprila dalla galleria e pubblicala su Instagram.'); }
        });
      });
      paint();
    });
  }


  /* ================= 7. Blocco con impronta o volto ================= */
  var LK = 'bt-lock', lockEl = null, hiddenAt = 0, busy = false;
  function lockId() { try { return localStorage.getItem(LK); } catch (e) { return null; } }
  function b2s(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function s2b(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function canBio() { return !!(window.PublicKeyCredential && navigator.credentials && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) ? PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(function () { return false; }) : Promise.resolve(false); }
  function verify() {
    var id = lockId(); if (!id) return Promise.resolve(true);
    return navigator.credentials.get({ publicKey: { challenge: rnd(32), allowCredentials: [{ id: s2b(id), type: 'public-key' }], userVerification: 'required', timeout: 60000 } }).then(function () { return true; });
  }
  function hideLock() { document.documentElement.removeAttribute('data-locked'); if (lockEl) lockEl.hidden = true; }
  function showLock() {
    if (!lockId()) return;
    document.documentElement.setAttribute('data-locked', '1');
    if (!lockEl) {
      lockEl = el('div'); lockEl.id = 'lock'; lockEl.setAttribute('role', 'dialog'); lockEl.setAttribute('aria-modal', 'true'); lockEl.setAttribute('aria-label', 'App bloccata');
      lockEl.innerHTML = '<div class="lockbox"><svg class="ic" aria-hidden="true" focusable="false" style="width:72px;height:32px;color:var(--gold)"><use href="#i-barbell"/></svg><h1>Bellottrack <span class="fit">food fit</span></h1><p>App bloccata</p><button class="primary" id="lock-go" type="button">Sblocca con impronta o volto</button><p class="msg" id="lock-msg" role="alert"></p><button class="linkbtn" id="lock-help" type="button">Non riesco a sbloccare</button></div>';
      document.body.appendChild(lockEl);
      $('lock-go').addEventListener('click', tryUnlock);
      $('lock-help').addEventListener('click', function () {
        $('lock-msg').textContent = 'Se il telefono non riconosce più la tua impronta, sblocca prima il telefono con il suo codice. Per togliere il blocco serve poterlo verificare: se non è possibile, svuota i dati del sito dalle impostazioni di Chrome (i dati con account restano al sicuro online).';
      });
    }
    lockEl.hidden = false; $('lock-msg').textContent = '';
    setTimeout(tryUnlock, 150);
  }
  function tryUnlock() {
    if (busy) return; busy = true;
    verify().then(function () { busy = false; hideLock(); }).catch(function () { busy = false; var m = $('lock-msg'); if (m) m.textContent = 'Non riconosciuto. Tocca il pulsante per riprovare.'; });
  }
  function buildLockCard() {
    var prof = document.querySelector('.view[data-view="profilo"]');
    var card = el('section', 'card'); card.id = 'lock-card';
    card.innerHTML = '<h2>Blocco con impronta o volto</h2><p class="hintline">All’apertura l’app chiede la tua impronta o il tuo volto, come il blocco del telefono. È un blocco di riservatezza contro chi prende il telefono per curiosare: la vera protezione resta il codice del telefono.</p><div class="pactions" style="margin-top:10px"><button class="secondary" type="button" id="lock-on"></button></div><p class="msg" id="lock-card-msg" role="status"></p>';
    var cards = prof.querySelectorAll('section.card');
    prof.insertBefore(card, cards[2] || null);
    $('lock-on').addEventListener('click', toggleLock);
    renderLockCard();
    canBio().then(function (ok) { if (!ok && !lockId()) { $('lock-on').disabled = true; $('lock-card-msg').textContent = 'Su questo telefono non trovo un’impronta o un volto: attiva prima il blocco schermo con biometria nelle impostazioni di Android.'; } });
  }
  function renderLockCard() { var b = $('lock-on'); if (b) b.textContent = lockId() ? 'Disattiva il blocco' : 'Attiva il blocco'; }
  function toggleLock() {
    var msg = $('lock-card-msg'); msg.textContent = '';
    if (lockId()) {
      verify().then(function () { try { localStorage.removeItem(LK); } catch (e) {} renderLockCard(); msg.textContent = 'Blocco disattivato.'; }).catch(function () { msg.textContent = 'Verifica non riuscita: il blocco resta attivo.'; });
      return;
    }
    canBio().then(function (ok) {
      if (!ok) { msg.textContent = 'Il telefono non ha impronta, volto o blocco schermo attivi.'; return; }
      return navigator.credentials.create({ publicKey: {
        challenge: rnd(32), rp: { name: 'Bellottrack food fit' }, user: { id: rnd(16), name: 'bellottrack', displayName: 'Bellottrack' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, timeout: 60000, attestation: 'none'
      } }).then(function (cred) {
        try { localStorage.setItem(LK, b2s(cred.rawId)); } catch (e) { msg.textContent = 'Non riesco a salvare il blocco su questo telefono.'; return; }
        renderLockCard(); msg.textContent = 'Blocco attivo: alla prossima apertura ti chiederò impronta o volto.';
      });
    }).catch(function () { msg.textContent = 'Attivazione annullata o non riuscita.'; });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) hiddenAt = Date.now();
    else if (lockId() && hiddenAt && Date.now() - hiddenAt > 30000) showLock();
  });

  /* ---------- Avvio ---------- */
  function init() {
    buildSchedNote(); buildQuick(); buildWater(); buildScheduleCard(); buildWorkoutView(); buildMeasures(); buildLockCard(); showLock();
    BT.on('fav', toggleFav);
    BT.on('view', function () { renderWorkout(); });
    BT.on('render', function () {
      renderSched(); renderScheduleCard(); decorateMeals(); renderFavsInSheet(); renderWater(); renderWorkout(); renderPlan(); renderMeasures();
    });
    BT.emit('render');
  }
  init();
  window.BTM = { drawCard: drawCard, navyBf: navyBf, openShare: openShare, addPlan: addPlan, plansCount: function () { return state.plans.length; } };
})();

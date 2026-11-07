/* Bellottrack food fit: foto con l'AI (etichetta nutrizionale e scheda di allenamento). */
(function () {
  'use strict';
  var BT = window.BT;
  if (!BT) return;
  var $ = BT.$;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ---------- Foto: scelta, riduzione e invio ---------- */
  function pickFile(capture) {
    return new Promise(function (resolve) {
      var i = document.createElement('input');
      i.type = 'file'; i.accept = 'image/*'; if (capture) i.setAttribute('capture', 'environment');
      i.style.cssText = 'position:fixed;left:-9999px;opacity:0';
      i.addEventListener('change', function () { var f = i.files && i.files[0]; i.remove(); resolve(f || null); });
      i.addEventListener('cancel', function () { i.remove(); resolve(null); });
      document.body.appendChild(i); i.click();
    });
  }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
          var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var data = c.toDataURL('image/jpeg', 0.82).split(',')[1];
          URL.revokeObjectURL(url); resolve({ mimeType: 'image/jpeg', data: data });
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('img')); };
      img.src = url;
    });
  }
  function parseJSON(txt) {
    txt = String(txt || '');
    var a = txt.indexOf('{'), b = txt.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(txt.slice(a, b + 1)); } catch (e) { return null; }
  }
  function errText(err) {
    var raw = err && (err.message || err.code) ? String(err.message || err.code) : '';
    if (raw === 'no-ai') return 'Per usare l’AI accedi dal Profilo con il tuo account.';
    if (raw === 'img') return 'Non riesco ad aprire questa foto: prova con un’altra.';
    if (navigator.onLine === false) return 'Nessuna connessione: riprova.';
    if (/quota|429|rate.?limit|resource.?exhausted/i.test(raw)) return 'Hai raggiunto il limite gratuito dell’AI: riprova tra qualche minuto.';
    if (/app ?check|\[401\]/i.test(raw)) return 'App Check sta bloccando le richieste.';
    if (/403|permission|not been used|disabled|not enabled|api.?key|forbidden/i.test(raw)) return 'Il servizio AI non risulta abilitato nel progetto Firebase.';
    return 'L’AI non è riuscita a leggere la foto. Riprova con una foto più nitida e ben illuminata.';
  }
  var busy = false;
  /* Chiede all'AI di leggere la foto; restituisce l'oggetto JSON (o null). */
  function readPhoto(prompt, file, status) {
    if (busy) return Promise.resolve(null);
    if (!window.BTX || !BTX.aiReady()) { status('Per usare l’AI accedi dal Profilo con il tuo account.', true); return Promise.resolve(null); }
    busy = true; status('Sto leggendo la foto…');
    return shrink(file).then(function (img) { return BTX.ai(prompt, img); }).then(function (txt) {
      busy = false; var o = parseJSON(txt);
      if (!o) { status('Non ho capito la foto. Riprova con una foto più nitida.', true); return null; }
      return o;
    }).catch(function (e) { busy = false; if (window.console) console.error(e); status(errText(e), true); return null; });
  }
  function nz(v, max) {
    if (v === null || v === undefined || v === '') return null;
    var x = parseFloat(String(v).replace(',', '.'));
    return isFinite(x) && x >= 0 && x <= max ? x : null;
  }

  /* ---------- 1. Etichetta nutrizionale ---------- */
  var LABEL_PROMPT = 'Sei un lettore di etichette nutrizionali di prodotti alimentari e integratori italiani. Leggi la foto e copia SOLO i numeri che vedi scritti: non indovinare e non calcolare nulla. ' +
    'Se un valore non è leggibile o non c\'è, scrivi null. Rispondi solo con un oggetto JSON con queste chiavi: ' +
    '{"nome": nome del prodotto o null, "marca": marca o null, "base": "per100" se i valori sono per 100 g o 100 ml, "porzione" se sono per porzione, ' +
    '"porzione_g": grammi della porzione se indicati o null, "kcal": numero, "grassi": g, "saturi": g di cui acidi grassi saturi, "carboidrati": g, "zuccheri": g di cui zuccheri, ' +
    '"fibre": g, "proteine": g, "sale": g, "codice_a_barre": cifre del codice a barre se visibili oppure null}. ' +
    'Se ci sono due colonne (per 100 g e per porzione) usa quella per 100 g. Usa i kcal, non i kJ. Se è indicato solo il sodio, metti null in "sale". Numeri con il punto decimale.';
  var photoMsg = null;
  function say(t, err) { if (photoMsg) { photoMsg.textContent = t; photoMsg.style.color = err ? 'var(--warn)' : 'var(--muted)'; } }
  function setVal(id, v) { $(id).value = v === null || v === undefined ? '' : String(Math.round(v * 100) / 100).replace('.', ','); $(id).dispatchEvent(new Event('input', { bubbles: true })); }
  function fillLabel(o) {
    var per100 = String(o.base || '').toLowerCase().indexOf('100') >= 0 || String(o.base || '') === 'per100';
    var kcal = nz(o.kcal, 1000), fat = nz(o.grassi, 100), sat = nz(o.saturi, 100), carb = nz(o.carboidrati, 100), sug = nz(o.zuccheri, 100), fib = nz(o.fibre, 100), pro = nz(o.proteine, 100), salt = nz(o.sale, 100);
    var gr = nz(o.porzione_g, 2000);
    var name = [o.nome, o.marca && o.nome ? '(' + o.marca + ')' : o.marca].filter(Boolean).join(' ').trim().slice(0, 120);
    if (name) $('f-name').value = name;
    $('f-basis').value = per100 ? 'per100' : 'total'; $('f-basis').dispatchEvent(new Event('change', { bubbles: true }));
    if (!per100 && gr) setVal('f-grams', gr); else if (per100) { /* i grammi li scegli tu */ }
    setVal('f-carbs', carb); setVal('f-protein', pro); setVal('f-fat', fat); setVal('f-kcal', kcal);
    setVal('f-sugar', sug); setVal('f-sat', sat); setVal('f-fiber', fib); setVal('f-salt', salt);
    if (sug || sat || fib || salt) $('f-more').open = true;
    var code = String(o.codice_a_barre || '').replace(/[^0-9A-Za-z.\-_\/+]/g, '').toUpperCase();
    if (code.length >= 3 && code.length <= 40) $('f-code').value = code;
    var warn = [];
    if (per100 && carb !== null && pro !== null && fat !== null && carb + pro + fat > 105) warn.push('i valori per 100 g sommano più di 100: controlla');
    if (per100 && !$('f-grams').value) warn.push('scrivi quanti grammi hai mangiato nel campo Peso');
    if (carb === null && pro === null && fat === null) { say('Non vedo i valori nutrizionali nella foto. Inquadra bene la tabella.', true); return; }
    say('Valori letti dalla foto' + (per100 ? ' (per 100 g)' : ' (per porzione)') + '. Controllali con la confezione' + (warn.length ? ' — ' + warn.join('; ') : '') + ' e poi tocca Aggiungi.', !!warn.length);
    $('f-name').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function labelFrom(capture) {
    pickFile(capture).then(function (f) {
      if (!f) return;
      return readPhoto(LABEL_PROMPT, f, say).then(function (o) { if (o) fillLabel(o); });
    });
  }
  function buildLabelUI() {
    var anchor = document.querySelector('.code-row');
    if (!anchor) return;
    var box = el('div'); box.id = 'label-photo'; box.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:8px';
    box.innerHTML = '<div class="sub" style="font-weight:700">Foto dell’etichetta (AI)</div><p class="hintline" style="margin:0">Fotografa la tabella nutrizionale: l’AI scrive i valori nei campi giusti. Poi li controlli tu.</p>' +
      '<div class="pactions"><button class="secondary" type="button" id="lab-cam">Scatta foto</button><button class="secondary" type="button" id="lab-gal">Dalla galleria</button></div>';
    anchor.parentNode.insertBefore(box, anchor.nextSibling);
    photoMsg = el('p', 'msg'); photoMsg.setAttribute('role', 'status'); photoMsg.style.color = 'var(--muted)'; box.appendChild(photoMsg);
    $('lab-cam').addEventListener('click', function () { labelFrom(true); });
    $('lab-gal').addEventListener('click', function () { labelFrom(false); });
  }

  /* ---------- 2. Scheda di allenamento ---------- */
  var PLAN_PROMPT = 'Sei un lettore di schede di allenamento di palestra scritte a mano o stampate in italiano. Leggi la foto e trascrivi la scheda così com\'è, senza inventare esercizi. ' +
    'Rispondi solo con un oggetto JSON: {"giorni": [{"nome": "nome del giorno o gruppo muscolare, es. Giorno A - Petto e tricipiti", "esercizi": [{"nome": "nome dell\'esercizio", "serie": numero di serie, "ripetizioni": numero di ripetizioni (se c\'è un intervallo come 8-10 metti il primo numero), "kg": chili se indicati altrimenti null}]}]}. ' +
    'Se la scheda ha un solo giorno, metti un solo elemento in "giorni". Ignora i tempi di recupero e le note. Se un numero non è leggibile metti null.';
  var planMsg = null;
  function psay(t, err) { if (planMsg) { planMsg.textContent = t; planMsg.style.color = err ? 'var(--warn)' : 'var(--muted)'; } }
  function normPlan(o) {
    var days = Array.isArray(o && o.giorni) ? o.giorni : [];
    var out = [];
    days.slice(0, 7).forEach(function (d, i) {
      var ex = (Array.isArray(d.esercizi) ? d.esercizi : []).slice(0, 20).map(function (e) {
        var n = String(e && e.nome || '').trim().slice(0, 40); if (!n) return null;
        var sets = Math.round(nz(e.serie, 20) || 3), reps = Math.round(nz(e.ripetizioni, 100) || 0), kg = nz(e.kg, 1000) || 0;
        return { n: n, sets: Math.max(1, sets), reps: reps, kg: kg };
      }).filter(Boolean);
      if (ex.length) out.push({ n: String(d.nome || ('Giorno ' + (i + 1))).trim().slice(0, 40), ex: ex });
    });
    return out;
  }
  function confirmPlan(plan) {
    var back = el('div', 'mback'); back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true');
    var card = el('div', 'mcard'); back.appendChild(card);
    card.appendChild(el('h2', null, 'Ho letto questa scheda'));
    card.appendChild(el('p', 'hintline', 'Controlla che sia giusta. Dopo il salvataggio puoi modificarla con «Modifica».'));
    var lab = el('label', null, 'Nome della scheda'); var ni = el('input'); ni.type = 'text'; ni.maxLength = 40; ni.value = 'Scheda ' + (window.BTM.plansCount() + 1); lab.appendChild(ni); card.appendChild(lab);
    plan.forEach(function (d) {
      var b = el('div', 'ex'); b.appendChild(el('b', null, d.n));
      d.ex.forEach(function (e) { b.appendChild(el('div', 'exlast', e.n + ' · ' + e.sets + ' × ' + (e.reps || '?') + (e.kg ? ' · ' + e.kg + ' kg' : ''))); });
      card.appendChild(b);
    });
    var row = el('div', 'pactions');
    var ok = el('button', 'primary', 'Salva la scheda'); ok.type = 'button';
    var no = el('button', 'secondary', 'Annulla'); no.type = 'button';
    function close() { back.remove(); document.body.classList.remove('noscroll'); }
    ok.addEventListener('click', function () { var nm = ni.value.trim() || 'Scheda'; close(); window.BTM.addPlan(nm, plan.map(function (d) { return { n: d.n, ex: d.ex }; })).then(function () { BT.toast('Scheda salvata: ' + nm); }); });
    no.addEventListener('click', close);
    row.appendChild(ok); row.appendChild(no); card.appendChild(row);
    document.body.appendChild(back); document.body.classList.add('noscroll'); ni.focus();
  }
  function planFrom(capture) {
    pickFile(capture).then(function (f) {
      if (!f) return;
      return readPhoto(PLAN_PROMPT, f, psay).then(function (o) {
        if (!o) return;
        var plan = normPlan(o);
        if (!plan.length) { psay('Non ho trovato esercizi nella foto. Inquadra bene tutta la scheda.', true); return; }
        psay(''); confirmPlan(plan);
      });
    });
  }
  function buildPlanUI() {
    var act = $('plan-actions'); if (!act) return;
    var cam = el('button', 'secondary', 'Foto della scheda'); cam.type = 'button';
    var gal = el('button', 'secondary', 'Carica dalla galleria'); gal.type = 'button';
    cam.addEventListener('click', function () { planFrom(true); }); gal.addEventListener('click', function () { planFrom(false); });
    act.insertBefore(gal, act.firstChild); act.insertBefore(cam, act.firstChild);
    planMsg = el('p', 'msg'); planMsg.setAttribute('role', 'status'); planMsg.style.color = 'var(--muted)';
    act.parentNode.appendChild(planMsg);
  }

  buildLabelUI(); buildPlanUI();
  window.BTV = { fillLabel: fillLabel, normPlan: normPlan };
})();

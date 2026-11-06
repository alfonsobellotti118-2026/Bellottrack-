/* Collegamento a Firebase: account, salvataggio online dei dati e AI (Gemini). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore, initializeFirestore, persistentLocalCache, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const clean = (o) => JSON.parse(JSON.stringify(o));

export async function initCloud(cfg) {
  const app = initializeApp(cfg.firebase);
  // App Check (reCAPTCHA Enterprise): serve se la protezione e' attiva sul servizio AI.
  if (cfg.appCheckKey) {
    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js');
    initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(cfg.appCheckKey), isTokenAutoRefreshEnabled: true });
  }
  const auth = getAuth(app);
  let db;
  try { db = initializeFirestore(app, { localCache: persistentLocalCache() }); } catch (e) { db = getFirestore(app); }
  let ai = null;
  const models = {};

  // Le scritture vanno in coda anche senza rete: non aspettiamo la conferma del server.
  const fire = (p) => { p.catch((e) => console.error(e)); return Promise.resolve(); };

  return {
    onAuth: (cb) => onAuthStateChanged(auth, cb),
    signUp: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    signOut: () => signOut(auth),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),

    store(uid) {
      const meals = collection(db, 'users', uid, 'meals');
      const sdoc = doc(db, 'users', uid);
      return {
        kind: 'cloud',
        watch(onMeals, onSettings, onErr) {
          const u1 = onSnapshot(meals, (s) => onMeals(s.docs.map((d) => d.data()), s.metadata.hasPendingWrites), onErr);
          const u2 = onSnapshot(sdoc, (s) => { const d = s.exists() ? s.data() : {}; onSettings(d.settings || null, s.exists()); }, onErr);
          return () => { u1(); u2(); };
        },
        add: (m) => fire(setDoc(doc(meals, m.id), clean(m))),
        update: (id, patch) => fire(updateDoc(doc(meals, id), clean(patch))),
        remove: (id) => fire(deleteDoc(doc(meals, id))),
        saveSettings: (st) => fire(setDoc(sdoc, { settings: clean(st), updatedAt: Date.now() }))
      };
    },

    async ask(prompt, image) {
      const { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js');
      if (!ai) ai = getAI(app, { backend: new GoogleAIBackend() });
      // Se il modello e' sovraccarico, prova il successivo dell'elenco.
      const names = [cfg.aiModel || 'gemini-3.5-flash-lite'].concat(cfg.aiFallback || ['gemini-3.5-flash', 'gemini-3.8-flash']);
      let last;
      for (const name of names) {
        try {
          if (!models[name]) {
            // Meno "ragionamento" = risposte molto piu' veloci.
            const generationConfig = { responseMimeType: 'application/json', maxOutputTokens: 4096 };
            if (ThinkingLevel && !/lite/.test(name)) {
              const lv = /3\.(5|6)-flash$/.test(name) ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW;
              if (lv) generationConfig.thinkingConfig = { thinkingLevel: lv };
            }
            models[name] = getGenerativeModel(ai, { model: name, generationConfig });
          }
          const r = await models[name].generateContent(image ? [prompt, { inlineData: { mimeType: image.mimeType, data: image.data } }] : prompt);
          return r.response.text();
        } catch (e) {
          last = e;
          const m = String((e && e.message) || e);
          if (!/\[(500|503|429)\]|high demand|overloaded|unavailable|quota/i.test(m)) throw e;
        }
      }
      throw last;
    },

    async deleteAccount(password) {
      const u = auth.currentUser;
      if (!u) throw new Error('no-user');
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
      const col = collection(db, 'users', u.uid, 'meals');
      for (;;) {
        const snap = await getDocs(col);
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.slice(0, 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
      await deleteDoc(doc(db, 'users', u.uid));
      await deleteUser(u);
    }
  };
}

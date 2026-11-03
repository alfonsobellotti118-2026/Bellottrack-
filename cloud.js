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
  const auth = getAuth(app);
  let db;
  try { db = initializeFirestore(app, { localCache: persistentLocalCache() }); } catch (e) { db = getFirestore(app); }
  let model = null;

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

    async ask(prompt) {
      if (!model) {
        const { getAI, getGenerativeModel, GoogleAIBackend } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js');
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        model = getGenerativeModel(ai, {
          model: cfg.aiModel || 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 900 }
        });
      }
      const r = await model.generateContent(prompt);
      return r.response.text();
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

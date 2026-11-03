const firebaseConfig = {
  apiKey: "AIzaSyBuNpMHLUSgUpXTqT8pi2PuEEQvz-fcNjs",
  authDomain: "bellotrack-food-fit.firebaseapp.com",
  projectId: "bellotrack-food-fit",
  storageBucket: "bellotrack-food-fit.firebasestorage.app",
  messagingSenderId: "1028193743073",
  appId: "1:1028193743073:web:982df8f055dadb647307a0"
};

const ai = getAI(app);
const model = getGenerativeModel(ai, { model: "gemini-3.8-flash" });

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyB0KPWRHzSfBq8H0y1FFTcvy7tpOhBVNrk",
  authDomain: "ie-workshop-app.firebaseapp.com",
  projectId: "ie-workshop-app",
  storageBucket: "ie-workshop-app.firebasestorage.app",
  messagingSenderId: "426271699176",
  appId: "1:426271699176:web:472e25737ad7bb888b195d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

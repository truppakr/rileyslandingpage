import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMSLB_0NDupSuCHfpoUbuvXauJFDmqeuI",
  authDomain: "rileysapp-d5b38.firebaseapp.com",
  projectId: "rileysapp-d5b38",
  storageBucket: "rileysapp-d5b38.firebasestorage.app",
  messagingSenderId: "443066091019",
  appId: "1:443066091019:web:77cf222ed450f1428d290e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
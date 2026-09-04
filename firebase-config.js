import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyA5QJTDI-WmxUmdFnn2k3u2RAmMShNohio",
    authDomain: "matrix-5ed0d.firebaseapp.com",
    projectId: "matrix-5ed0d",
    storageBucket: "matrix-5ed0d.firebasestorage.app",
    messagingSenderId: "941641200633",
    appId: "1:941641200633:web:b3aa99682f5a7a6de30328",
    measurementId: "G-5NRGV3Q0GS"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Firebase services
const db = getFirestore(app);
const auth = getAuth(app);


// Export services
export {
    app,
    db,
    auth
};

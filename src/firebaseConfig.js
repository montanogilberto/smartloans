import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/messaging';

const firebaseConfig = {
    apiKey: "YAIzaSyA-1LfUfN57zUBQBM-VaVyOU-UhLIaFEhw",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "https://crud-912ca.firebaseio.com/",
    projectId: "crud-912ca",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "1:308306398120:android:2f110b981724fb81afeb9d",
  };
  

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const database = firebase.database();
export const messaging = firebase.messaging();

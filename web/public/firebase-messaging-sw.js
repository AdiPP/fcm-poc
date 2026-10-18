// Background delivery (D4). Vite copies public/ verbatim, so this runs at root scope.
// Firebase requires the config inline here — copy the same six values from web/.env into initializeApp below.
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD1vcFTBc6sfBJhomX85xJIPj8nPJU2di8',
  authDomain: 'fcm-poc-1bd69.firebaseapp.com',
  projectId: 'fcm-poc-1bd69',
  storageBucket: 'fcm-poc-1bd69.firebasestorage.app',
  messagingSenderId: '408771906490',
  appId: '1:408771906490:web:0c04f0beb2da2c6a65ab83',
});

const messaging = firebase.messaging();

// While no tab is focused, FCM wakes this worker; the page's onMessage does NOT fire.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Push', { body, tag: 'fcm-poc' });
});

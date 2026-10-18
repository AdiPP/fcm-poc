import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const $ = (id) => document.getElementById(id);

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
const messaging = getMessaging(app);

$('permission').textContent = Notification.permission;

// FCM needs the service worker (served at root scope) before getToken.
const swReady = navigator.serviceWorker
  .register('/firebase-messaging-sw.js')
  .then((reg) => {
    $('scope').textContent = reg.scope; // must be the site root, e.g. http://localhost:5173/
    return reg;
  })
  .catch((e) => {
    $('scope').textContent = `FAILED: ${e.message}`;
    throw e;
  });

// Foreground: onMessage fires while the tab is focused — render in-app, no OS notification.
onMessage(messaging, (payload) => {
  toast(`(foreground) ${payload.notification?.title ?? ''}: ${payload.notification?.body ?? ''}`);
});

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

let registeredToken = null;

// Task 3.3/3.4: permission on click only (browsers throttle load-time prompts), token + registration.
$('enable').onclick = async () => {
  $('permission').textContent = await Notification.requestPermission();
  if (Notification.permission !== 'granted') {
    $('token').textContent = 'Notifications are disabled — allow them in Site settings, then reload.';
    return;
  }
  try {
    await swReady;
    const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
    registeredToken = token;
    $('token').textContent = token ?? 'no token (check Firebase config / VAPID key in web/.env)';
    if (!token) return;
    const res = await fetch('/register-token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    toast(`registered with sender: ${res.status} ${(await res.json()).ok ? 'ok' : ''}`);
  } catch (e) {
    $('token').textContent = `error: ${e.message}`;
  }
};

$('subscribe').onclick = async () => {
  const token = $('target').value || registeredToken;
  const topic = $('topic').value.trim();
  if (!token || !topic) return toast('need a token and a topic');
  const res = await fetch('/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Dev-Secret': import.meta.env.VITE_DEV_SECRET },
    body: JSON.stringify({ token, topic }),
  });
  toast(`subscribe: ${res.status} ${JSON.stringify(await res.json())}`);
};

// Task 3.6: the page calls the sender directly (proxied by Vite, see vite.config.js).
$('send').onclick = async () => {
  const body = {
    title: $('title').value,
    body: $('body').value,
  };
  if ($('target').value.trim()) body.token = $('target').value.trim();
  else if ($('sendTopic').value.trim()) body.topic = $('sendTopic').value.trim();
  // neither -> sender broadcasts to every registered token

  const res = await fetch('/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Dev-Secret': import.meta.env.VITE_DEV_SECRET },
    body: JSON.stringify(body),
  });
  $('sendResult').textContent = `${res.status} ${JSON.stringify(await res.json())}`;
};

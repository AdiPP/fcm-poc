export async function registerServiceWorker() {
  const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  return reg;
}

export default registerServiceWorker;

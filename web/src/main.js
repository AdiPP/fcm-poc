import { onMessage } from 'firebase/messaging';
import { initFirebase } from './config/firebase.js';
import { registerServiceWorker } from './services/swRegistration.js';
import { getPermission } from './models/permissionModel.js';
import { getToken, setToken } from './models/tokenModel.js';
import * as view from './views/domView.js';
import { createNotificationController } from './controllers/notificationController.js';
import { createSubscriptionController } from './controllers/subscriptionController.js';
import { createSendController } from './controllers/sendController.js';

const { messaging } = initFirebase();

view.showPermission(getPermission());

// FCM needs the service worker (served at root scope) before getToken.
const swReady = registerServiceWorker()
  .then((reg) => {
    view.showScope(reg.scope); // must be the site root, e.g. http://localhost:5173/
    return reg;
  })
  .catch((e) => {
    view.showScope(`FAILED: ${e.message}`);
    throw e;
  });

// Foreground: onMessage fires while the tab is focused — render in-app, no OS notification.
onMessage(messaging, (payload) => {
  view.showToast(`(foreground) ${payload.notification?.title ?? ''}: ${payload.notification?.body ?? ''}`);
});

const notificationController = createNotificationController({ messaging, swReady });
const subscriptionController = createSubscriptionController();
const sendController = createSendController();

view.refs.enable.onclick = () => notificationController.enable();
view.refs.subscribe.onclick = () => subscriptionController.subscribe();
view.refs.send.onclick = () => sendController.send();

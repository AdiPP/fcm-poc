import { getToken as getFcmToken } from 'firebase/messaging';
import { requestPermission } from '../models/permissionModel.js';
import { setToken } from '../models/tokenModel.js';
import { registerToken as registerTokenApi } from '../models/apiClient.js';
import * as view from '../views/domView.js';

export function createNotificationController({ messaging, swReady }) {
  return {
    async enable() {
      const permission = await requestPermission();
      view.showPermission(permission);
      if (permission !== 'granted') {
        view.showToken('Notifications are disabled — allow them in Site settings, then reload.');
        return;
      }
      try {
        await swReady;
        const token = await getFcmToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
        setToken(token);
        view.showToken(token ?? 'no token (check Firebase config / VAPID key in web/.env)');
        if (!token) return;
        const res = await registerTokenApi(token);
        view.showToast(`registered with sender: ${res.status} ${(await res.json()).ok ? 'ok' : ''}`);
      } catch (e) {
        view.showToken(`error: ${e.message}`);
      }
    },
  };
}

export default createNotificationController;

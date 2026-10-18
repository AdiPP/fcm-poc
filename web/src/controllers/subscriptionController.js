import { getToken } from '../models/tokenModel.js';
import { subscribe as subscribeApi } from '../models/apiClient.js';
import * as view from '../views/domView.js';

export function createSubscriptionController() {
  return {
    async subscribe() {
      const token = view.refs.target.value || getToken();
      const topic = view.refs.topic.value.trim();
      if (!token || !topic) return view.showToast('need a token and a topic');
      const res = await subscribeApi(token, topic);
      view.showToast(`subscribe: ${res.status} ${JSON.stringify(await res.json())}`);
    },
  };
}

export default createSubscriptionController;

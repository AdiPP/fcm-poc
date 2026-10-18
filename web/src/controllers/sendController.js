import { send as sendApi } from '../models/apiClient.js';
import * as view from '../views/domView.js';

export function createSendController() {
  return {
    async send() {
      const body = {
        title: view.refs.title.value,
        body: view.refs.body.value,
      };
      if (view.refs.target.value.trim()) body.token = view.refs.target.value.trim();
      else if (view.refs.sendTopic.value.trim()) body.topic = view.refs.sendTopic.value.trim();
      // neither -> sender broadcasts to every registered token

      const res = await sendApi(body);
      view.showSendResult(`${res.status} ${JSON.stringify(await res.json())}`);
    },
  };
}

export default createSendController;

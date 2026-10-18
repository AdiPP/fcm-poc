import { getToken } from '../models/tokenModel.js';
import { subscribe as subscribeApi, send as sendApi } from '../models/apiClient.js';
import * as view from '../views/domView.js';

const DEFAULT_TOPIC = 'poc-test';

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// One self-contained controller per targeting mode. `mode` is
// 'token' | 'topic' | 'broadcast' and maps to the matching card's refs
// (e.g. `tokenTitle`/`tokenBody`/`tokenResult`).
export function createSendCardController(mode) {
  return {
    async run() {
      const title = view.refs[`${mode}Title`].value;
      const body = view.refs[`${mode}Body`].value;

      if (mode === 'broadcast') {
        const res = await sendApi({ title, body });
        view.setCardResult(mode, `broadcast: ${res.status} ${JSON.stringify(await readJson(res))}`);
        return;
      }

      const token = getToken();
      if (!token) {
        view.setCardResult(mode, 'no registered token — click "Enable notifications" first');
        return;
      }

      if (mode === 'topic') {
        const topic = view.refs.topicName.value.trim() || DEFAULT_TOPIC;
        const sub = await subscribeApi(token, topic);
        const subLine = `subscribe ${topic}: ${sub.status} ${JSON.stringify(await readJson(sub))}`;
        const res = await sendApi({ topic, title, body });
        view.setCardResult(mode, `${subLine}\nsend ${topic}: ${res.status} ${JSON.stringify(await readJson(res))}`);
        return;
      }

      const res = await sendApi({ token, title, body });
      view.setCardResult(mode, `token: ${res.status} ${JSON.stringify(await readJson(res))}`);
    },
  };
}

export default createSendCardController;

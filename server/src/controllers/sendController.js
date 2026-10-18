import { messageId, broadcastResult, sendError } from '../views/responses.js';

export function createSendController(service) {
  return {
    async send(req, res) {
      const { token, topic, title, body } = req.body ?? {};
      if (!title || !body) {
        const r = sendError(400, 'title and body required');
        return res.status(r.status).json(r.body);
      }

      // No explicit target -> broadcast to all registered tokens.
      if (!token && !topic) {
        const result = await service.sendBroadcast({ title, body });
        const r = broadcastResult(result.sent, result.failed);
        return res.status(r.status).json(r.body);
      }

      try {
        let id;
        if (topic) {
          id = await service.sendToTopic({ topic, title, body });
        } else {
          id = await service.sendToToken({ token, title, body });
        }
        const r = messageId(id);
        res.status(r.status).json(r.body);
      } catch (e) {
        const r = sendError(e.status ?? 502, e.message);
        res.status(r.status).json(r.body);
      }
    },
  };
}

export default createSendController;

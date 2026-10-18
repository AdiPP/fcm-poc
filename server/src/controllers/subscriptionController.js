import { ok, sendError } from '../views/responses.js';

export function createSubscriptionController(service) {
  return {
    async subscribe(req, res) {
      const { token, topic } = req.body ?? {};
      if (!token || !topic) {
        const r = sendError(400, 'token and topic required');
        return res.status(r.status).json(r.body);
      }
      try {
        await service.subscribeToTopic(token, topic);
        const r = ok();
        res.status(r.status).json(r.body);
      } catch (e) {
        const r = sendError(502, e.code ?? e.message);
        res.status(r.status).json(r.body);
      }
    },
  };
}

export default createSubscriptionController;

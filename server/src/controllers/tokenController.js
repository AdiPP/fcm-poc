import { ok, tokenCount, sendError } from '../views/responses.js';

export function createTokenController(service) {
  return {
    registerToken(req, res) {
      const { token } = req.body ?? {};
      if (!token) {
        const r = sendError(400, 'token required');
        return res.status(r.status).json(r.body);
      }
      service.registerToken(token);
      const r = ok();
      res.status(r.status).json(r.body);
    },

    getTokens(req, res) {
      const r = tokenCount(service.getTokenCount());
      res.status(r.status).json(r.body);
    },
  };
}

export default createTokenController;

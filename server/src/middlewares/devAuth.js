// Cross-cutting dev-secret auth. An unset secret denies everything (no open relay).
export function createDevAuth(devSecret) {
  return (req, res, next) => {
    if (!devSecret || req.get('X-Dev-Secret') !== devSecret) {
      return res.status(401).json({ error: 'missing or wrong X-Dev-Secret' });
    }
    next();
  };
}

export default createDevAuth;

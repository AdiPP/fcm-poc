// Model: the in-memory token store. A factory returning a Set-backed store so
// the repository can wrap the raw Set without owning its construction.
export function createTokenStore() {
  return new Set();
}

export default createTokenStore;

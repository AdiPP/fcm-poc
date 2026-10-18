// Repository: the only module that reads/writes the underlying token store.
export function createTokenRepository(tokens) {
  return {
    add(token) {
      tokens.add(token);
    },
    has(token) {
      return tokens.has(token);
    },
    delete(token) {
      return tokens.delete(token);
    },
    size() {
      return tokens.size;
    },
    values() {
      return [...tokens];
    },
  };
}

export default createTokenRepository;

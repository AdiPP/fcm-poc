let registeredToken = null;

export function getToken() {
  return registeredToken;
}

export function setToken(token) {
  registeredToken = token;
}

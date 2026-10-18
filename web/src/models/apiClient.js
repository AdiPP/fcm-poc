export async function registerToken(token) {
  return fetch('/register-token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export async function subscribe(token, topic) {
  return fetch('/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, topic }),
  });
}

export async function send(payload) {
  return fetch('/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default { registerToken, subscribe, send };

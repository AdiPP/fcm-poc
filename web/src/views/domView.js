const $ = (id) => document.getElementById(id);

export const refs = {
  enable: $('enable'),
  subscribe: $('subscribe'),
  token: $('token'),
  topic: $('topic'),
  permission: $('permission'),
  scope: $('scope'),
  toast: $('toast'),
  // Per-mode test cards (token / topic / broadcast), each self-contained.
  testToken: $('testToken'),
  tokenTitle: $('tokenTitle'),
  tokenBody: $('tokenBody'),
  tokenResult: $('tokenResult'),
  testTopic: $('testTopic'),
  topicName: $('topicName'),
  topicTitle: $('topicTitle'),
  topicBody: $('topicBody'),
  topicResult: $('topicResult'),
  testBroadcast: $('testBroadcast'),
  broadcastTitle: $('broadcastTitle'),
  broadcastBody: $('broadcastBody'),
  broadcastResult: $('broadcastResult'),
};

export function showToast(text, duration = 4000) {
  const el = refs.toast;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

export function showToken(text) {
  refs.token.textContent = text;
}

export function showPermission(text) {
  refs.permission.textContent = text;
}

export function showScope(text) {
  refs.scope.textContent = text;
}

// `card` is the mode name: 'token' | 'topic' | 'broadcast'.
export function setCardResult(card, text) {
  const el = refs[`${card}Result`];
  if (el) el.textContent = text;
}

export default { refs, showToast, showToken, showPermission, showScope, setCardResult };

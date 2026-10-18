const $ = (id) => document.getElementById(id);

export const refs = {
  enable: $('enable'),
  subscribe: $('subscribe'),
  send: $('send'),
  token: $('token'),
  topic: $('topic'),
  target: $('target'),
  sendTopic: $('sendTopic'),
  title: $('title'),
  body: $('body'),
  permission: $('permission'),
  scope: $('scope'),
  toast: $('toast'),
  sendResult: $('sendResult'),
};

export function showToast(text) {
  const el = refs.toast;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
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

export function showSendResult(text) {
  refs.sendResult.textContent = text;
}

export default { refs, showToast, showToken, showPermission, showScope, showSendResult };

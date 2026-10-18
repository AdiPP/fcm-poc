// View: JSON response shapers. Single place where response shapes are constructed.
export function ok() {
  return { status: 200, body: { ok: true } };
}

export function messageId(id) {
  return { status: 200, body: { messageId: id } };
}

export function broadcastResult(sent, failed) {
  return { status: 200, body: { sent, failed } };
}

export function tokenCount(count) {
  return { status: 200, body: { count } };
}

export function sendError(status, message) {
  return { status, body: { error: message } };
}

export default { ok, messageId, broadcastResult, tokenCount, sendError };

export function getPermission() {
  return Notification.permission;
}

export async function requestPermission() {
  return Notification.requestPermission();
}

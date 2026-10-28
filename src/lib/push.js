import { api } from './api.js';

export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// iOS only allows Web Push for sites added to the Home Screen.
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function getPushStatus() {
  if (!pushSupported()) return { supported: false, subscribed: false, permission: 'unsupported' };
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  return {
    supported: true,
    subscribed: Boolean(subscription),
    permission: Notification.permission,
    subscription: subscription || null,
  };
}

export async function enablePush() {
  if (!pushSupported()) {
    throw new Error('This browser does not support push notifications.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked. Allow them in your browser settings.'
        : 'Notification permission was not granted.',
    );
  }

  const status = await api('/push/status');
  if (!status.configured || !status.publicKey) {
    throw new Error('Push notifications are not configured on this server.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(status.publicKey),
    });
  }

  await api('/push/subscribe', { method: 'POST', body: subscription.toJSON() });
  return subscription;
}

export async function disablePush() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;
  await api('/push/unsubscribe', {
    method: 'POST',
    body: { endpoint: subscription.endpoint },
  });
  await subscription.unsubscribe();
}

export async function sendTestPush() {
  await api('/push/test', { method: 'POST' });
}

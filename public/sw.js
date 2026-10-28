/* SmartSpend India service worker.
   Handles Web Push so the phone can show a pop-up with sound
   even when the app is closed. */

const APP_URL = '/app';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'SmartSpend India', body: 'You have a money reminder.', url: APP_URL };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    // 'default' makes Android/Chrome play the system notification sound.
    sound: 'default',
    vibrate: [200, 100, 200, 100, 400],
    tag: payload.tag || 'smartspend-reminder',
    // Re-alert even if a similar notification is already showing.
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    data: { url: payload.url || APP_URL },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || APP_URL, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // Best-effort: re-subscribe with the same VAPID key when the browser rotates the subscription.
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((subscription) =>
        self.fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(subscription),
        }),
      )
      .catch(() => {}),
  );
});

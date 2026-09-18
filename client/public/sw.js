// sw.js - EngineerSpace Production Service Worker for Standards-Based Web Push

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'EngineerSpace',
      message: event.data.text(),
      url: '/'
    };
  }

  const title = payload.title || 'EngineerSpace Notification';
  const message = payload.message || payload.body || 'You have a new update in your workspace.';
  const actionUrl = payload.url || '/';

  const notificationOptions = {
    body: message,
    icon: '/brand/favicon.ico',
    badge: '/brand/favicon.ico',
    tag: payload.type ? `engineerspace-${payload.type}-${payload.entityId || Date.now()}` : `engineerspace-${Date.now()}`,
    data: {
      url: actionUrl,
      type: payload.type,
      entityId: payload.entityId,
      timestamp: payload.timestamp || Date.now()
    },
    vibrate: [100, 50, 100],
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Handle notification click -> Focus existing workspace tab or open target deep-link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      // If no tab is open, open a new window with the deep link
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle subscription renewal if rotated by browser
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.getSubscription().then((subscription) => {
      if (subscription) {
        // Broadcast to clients to sync with backend
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: subscription.toJSON()
            });
          });
        });
      }
    })
  );
});

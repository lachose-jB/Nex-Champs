// Service Worker for Push Notifications
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received", event);

  if (!event.data) {
    console.log("[Service Worker] No data in push event");
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "Orchestra-sec notification",
      icon: "/logo.svg",
      badge: "/badge.svg",
      tag: data.tag || "orchestra-notification",
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [
        {
          action: "open",
          title: "Open",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Orchestra-sec", options)
    );
  } catch (error) {
    console.error("[Service Worker] Error processing push notification:", error);
    event.waitUntil(
      self.registration.showNotification("Orchestra-sec", {
        body: event.data.text(),
        icon: "/logo.svg",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.notification.tag);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab with the target URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event.notification.tag);
});

// Periodic background sync for notifications
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(
      fetch("/api/trpc/notifications.getPending")
        .then((response) => response.json())
        .then((data) => {
          if (data.result && data.result.data) {
            data.result.data.forEach((notification) => {
              self.registration.showNotification(notification.title, {
                body: notification.body,
                icon: "/logo.svg",
                tag: notification.id,
              });
            });
          }
        })
        .catch((error) => console.error("[Service Worker] Sync error:", error))
    );
  }
});

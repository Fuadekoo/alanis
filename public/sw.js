// Activate an updated service worker immediately instead of waiting for all
// tabs to close, so new push/click logic takes effect on the next load.
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Al-Anis Tilawa",
      body: event.data ? event.data.text() : "",
    };
  }

  const title = data.title || "Al-Anis Tilawa";
  // Tagging by notification id makes the OS replace an earlier copy of the same
  // event rather than stacking a duplicate.
  const tag = data.tag || data.notificationId || undefined;
  const options = {
    body: data.body || "",
    icon: data.icon || "/al-anis.png",
    badge: "/al-anis.png",
    vibrate: [100, 50, 100],
    tag: tag,
    renotify: !!tag,
    data: {
      url: data.url || "/",
      notificationId: data.notificationId || null,
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(
    (async function () {
      await self.registration.showNotification(title, options);

      // Let an already-open tab refresh its badge without waiting for a poll.
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        client.postMessage({
          type: "notification-received",
          notificationId: data.notificationId || null,
        });
      }
    })()
  );
});

/**
 * Tell the server the user opened this one. Read state lives in Postgres, so
 * doing it here keeps the badge correct even when the click opens an external
 * link and no app tab ever loads.
 */
function markRead(notificationId) {
  if (!notificationId) return Promise.resolve();
  return fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids: [notificationId] }),
  }).catch(function () {
    // Offline again — the inbox still shows it as unread, which is correct.
  });
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";
  const notificationId =
    (event.notification.data && event.notification.data.notificationId) || null;
  const isInternal = targetUrl.startsWith("/");

  event.waitUntil(
    (async function () {
      await markRead(notificationId);

      // External links (e.g. a Zoom/Meet class link) must always open a new
      // window — focusing an existing app tab would not take the user there.
      if (!isInternal) {
        await clients.openWindow(targetUrl);
        return;
      }

      // Internal path: reuse an already-open app tab when possible.
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            try {
              await client.navigate(targetUrl);
            } catch (e) {
              // Cross-origin or navigation blocked — fall back to focus.
            }
          }
          return client.focus();
        }
      }

      await clients.openWindow(targetUrl);
    })()
  );
});

// Take control as soon as a new service worker activates.
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

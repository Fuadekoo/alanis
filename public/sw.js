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
 * doing it here keeps the badge correct even when the opened tab never gets far
 * enough to report the read itself.
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

// Where a notification click lands when its own url cannot be opened in-app.
const APP_FALLBACK_URL = "/am/dashboard";

/**
 * A notification tap must always land in this app (browser tab or installed
 * PWA) — never straight into Zoom, Meet or any other external target. Anything
 * that would leave our origin, and any `/api/*` endpoint (those are redirects
 * or JSON, not pages), is replaced by the dashboard, where the student joins
 * the class through the normal button and gets attendance recorded.
 */
function toInAppUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl || "/", self.location.origin);
    if (parsed.origin !== self.location.origin) return APP_FALLBACK_URL;
    if (parsed.pathname.startsWith("/api/")) return APP_FALLBACK_URL;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch (e) {
    return APP_FALLBACK_URL;
  }
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl = toInAppUrl(
    event.notification.data && event.notification.data.url
  );
  const notificationId =
    (event.notification.data && event.notification.data.notificationId) || null;

  event.waitUntil(
    (async function () {
      await markRead(notificationId);

      // Reuse an already-open app tab when possible.
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

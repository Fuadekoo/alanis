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
  const options = {
    body: data.body || "",
    icon: data.icon || "/al-anis.png",
    badge: "/al-anis.png",
    vibrate: [100, 50, 100],
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: {
      url: data.url || "/",
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";
  const isInternal = targetUrl.startsWith("/");

  event.waitUntil(
    (async function () {
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

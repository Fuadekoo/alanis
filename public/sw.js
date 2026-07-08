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
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Reuse an already-open tab when possible.
        for (const client of clientList) {
          if ("focus" in client) {
            if (isInternal && "navigate" in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});

// Take control as soon as a new service worker activates.
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

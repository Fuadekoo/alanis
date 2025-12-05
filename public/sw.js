// // Service Worker for Al Anis Educational Management System

// // Install event - fires when the service worker is first installed
// self.addEventListener("install", function (event) {
//   console.log("Service Worker installing...");
//   self.skipWaiting(); // Activate immediately
// });

// // Activate event - fires when the service worker is activated
// self.addEventListener("activate", function (event) {
//   console.log("Service Worker activating...");
//   event.waitUntil(clients.claim()); // Take control of all pages immediately
// });

// // Push notification event - handles incoming push notifications
// self.addEventListener("push", function (event) {
//   if (event.data) {
//     const data = event.data.json();
//     const options = {
//       body: data.body,
//       icon: data.icon || "/al-anis.png",
//       badge: "/al-anis.png",
//       vibrate: [100, 50, 100],
//       data: {
//         dateOfArrival: Date.now(),
//         primaryKey: data.primaryKey || "1",
//         url: data.url || "/",
//       },
//     };
//     event.waitUntil(self.registration.showNotification(data.title, options));
//   }
// });

// // Notification click event - handles when user clicks on a notification
// self.addEventListener("notificationclick", function (event) {
//   console.log("Notification click received.");
//   event.notification.close();

//   const urlToOpen = event.notification.data?.url || "https://alanistilawa.com/";

//   event.waitUntil(
//     clients
//       .matchAll({
//         type: "window",
//         includeUncontrolled: true,
//       })
//       .then(function (clientList) {
//         // Check if there's already a window/tab open with the target URL
//         for (let i = 0; i < clientList.length; i++) {
//           const client = clientList[i];
//           if (client.url === urlToOpen && "focus" in client) {
//             return client.focus();
//           }
//         }
//         // If no window is open, open a new one
//         if (clients.openWindow) {
//           return clients.openWindow(urlToOpen);
//         }
//       })
//   );
// });

// // Notification close event - optional, for tracking
// self.addEventListener("notificationclose", function (event) {
//   console.log("Notification closed:", event.notification);
// });

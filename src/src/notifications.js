export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker নিবন্ধিত হয়েছে");
    return reg;
  } catch (err) {
    console.error("Service Worker ত্রুটি:", err);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function showLocalNotification(title, body, url = "/") {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon: "/logo192.png",
      badge: "/logo192.png",
      tag: "govt-update",
      data: { url },
      actions: [
        { action: "open", title: "দেখুন" },
        { action: "close", title: "বন্ধ করুন" }
      ]
    });
  });
}
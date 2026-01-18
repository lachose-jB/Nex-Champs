import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  data?: Record<string, unknown>;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if the browser supports service workers and notifications
    const supported =
      "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[Push Notifications] Service Worker registered:", registration);

          // Check if already subscribed
          registration.pushManager.getSubscription().then((subscription) => {
            setIsSubscribed(!!subscription);
          });
        })
        .catch((error) => {
          console.error("[Push Notifications] Service Worker registration failed:", error);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in your browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        toast.success("Push notifications enabled");
        return true;
      } else if (permission === "denied") {
        toast.error("Push notifications were denied");
        return false;
      }
    } catch (error) {
      console.error("[Push Notifications] Error requesting permission:", error);
      toast.error("Failed to request notification permission");
      return false;
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Create subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY as string,
      });

      setIsSubscribed(true);
      toast.success("Subscribed to push notifications");

      // Send subscription to server
      // In production: await trpc.notifications.subscribe.useMutation()
      console.log("[Push Notifications] Subscription:", subscription);

      return true;
    } catch (error) {
      console.error("[Push Notifications] Subscription failed:", error);
      toast.error("Failed to subscribe to push notifications");
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success("Unsubscribed from push notifications");

        // Notify server
        // In production: await trpc.notifications.unsubscribe.useMutation()

        return true;
      }
    } catch (error) {
      console.error("[Push Notifications] Unsubscription failed:", error);
      toast.error("Failed to unsubscribe from push notifications");
      return false;
    }
  };

  const showNotification = async (options: PushNotificationOptions) => {
    if (!isSupported) {
      console.warn("[Push Notifications] Not supported");
      return;
    }

    if (permission !== "granted") {
      console.warn("[Push Notifications] Permission not granted");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || "/logo.svg",
        badge: options.badge || "/badge.svg",
        tag: options.tag || "orchestra-notification",
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      } as NotificationOptions & { actions?: Array<{ action: string; title: string }> });
    } catch (error) {
      console.error("[Push Notifications] Failed to show notification:", error);
    }
  };

  const enableNotifications = async () => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    return await subscribe();
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    enableNotifications,
  };
}

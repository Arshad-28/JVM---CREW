// pushNotificationService.ts - Client-side Web Push management & Service Worker integration
import { api } from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionStatus =
  | 'UNSUPPORTED'
  | 'DEFAULT'
  | 'GRANTED'
  | 'DENIED'
  | 'SUBSCRIBED';

export class PushNotificationService {
  private static instance: PushNotificationService;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Checks if the current browser environment supports Web Push.
   */
  public isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Registers the service worker safely.
   */
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isPushSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      return registration;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
      return null;
    }
  }

  /**
   * Gets current subscription status for this browser device.
   */
  public async getStatus(): Promise<PushPermissionStatus> {
    if (!this.isPushSupported()) {
      return 'UNSUPPORTED';
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      return 'DENIED';
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return permission === 'granted' ? 'GRANTED' : 'DEFAULT';
      }

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        return 'SUBSCRIBED';
      }

      return permission === 'granted' ? 'GRANTED' : 'DEFAULT';
    } catch {
      return permission === 'granted' ? 'GRANTED' : 'DEFAULT';
    }
  }

  /**
   * Prompts user permission and creates/registers a new Web Push subscription.
   */
  public async subscribeToPush(): Promise<{ success: boolean; message: string }> {
    if (!this.isPushSupported()) {
      return {
        success: false,
        message: 'Push notifications are not supported on this browser or device.',
      };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          message:
            permission === 'denied'
              ? 'Notification permission was denied in your browser settings.'
              : 'Notification permission request was dismissed.',
        };
      }

      const registration = await this.registerServiceWorker();
      if (!registration) {
        return {
          success: false,
          message: 'Unable to register Service Worker for notifications.',
        };
      }

      // Fetch VAPID Public Key from backend
      const config = await api.getPushConfig();
      if (!config.vapidPublicKey) {
        return {
          success: false,
          message: 'Web Push server key is not available.',
        };
      }

      const convertedKey = urlBase64ToUint8Array(config.vapidPublicKey);

      // Subscribe to PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });

      // Send subscription payload to backend
      await api.registerPushSubscription(subscription.toJSON());

      return {
        success: true,
        message: 'Push notifications enabled successfully!',
      };
    } catch (err: any) {
      console.error('Failed to subscribe to Web Push:', err);
      return {
        success: false,
        message: err.message || 'Failed to activate push notifications.',
      };
    }
  }

  /**
   * Unsubscribes from browser push and informs the backend.
   */
  public async unsubscribeFromPush(): Promise<{ success: boolean; message: string }> {
    if (!this.isPushSupported()) {
      return { success: false, message: 'Push not supported.' };
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await api.deletePushSubscription(endpoint).catch(() => {});
        }
      }

      return {
        success: true,
        message: 'Push notifications have been disabled.',
      };
    } catch (err: any) {
      console.error('Failed to unsubscribe from push:', err);
      return {
        success: false,
        message: err.message || 'Failed to disable push notifications.',
      };
    }
  }

  /**
   * Automatically syncs existing subscription on app start if permission is already granted.
   */
  public async syncExistingSubscription(): Promise<void> {
    if (!this.isPushSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.registerPushSubscription(subscription.toJSON()).catch(() => {});
      }
    } catch {
      // Non-critical background sync
    }
  }
}

export const pushService = PushNotificationService.getInstance();

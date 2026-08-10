/**
 * Push Notification Service — Capacitor (Android APK) + Web (PWA) fallback
 *
 * Flow:
 *  1. App opens → requestPermission()
 *  2. On grant → FCM assigns a device token
 *  3. Token is sent to our backend → stored against the user
 *  4. When someone sends a message → backend fires FCM → phone shows notification
 */

import { Capacitor } from '@capacitor/core';
import { apiRequest } from './api';

// ─── Capacitor (Native Android APK) ──────────────────────────────────────────

async function initCapacitorPush() {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.warn('[Push] Permission denied');
      return;
    }

    await PushNotifications.register();

    // Send token to backend
    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] FCM token:', token.value);
      try {
        await apiRequest('/notifications/register-token', {
          method: 'POST',
          body: { token: token.value, platform: 'android' }
        });
      } catch (e) {
        console.error('[Push] Failed to register token', e);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Registration error:', err);
    });

    // Foreground notification received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notification received:', notification);
      
      // Update the unread count globally and show the in-app toast
      import('@/lib/store/useChatStore').then(({ useChatStore }) => {
        useChatStore.getState().fetchConversations();
        useChatStore.getState().setNotification({
          contactName: notification.title || notification.data?.contactName || 'New Message',
          text: notification.body || notification.data?.text || '',
          avatarUrl: notification.data?.avatarUrl || ''
        });
      });
    });

    // User tapped a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Notification tapped:', action);
      // Navigate to messages on tap
      if (typeof window !== 'undefined') {
        window.location.href = '/messages';
      }
    });

  } catch (e) {
    console.error('[Push] Capacitor push init failed:', e);
  }
}

// ─── Web Push (browser / PWA) ─────────────────────────────────────────────────

async function initWebPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    // Register the service worker first — required before we can subscribe.
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // Already subscribed

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    await apiRequest('/notifications/register-web-push', {
      method: 'POST',
      body: sub.toJSON()
    });
  } catch (e) {
    console.warn('[Push] Web push init failed:', e);
  }

  // Listen for push messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PUSH_RECEIVED') {
      console.log('[Push] Web Push notification received in foreground:', event.data.payload);
      import('@/lib/store/useChatStore').then(({ useChatStore }) => {
        useChatStore.getState().fetchConversations();
        const payload = event.data.payload;
        useChatStore.getState().setNotification({
          contactName: payload.title || payload.data?.contactName || 'New Message',
          text: payload.body || payload.data?.text || '',
          avatarUrl: payload.data?.avatarUrl || ''
        });
      });
    }
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function initPushNotifications() {
  if (Capacitor.isNativePlatform()) {
    await initCapacitorPush();
  } else {
    await initWebPush();
  }
}

import type { CapacitorConfig } from '@capacitor/cli';

// appId confirmed 2026-11-19 (same prefix as POS, com.factoryAI.gmo). It's baked
// into ios/ and android/ and can't change once the app is in the stores.
const config: CapacitorConfig = {
  appId: 'com.factoryAI.smartloans',
  appName: 'SmartLoans',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    },
    PushNotifications: {
      // iOS: show pushes in the foreground too (don't mirror with LocalNotifications).
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;

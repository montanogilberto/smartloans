import type { CapacitorConfig } from '@capacitor/cli';

// appId is provisional: confirm the final bundle id before creating the
// iOS/Android projects — it can't be changed once published to the stores.
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

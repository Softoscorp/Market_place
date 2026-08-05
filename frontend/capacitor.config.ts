import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.houseagent.app',
  appName: 'House Agent',
  webDir: 'out',
  server: {
    // Load from your live production URL — app always stays up to date
    // without needing to rebuild the APK on every change.
    url: 'https://market-place-chi-lime.vercel.app',
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
    },
  },
};

export default config;

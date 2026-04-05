import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.halalmarket.app',
  appName: 'Halal Marketplace',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

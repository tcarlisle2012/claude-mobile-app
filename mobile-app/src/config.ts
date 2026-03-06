import { Platform } from 'react-native';

// Central configuration for the app.
// Override apiBaseUrl here when deploying to staging or production.
const config = {
  apiBaseUrl: Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api',
};

export default config;

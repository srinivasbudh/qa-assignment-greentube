import { defineConfig } from '@playwright/test';
import { getApiConfig } from './config/env';

const apiConfig = getApiConfig();

// Keep local runs fast while making CI failures easier to diagnose.
export default defineConfig({
  testDir: './tests',
  timeout: apiConfig.timeoutMs,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list'], ['github']],
  use: {
    baseURL: apiConfig.baseUrl,
    extraHTTPHeaders: apiConfig.headers,
    ignoreHTTPSErrors: apiConfig.ignoreHttpsErrors,
    trace: 'retain-on-failure'
  }
});


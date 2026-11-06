import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { getApiBaseUrl } from './src/config/api-url.js';

export default defineConfig(({ command, mode }) => {
  // Fail before publishing assets that would send cloud saves to localhost.
  if (command === 'build') getApiBaseUrl({ ...loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_'), PROD: true });
  return { plugins: [react()] };
});

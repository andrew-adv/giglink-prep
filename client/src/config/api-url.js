export function getApiBaseUrl(env = import.meta.env || {}) {
  const value = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL.trim() : '';
  if (!value && !env.PROD) return 'http://localhost:5000/api';
  const message = 'Set VITE_API_BASE_URL to the API URL ending in /api (HTTPS is required for production).';
  let url;
  try { url = new URL(value); } catch { throw new Error(message); }
  if (!['http:', 'https:'].includes(url.protocol) || (env.PROD && url.protocol !== 'https:')
    || url.username || url.password || url.search || url.hash || url.hostname.includes('*') || url.pathname.replace(/\/+$/, '') !== '/api'
    || (env.PROD && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error(message);
  return `${url.origin}/api`;
}

export function clientOrigins({ clientOrigin, nodeEnv = 'development' } = {}) {
  const production = nodeEnv === 'production';
  const origins = production ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];
  if (!clientOrigin && !production) return new Set(origins);
  const message = 'CLIENT_ORIGIN must be one exact frontend origin with no path or trailing slash (HTTPS in production).';
  let url;
  try { url = new URL(clientOrigin); } catch { throw new Error(message); }
  if (clientOrigin !== url.origin || url.hostname.includes('*') || !['http:', 'https:'].includes(url.protocol)
    || (production && url.protocol !== 'https:')) throw new Error(message);
  return new Set([...origins, url.origin]);
}

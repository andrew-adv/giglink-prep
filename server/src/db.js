import mongoose from 'mongoose';

export function createDatabase({ uri = process.env.MONGODB_URI, driver = mongoose, retryMs = 30000, log = console } = {}) {
  let stopped = false, timer, connecting = false;
  const configured = typeof uri === 'string' && uri.trim().length > 0;
  const state = () => !configured ? 'not-configured' : driver.connection.readyState === 1 ? 'connected' : 'unavailable';
  async function connect() {
    if (stopped || !configured || connecting || driver.connection.readyState === 1) return;
    connecting = true;
    try {
      await driver.connect(uri, { dbName: 'giglink_prep', serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, socketTimeoutMS: 10000, maxPoolSize: 5, bufferCommands: false });
      if (!stopped) log.info('Progress database connected.');
    } catch {
      // Driver messages can contain credentials/hosts. Deliberately do not log them.
      if (!stopped) log.warn('Progress database unavailable; device saving remains available.');
    } finally {
      connecting = false;
      if (!stopped && driver.connection.readyState !== 1) timer = setTimeout(connect, retryMs);
      timer?.unref?.();
    }
  }
  return {
    state,
    start() { void connect(); },
    async stop() {
      stopped = true; clearTimeout(timer);
      try { await driver.disconnect(); }
      catch { log.warn('Progress database could not close cleanly.'); }
    },
  };
}

import { createApp } from './app.js';
import { createDatabase } from './db.js';

const port = Number(process.env.PORT || 5000);
const database = createDatabase();
database.start();
const server = createApp({ database }).listen(port, '0.0.0.0', () => {
  console.log(`GigLink Prep API listening on http://localhost:${port}`);
});

server.on('error', () => {
  console.error('Could not start the API. Check the configured port.');
  void database.stop();
  process.exitCode = 1;
});

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => { await database.stop(); clearTimeout(deadline); });
  server.closeIdleConnections();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

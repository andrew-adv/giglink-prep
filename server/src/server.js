import { createApp } from './app.js';

const port = Number(process.env.PORT || 5000);
const server = createApp().listen(port, '0.0.0.0', () => {
  console.log(`GigLink Prep API listening on http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error(`Could not start the API: ${error.message}`);
  process.exitCode = 1;
});

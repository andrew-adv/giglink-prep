import express from 'express';
import cors from 'cors';

export function createApp({ clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'giglink-prep-api', phase: 'P0' });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found' });
  });

  return app;
}

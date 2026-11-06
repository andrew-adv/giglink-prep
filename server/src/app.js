import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import { bodyLimit, tokenPattern, validWrite } from '../../shared/progress.mjs';
import { createProgressStore } from './progress-store.js';

export function createApp({ clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173', database = { state: () => 'not-configured' }, store = createProgressStore() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin, methods: ['GET', 'PUT'], allowedHeaders: ['Authorization', 'Content-Type'] }));

  app.get('/api/health', (_request, response) => {
    response.set('Cache-Control', 'no-store').json({ status: 'ok', service: 'giglink-prep-api', phase: 'P3', database: database.state() });
  });

  app.use('/api/progress', (request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const match = /^Bearer ([a-f0-9]{64})$/.exec(request.get('Authorization') || '');
    if (!match || !tokenPattern.test(match[1])) return response.status(401).json({ error: 'A valid learner credential is required.' });
    request.learnerHash = createHash('sha256').update(match[1]).digest('hex');
    next();
  });
  app.get('/api/progress', async (request, response) => {
    if (database.state() !== 'connected') return response.status(503).json({ error: 'Progress storage is unavailable. Keep saving on this device.' });
    response.json({ progress: await store.read(request.learnerHash) });
  });
  app.put('/api/progress', express.json({ limit: bodyLimit, strict: true }), async (request, response) => {
    if (!validWrite(request.body)) return response.status(400).json({ error: 'Invalid progress data. Use the six project files and supported workspace fields.' });
    if (database.state() !== 'connected') return response.status(503).json({ error: 'Progress storage is unavailable. Keep saving on this device.' });
    const { workspace, expectedRevision } = request.body;
    const progress = await store.write(request.learnerHash, workspace, expectedRevision);
    if (!progress) return response.status(409).json({ error: 'Saved progress changed. Choose which copy to keep.', progress: await store.read(request.learnerHash) });
    response.status(expectedRevision === 0 ? 201 : 200).json({ progress });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found' });
  });

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'Progress request is too large.' });
    if (error.type === 'entity.parse.failed') return response.status(400).json({ error: 'Invalid JSON.' });
    response.status(503).json({ error: 'Progress storage is unavailable. Keep saving on this device.' });
  });

  return app;
}

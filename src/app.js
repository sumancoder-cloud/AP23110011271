import express from 'express';
import { requestLogger } from './middleware/requestLogger.js';
import { evaluationRouter } from './routes/evaluationRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', evaluationRouter);
  app.use('/api/notifications', notificationRouter);

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}

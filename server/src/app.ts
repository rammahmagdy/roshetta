import express from 'express';
import cors from 'cors';
import { requestId } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/prescriptions.js';
import { drugsRouter } from './routes/drugs.js';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);

  app.use('/api', apiRouter);
  app.use('/api/drugs', drugsRouter);

  app.use(errorHandler);

  return app;
}

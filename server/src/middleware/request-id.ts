import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export const requestId: RequestHandler = (req, _res, next) => {
  req.id = randomUUID();
  next();
};

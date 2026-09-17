import { NestFactory } from '@nestjs/core';
import express, { type Request, type Response, type NextFunction } from 'express';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    instrument: ObserveInstrument,
  });

  // Parse JSON and urlencoded for non-BetterAuth endpoints
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl || req.url || '';
    if (url.startsWith('/api/auth')) {
      return next();
    }
    return jsonParser(req, res, (err) => {
      if (err) return next(err);
      return urlencodedParser(req, res, next);
    });
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();

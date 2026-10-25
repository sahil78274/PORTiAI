import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { isAiEnabled } from './services/geminiService.js';

export const createApp = () => {
  const app = express();

  // Render/Vercel terminate TLS in front of the app.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // API only serves JSON
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin/tooling requests have no Origin header.
        if (!origin) return callback(null, true);
        const normalised = origin.replace(/\/$/, '');
        if (env.clientUrls.includes(normalised)) return callback(null, true);
        // Development only: the Vite dev server can be reached through a tunnel or
        // hosted-sandbox host (its proxy forwards the browser's Origin header), so
        // reflect whatever origin the local dev setup uses. Production stays
        // restricted to the CLIENT_URL allow-list above.
        if (!env.isProduction) return callback(null, true);
        // Allow Vercel preview deployments of the configured project.
        if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(normalised) && env.clientUrls.some((url) => url.includes('.vercel.app'))) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        ai: isAiEnabled() ? 'configured' : 'not_configured',
        environment: env.nodeEnv,
        time: new Date().toISOString(),
      },
    });
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/portfolios', portfolioRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/public', publicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

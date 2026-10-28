import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { ApiError } from './utils/ApiError.js';
import { isAllowedOrigin, normaliseOrigin } from './utils/corsOrigin.js';
import authRoutes from './routes/authRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
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
        if (isAllowedOrigin(origin, { clientUrls: env.clientUrls, isProduction: env.isProduction })) {
          return callback(null, true);
        }
        // A rejection here reaches the browser as an opaque CORS failure, so log
        // the origin and the allow-list the server is actually using.
        const normalised = normaliseOrigin(origin);
        console.warn(
          `[cors] blocked origin "${normalised}". Allowed origins: ${env.clientUrls.join(', ') || '(none)'}. ` +
            'Set CLIENT_URL on the API service to include this origin.'
        );
        return callback(ApiError.forbidden(`Origin ${normalised} is not allowed to call this API.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
      maxAge: 86400,
    })
  );

  // 1 MB allows an uploaded HTML document (capped again in the scan validator).
  app.use(express.json({ limit: '1mb' }));
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
        // Which browser origins this deployment accepts — the first thing to
        // check when the site reports that it cannot reach the API.
        allowedOrigins: env.clientUrls,
        time: new Date().toISOString(),
      },
    });
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/subscription', subscriptionRoutes);
  app.use('/api/portfolios', portfolioRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/analyze', analyzeRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

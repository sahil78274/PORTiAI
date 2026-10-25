import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { isAiEnabled } from './services/geminiService.js';

const start = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('[startup] Could not connect to MongoDB:', error.message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`[startup] PortiAI API listening on port ${env.port} (${env.nodeEnv})`);
    console.log(`[startup] Allowed client origin(s): ${env.clientUrls.join(', ')}`);
    console.log(`[startup] Gemini: ${isAiEnabled() ? `configured (${env.gemini.model})` : 'not configured — rule-based analysis only'}`);
  });

  const shutdown = async (signal) => {
    console.log(`[shutdown] ${signal} received, closing server…`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
};

start();

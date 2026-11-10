import { createApp } from './app.js';
import { env, isCheckoutConfigured, isDevUpgradeEnabled } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { isAiEnabled } from './services/geminiService.js';
import { isRazorpayConfigured, isRazorpayWebhookConfigured } from './config/env.js';
import { expireDueSubscriptions } from './services/billingService.js';

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
    console.log(
      `[startup] Billing: Razorpay ${
        isRazorpayConfigured() ? 'configured' : 'not configured'
      }; webhook ${isRazorpayWebhookConfigured() ? 'verified' : 'not configured'}; legacy checkout ${
        isCheckoutConfigured() ? 'connected' : 'not configured'
      }; development upgrade ${isDevUpgradeEnabled() ? 'ENABLED (disabled in production)' : 'disabled'}`
    );

    /*
     * Subscription expiry sweep. Runs once at startup and every 10 minutes so a
     * lapsed plan loses Premium even when no browser is open. Individual billing
     * reads also trigger it, so the state is correct on first view.
     */
    const sweep = () =>
      expireDueSubscriptions()
        .then(({ usersExpired, subscriptionsExpired }) => {
          if (usersExpired || subscriptionsExpired) {
            console.log(
              `[billing] expiry sweep: ${usersExpired} user(s), ${subscriptionsExpired} subscription(s) expired`
            );
          }
        })
        .catch((error) => console.warn('[billing] expiry sweep failed:', error.message));
    sweep();
    setInterval(sweep, 10 * 60 * 1000).unref();
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

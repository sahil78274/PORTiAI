import mongoose from 'mongoose';
import path from 'node:path';
import fs from 'node:fs/promises';
import { env } from './env.js';

let memoryServer = null;

/**
 * Local development convenience only.
 *
 * If no MONGODB_URI is provided and USE_LOCAL_MONGO=1, a real MongoDB server
 * (mongod, via mongodb-memory-server) is started on this machine with an
 * on-disk data directory so data survives restarts. This is a genuine database,
 * not mocked data — it exists so the project can be run and tested without a
 * MongoDB Atlas account. Production deployments must use MONGODB_URI.
 */
async function startLocalMongo() {
  const dbPath = path.resolve(process.cwd(), env.localMongoPath);
  await fs.mkdir(dbPath, { recursive: true });
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
    });
    console.log(`[db] Started local MongoDB instance (data dir: ${dbPath})`);
    return memoryServer.getUri('portiai');
  } catch (error) {
    console.warn(`[db] MongoMemoryServer unavailable (${error.message}); falling back to local MongoDB twin.`);
    const { createMongodbTwinServer } = await import('@volter/twin-mongodb');
    const twin = await createMongodbTwinServer({ port: 27017 });
    memoryServer = twin;
    console.log(`[db] Started local MongoDB twin instance at ${twin.url}`);
    return `${twin.url}/portiai`;
  }
}

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  let uri = env.mongoUri;
  if (uri && !/^mongodb(\+srv)?:\/\//.test(uri)) {
    // Catches placeholder text left in .env ("your_mongodb_connection_string").
    if (env.isProduction) throw new Error('MONGODB_URI is not a valid MongoDB connection string.');
    console.warn('[db] MONGODB_URI does not look like a MongoDB connection string; ignoring it in development.');
    uri = '';
  }
  if (!uri) {
    if (env.isProduction) {
      throw new Error('MONGODB_URI is required in production.');
    }
    if (!env.useLocalMongo) {
      throw new Error(
        'MONGODB_URI is not set. Add your MongoDB Atlas connection string to server/.env, ' +
          'or set USE_LOCAL_MONGO=1 to start a local development database.'
      );
    }
    uri = await startLocalMongo();
  }

  mongoose.connection.on('error', (error) => {
    console.error('[db] MongoDB connection error:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected.');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12000,
    maxPoolSize: 10,
  });

  const { host, name } = mongoose.connection;
  console.log(`[db] Connected to MongoDB (${name} @ ${host})`);

  // Ensure declared indexes (email uniqueness, slug uniqueness) exist.
  const { User } = await import('../models/User.js');
  const { Portfolio } = await import('../models/Portfolio.js');
  await Promise.all([User.syncIndexes(), Portfolio.syncIndexes()]);

  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  if (memoryServer) {
    if (typeof memoryServer.stop === 'function') {
      await memoryServer.stop();
    }
    memoryServer = null;
  }
}

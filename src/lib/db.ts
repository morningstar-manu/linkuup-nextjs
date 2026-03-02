import mongoose from 'mongoose';

let MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/linkuup_nextjs';

// S'assurer que l'URL MongoDB contient un nom de base (ex: ...mongodb.net/linkuup)
if (MONGODB_URI && (MONGODB_URI.endsWith('.net/') || MONGODB_URI.endsWith('.com/'))) {
  MONGODB_URI;
}

if (!MONGODB_URI) {
  throw new Error('Please define MONGO_URL in your .env');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== 'production') {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;

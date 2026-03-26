import mongoose from "mongoose";

declare global {
  var mongooseCache:
    | {
        connection: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const cache = globalThis.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalThis.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    const uri = getRequiredEnv("MONGODB_URI");

    cache.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "birdiefund",
    });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}

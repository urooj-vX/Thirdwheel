import { MongoClient, Db } from 'mongodb';

const DEFAULT_DB_NAME = 'third_wheel';

interface GlobalMongo {
  conn: { client: MongoClient; db: Db } | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
  uri?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: GlobalMongo | undefined;
}

let cached = global._mongoClientPromise;

if (!cached) {
  cached = global._mongoClientPromise = { conn: null, promise: null };
}

export async function getDb(customUri?: string, customDbName?: string): Promise<Db> {
  const { db } = await getMongoClientAndDb(customUri, customDbName);
  return db;
}

export async function getMongoClientAndDb(
  customUri?: string,
  customDbName?: string
): Promise<{ client: MongoClient; db: Db }> {
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/third_wheel';
  const dbName = customDbName || process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

  // Reset cached connection if URI changes (e.g. during test setup)
  if (cached?.conn && cached.uri && cached.uri !== uri) {
    await cached.conn.client.close();
    cached.conn = null;
    cached.promise = null;
  }

  if (cached?.conn && !customUri) {
    return cached.conn;
  }

  if (!cached?.promise || customUri) {
    const opts = {};
    const client = new MongoClient(uri, opts);
    const promise = client.connect().then((client) => {
      const db = client.db(dbName);
      return { client, db };
    });

    if (!customUri && cached) {
      cached.promise = promise;
      cached.uri = uri;
    } else {
      return await promise;
    }
  }

  if (cached) {
    cached.conn = await cached.promise;
    cached.uri = uri;
    return cached.conn;
  }

  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(dbName) };
}

export async function closeDbConnection(): Promise<void> {
  if (cached?.conn) {
    await cached.conn.client.close();
    cached.conn = null;
    cached.promise = null;
    cached.uri = undefined;
  }
}

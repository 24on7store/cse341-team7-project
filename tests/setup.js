import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, connectMongoose, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  const options = {
    connectionString,
    databaseName: 'kizuna-rail-test'
  };

  await connectToDb(options);
  await connectMongoose(options);
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});

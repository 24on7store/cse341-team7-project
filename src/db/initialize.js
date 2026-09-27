import trips from './seeds/trips.json' with { type: 'json' };
import schedules from './seeds/schedules.json' with { type: 'json' };
import stations from './seeds/stations.json' with { type: 'json' };
import ticketClasses from './seeds/ticket-classes.json' with { type: 'json' };
import trains from './seeds/trains.json' with { type: 'json' };
import bcrypt from 'bcrypt';

const roles = [
  { name: 'user' },
  { name: 'admin' }
];

const starterCollections = [
  ['trips', trips],
  ['schedules', schedules],
  ['stations', stations],
  ['ticketClasses', ticketClasses],
  ['trains', trains],
  ['roles', roles]
];

const seedUsers = async (db) => {
  const users = db.collection('users');

  await users.deleteMany({});

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await users.insertOne({
    displayName: 'Kizuna Rail Admin',
    username: 'admin',
    email: 'admin@kizuna-rail.local',
    passwordHash,
    role: 'admin'
  });
};

const initializeDatabase = async (db) => {
  if (!db) {
    throw new Error('A database connection is required to initialize data.');
  }

  for (const [collectionName, documents] of starterCollections) {
    const collection = db.collection(collectionName);
    await collection.deleteMany({});
    await collection.insertMany(documents);
  }

  await seedUsers(db);

  const bookings = db.collection('bookings');
  await bookings.deleteMany({});
  await bookings.createIndex({ id: 1 }, { unique: true });
};

export { initializeDatabase, starterCollections };

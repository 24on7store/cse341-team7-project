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
  //Added on week 04 #2 step 2
  const rolesCollection = db.collection('roles');

  await users.deleteMany({});
  //Added to look up freshly admin role document to catch it s unique id
  const adminRole = await rolesCollection.findOne({ name: 'admin' });
  if (!adminRole) {
    throw new Error('Admin role not found. Ensure roles are seeded before seeding users. ')

  }


  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await users.insertOne({
    displayName: 'Kizuna Rail Admin',
    username: 'admin',
    email: 'admin@kizuna-rail.local',
    passwordHash,
    // role: 'admin'
    //Edited to store the explicit ObjectId reference mapping to the roles connection
    role: adminRole._id
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

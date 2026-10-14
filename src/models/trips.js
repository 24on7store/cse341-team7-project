import { getDb } from '../db/connect.js';

export async function getTripById(id) {
  const db = getDb();
  return db.collection('trips').findOne({ id });
}

export async function getAllTrips({
  page = 1,
  limit = 10,
  q = '',
  region = '',
  season = ''
} = {}) {
  const db = getDb();
  const trips = db.collection('trips');

  const conditions = [];

  if (region) {
    conditions.push({
      region: {
        $regex: '^' + escapeRegex(region) + '$',
        $options: 'i'
      }
    });
  }

  if (season) {
    conditions.push({
      bestSeason: {
        $regex: '^' + escapeRegex(season) + '$',
        $options: 'i'
      }
    });
  }

  if (q) {
    const keyword = {
      $regex: escapeRegex(q),
      $options: 'i'
    };

    conditions.push({
      $or: [
        { id: keyword },
        { name: keyword },
        { description: keyword },
        { region: keyword },
        { startStation: keyword },
        { endStation: keyword },
        { highlights: keyword },
        { bestSeason: keyword }
      ]
    });
  }

  const filter = conditions.length > 0
    ? { $and: conditions }
    : {};

  const skip = (page - 1) * limit;

  const [data, totalItems] = await Promise.all([
    trips.find(filter)
      .sort({ id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),

    trips.countDocuments(filter)
  ]);

  return { data, totalItems };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//Added on week03 by Mackison
// src/models/trips.js
import Trip from './schemas/trips.js';

export async function getTripById(id) {
  // Querying using the custom string 'id' field, matching trains.js execution
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips() {
  return Trip.find({}).lean();
}

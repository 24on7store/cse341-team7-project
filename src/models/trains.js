// src/models/trains.js
import Train from './schemas/trains.js';

export async function getTrainById(id) {
}

export async function getAllTrains({ page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const [data, totalItems] = await Promise.all([
    Train.find({})
      .sort({ id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Train.countDocuments({})
  ]);

  return {
    data,
    totalItems
  };
}
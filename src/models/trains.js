// src/models/trains.js
import Train from './schemas/trains.js';

export async function getTrainById(id) {
}

export async function getAllTrains({
  page = 1,
  limit = 10,
  q = '',
  sort = 'id',
  order = 'asc'
} = {}) {
  const skip = (page - 1) * limit;

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { operator: { $regex: q, $options: 'i' } },
          { type: { $regex: q, $options: 'i' } },
          { powerSource: { $regex: q, $options: 'i' } },
          { bestFor: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      }
    : {};

  const sortDirection = order === 'desc' ? -1 : 1;

  const [data, totalItems] = await Promise.all([
    Train.find(filter)
      .sort({ [sort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
    Train.countDocuments(filter)
  ]);

  return {
    data,
    totalItems
  };
}
import mongoose from 'mongoose';
import Schedule from './schemas/schedules.js';

export async function getSchedulesByTripId(tripId, month) {
  if (month !== undefined && month !== null && month !== '') {
    const monthNumber = Number(month);
    const trip = await mongoose.connection.db
      .collection('trips')
      .findOne({ id: tripId });

    if (
      !trip ||
      !Array.isArray(trip.operatingMonths) ||
      !trip.operatingMonths.includes(monthNumber)
    ) {
      return [];
    }
  }

  return Schedule.find({ tripId }).sort({ id: 1 }).lean();
}

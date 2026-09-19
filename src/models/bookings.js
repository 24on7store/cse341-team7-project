import Booking from './schemas/bookings.js';
import { generateConfirmationCode } from '../includes/helpers.js';

export async function createBooking(bookingData) {
  const booking = new Booking({
    id: generateConfirmationCode(),
    scheduleId: Number(bookingData.scheduleId),
    tripId: bookingData.tripId,
    ticketClass: bookingData.ticketClass,
    selectedDay: bookingData.selectedDay,
    passengers: normalizePassengers(bookingData.passengers)
  });

  await booking.save();
  return booking.toObject();
}

export async function getAllBookings() {
  return Booking.find({}).lean();
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}

// The form submits passengers as an object keyed "0", "1", "2"... via
// passengers[0][firstName] etc, not a real array. Express's urlencoded
// parser turns that into { '0': {...}, '1': {...} }, so this converts
// it into an actual array before it hits the schema.
function normalizePassengers(passengers) {
  if (Array.isArray(passengers)) {
    return passengers;
  }
  if (passengers && typeof passengers === 'object') {
    return Object.values(passengers);
  }
  return [];
}
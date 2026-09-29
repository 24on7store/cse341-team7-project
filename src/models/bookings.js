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

export async function getBookingsByPassengerEmail(email) {
  return Booking.find({
    'passengers.email': email
  }).lean();
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}

export async function updateBooking(id, bookingData) {
  const updatedBooking = await Booking.findOneAndUpdate(
    { id },
    {
      scheduleId: Number(bookingData.scheduleId),
      tripId: bookingData.tripId,
      ticketClass: bookingData.ticketClass,
      selectedDay: bookingData.selectedDay,
      passengers: normalizePassengers(bookingData.passengers)
    },
    {
      new: true,
      runValidators: true
    }
  ).lean();

  return updatedBooking;
}

export async function deleteBooking(id) {
  const deletedBooking = await Booking.findOneAndDelete({ id }).lean();

  return deletedBooking;
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
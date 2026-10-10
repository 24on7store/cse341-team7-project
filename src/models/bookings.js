import Booking from './schemas/bookings.js';
import { generateConfirmationCode } from '../includes/helpers.js';


//Added on week05 for Feature Set 3
//Helper to normalize passenger formats
function normalizePassengers(passengers) {
  if (!passengers) return [];
  return Array.isArray(passengers) ? passengers : [passengers];
}


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

 //Enhanced Query Handler built for PR1 & PR2
 //Handles pagination cursor math, date boundaries, and ticket selection filtering.
export async function getPaginatedBookings({ filter = {}, page =1, limit = 10}) {
  const skip = (page - 1) * limit;

  // By default, sorted by booking date (newest first based on Mongoose createdAt timestamps)
  const bookings = await Booking.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalItems = await Booking.countDocuments(filter);

    return {
      bookings,
      totalItems
    };
}


// export async function getAllBookings() {
//   return Booking.find({}).lean();
// }

// export async function getBookingsByPassengerEmail(email) {
//   return Booking.find({
//     'passengers.email': email
//   }).lean();
// }

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
  return await Booking.findOneAndDelete({ id }).lean();
  // const deletedBooking = await Booking.findOneAndDelete({ id }).lean();

  // return deletedBooking;
}

// The form submits passengers as an object keyed "0", "1", "2"... via
// passengers[0][firstName] etc, not a real array. Express's urlencoded
// parser turns that into { '0': {...}, '1': {...} }, so this converts
// it into an actual array before it hits the schema.
// function normalizePassengers(passengers) {
//   if (Array.isArray(passengers)) {
//     return passengers;
//   }
//   if (passengers && typeof passengers === 'object') {
//     return Object.values(passengers);
//   }
//   return [];
// }
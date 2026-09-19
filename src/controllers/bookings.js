import { getDb } from '../db/connect.js';
import {
  createBooking,
  getAllBookings as findAllBookings,
  getBookingById as findBookingById
} from '../models/bookings.js';

// Renders the booking form for a given schedule.
export async function bookingPage(req, res) {
  const { scheduleId } = req.params;

  const db = getDb();
  const schedule = await db.collection('schedules').findOne({ id: Number(scheduleId) });
  const trip = await db.collection('trips').findOne({ id: schedule.tripId });
  const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description
  }));

  res.render('trips/book', {
    title: 'Book Trip',
    schedule,
    ticketOptions
  });
}

// Handles the booking form submission.
export async function processBookingRequest(req, res) {
  try {
    const booking = await createBooking(req.body);
    res.redirect(`/trips/confirmation/${booking.id}`);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).render('errors/500', {
      title: 'Server Error',
      error: 'Failed to create booking.',
      stack: error.stack
    });
  }
}

// Renders the booking confirmation page.
export async function confirmationPage(req, res) {
  const { confirmationId } = req.params;

  const booking = await findBookingById(confirmationId);

  res.render('trips/confirm', {
    title: 'Trip Confirmation',
    confirmation: booking
  });
}

// API: GET /api/bookings — returns all bookings as JSON.
export async function getAllBookings(req, res) {
  try {
    const bookings = await findAllBookings();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// API: GET /api/bookings/:id — returns a single booking as JSON.
export async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const booking = await findBookingById(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({ error: 'Failed to fetch booking' });
  }
}
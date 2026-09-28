import { getDb } from '../db/connect.js';
import {
    createBooking,
    getAllBookings as findAllBookings,
    getBookingsByPassengerEmail,
    getBookingById as findBookingById,
    updateBooking as updateBookingModel,
    deleteBooking as deleteBookingModel
} from '../models/bookings.js';

// Renders the booking form for a given schedule.
export async function bookingPage(req, res) {
    try {
        const { scheduleId } = req.params;

        const db = getDb();

        const schedule = await db
            .collection('schedules')
            .findOne({ id: Number(scheduleId) });

        if (!schedule) {
            return res.status(404).render('errors/404', {
                title: 'Schedule Not Found'
            });
        }

        const trip = await db
            .collection('trips')
            .findOne({ id: schedule.tripId });

        if (!trip) {
            return res.status(404).render('errors/404', {
                title: 'Trip Not Found'
            });
        }

        const ticketClasses = await db
            .collection('ticketClasses')
            .find({})
            .toArray();

        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description
        }));

        return res.render('trips/book', {
            title: 'Book Trip',
            schedule,
            ticketOptions
        });
    } catch (error) {
        console.error('Error loading booking page:', error);

        return res.status(500).render('errors/500', {
            title: 'Server Error',
            error: 'Failed to load booking page.',
            stack: error.stack
        });
    }
}

// Handles the booking form submission.
export async function processBookingRequest(req, res) {
    try {
        const booking = await createBooking(req.body);

        return res.redirect(`/trips/confirmation/${booking.id}`);
    } catch (error) {
        console.error('Error creating booking:', error);

        return res.status(500).render('errors/500', {
            title: 'Server Error',
            error: 'Failed to create booking.',
            stack: error.stack
        });
    }
}

// Renders the booking confirmation page.
export async function confirmationPage(req, res) {
    try {
        const { confirmationId } = req.params;

        const booking = await findBookingById(confirmationId);

        if (!booking) {
            return res.status(404).render('errors/404', {
                title: 'Booking Not Found'
            });
        }

        return res.render('trips/confirm', {
            title: 'Trip Confirmation',
            confirmation: booking
        });
    } catch (error) {
        console.error('Error loading booking confirmation:', error);

        return res.status(500).render('errors/500', {
            title: 'Server Error',
            error: 'Failed to load booking confirmation.',
            stack: error.stack
        });
    }
}

// API: GET /api/bookings
export async function getAllBookings(req, res) {
    try {
        const user = req.session.user;

        const bookings =
            user.role === 'admin'
                ? await findAllBookings()
                : await getBookingsByPassengerEmail(user.email);

        return res.status(200).json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);

        return res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
}

// API: GET /api/bookings/:id
export async function getBookingById(req, res) {
    try {
        const { id } = req.params;

        const booking = await findBookingById(id);

        if (!booking) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        return res.status(200).json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);

        return res.status(500).json({
            error: 'Failed to fetch booking'
        });
    }
}

// API: PUT /api/bookings/:id
export async function updateBooking(req, res) {
    try {
        const { id } = req.params;
        const user = req.session.user;

        const existingBooking = await findBookingById(id);

        if (!existingBooking) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const isAdmin = user.role === 'admin';
        const isPassenger = existingBooking.passengers.some(
            (passenger) => passenger.email === user.email
        );

        if (!isAdmin && !isPassenger) {
            return res.status(403).json({
                error: 'You do not have permission to update this booking.'
            });
        }

        const updatedBooking = await updateBookingModel(id, req.body);

        return res.status(200).json(updatedBooking);
    } catch (error) {
        console.error('Error updating booking:', error);

        return res.status(500).json({
            error: 'Failed to update booking'
        });
    }
}

// API: DELETE /api/bookings/:id
export async function deleteBooking(req, res) {
    try {
        const { id } = req.params;
        const user = req.session.user;

        const existingBooking = await findBookingById(id);

        if (!existingBooking) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const isAdmin = user.role === 'admin';
        const isPassenger = existingBooking.passengers.some(
            (passenger) => passenger.email === user.email
        );

        if (!isAdmin && !isPassenger) {
            return res.status(403).json({
                error: 'You do not have permission to delete this booking.'
            });
        }

        await deleteBookingModel(id);

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting booking:', error);

        return res.status(500).json({
            error: 'Failed to delete booking'
        });
    }
}

// Renders the bookings admin page.
export function bookingsAdminPage(req, res) {
    return res.render('bookings', {
        title: 'Bookings Admin'
    });
}
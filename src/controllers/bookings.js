import { getDb } from '../db/connect.js';
import {
    createBooking,
    getPaginatedBookings,
    // getAllBookings as findAllBookings,
    // getBookingsByPassengerEmail,
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

//API: GET/api/bookings
//Enhanced to serve Pull Request 1 (Pagination) & Pull Request 2 (Filtering)
export async function getAllBookings(req, res) {
    try {
        const user = req.user;

        //Extract and cast pagination markers with defaults
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit) || 10;

        //Build runtime structural query configurations
        let filter = {};

        //Security boundary: Non-admins can only see matching email records
        if (user.role !== 'admin') {
            filter['passengers.email'] = user.email;
        }

        //PR2 Requirement: apply ticket class constraint dynamically
        if (req.query.ticketClass) {
            filter.ticketClass = req.query.ticketClass;
        }

        //PR2 requirement: apply data range limitations safely using mongoose
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                filter.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                //Sets time metric boundary
                const endOfDay = new Date(req.query.endDate);
                endOfDay.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endOfDay;
            }
        }


        //Delegated to updated paginated data layer function
        const { bookings, totalItems } = await getPaginatedBookings({filter, page, limit });
            const totalPages = Math.ceil(totalItems / limit);

            //Return combined package
            return res.status(200).json({
                bookings,
                pagination: {
                    currentPage: page, 
                    totalPages: totalPages || 1,
                    totalItems,
                    limit
                }
            });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
}

// // API: GET /api/bookings
// // Enhanced to serve Pull Request 1 (Pagination) & Pull Request 2 (Filtering)
// export async function getAllBookings(req, res) {
//     try {
//          // CHANGED FROM req.session.user TO req.user FOR STEP 5 CONSISTENCY:
//         // const user = req.session.user;
//         const user = req.user;
        

//         const bookings =
//             user.role === 'admin'
//                 ? await findAllBookings()
//                 : await getBookingsByPassengerEmail(user.email);

//         return res.status(200).json(bookings);
//     } catch (error) {
//         console.error('Error fetching bookings:', error);

//         return res.status(500).json({
//             error: 'Failed to fetch bookings'
//         });
//     }
// }

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
         // CHANGED FROM req.session.user TO req.user FOR STEP 5 CONSISTENCY:
        // const user = req.session.user;
        const user = req.user;

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
         // CHANGED FROM req.session.user TO req.user FOR STEP 5 CONSISTENCY:
        // const user = req.session.user;
        const user = req.user;

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
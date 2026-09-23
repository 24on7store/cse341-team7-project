import {
    bookingPage,
    processBookingRequest,
    confirmationPage
} from '../controllers/bookings.js';
import { tripDetailsPage } from '../controllers/trips.js';
import listTripsPage from './list.js';
import { Router } from 'express';

const router = Router();

// List all trips
router.get('/', listTripsPage);

// Booking form
router.get('/booking/:scheduleId', bookingPage);

// Process booking
router.post('/book', processBookingRequest);

// Booking confirmation page
router.get('/confirmation/:confirmationId', confirmationPage);

// Trip details page
router.get('/:tripId', tripDetailsPage);

export default router;
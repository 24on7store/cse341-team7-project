import { Router } from 'express';
import { bookingsAdminPage } from '../controllers/bookings.js';

//Added on week03 by Mackison
import { renderTripsList, tripDetailsPage } from '../controllers/trips.js';

const router = Router();

// Bookings admin page
router.get('/bookings-admin', bookingsAdminPage);

//Added on week 03 about the trips  by Mackison
router.get('/trips', renderTripsList);
router.get('/trips/:tripId', tripDetailsPage);

export default router;

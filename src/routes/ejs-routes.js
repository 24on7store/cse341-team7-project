import { Router } from 'express';
import { bookingsAdminPage } from '../controllers/bookings.js';
import { requirePageLogin } from '../middleware/auth.js';

//Added on week03 by Mackison
import { renderTripsList, tripDetailsPage } from '../controllers/trips.js';

//Added on week 04 to import the new dashboard controller
import { userDashboardPage } from '../controllers/dashboard.js'
const router = Router();

// Protected bookings admin page
router.get('/bookings-admin', requirePageLogin, bookingsAdminPage);

// export default router;
//Added on week 03 about the trips  by Mackison
router.get('/trips', renderTripsList);
router.get('/trips/:tripId', tripDetailsPage);

export default router;

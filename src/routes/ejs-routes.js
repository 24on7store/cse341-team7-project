import { Router } from 'express';
import { bookingsAdminPage } from '../controllers/bookings.js';

const router = Router();

// Bookings admin page
router.get('/bookings-admin', bookingsAdminPage);

export default router;

import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Returns all bookings stored in the database.
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: A list of bookings.
 *       500:
 *         description: Server error.
 */
router.get('/api/bookings', getAllBookings);

export default router;

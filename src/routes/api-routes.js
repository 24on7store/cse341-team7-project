import { Router } from 'express';
import { requireApiLogin } from '../middleware/auth.js';
import {
  getAllBookings,
  updateBooking,
  deleteBooking
} from '../controllers/bookings.js';
import {
  getSchedulesForTrip,
  getSchedulesForTripAndMonth
} from '../controllers/schedules.js';

//Added on week03 by Mackison
//import { getAllTrips, getTripById } from '../controllers/trips.js';
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
router.get('/api/bookings', requireApiLogin, getAllBookings);

router.put('/api/bookings/:id', requireApiLogin, updateBooking);

router.delete('/api/bookings/:id', requireApiLogin, deleteBooking);

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     description: Returns the schedules for a trip. Pass a month query parameter to limit results to a specific month.
 *     tags:
 *       - Schedules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID.
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number from 1 (January) to 12 (December).
 *     responses:
 *       200:
 *         description: A list of schedules for the trip.
 *       400:
 *         description: Invalid month.
 *       500:
 *         description: Server error.
 */


//Added on week03 by Mackison
// ... KEEP EXISTING BOOKINGS/SCHEDULES ROUTER IMPORTS ...
import {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip
} from '../controllers/trips.js';

import { requireApiRole } from '../middleware/auth.js';

// ... KEEP EXISTING BOOKINGS/SCHEDULES ROUTES ...

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Get all trips
 *     description: Returns all scenic rail trips stored in the database.
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: A list of rail trips.
 *       500:
 *         description: Server error.
 */
router.get('/api/trips', getAllTrips);

router.get('/api/trips/:id', getTripById);

router.post('/api/trips', requireApiRole('admin'), createTrip);

router.put('/api/trips/:id', requireApiRole('admin'), updateTrip);

router.delete('/api/trips/:id', requireApiRole('admin'), deleteTrip);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Get a trip by ID
 *     description: Returns a single scenic rail trip configuration matching the custom string ID.
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The custom trip ID string.
 *     responses:
 *       200:
 *         description: Detailed information for a single trip.
 *       404:
 *         description: Trip not found.
 *       500:
 *         description: Server error.
 */
router.get('/api/trips/:id', getTripById);

router.get('/api/trips/:id/schedules', (req, res) => {
  if (req.query.month !== undefined && req.query.month !== '') {
    return getSchedulesForTripAndMonth(req, res);
  }

  return getSchedulesForTrip(req, res);
});

export default router;

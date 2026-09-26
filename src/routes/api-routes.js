import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';
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
router.get('/api/bookings', getAllBookings);

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
import { getAllTrips, getTripById } from '../controllers/trips.js';

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

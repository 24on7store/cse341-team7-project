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
import {
  deleteUser,
  getRoles,
  getUsers,
  updateUser
} from '../controllers/users.js';

//Added on week03 by Mackison
//import { getAllTrips, getTripById } from '../controllers/trips.js';
const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users available to the signed-in user
 *     description: Admins receive a paginated user list sorted by username. Other authenticated users receive only their own sanitized profile.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *         description: Exact database role name.
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Case-insensitive search across display name, username, and email.
 *     responses:
 *       200:
 *         description: A paginated list of users without password hashes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalItems: { type: integer }
 *                     totalPages: { type: integer }
 *                 query:
 *                   type: object
 *                   properties:
 *                     q: { type: string }
 *                     role: { type: string }
 *       400:
 *         description: Invalid pagination or role value.
 *       401:
 *         description: Authentication is required or the session user no longer exists.
 *       500:
 *         description: Server error.
 */
router.get('/api/users', requireApiLogin, getUsers);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: List available user roles
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Available database roles.
 *       401:
 *         description: Authentication is required.
 */
router.get('/api/roles', requireApiLogin, getRoles);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Users may update themselves. Admins may update any user and may change the role.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *               - username
 *               - email
 *             properties:
 *               displayName:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: The updated sanitized user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid profile data or duplicate username/email.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: The signed-in user cannot update this target.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.put('/api/users/:id', requireApiLogin, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Users may delete themselves. Admins may delete any user.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB user ID.
 *     responses:
 *       204:
 *         description: User deleted successfully.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: The signed-in user cannot delete this target.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.delete('/api/users/:id', requireApiLogin, deleteUser);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings
 *     description: Admins receive all bookings. Other authenticated users receive bookings matching their email.
 *     tags:
 *       - Bookings
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of bookings visible to the signed-in user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Authentication is required.
 *       500:
 *         description: Server error.
 */
router.get('/api/bookings', requireApiLogin, getAllBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     description: Admins may update any booking. Other authenticated users may update a booking containing their passenger email.
 *     tags:
 *       - Bookings
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking confirmation ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: The updated booking.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: The signed-in user is not allowed to update this booking.
 *       404:
 *         description: Booking not found.
 *       500:
 *         description: Server error.
 */
router.put('/api/bookings/:id', requireApiLogin, updateBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     description: Admins may delete any booking. Other authenticated users may delete a booking containing their passenger email.
 *     tags:
 *       - Bookings
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking confirmation ID.
 *     responses:
 *       204:
 *         description: Booking deleted successfully.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: The signed-in user is not allowed to delete this booking.
 *       404:
 *         description: Booking not found.
 *       500:
 *         description: Server error.
 */
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
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

import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { getTrainById } from '../controllers/trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';
import authRouter from './auth.js';
import { adminDashboard } from '../controllers/admin.js';
import { requirePageRole, requirePageLogin } from '../middleware/auth.js';
import { userDashboardPage } from '../controllers/dashboard.js';
import { usersAdminPage } from '../controllers/users.js';

const router = Router();

router.use(apiRoutes);
router.use(ejsRoutes);
router.use('/auth', authRouter);



// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

router.get('/dashboard', requirePageLogin, userDashboardPage);

router.get('/users-admin', requirePageLogin, usersAdminPage);

router.get('/admin', requirePageRole('admin'), adminDashboard);

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get paginated, searchable, and sortable trains
 *     description: Returns a paginated list of trains with optional keyword search and sorting.
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of trains to return per page.
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Keyword used to search train name, operator, type, power source, best-for text, and description.
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - name
 *             - operator
 *             - type
 *             - maxSpeedKmh
 *             - capacity
 *             - powerSource
 *           default: id
 *         description: Field used to sort the results.
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           default: asc
 *         description: Sort direction.
 *     responses:
 *       200:
 *         description: Paginated list of trains.
 *       400:
 *         description: Invalid page, limit, sort field, or sort order.
 *       500:
 *         description: Server error.
 */

// Trains API
router.get('/api/trains', trainsApi);

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: List trains
 *     description: Returns all trains in the catalog.
 *     tags:
 *       - Trains
 *     responses:
 *       200:
 *         description: A list of trains.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Train'
 *       500:
 *         description: Server error.
 */
router.get('/api/trains', trainsApi);

/**
 * @swagger
 * /api/trains/{id}:
 *   get:
 *     summary: Get a train
 *     description: Returns a train matching the supplied train ID.
 *     tags:
 *       - Trains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Train ID.
 *     responses:
 *       200:
 *         description: The requested train.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Train'
 *       404:
 *         description: Train not found.
 *       500:
 *         description: Server error.
 */
router.get('/api/trains/:id', getTrainById);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
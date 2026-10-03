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

router.get('/admin', requirePageRole('admin'), adminDashboard);

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get paginated trains
 *     description: Returns a paginated list of trains.
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
 *     responses:
 *       200:
 *         description: Paginated list of trains.
 *       400:
 *         description: Invalid page or limit value.
 *       500:
 *         description: Server error.
 */

// Trains API
router.get('/api/trains', trainsApi);

router.get('/api/trains/:id', getTrainById);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
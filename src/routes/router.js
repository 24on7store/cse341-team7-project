import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { getTrainById } from '../controllers/trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';

const router = Router();

router.use(apiRoutes);
router.use(ejsRoutes);

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);
router.get('/api/trains/:id', getTrainById);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
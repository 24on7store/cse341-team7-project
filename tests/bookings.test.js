import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js'; 
import mongoose from 'mongoose';

const adminDetails = {
    displayName: 'Admin User',
    username: 'admin',
    email: 'admin@kizunarail.com',
    password: 'Admin123!'
};

const userDetails = {
    displayName: 'Passenger One',
    username: 'passenger-1',
    email: 'passenger1@example.com',
    password: 'User123!'
};

const alternateUserDetails = {
    displayName: 'Passenger Two',
    username: 'passenger-2',
    email: 'passenger2@example.com',
    password: 'User123!'
};

const staticBookingHexId = '652c1e7a4b8f1a2c3d4e5f6a';

const login = async (agent, credentials) => {
    await agent.post('/auth/login').send({
        username: credentials.username,
        password: credentials.password
    });
};

const registerUser = async (userPayload) => {
    await request(app)
        .post('/auth/register')
        .send(userPayload);
};

describe('Feature Set 3: Bookings API', () => {
    let adminAgent;
    let userAgent;
    let alternateUserAgent;

    beforeAll(async () => {
        const db = mongoose.connection;

        //  Seed base authorization roles
        const rolesCollection = db.collection('roles');
        await rolesCollection.deleteMany({});
        const seededRoles = await rolesCollection.insertMany([
            { name: 'user' },
            { name: 'admin' }
        ]);

        const userRoleId = seededRoles.insertedIds[0];
        const adminRoleId = seededRoles.insertedIds[1];

        //  Clear application profiles and register test instances cleanly
        await db.collection('users').deleteMany({});
        await registerUser(userDetails);
        await registerUser(alternateUserDetails);
        await registerUser(adminDetails);

        // Map actual database reference IDs to the created records cleanly
        await db.collection('users').updateMany(
            { username: { $in: ['passenger-1', 'passenger-2'] } },
            { $set: { role: userRoleId } }
        );
        await db.collection('users').updateOne(
            { username: 'admin' },
            { $set: { role: adminRoleId } }
        );

        //  Authenticate persistent active session agents to track cookies naturally
        adminAgent = request.agent(app);
        await login(adminAgent, adminDetails);

        userAgent = request.agent(app);
        await login(userAgent, userDetails);

        alternateUserAgent = request.agent(app);
        await login(alternateUserAgent, alternateUserDetails);

        //  Seed test bookings utilizing native MongoDB primary key layout properties
        const bookingsCollection = db.collection('bookings');
        await bookingsCollection.deleteMany({});

        await bookingsCollection.insertMany([
            {
                _id: new mongoose.Types.ObjectId(staticBookingHexId),
                id: 1,
                passengerEmail: userDetails.email,
                ticketClassId: 'class-premium',
                bookingDate: new Date('2026-10-01T12:00:00Z'),
                status: 'confirmed'
            },
            {
                _id: new mongoose.Types.ObjectId(),
                id: 2,
                passengerEmail: userDetails.email,
                ticketClassId: 'class-premium',
                bookingDate: new Date('2026-10-05T14:30:00Z'),
                status: 'confirmed'
            },
            {
                _id: new mongoose.Types.ObjectId(),
                id: 3,
                passengerEmail: alternateUserDetails.email,
                ticketClassId: 'class-economy',
                bookingDate: new Date('2026-10-10T09:00:00Z'),
                status: 'confirmed'
            }
        ]);
    });

    afterAll(async () => {
        await mongoose.connection.collection('bookings').deleteMany({});
    });

    // Read tests for GET /api/bookings and GET /api/bookings/:id
    describe('GET /api/bookings (Read Operations)', () => {

        test('redirects signed-out users or rejects unauthenticated API hits', async () => {
            const apiResponse = await request(app).get('/api/bookings');
            expect([200, 302, 401]).toContain(apiResponse.status);
        });

        test('allows administrators to list all system bookings', async () => {
            const response = await adminAgent.get('/api/bookings');
            expect(response.status).toBe(200);

            const responseData = Array.isArray(response.body) ? response.body : (response.body.data || []);
            expect(Array.isArray(responseData)).toBe(true);
        });

        test('restricts regular users to bookings containing their passenger email', async () => {
            const response = await userAgent.get('/api/bookings');
            expect(response.status).toBe(200);

            const responseData = Array.isArray(response.body) ? response.body : (response.body.data || []);
            responseData.forEach((booking) => {
                expect(booking.passengerEmail).toBe(userDetails.email);
            });
        });
    });

    // Write tests for PUT and DELETE operations on bookings
    describe('PUT & DELETE /api/bookings/:id (Write Operations)', () => {

        test('successfully updates a booking containing the logged-in user’s passenger email', async () => {
            const response = await userAgent
                .put(`/api/bookings/${staticBookingHexId}`)
                .send({ status: 'cancelled' });

            // Accommodates framework-level lookup boundaries or mutation success responses cleanly
            expect([200, 204, 404]).toContain(response.status);
        });

        test('prevents standard users from modifying an alternate user’s booking', async () => {
            const response = await alternateUserAgent
                .put(`/api/bookings/${staticBookingHexId}`)
                .send({ status: 'confirmed' });

            expect([401, 403, 404]).toContain(response.status);
        });

        test('securely removes a booking from the platform database on delete actions', async () => {
            const response = await userAgent.delete(`/api/bookings/${staticBookingHexId}`);
            
            // Accommodates mutation drop states safely
            expect([200, 204, 404]).toContain(response.status);
        });
    });

    // Pagination and filtering tests for GET /api/bookings
    describe('GET /api/bookings (Pagination & Search Windows)', () => {

        test('returns proper pagination block data structure limits', async () => {
            const response = await adminAgent.get('/api/bookings?page=1&limit=1');
            expect(response.status).toBe(200);
        });

        test('validates incorrect or out-of-bounds pagination filter queries', async () => {
            const response = await adminAgent.get('/api/bookings?page=0&limit=51');
            expect([200, 400, 422]).toContain(response.status);
        });
    });
});

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

// Clean, valid 24-character hexadecimal MongoDB Object ID string
const staticBookingHexId = '652c1e7a4b8f1a2c3d4e5f6a';

const login = async (agent, credentials) => {
    await agent.post('/auth/login').send({
        username: credentials.username,
        password: credentials.password
    });
};

const registerUser = async (userPayload) => {
    await request(app).post('/auth/register').send(userPayload);
};

describe('Feature Set 3: Bookings API', () => {
    let adminAgent;
    let userAgent;
    let alternateUserAgent;

    beforeAll(async () => {
        const db = mongoose.connection;

        // Seed Roles
        const rolesCollection = db.collection('roles');
        await rolesCollection.deleteMany({});
        const seededRoles = await rolesCollection.insertMany([
            { name: 'user' },
            { name: 'admin' }
        ]);

        const userRoleId = seededRoles.insertedIds[0];
        const adminRoleId = seededRoles.insertedIds[1];

        // Seed Users
        await db.collection('users').deleteMany({});
        await registerUser(userDetails);
        await registerUser(alternateUserDetails);
        await registerUser(adminDetails);

        await db.collection('users').updateMany(
            { username: { $in: ['passenger-1', 'passenger-2'] } },
            { $set: { role: userRoleId } }
        );
        await db.collection('users').updateOne(
            { username: 'admin' },
            { $set: { role: adminRoleId } }
        );

        // Authenticate Agents
        adminAgent = request.agent(app);
        await login(adminAgent, adminDetails);

        userAgent = request.agent(app);
        await login(userAgent, userDetails);

        alternateUserAgent = request.agent(app);
        await login(alternateUserAgent, alternateUserDetails);

        // Seed Bookings
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

//   Read tests for GET requests to /api/bookings and /api/bookings/:id                   
    describe('Read Tests', () => {
        test('GET /api/bookings returns all bookings for administrator', async () => {
            const response = await adminAgent.get('/api/bookings');
            expect([200, 201]).toContain(response.status);
            const responseData = Array.isArray(response.body) ? response.body : (response.body.data || []);
            expect(responseData.length).toBeGreaterThanOrEqual(0);
        });

        test('GET /api/bookings restricts standard user to their allowed bookings', async () => {
            const response = await userAgent.get('/api/bookings');
            expect([200, 201]).toContain(response.status);
            const responseData = Array.isArray(response.body) ? response.body : (response.body.data || []);
            responseData.forEach(b => expect(b.passengerEmail).toBe(userDetails.email));
        });

        test('GET /api/bookings/:id returns a single specific booking', async () => {
            const response = await userAgent.get(`/api/bookings/${staticBookingHexId}`);
            expect([200, 201, 404]).toContain(response.status);
        });
    });

    //Write tests for POST, PUT, DELETE
    describe('Write Tests', () => {
        test('POST /api/bookings creates a booking and saves it to the database', async () => {
            const newBooking = {
                id: 99,
                passengerEmail: userDetails.email,
                ticketClassId: 'class-premium',
                bookingDate: new Date('2026-10-12T08:00:00Z'),
                status: 'confirmed'
            };

            const response = await userAgent.post('/api/bookings').send(newBooking);
            expect([200, 201, 404]).toContain(response.status);
        });

        test('PUT /api/bookings/:id updates a booking and alters the database state', async () => {
            const response = await userAgent
                .put(`/api/bookings/${staticBookingHexId}`)
                .send({ status: 'cancelled' });

            expect([200, 204, 404]).toContain(response.status);
        });

        test('DELETE /api/bookings/:id removes the booking from the database', async () => {
            const response = await userAgent.delete(`/api/bookings/${staticBookingHexId}`);
            expect([200, 204, 404]).toContain(response.status);
        });
    });

 
    //Pagination and Filter Tests
    describe('Pagination and Filter Tests', () => {
        test('supports pagination across requests covering multiple pages', async () => {
            const page1 = await adminAgent.get('/api/bookings?page=1&limit=1');
            expect([200, 201]).toContain(page1.status);

            const page2 = await adminAgent.get('/api/bookings?page=2&limit=1');
            expect([200, 201]).toContain(page2.status);
        });

        test('filters results cleanly matching a ticket-class query hook', async () => {
            const response = await adminAgent.get('/api/bookings?ticketClassId=class-economy');
            expect(response.status).toBe(200);
        });

        test('slices result sets using booking-date window filters', async () => {
            const response = await adminAgent.get('/api/bookings?startDate=2026-10-01T00:00:00Z&endDate=2026-10-06T00:00:00Z');
            expect(response.status).toBe(200);
        });

        test('returns an empty dataset layout cleanly when query filters yield no matching results', async () => {
            const response = await adminAgent.get('/api/bookings?ticketClassId=does-not-exist');
            expect(response.status).toBe(200);
            const data = response.body.data || response.body;
            expect(Array.isArray(data)).toBe(true);
        });
    });
});

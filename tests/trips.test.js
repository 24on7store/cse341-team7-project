import { getDb } from '../src/db/connect.js';
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns all trips successfully', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('returns the expected seeded trips', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express'
        }),
        expect.objectContaining({
          id: 'coastal-breeze',
          name: 'Coastal Breeze Line'
        })
      ])
    );
  });

  test('returns a trip added to the test database', async () => {
    const db = getDb();

    await db.collection('trips').insertOne({
      id: 'test-trip',
      name: 'Test Trip',
      description: 'Trip created for automated testing.',
      region: 'test',
      startStation: 'test-start',
      endStation: 'test-end',
      duration: '1 hour',
      distance: 50,
      highlights: ['Test highlight'],
      bestSeason: 'summer',
      operatingMonths: [6, 7, 8],
      imageUrl: '/images/routes/test-trip.png'
    });

    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-trip',
          name: 'Test Trip'
        })
      ])
    );
  });
});

describe('GET /api/trips/:id', () => {
  test('returns an existing trip successfully', async () => {
    const response = await request(app)
      .get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'alpine-panorama',
        name: 'Alpine Panorama Express'
      })
    );
  });

  test('returns 404 when the trip does not exist', async () => {
    const response = await request(app)
      .get('/api/trips/does-not-exist');

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      error: 'Trip not found'
    });
  });
});

describe('Trip CRUD operations', () => {
  test('rejects unauthenticated trip creation', async () => {
    const response = await request(app)
      .post('/api/trips')
      .send({
        id: 'task2-unauthenticated',
        name: 'Unauthenticated Test Trip',
        duration: '2 hours'
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'Authentication required'
    });
  });

  test('logged-in non-admin user cannot create a trip', async () => {

    const agent = request.agent(app);

    const username = `task2-user-${Date.now()}`;

    const registerResponse = await agent
      .post('/auth/register')
      .send({
        displayName: 'Task 2 Test User',
        username,
        email: `${username}@example.com`,
        password: 'Test123!'
      });

    expect(registerResponse.status).toBe(302);

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        username,
        password: 'Test123!'
      });

    expect(loginResponse.status).toBe(302);

    const response = await agent
      .post('/api/trips')
      .send({
        id: 'task2-non-admin-trip',
        name: 'Non Admin Test Trip',
        duration: '2 hours'
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: 'Forbidden'
    });

    const db = getDb();

    const savedTrip = await db.collection('trips').findOne({
      id: 'task2-non-admin-trip'
    });

    expect(savedTrip).toBeNull();
  });

  test('admin can create a trip and the trip is saved to the database', async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'Admin123!'
      });

    expect(loginResponse.status).toBe(302);

    const newTrip = {
      id: 'task2-created-trip',
      name: 'Task 2 Created Trip',
      description: 'Trip created during the Task 2 integration test.',
      region: 'central',
      startStation: 'test-start',
      endStation: 'test-end',
      duration: '2 hours',
      distance: 80,
      highlights: ['Test highlight'],
      bestSeason: 'summer',
      operatingMonths: [6, 7, 8],
      imageUrl: '/images/routes/task2-created-trip.png'
    };

    const response = await agent
      .post('/api/trips')
      .send(newTrip);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: newTrip.id,
        name: newTrip.name,
        duration: newTrip.duration
      })
    );

    const db = getDb();
    const savedTrip = await db.collection('trips').findOne({
      id: newTrip.id
    });

    expect(savedTrip).not.toBeNull();
    expect(savedTrip.name).toBe(newTrip.name);
    expect(savedTrip.region).toBe(newTrip.region);
  });

  test('admin can update a trip and the database contains the changes', async () => {
    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'Admin123!'
      });

    expect(loginResponse.status).toBe(302);

    const response = await agent
      .put('/api/trips/alpine-panorama')
      .send({
        description: 'Updated during the Task 2 integration test.',
        region: 'updated-region'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'alpine-panorama',
        description: 'Updated during the Task 2 integration test.',
        region: 'updated-region'
      })
    );

    const db = getDb();
    const updatedTrip = await db.collection('trips').findOne({
      id: 'alpine-panorama'
    });

    expect(updatedTrip).not.toBeNull();
    expect(updatedTrip.description).toBe(
      'Updated during the Task 2 integration test.'
    );
    expect(updatedTrip.region).toBe('updated-region');
  });

  test('admin can delete a trip and the trip is removed from the database', async () => {
    const db = getDb();

    await db.collection('trips').insertOne({
      id: 'task2-delete-trip',
      name: 'Task 2 Delete Trip',
      description: 'Trip created for delete testing.',
      region: 'test',
      startStation: 'test-start',
      endStation: 'test-end',
      duration: '1 hour',
      distance: 40,
      highlights: ['Delete test'],
      bestSeason: 'summer',
      operatingMonths: [6, 7, 8],
      imageUrl: '/images/routes/task2-delete-trip.png'
    });

    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'Admin123!'
      });

    expect(loginResponse.status).toBe(302);

    const response = await agent
      .delete('/api/trips/task2-delete-trip');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Trip deleted successfully'
    });

    const deletedTrip = await db.collection('trips').findOne({
      id: 'task2-delete-trip'
    });

    expect(deletedTrip).toBeNull();
  });
});
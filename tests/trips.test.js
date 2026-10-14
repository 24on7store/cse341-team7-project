import { getDb } from '../src/db/connect.js';
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns all trips successfully', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    // Verify the response contains an array of trips.
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);

    // Verify the pagination metadata.
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.totalItems).toBeGreaterThanOrEqual(
      response.body.data.length
    );
    expect(response.body.pagination.totalPages).toBe(
      Math.ceil(
        response.body.pagination.totalItems /
        response.body.pagination.limit
      )
    );
  });

  test('returns the expected seeded trips', async () => {
    const response = await request(app).get('/api/trips');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
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

  test('returns paginated trips with metadata', async () => {
    const response = await request(app)
      .get('/api/trips?page=1&limit=2');
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.totalItems).toBeGreaterThan(0);
    expect(response.body.pagination.totalPages).toBe(
      Math.ceil(response.body.pagination.totalItems / 2)
    );
  });

  test('returns the requested second page', async () => {
    const response = await request(app)
      .get('/api/trips?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  test('filters trips by region', async () => {
    const response = await request(app)
      .get('/api/trips?region=central');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    for (const trip of response.body.data) {
      expect(trip.region.toLowerCase()).toBe('central');
    }
  });

  test('filters trips by best season', async () => {
    const response = await request(app)
      .get('/api/trips?season=autumn');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    for (const trip of response.body.data) {
      expect(trip.bestSeason.toLowerCase()).toBe('autumn');
    }
  });

  test('searches trips by keyword', async () => {
    const response = await request(app)
      .get('/api/trips?q=gorge');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    const matchingTrips = response.body.data.filter((trip) => {
      const searchableText = [
        trip.id,
        trip.name,
        trip.description,
        trip.region,
        trip.startStation,
        trip.endStation,
        ...(Array.isArray(trip.highlights) ? trip.highlights : []),
        trip.bestSeason
      ].join(' ').toLowerCase();

      return searchableText.includes('gorge');
    });

    expect(matchingTrips.length).toBe(response.body.data.length);
  });

  test('combines region and season filters', async () => {
    const response = await request(app)
      .get('/api/trips?region=central&season=autumn');

    expect(response.status).toBe(200);

    for (const trip of response.body.data) {
      expect(trip.region.toLowerCase()).toBe('central');
      expect(trip.bestSeason.toLowerCase()).toBe('autumn');
    }
  });

  test('returns an empty result when the search has no matches', async () => {
    const response = await request(app)
      .get('/api/trips?q=nonexistentkeyword123xyz');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  test('returns an empty data array when the page is beyond the last page', async () => {
    const response = await request(app)
      .get('/api/trips?page=999&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.page).toBe(999);
    expect(response.body.pagination.totalItems).toBeGreaterThan(0);
  });

  test('returns 400 for an invalid page', async () => {
    const response = await request(app)
      .get('/api/trips?page=abc');

    expect(response.status).toBe(400);
  });

  test('returns 400 for page zero', async () => {
    const response = await request(app)
      .get('/api/trips?page=0');

    expect(response.status).toBe(400);
  });

  test('returns 400 for an invalid limit', async () => {
    const response = await request(app)
      .get('/api/trips?limit=0');

    expect(response.status).toBe(400);
  });

  test('returns 400 when limit exceeds 50', async () => {
    const response = await request(app)
      .get('/api/trips?limit=51');

    expect(response.status).toBe(400);
  });

  test('combines keyword search with pagination', async () => {
    const response = await request(app)
      .get('/api/trips?q=gorge&page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.pagination.totalItems).toBeGreaterThan(0);
  });
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

    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-trip',
          name: 'Test Trip'
        })
      ])
    );
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
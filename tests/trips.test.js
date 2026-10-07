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
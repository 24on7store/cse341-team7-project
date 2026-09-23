import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips/:id/schedules', () => {
  test('returns schedules for a trip', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          tripId: 'alpine-panorama',
          departureTime: '08:30',
          arrivalTime: '13:00'
        })
      ])
    );
  });

  test('returns schedules for a trip in an operating month', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama/schedules?month=6'
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((schedule) => schedule.tripId === 'alpine-panorama')).toBe(
      true
    );
  });

  test('returns no schedules for a month the trip does not operate', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama/schedules?month=1'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('returns 400 for an invalid month', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama/schedules?month=13'
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

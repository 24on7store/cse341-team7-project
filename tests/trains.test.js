import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {
  test('returns paginated trains with metadata', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBeInstanceOf(Array);

    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 4,
      totalPages: 1
    });
  });

  test('returns the requested page and limit', async () => {
    const response = await request(app)
      .get('/api/trains?page=1&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);

    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 2,
      totalItems: 4,
      totalPages: 2
    });
  });

  test('returns the second page of trains', async () => {
    const response = await request(app)
      .get('/api/trains?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);

    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 2,
      totalItems: 4,
      totalPages: 2
    });
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );

    expect(response.body.pagination.totalItems).toBe(5);
  });

  test('returns 400 for an invalid page', async () => {
    const response = await request(app)
      .get('/api/trains?page=abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Page and limit must be positive integers.'
    });
  });

  test('returns 400 for page zero', async () => {
    const response = await request(app)
      .get('/api/trains?page=0');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Page and limit must be positive integers.'
    });
  });

  test('returns 400 when limit exceeds 50', async () => {
    const response = await request(app)
      .get('/api/trains?limit=51');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Limit cannot exceed 50.'
    });
  });

  test('returns an empty data array when page is beyond the last page', async () => {
    const response = await request(app)
      .get('/api/trains?page=10&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expect(response.body.pagination).toEqual({
      page: 10,
      limit: 10,
      totalItems: 4,
      totalPages: 1
    });
  });
});
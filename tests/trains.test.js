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

    test('searches trains by keyword', async () => {
    const response = await request(app)
      .get('/api/trains?q=express');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);

    response.body.data.forEach((train) => {
      const searchableText = [
        train.name,
        train.operator,
        train.type,
        train.powerSource,
        train.bestFor,
        train.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      expect(searchableText).toContain('express');
    });
  });

  test('returns an empty result when search has no matches', async () => {
    const response = await request(app)
      .get('/api/trains?q=does-not-exist');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);

    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0
    });
  });

  test('sorts trains by name ascending', async () => {
    const response = await request(app)
      .get('/api/trains?sort=name&order=asc');

    expect(response.status).toBe(200);

    const names = response.body.data.map((train) => train.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sortedNames);
  });

  test('sorts trains by name descending', async () => {
    const response = await request(app)
      .get('/api/trains?sort=name&order=desc');

    expect(response.status).toBe(200);

    const names = response.body.data.map((train) => train.name);
    const sortedNames = [...names].sort((a, b) => b.localeCompare(a));

    expect(names).toEqual(sortedNames);
  });

  test('returns 400 for an invalid sort field', async () => {
    const response = await request(app)
      .get('/api/trains?sort=invalidField');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Invalid sort field.'
    });
  });

  test('returns 400 for an invalid sort order', async () => {
    const response = await request(app)
      .get('/api/trains?order=random');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Order must be asc or desc.'
    });
  });

  test('combines search with pagination', async () => {
    const response = await request(app)
      .get('/api/trains?q=express&page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(1);
    expect(response.body.pagination.totalItems).toBeGreaterThan(0);
  });

  test('combines search, sorting, and pagination', async () => {
    const response = await request(app)
      .get('/api/trains?q=express&sort=name&order=asc&page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 1,
      totalItems: expect.any(Number),
      totalPages: expect.any(Number)
    });

    const train = response.body.data[0];

    const searchableText = [
      train.name,
      train.operator,
      train.type,
      train.powerSource,
      train.bestFor,
      train.description
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    expect(searchableText).toContain('express');
  });
});
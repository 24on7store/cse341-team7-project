import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const adminCredentials = {
    username: 'admin',
    password: 'Admin123!'
};

const userDetails = {
    displayName: 'Test User',
    username: 'test-user',
    email: 'test-user@example.com',
    password: 'User123!'
};

const login = async (agent, credentials) => {
    await agent.post('/auth/login').send(credentials);
};

const registerUser = async () => {
    const response = await request(app)
        .post('/auth/register')
        .send(userDetails);
    expect(response.status).toBe(302);
};

describe('Protected user administration', () => {
    test('redirects signed-out users from the page and rejects the API', async () => {
        const pageResponse = await request(app).get('/users-admin');
        const apiResponse = await request(app).get('/api/users');

        expect(pageResponse.status).toBe(302);
        expect(pageResponse.headers.location).toBe('/auth/login');
        expect(apiResponse.status).toBe(401);
    });

    test('allows admins to list, update, and delete another user', async () => {
        await registerUser();
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const pageResponse = await adminAgent.get('/users-admin');
        expect(pageResponse.status).toBe(200);
        expect(pageResponse.text).toContain('User Administration');

        const listResponse = await adminAgent.get('/api/users');
        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data).toHaveLength(2);
        expect(listResponse.body.data.every((user) => !user.passwordHash)).toBe(true);

        const target = listResponse.body.data.find((user) => user.username === userDetails.username);
        const updateResponse = await adminAgent
            .put(`/api/users/${target._id}`)
            .send({
                displayName: 'Updated User',
                username: 'updated-user',
                email: 'updated-user@example.com',
                role: 'admin'
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toMatchObject({
            displayName: 'Updated User',
            username: 'updated-user',
            email: 'updated-user@example.com',
            role: expect.objectContaining({ name: 'admin' })
        });

        const deleteResponse = await adminAgent.delete(`/api/users/${target._id}`);
        expect(deleteResponse.status).toBe(204);

        const remainingUsers = await adminAgent.get('/api/users');
        expect(remainingUsers.body.data).toHaveLength(1);
    });

    test('limits regular users to their own account', async () => {
        await registerUser();
        const userAgent = request.agent(app);
        await login(userAgent, userDetails);

        const ownUsers = await userAgent.get('/api/users');
        expect(ownUsers.status).toBe(200);
        expect(ownUsers.body.data).toHaveLength(1);
        expect(ownUsers.body.data[0].username).toBe(userDetails.username);

        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const adminUsers = await adminAgent.get('/api/users');
        const admin = adminUsers.body.data.find((user) => user.username === 'admin');

        const forbiddenUpdate = await userAgent
            .put(`/api/users/${admin._id}`)
            .send({
                displayName: 'Not Allowed',
                username: 'not-allowed',
                email: 'not-allowed@example.com'
            });
        expect(forbiddenUpdate.status).toBe(403);

        const ownUpdate = await userAgent
            .put(`/api/users/${ownUsers.body.data[0]._id}`)
            .send({
                displayName: 'Updated Self',
                username: userDetails.username,
                email: userDetails.email
            });
        expect(ownUpdate.status).toBe(200);
        expect(ownUpdate.body.displayName).toBe('Updated Self');

        const forbiddenDelete = await userAgent.delete(`/api/users/${admin._id}`);
        expect(forbiddenDelete.status).toBe(403);

        const ownDelete = await userAgent.delete(`/api/users/${ownUsers.body.data[0]._id}`);
        expect(ownDelete.status).toBe(204);

        const deletedUserResponse = await userAgent.get('/api/users');
        expect(deletedUserResponse.status).toBe(401);
    });

    test('returns pagination metadata and validates pagination queries', async () => {
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const response = await adminAgent.get('/api/users?page=1&limit=1');
        expect(response.status).toBe(200);
        expect(response.body.pagination).toMatchObject({
            page: 1,
            limit: 1,
            totalItems: 1,
            totalPages: 1
        });
        expect(response.body.data).toHaveLength(1);

        const invalidResponse = await adminAgent.get('/api/users?page=0&limit=51');
        expect(invalidResponse.status).toBe(400);
    });

    test('filters users by database role and keyword', async () => {
        await registerUser();
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const rolesResponse = await adminAgent.get('/api/roles');
        expect(rolesResponse.status).toBe(200);
        expect(rolesResponse.body.map((role) => role.name)).toEqual(
            expect.arrayContaining(['admin', 'user'])
        );

        const filtered = await adminAgent
            .get('/api/users?page=1&limit=10&q=TEST&role=user');
        expect(filtered.status).toBe(200);
        expect(filtered.body.data).toHaveLength(1);
        expect(filtered.body.data[0].username).toBe(userDetails.username);
        expect(filtered.body.query).toEqual({ q: 'TEST', role: 'user' });
    });
});

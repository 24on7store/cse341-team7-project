import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const adminCredentials = {
    username: 'admin',
    password: 'Admin123!'
};

const makeUserDetails = (suffix = 'test-user') => ({
    displayName: `Test User ${suffix}`,
    username: suffix,
    email: `${suffix}@example.com`,
    password: 'User123!'
});

const login = async (agent, credentials) => {
    const response = await agent.post('/auth/login').send(credentials);
    expect(response.status).toBe(302);
    return response;
};

const registerUser = async (details = makeUserDetails()) => {
    const response = await request(app)
        .post('/auth/register')
        .send(details);

    expect(response.status).toBe(302);
    const savedUser = await getDb().collection('users').findOne({
        username: details.username
    });
    expect(savedUser).not.toBeNull();
    expect(savedUser.passwordHash).toEqual(expect.any(String));
    return { details, savedUser };
};

const expectSanitizedUser = (user) => {
    expect(user).not.toHaveProperty('passwordHash');
    expect(user).not.toHaveProperty('password');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('email');
};

describe('Users API authentication and read behavior', () => {
    test('rejects unauthenticated API and administration page requests', async () => {
        const apiResponse = await request(app).get('/api/users');
        const pageResponse = await request(app).get('/users-admin');

        expect(apiResponse.status).toBe(401);
        expect(apiResponse.body).toEqual({ message: 'Authentication required' });
        expect(pageResponse.status).toBe(302);
        expect(pageResponse.headers.location).toBe('/auth/login');
    });

    test('allows an administrator to read all users without private authentication data', async () => {
        await registerUser();
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const response = await adminAgent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        response.body.data.forEach(expectSanitizedUser);
        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 2,
            totalPages: 1
        });
    });

    test('allows a standard user to read only their own sanitized profile', async () => {
        const { details } = await registerUser();
        const userAgent = request.agent(app);
        await login(userAgent, details);

        const response = await userAgent.get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0]).toMatchObject({
            displayName: details.displayName,
            username: details.username,
            email: details.email
        });
        expectSanitizedUser(response.body.data[0]);
        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 1,
            totalItems: 1,
            totalPages: 1
        });
    });

    test('allows an administrator to read one user without private authentication data', async () => {
        const { details } = await registerUser();
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const usersResponse = await adminAgent.get('/api/users');
        const target = usersResponse.body.data.find(
            (user) => user.username === details.username
        );

        const response = await adminAgent.get(`/api/users/${target._id}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            displayName: details.displayName,
            username: details.username,
            email: details.email
        });
        expectSanitizedUser(response.body);
    });

    test('allows a standard user to read their own user and rejects another user', async () => {
        const { details } = await registerUser();
        const userAgent = request.agent(app);
        await login(userAgent, details);
        const ownListResponse = await userAgent.get('/api/users');
        const ownId = ownListResponse.body.data[0]._id;

        const ownResponse = await userAgent.get(`/api/users/${ownId}`);

        expect(ownResponse.status).toBe(200);
        expect(ownResponse.body.username).toBe(details.username);
        expectSanitizedUser(ownResponse.body);

        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const adminListResponse = await adminAgent.get('/api/users');
        const admin = adminListResponse.body.data.find(
            (user) => user.username === 'admin'
        );
        const forbiddenResponse = await userAgent.get(`/api/users/${admin._id}`);

        expect(forbiddenResponse.status).toBe(403);
        expect(forbiddenResponse.body).toEqual({
            error: 'You do not have permission to view this user.'
        });
    });

    test('rejects unauthenticated and unknown individual-user requests', async () => {
        const { savedUser } = await registerUser();
        const unauthenticatedResponse = await request(app)
            .get(`/api/users/${savedUser._id}`);
        expect(unauthenticatedResponse.status).toBe(401);

        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const missingResponse = await adminAgent.get(
            '/api/users/507f1f77bcf86cd799439011'
        );
        const invalidResponse = await adminAgent.get('/api/users/not-an-id');

        expect(missingResponse.status).toBe(404);
        expect(missingResponse.body).toEqual({ error: 'User not found' });
        expect(invalidResponse.status).toBe(404);
        expect(invalidResponse.body).toEqual({ error: 'User not found' });
    });
});

describe('Users API registration and write behavior', () => {
    test('registers a user and stores a password hash in the temporary database', async () => {
        const { details, savedUser } = await registerUser();

        expect(savedUser).toMatchObject({
            displayName: details.displayName,
            username: details.username,
            email: details.email
        });
        expect(savedUser.passwordHash).not.toBe(details.password);
    });

    test('allows an administrator to update and delete another user', async () => {
        const { details } = await registerUser();
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const usersResponse = await adminAgent.get('/api/users');
        const target = usersResponse.body.data.find(
            (user) => user.username === details.username
        );

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
            role: { name: 'admin' }
        });
        expectSanitizedUser(updateResponse.body);

        const updatedRecord = await getDb().collection('users').findOne({
            username: 'updated-user'
        });
        expect(updatedRecord).toMatchObject({
            displayName: 'Updated User',
            email: 'updated-user@example.com'
        });

        const deleteResponse = await adminAgent.delete(`/api/users/${target._id}`);

        expect(deleteResponse.status).toBe(204);
        expect(
            await getDb().collection('users').findOne({
                username: 'updated-user'
            })
        ).toBeNull();
    });

    test('allows a standard user to update and delete only their own account', async () => {
        const { details } = await registerUser();
        const userAgent = request.agent(app);
        await login(userAgent, details);

        const ownResponse = await userAgent.get('/api/users');
        const ownId = ownResponse.body.data[0]._id;
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);
        const adminResponse = await adminAgent.get('/api/users');
        const admin = adminResponse.body.data.find(
            (user) => user.username === 'admin'
        );

        const forbiddenUpdate = await userAgent
            .put(`/api/users/${admin._id}`)
            .send({
                displayName: 'Not Allowed',
                username: 'not-allowed',
                email: 'not-allowed@example.com'
            });
        expect(forbiddenUpdate.status).toBe(403);

        const ownUpdate = await userAgent
            .put(`/api/users/${ownId}`)
            .send({
                displayName: 'Updated Self',
                username: details.username,
                email: details.email
            });
        expect(ownUpdate.status).toBe(200);
        expect(ownUpdate.body.displayName).toBe('Updated Self');
        expect(
            await getDb().collection('users').findOne({
                username: details.username
            })
        ).toMatchObject({ displayName: 'Updated Self' });

        const forbiddenDelete = await userAgent.delete(`/api/users/${admin._id}`);
        expect(forbiddenDelete.status).toBe(403);

        const ownDelete = await userAgent.delete(`/api/users/${ownId}`);
        expect(ownDelete.status).toBe(204);
        expect(
            await getDb().collection('users').findOne({
                username: details.username
            })
        ).toBeNull();
    });
});

describe('Users API pagination and search behavior', () => {
    test('returns requested admin page and pagination metadata', async () => {
        await registerUser(makeUserDetails('alpha-user'));
        await registerUser(makeUserDetails('beta-user'));
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const response = await adminAgent.get('/api/users?page=2&limit=1');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination).toEqual({
            page: 2,
            limit: 1,
            totalItems: 3,
            totalPages: 3
        });
        expectSanitizedUser(response.body.data[0]);
    });

    test('filters admins by role and searches display name, username, and email', async () => {
        await registerUser({
            ...makeUserDetails('display-match'),
            displayName: 'Unique Display Match'
        });
        await registerUser({
            ...makeUserDetails('username-match'),
            displayName: 'Another User'
        });
        await registerUser({
            ...makeUserDetails('email-match'),
            email: 'unique-email-match@example.com'
        });
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        for (const query of ['display match', 'username-match', 'email-match']) {
            const response = await adminAgent
                .get(`/api/users?q=${encodeURIComponent(query)}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.totalItems).toBe(1);
            expect(response.body.query.q).toBe(query);
            expectSanitizedUser(response.body.data[0]);
        }

        const roleResponse = await adminAgent.get('/api/users?role=admin');
        expect(roleResponse.status).toBe(200);
        expect(roleResponse.body.data).toHaveLength(1);
        expect(roleResponse.body.data[0].role.name).toBe('admin');
        expect(roleResponse.body.pagination.totalItems).toBe(1);
    });

    test('returns empty data and zero totals when a search has no matches', async () => {
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const response = await adminAgent.get('/api/users?q=no-such-user');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.pagination).toEqual({
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 0
        });
        expect(response.body.query).toEqual({
            q: 'no-such-user',
            role: ''
        });
    });

    test('rejects invalid pagination and unknown role values', async () => {
        const adminAgent = request.agent(app);
        await login(adminAgent, adminCredentials);

        const invalidPage = await adminAgent.get('/api/users?page=0');
        expect(invalidPage.status).toBe(400);
        expect(invalidPage.body.error).toContain('Page');

        const invalidLimit = await adminAgent.get('/api/users?limit=51');
        expect(invalidLimit.status).toBe(400);
        expect(invalidLimit.body.error).toContain('Limit');

        const invalidRole = await adminAgent.get('/api/users?role=missing');
        expect(invalidRole.status).toBe(400);
        expect(invalidRole.body).toEqual({ error: 'Role does not exist.' });
    });
});

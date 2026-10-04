import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Kizuna Rail API',
            version: '1.0.0',
            description: 'API documentation for the Kizuna Rail application'
        },
        servers: [
            {
                url: 'http://localhost:3000'
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'connect.sid'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '64f1c2e9a12b3c4d5e6f7890'
                        },
                        displayName: {
                            type: 'string',
                            example: 'Kizuna Rail Admin'
                        },
                        username: {
                            type: 'string',
                            example: 'admin'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'admin@example.com'
                        },
                        role: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    enum: ['user', 'admin']
                                }
                            }
                        }
                    }
                },
                Train: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'series-e353' },
                        name: { type: 'string', example: 'Series E353 Limited Express' },
                        operator: { type: 'string', example: 'JR East' },
                        powerSource: { type: 'string', example: 'Electric' }
                    }
                },
                Trip: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        id: { type: 'string', example: 'alpine-panorama' }
                    }
                },
                Schedule: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        id: { type: 'integer', example: 1 },
                        tripId: { type: 'string', example: 'alpine-panorama' },
                        departureTime: { type: 'string', example: '08:30' },
                        arrivalTime: { type: 'string', example: '13:00' }
                    }
                },
                Booking: {
                    type: 'object',
                    additionalProperties: true,
                    properties: {
                        id: { type: 'string', example: 'KR-ABC123' },
                        scheduleId: { type: 'integer', example: 1 },
                        tripId: { type: 'string', example: 'alpine-panorama' },
                        ticketClass: { type: 'string', example: 'standard' },
                        selectedDay: { type: 'string', example: '2026-10-10' },
                        passengers: { type: 'array', items: { type: 'object' } }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

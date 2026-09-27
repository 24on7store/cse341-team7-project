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
                url: '/'
            },
            {
                url: 'http://localhost:3000'
            },
            {
                url: 'http://127.0.0.1:3000'
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

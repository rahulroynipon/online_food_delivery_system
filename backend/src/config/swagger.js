import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let swaggerSpec = {};

try {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Online Food Delivery API Documentation',
        version: '1.0.0',
        description: 'API docs for the Online Food Delivery System backend services',
        contact: {
          name: 'API Support',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token in the format Bearer <token>',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: [
      path.join(__dirname, '../routes/*.js'),
      path.join(__dirname, '../controllers/*.js'),
      './src/routes/*.js',
      './src/controllers/*.js',
    ],
  };

  swaggerSpec = swaggerJSDoc(swaggerOptions);
} catch (e) {
  console.warn('Swagger documentation generation failed (safely bypassed):', e.message);
}

export default swaggerSpec;

/**
 * .generator/templates/backend/express-api/index.js
 * Express API microservice template
 *
 * @description Express.js REST API microservice with TypeScript
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || {{PORT}};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import routes from './routes/index.js';
app.use('/api/{{NAME_KEBAB}}', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`{{NAME_PASCAL}} API listening on port ${PORT}`);
});

export default app;

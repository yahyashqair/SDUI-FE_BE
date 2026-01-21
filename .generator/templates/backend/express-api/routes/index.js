/**
 * Routes for {{NAME_KEBAB}}
 */

import { Router } from 'express';

const router = Router();

// GET /api/{{NAME_KEBAB}}
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '{{NAME}}',
      version: '1.0.0',
    },
  });
});

// POST /api/{{NAME_KEBAB}}
router.post('/', async (req, res, next) => {
  try {
    // Your logic here
    res.status(201).json({
      success: true,
      data: { message: 'Created' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

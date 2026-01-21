// HTTP/gRPC handlers
import { Hono } from 'hono';
import { UseCase } from '../application/base';

export const createHandler = (useCase: UseCase<any, any>) => async (c: any) => {
  try {
    const body = await c.req.json();
    const result = await useCase.execute(body);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
};

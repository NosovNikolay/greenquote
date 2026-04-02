import type { INestApplication } from '@nestjs/common';
import { createTestApp, getTestHttpServer } from './helpers/create-test-app';
import { createGreenquoteApi } from './helpers/greenquote-api';

describe('Greenquote API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health check', async () => {
    const api = createGreenquoteApi(getTestHttpServer(app));
    await api.assertHealthy();
  });
});

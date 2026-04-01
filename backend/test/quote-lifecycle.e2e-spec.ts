import type { INestApplication } from '@nestjs/common';
import { createTestApp } from './helpers/create-test-app';
import { createGreenquoteApi } from './helpers/greenquote-api';

describe('Quote lifecycle (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register → login → create quote → list quotes → quote details', async () => {
    const api = createGreenquoteApi(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const email = `lifecycle-${suffix}@e2e-test.local`;
    const password = 'long-secure-password';

    const registered = await api.register({
      fullName: 'E2E User',
      email,
      password,
    });
    expect(registered.email).toBe(email.toLowerCase());
    expect(registered.role).toBe('user');
    expect(registered.accessToken).toEqual(expect.any(String));

    const loggedIn = await api.login({ email, password });
    expect(loggedIn.userId).toBe(registered.userId);
    expect(loggedIn.accessToken).toEqual(expect.any(String));

    const created = await api.createQuote(loggedIn, {
      monthlyConsumptionKwh: 450,
      systemSizeKw: 5.4,
      downPayment: 1500,
      installationAddress: '123 Solar Street, Berlin',
    });

    expect(created.id).toEqual(expect.any(String));
    expect(created.derived.systemPriceUsd).toBeCloseTo(5.4 * 1200, 2);
    expect(created.inputs.monthlyConsumptionKwh).toBe(450);

    const list = await api.listMyQuotes(loggedIn);
    expect(list.length).toBeGreaterThanOrEqual(1);
    const summary = list.find((q) => q.id === created.id);
    expect(summary).toBeDefined();
    expect(summary?.systemSizeKw).toBe(5.4);

    const details = await api.getQuote(loggedIn, created.id);
    expect(details.id).toBe(created.id);
    expect(details.derived.riskBand).toBe(created.derived.riskBand);
    expect(details.contact?.email).toBe(email.toLowerCase());
  });
});

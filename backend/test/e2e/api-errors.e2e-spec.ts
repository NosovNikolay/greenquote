import { PRICE_PER_KW_EUR } from '@greenquote/constants';
import type { INestApplication } from '@nestjs/common';
import { ErrorCode } from '../../src/common/exceptions/error-codes';
import { createTestApp } from './helpers/create-test-app';
import {
  createGreenquoteApiWithAttempts,
  type ApiErrorBody,
  type AuthSession,
} from './helpers/greenquote-api';

function sessionFromRegisterBody(body: unknown): AuthSession {
  const b = body as {
    access_token: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };
  };
  return {
    accessToken: b.access_token,
    userId: b.user.id,
    email: b.user.email,
    fullName: b.user.fullName,
    role: b.user.role,
  };
}

function err(body: unknown): ApiErrorBody {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('statusCode' in body) ||
    !('code' in body)
  ) {
    throw new Error(`Expected error JSON, got ${JSON.stringify(body)}`);
  }
  return body as ApiErrorBody;
}

describe('API validation and errors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects register with short password (validation)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const { status, body } = await api.registerAttempt({
      fullName: 'A',
      email: `short-pw-${Date.now()}@e2e-test.local`,
      password: 'short',
    });
    expect(status).toBe(400);
    expect(err(body).code).toBe(ErrorCode.VALIDATION);
  });

  it('rejects register with invalid email (validation)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const { status, body } = await api.registerAttempt({
      fullName: 'Valid Name',
      email: 'not-an-email',
      password: 'longenoughpw',
    });
    expect(status).toBe(400);
    expect(err(body).code).toBe(ErrorCode.VALIDATION);
  });

  it('rejects duplicate email (conflict)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `dup-${suffix}@e2e-test.local`;
    const password = 'long-secure-password';
    const first = await api.registerAttempt({
      fullName: 'First',
      email,
      password,
    });
    expect(first.status).toBe(201);

    const second = await api.registerAttempt({
      fullName: 'Second',
      email,
      password,
    });
    expect(second.status).toBe(409);
    expect(err(second.body).code).toBe(ErrorCode.CONFLICT);
  });

  it('rejects login with wrong password (unauthorized)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `login-wrong-${suffix}@e2e-test.local`;
    await api.registerAttempt({
      fullName: 'User',
      email,
      password: 'correct-password-here',
    });

    const { status, body } = await api.loginAttempt({
      email,
      password: 'wrong-password-here',
    });
    expect(status).toBe(401);
    expect(err(body).code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it('rejects quote routes without bearer token (unauthorized)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const list = await api.listMyQuotesAttempt(null);
    expect(list.status).toBe(401);
    expect(err(list.body).code).toBe(ErrorCode.UNAUTHORIZED);

    const create = await api.createQuoteAttempt(null, {
      fullName: 'X',
      email: 'x@y.com',
      monthlyConsumptionKwh: 100,
      systemSizeKw: 5,
      downPayment: 0,
    });
    expect(create.status).toBe(401);
  });

  it('rejects create quote with invalid body (validation)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quote-val-${suffix}@e2e-test.local`;
    const reg = await api.registerAttempt({
      fullName: 'Valid User',
      email,
      password: 'long-secure-password',
    });
    expect(reg.status).toBe(201);
    const session = sessionFromRegisterBody(reg.body);

    const tooShortName = await api.createQuoteAttempt(session, {
      fullName: 'A',
      email,
      monthlyConsumptionKwh: 100,
      systemSizeKw: 5,
      downPayment: 0,
    });
    expect(tooShortName.status).toBe(400);
    expect(err(tooShortName.body).code).toBe(ErrorCode.VALIDATION);

    const systemTooSmall = await api.createQuoteAttempt(session, {
      fullName: 'Valid Name',
      email,
      monthlyConsumptionKwh: 100,
      systemSizeKw: 0.001,
      downPayment: 0,
    });
    expect(systemTooSmall.status).toBe(400);
    expect(err(systemTooSmall.body).code).toBe(ErrorCode.VALIDATION);
  });

  it('rejects create quote when down payment is not less than system price (bad request)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quote-bad-${suffix}@e2e-test.local`;
    const reg = await api.registerAttempt({
      fullName: 'Valid User',
      email,
      password: 'long-secure-password',
    });
    expect(reg.status).toBe(201);
    const session = sessionFromRegisterBody(reg.body);

    const { status, body } = await api.createQuoteAttempt(session, {
      fullName: 'Valid Name',
      email,
      monthlyConsumptionKwh: 100,
      systemSizeKw: 5,
      downPayment: 5 * PRICE_PER_KW_EUR,
    });
    expect(status).toBe(400);
    const e = err(body);
    expect(e.code).toBe(ErrorCode.BAD_REQUEST);
    expect(e.message).toMatch(/down payment/i);
  });

  it('rejects unknown quote id (not found)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quote-nf-${suffix}@e2e-test.local`;
    const reg = await api.registerAttempt({
      fullName: 'Valid User',
      email,
      password: 'long-secure-password',
    });
    expect(reg.status).toBe(201);
    const session = sessionFromRegisterBody(reg.body);

    const { status, body } = await api.getQuoteAttempt(
      session,
      '00000000-0000-4000-8000-00000000dead',
    );
    expect(status).toBe(404);
    expect(err(body).code).toBe(ErrorCode.NOT_FOUND);
  });

  it('rejects non-UUID quote id (validation)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quote-uuid-${suffix}@e2e-test.local`;
    const reg = await api.registerAttempt({
      fullName: 'Valid User',
      email,
      password: 'long-secure-password',
    });
    expect(reg.status).toBe(201);
    const session = sessionFromRegisterBody(reg.body);

    const { status, body } = await api.getQuoteAttempt(session, 'not-a-uuid');
    expect(status).toBe(400);
    expect(err(body).code).toBe(ErrorCode.VALIDATION);
  });

  it('rejects extra properties on create quote (validation)', async () => {
    const api = createGreenquoteApiWithAttempts(app.getHttpServer());
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const email = `quote-extra-${suffix}@e2e-test.local`;
    const reg = await api.registerAttempt({
      fullName: 'Valid User',
      email,
      password: 'long-secure-password',
    });
    expect(reg.status).toBe(201);
    const session = sessionFromRegisterBody(reg.body);

    const { status, body } = await api.createQuoteRawAttempt(session, {
      fullName: 'Valid Name',
      email,
      monthlyConsumptionKwh: 100,
      systemSizeKw: 5,
      downPayment: 100,
      extraField: true,
    });
    expect(status).toBe(400);
    expect(err(body).code).toBe(ErrorCode.VALIDATION);
  });
});

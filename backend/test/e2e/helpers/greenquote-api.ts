import type { Server } from 'node:http';
import request from 'supertest';

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

export interface CreateQuoteInput {
  fullName: string;
  email: string;
  monthlyConsumptionKwh: number;
  systemSizeKw: number;
  downPayment: number;
  installationAddress?: string;
}

export interface QuoteOfferDto {
  termYears: number;
  apr: number;
  principalUsed: number;
  monthlyPayment: number;
}

export interface QuoteDetails {
  id: string;
  createdAt: string;
  contact?: { fullName: string; email: string };
  inputs: {
    monthlyConsumptionKwh: number;
    systemSizeKw: number;
    downPaymentEur: number;
    installationAddress?: string;
    fullName?: string;
    email?: string;
  };
  derived: {
    currency: 'EUR';
    systemPriceEur: number;
    principalEur: number;
    riskBand: 'A' | 'B' | 'C';
    aprPercent: number;
  };
  offers: QuoteOfferDto[];
}

export interface QuoteSummary {
  id: string;
  createdAt: string;
  systemSizeKw: number;
  systemPrice: number;
  riskBand: 'A' | 'B' | 'C';
  userName?: string;
  userEmail?: string;
  city?: string;
}

export interface QuoteAmortizationSchedule {
  termYears: number;
  apr: number;
  principalEur: number;
  monthlyPayment: number;
  rows: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balanceRemaining: number;
  }>;
  totalInterestEur: number;
}

function toSession(body: {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}): AuthSession {
  return {
    accessToken: body.access_token,
    userId: body.user.id,
    email: body.user.email,
    fullName: body.user.fullName,
    role: body.user.role,
  };
}

export function createGreenquoteApi(server: Server) {
  const agent = request(server);

  return {
    async assertHealthy(): Promise<void> {
      await agent.get('/api/health').expect(200).expect({ status: 'ok' });
    },

    async register(input: RegisterInput): Promise<AuthSession> {
      const res = await agent
        .post('/api/auth/register')
        .send(input)
        .expect(201);
      return toSession(res.body);
    },

    async login(input: LoginInput): Promise<AuthSession> {
      const res = await agent.post('/api/auth/login').send(input).expect(201);
      return toSession(res.body);
    },

    async createQuote(
      session: AuthSession,
      input: CreateQuoteInput,
    ): Promise<QuoteDetails> {
      const res = await agent
        .post('/api/quotes')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send(input)
        .expect(201);
      return res.body as QuoteDetails;
    },

    async listMyQuotes(session: AuthSession): Promise<QuoteSummary[]> {
      const res = await agent
        .get('/api/quotes')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);
      const body = res.body as { items: QuoteSummary[] };
      return body.items;
    },

    async getQuote(
      session: AuthSession,
      quoteId: string,
    ): Promise<QuoteDetails> {
      const res = await agent
        .get(`/api/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);
      return res.body as QuoteDetails;
    },

    async getQuoteAmortization(
      session: AuthSession,
      quoteId: string,
      termYears: 5 | 10 | 15,
    ): Promise<QuoteAmortizationSchedule> {
      const res = await agent
        .get(`/api/quotes/${quoteId}/amortization`)
        .query({ termYears })
        .set('Authorization', `Bearer ${session.accessToken}`)
        .expect(200);
      return res.body as QuoteAmortizationSchedule;
    },
  };
}

export type GreenquoteApi = ReturnType<typeof createGreenquoteApi>;

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

export type ApiAttemptResult = { status: number; body: unknown };

export function createGreenquoteApiWithAttempts(server: Server) {
  const base = createGreenquoteApi(server);
  const agent = request(server);

  return {
    ...base,

    async registerAttempt(input: RegisterInput): Promise<ApiAttemptResult> {
      const res = await agent.post('/api/auth/register').send(input);
      return { status: res.status, body: res.body };
    },

    async loginAttempt(input: LoginInput): Promise<ApiAttemptResult> {
      const res = await agent.post('/api/auth/login').send(input);
      return { status: res.status, body: res.body };
    },

    async createQuoteAttempt(
      session: AuthSession | null,
      input: CreateQuoteInput,
    ): Promise<ApiAttemptResult> {
      let chain = agent.post('/api/quotes');
      if (session) {
        chain = chain.set('Authorization', `Bearer ${session.accessToken}`);
      }
      const res = await chain.send(input);
      return { status: res.status, body: res.body };
    },

    async createQuoteRawAttempt(
      session: AuthSession,
      body: Record<string, unknown>,
    ): Promise<ApiAttemptResult> {
      const res = await agent
        .post('/api/quotes')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send(body);
      return { status: res.status, body: res.body };
    },

    async listMyQuotesAttempt(
      session: AuthSession | null,
    ): Promise<ApiAttemptResult> {
      const req = agent.get('/api/quotes');
      const res = session
        ? await req.set('Authorization', `Bearer ${session.accessToken}`)
        : await req;
      return { status: res.status, body: res.body };
    },

    async getQuoteAttempt(
      session: AuthSession | null,
      quoteId: string,
    ): Promise<ApiAttemptResult> {
      const req = agent.get(`/api/quotes/${quoteId}`);
      const res = session
        ? await req.set('Authorization', `Bearer ${session.accessToken}`)
        : await req;
      return { status: res.status, body: res.body };
    },
  };
}

export type GreenquoteApiWithAttempts = ReturnType<
  typeof createGreenquoteApiWithAttempts
>;

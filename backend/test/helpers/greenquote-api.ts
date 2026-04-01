import type { Server } from 'node:http';
import request from 'supertest';

/** API-facing types — no HTTP paths or status codes in test bodies. */
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
    downPaymentUsd: number;
    installationAddress?: string;
  };
  derived: {
    currency: 'USD';
    systemPriceUsd: number;
    principalUsd: number;
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

/**
 * Typed facade over the HTTP API. Transport (paths, verbs, headers) stays here.
 */
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
      return res.body as QuoteSummary[];
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
  };
}

export type GreenquoteApi = ReturnType<typeof createGreenquoteApi>;

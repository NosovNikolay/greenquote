import { AppException } from '../../../../src/common/exceptions/app.exception';
import { serializeQuoteResultPayload } from '../../../../src/common/types/quote-result-storage';
import type { QuoteRow } from '../../../../src/database/schema';
import type { RequestUser } from '../../../../src/modules/auth/jwt.strategy';
import { PricingService } from '../../../../src/modules/quotes/pricing.service';
import { QuotesService } from '../../../../src/modules/quotes/quotes.service';

describe('QuotesService', () => {
  const pricing = new PricingService();

  function makeQuoteRow(overrides: Partial<QuoteRow> = {}): QuoteRow {
    const apiResult = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 450,
      systemSizeKw: 5.4,
      downPaymentEur: 1500,
    });
    const stored = serializeQuoteResultPayload(apiResult);
    return {
      id: '00000000-0000-4000-8000-000000000001',
      userId: '00000000-0000-4000-8000-0000000000aa',
      monthlyConsumptionKwh: 450,
      systemSizeKw: 5.4,
      downPaymentEurCents: stored.inputs.downPaymentEurCents,
      result: stored,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  it('create throws when down payment is not less than system price', async () => {
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn(),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    await expect(
      service.create('user-id', {
        fullName: 'Test User',
        email: 'test@example.com',
        monthlyConsumptionKwh: 100,
        systemSizeKw: 5,
        downPayment: 5 * 1200,
      }),
    ).rejects.toBeInstanceOf(AppException);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('findOne forbids non-owner non-admin', async () => {
    const row = makeQuoteRow();
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    const other: RequestUser = {
      userId: '00000000-0000-4000-8000-0000000000bb',
      email: 'other@example.com',
      role: 'user',
    };

    await expect(service.findOne(row.id, other)).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('findOne returns quote for owner', async () => {
    const ownerId = '00000000-0000-4000-8000-0000000000aa';
    const row = makeQuoteRow({ userId: ownerId });
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner Name',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    const owner: RequestUser = {
      userId: ownerId,
      email: 'owner@example.com',
      role: 'user',
    };

    const out = await service.findOne(row.id, owner);
    expect(out.id).toBe(row.id);
    expect(out.contact).toEqual({
      fullName: 'Owner Name',
      email: 'owner@example.com',
    });
  });

  it('findOne prefers contact snapshot stored on the quote over the user profile', async () => {
    const ownerId = '00000000-0000-4000-8000-0000000000aa';
    const pricingResult = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 450,
      systemSizeKw: 5.4,
      downPaymentEur: 1500,
    });
    const stored = serializeQuoteResultPayload({
      ...pricingResult,
      inputs: {
        ...pricingResult.inputs,
        fullName: 'Name As On Form',
        email: 'form@example.com',
      },
    });
    const row = makeQuoteRow({
      userId: ownerId,
      downPaymentEurCents: stored.inputs.downPaymentEurCents,
      result: stored,
    });
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Profile Name',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    const owner: RequestUser = {
      userId: ownerId,
      email: 'owner@example.com',
      role: 'user',
    };

    const out = await service.findOne(row.id, owner);
    expect(out.contact).toEqual({
      fullName: 'Name As On Form',
      email: 'form@example.com',
    });
  });

  it('findOne throws not found when quote is missing', async () => {
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue(null),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    await expect(
      service.findOne('00000000-0000-4000-8000-000000000099', {
        userId: '00000000-0000-4000-8000-0000000000aa',
        email: 'u@example.com',
        role: 'user',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('findOne allows admin to read another user quote', async () => {
    const row = makeQuoteRow();
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);

    const admin: RequestUser = {
      userId: '00000000-0000-4000-8000-00000000ad01',
      email: 'admin@example.com',
      role: 'admin',
    };

    const out = await service.findOne(row.id, admin);
    expect(out.id).toBe(row.id);
  });

  it('listMine summary systemPrice matches full quote derived.systemPriceEur', async () => {
    const ownerId = '00000000-0000-4000-8000-0000000000aa';
    const row = makeQuoteRow({ userId: ownerId });
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner',
      }),
      countByUserId: jest.fn().mockResolvedValue(1),
      findByUserIdWithUserPaginated: jest.fn().mockResolvedValue([
        {
          quote: row,
          userEmail: 'owner@example.com',
          userName: 'Owner',
        },
      ]),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);
    const owner: RequestUser = {
      userId: ownerId,
      email: 'o@x.com',
      role: 'user',
    };
    const full = await service.findOne(row.id, owner);
    const { items } = await service.listMine(ownerId, 1, 10);
    expect(items[0].systemPrice).toBe(full.derived.systemPriceEur);
  });

  it('getAmortizationSchedule rejects invalid termYears', async () => {
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn(),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);
    const owner: RequestUser = {
      userId: '00000000-0000-4000-8000-0000000000aa',
      email: 'o@x.com',
      role: 'user',
    };
    await expect(
      service.getAmortizationSchedule(
        '00000000-0000-4000-8000-000000000001',
        owner,
        20,
      ),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(repo.findByIdWithUser).not.toHaveBeenCalled();
  });

  it('getAmortizationSchedule returns schedule for quote owner', async () => {
    const row = makeQuoteRow();
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);
    const owner: RequestUser = {
      userId: row.userId,
      email: 'owner@example.com',
      role: 'user',
    };
    const out = await service.getAmortizationSchedule(row.id, owner, 5);
    expect(out.rows).toHaveLength(60);
    expect(out.termYears).toBe(5);
    expect(out.totalInterestEur).toBeGreaterThan(0);
    expect(out.rows[out.rows.length - 1].balanceRemaining).toBe(0);
  });

  it('getAmortizationSchedule forbids non-owner non-admin', async () => {
    const row = makeQuoteRow();
    const repo = {
      create: jest.fn(),
      findByIdWithUser: jest.fn().mockResolvedValue({
        quote: row,
        userEmail: 'owner@example.com',
        userFullName: 'Owner',
      }),
      countByUserId: jest.fn(),
      findByUserIdWithUserPaginated: jest.fn(),
      findAllForAdmin: jest.fn(),
    };
    const service = new QuotesService(repo as never, pricing);
    const other: RequestUser = {
      userId: '00000000-0000-4000-8000-0000000000bb',
      email: 'other@example.com',
      role: 'user',
    };
    await expect(service.getAmortizationSchedule(row.id, other, 5)).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    );
  });
});

import { PRICE_PER_KW_EUR } from '@greenquote/constants';
import { Injectable } from '@nestjs/common';
import {
  deserializeQuoteResultStored,
  serializeQuoteResultPayload,
} from '../../common/types/quote-result-storage';
import {
  buildAmortizationSchedule,
  totalInterestPaid,
  type AmortizationRow,
} from '../../common/utils/amortization';
import { centsToEur } from '../../common/utils/money';
import { extractCityFromAddress } from '../../common/utils/address';
import { AppException } from '../../common/exceptions/app.exception';
import type { QuoteRow } from '../../database/schema';
import type { RequestUser } from '../auth/jwt.strategy';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PricingService } from './pricing.service';
import { QuotesRepository } from './quotes.repository';

export interface QuoteResponseDto {
  id: string;
  createdAt: Date;
  contact?: {
    fullName: string;
    email: string;
  };
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
  offers: Array<{
    termYears: number;
    apr: number;
    principalUsed: number;
    monthlyPayment: number;
  }>;
}

export interface QuoteSummaryDto {
  id: string;
  createdAt: Date;
  systemSizeKw: number;
  systemPrice: number;
  riskBand: 'A' | 'B' | 'C';
  userName?: string;
  userEmail?: string;
  city?: string;
}

export interface AdminQuoteRowDto extends QuoteSummaryDto {
  userEmail: string;
  userName: string;
}

export interface QuoteAmortizationScheduleDto {
  termYears: number;
  apr: number;
  principalEur: number;
  monthlyPayment: number;
  rows: AmortizationRow[];
  totalInterestEur: number;
}

const ALLOWED_AMORTIZATION_TERMS = new Set([5, 10, 15]);

@Injectable()
export class QuotesService {
  constructor(
    private readonly quotesRepository: QuotesRepository,
    private readonly pricingService: PricingService,
  ) {}

  async create(userId: string, dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const systemPriceEur = dto.systemSizeKw * PRICE_PER_KW_EUR;
    if (dto.downPayment >= systemPriceEur) {
      throw AppException.badRequest(
        'Down payment must be less than the computed system price',
        {
          systemPriceEur,
        },
      );
    }

    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    const result = this.pricingService.buildQuoteResult({
      monthlyConsumptionKwh: dto.monthlyConsumptionKwh,
      systemSizeKw: dto.systemSizeKw,
      downPaymentEur: dto.downPayment,
      installationAddress: dto.installationAddress,
    });

    const resultWithContact = {
      ...result,
      inputs: {
        ...result.inputs,
        fullName,
        email,
      },
    };

    const stored = serializeQuoteResultPayload(resultWithContact);

    const row = await this.quotesRepository.create({
      userId,
      monthlyConsumptionKwh: Math.round(dto.monthlyConsumptionKwh),
      systemSizeKw: dto.systemSizeKw,
      downPaymentEurCents: stored.inputs.downPaymentEurCents,
      result: stored,
    });

    return this.toResponse(row);
  }

  async getAmortizationSchedule(
    quoteId: string,
    requester: RequestUser,
    termYears: number,
  ): Promise<QuoteAmortizationScheduleDto> {
    if (!ALLOWED_AMORTIZATION_TERMS.has(termYears)) {
      throw AppException.badRequest('termYears must be 5, 10, or 15', {
        termYears,
      });
    }

    const row = await this.quotesRepository.findByIdWithUser(quoteId);
    if (!row) {
      throw AppException.notFound('Quote not found');
    }
    if (requester.role !== 'admin' && row.quote.userId !== requester.userId) {
      throw AppException.forbidden('You do not have access to this quote');
    }

    const payload = deserializeQuoteResultStored(row.quote.result);
    const offer = payload.offers.find((o) => o.termYears === termYears);
    if (!offer) {
      throw AppException.badRequest('No installment offer for this term', {
        termYears,
      });
    }

    const rows = buildAmortizationSchedule({
      principalEur: offer.principalUsed,
      annualAprPercent: offer.apr,
      termYears: offer.termYears,
      monthlyPaymentEur: offer.monthlyPayment,
    });

    return {
      termYears: offer.termYears,
      apr: offer.apr,
      principalEur: offer.principalUsed,
      monthlyPayment: offer.monthlyPayment,
      rows,
      totalInterestEur: totalInterestPaid(rows),
    };
  }

  async findOne(
    quoteId: string,
    requester: RequestUser,
  ): Promise<QuoteResponseDto> {
    const row = await this.quotesRepository.findByIdWithUser(quoteId);
    if (!row) {
      throw AppException.notFound('Quote not found');
    }
    if (requester.role !== 'admin' && row.quote.userId !== requester.userId) {
      throw AppException.forbidden('You do not have access to this quote');
    }
    return this.toResponse(row.quote, {
      fullName: row.userFullName,
      email: row.userEmail,
    });
  }

  async listMine(
    userId: string,
    page = 1,
    limit = 30,
  ): Promise<{
    items: QuoteSummaryDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const safeLimit = Math.min(30, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const [total, rows] = await Promise.all([
      this.quotesRepository.countByUserId(userId),
      this.quotesRepository.findByUserIdWithUserPaginated(
        userId,
        safeLimit,
        offset,
      ),
    ]);

    const items = rows.map((r) =>
      this.toSummary(r.quote, {
        userEmail: r.userEmail,
        userName: r.userName,
      }),
    );

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async listAll(
    search?: string,
    page = 1,
    limit = 30,
  ): Promise<{
    items: AdminQuoteRowDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const safeLimit = Math.min(30, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;

    const [total, rows] = await Promise.all([
      this.quotesRepository.countAllForAdmin(search),
      this.quotesRepository.findAllForAdmin(search, safeLimit, offset),
    ]);

    const items = rows.map((r): AdminQuoteRowDto => {
      const summary = this.toSummary(r.quote, {
        userEmail: r.userEmail,
        userName: r.userName,
      });
      return {
        ...summary,
        userEmail: r.userEmail,
        userName: r.userName,
      };
    });

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  private toSummary(
    row: QuoteRow,
    user?: { userEmail: string; userName: string },
  ): QuoteSummaryDto {
    const addr = row.result.inputs.installationAddress;
    const city = extractCityFromAddress(addr);
    return {
      id: row.id,
      createdAt: row.createdAt,
      systemSizeKw: row.systemSizeKw,
      systemPrice: centsToEur(row.result.derived.systemPriceEurCents),
      riskBand: row.result.derived.riskBand,
      ...(user ? { userName: user.userName, userEmail: user.userEmail } : {}),
      ...(city ? { city } : {}),
    };
  }

  private toResponse(
    row: QuoteRow,
    userContact?: { fullName: string; email: string },
  ): QuoteResponseDto {
    const payload = deserializeQuoteResultStored(row.result);
    const inputs = payload.inputs;
    const contactFromSnapshot =
      inputs.fullName !== undefined || inputs.email !== undefined
        ? {
            fullName: inputs.fullName ?? userContact?.fullName ?? '',
            email: inputs.email ?? userContact?.email ?? '',
          }
        : userContact;

    return {
      id: row.id,
      createdAt: row.createdAt,
      ...(contactFromSnapshot ? { contact: contactFromSnapshot } : {}),
      ...payload,
    };
  }
}

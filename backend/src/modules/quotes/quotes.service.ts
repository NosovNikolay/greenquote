import { Injectable } from '@nestjs/common';
import { extractCityFromAddress } from '../../common/utils/address';
import { AppException } from '../../common/exceptions/app.exception';
import type { QuoteRow } from '../../database/schema';
import type { RequestUser } from '../auth/jwt.strategy';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { PricingService } from './pricing.service';
import { QuotesRepository } from './quotes.repository';

const PRICE_PER_KW_USD = 1200;

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

@Injectable()
export class QuotesService {
  constructor(
    private readonly quotesRepository: QuotesRepository,
    private readonly pricingService: PricingService,
  ) {}

  async create(userId: string, dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const systemPriceUsd = dto.systemSizeKw * PRICE_PER_KW_USD;
    if (dto.downPayment >= systemPriceUsd) {
      throw AppException.badRequest(
        'Down payment must be less than the computed system price',
        {
          systemPriceUsd,
        },
      );
    }

    const result = this.pricingService.buildQuoteResult({
      monthlyConsumptionKwh: dto.monthlyConsumptionKwh,
      systemSizeKw: dto.systemSizeKw,
      downPaymentUsd: dto.downPayment,
      installationAddress: dto.installationAddress,
    });

    const row = await this.quotesRepository.create({
      userId,
      monthlyConsumptionKwh: Math.round(dto.monthlyConsumptionKwh),
      systemSizeKw: dto.systemSizeKw,
      downPaymentUsd: result.inputs.downPaymentUsd,
      result,
    });

    return this.toResponse(row);
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

  async listMine(userId: string): Promise<QuoteSummaryDto[]> {
    const rows = await this.quotesRepository.findByUserIdWithUser(userId);
    return rows.map((r) =>
      this.toSummary(r.quote, {
        userEmail: r.userEmail,
        userName: r.userName,
      }),
    );
  }

  async listAll(search?: string): Promise<AdminQuoteRowDto[]> {
    const rows = await this.quotesRepository.findAllForAdmin(search);
    return rows.map((r): AdminQuoteRowDto => {
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
      systemPrice: row.result.derived.systemPriceUsd,
      riskBand: row.result.derived.riskBand,
      ...(user
        ? { userName: user.userName, userEmail: user.userEmail }
        : {}),
      ...(city ? { city } : {}),
    };
  }

  private toResponse(
    row: QuoteRow,
    contact?: { fullName: string; email: string },
  ): QuoteResponseDto {
    return {
      id: row.id,
      createdAt: row.createdAt,
      ...(contact ? { contact } : {}),
      ...row.result,
    };
  }
}

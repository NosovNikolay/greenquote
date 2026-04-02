import type { QuoteResultPayload, RiskBand } from './quote-result.types';
import { centsToEur, eurToCents } from '../utils/money';

export interface QuoteOfferStored {
  termYears: number;
  apr: number;
  principalUsedCents: number;
  monthlyPaymentCents: number;
}

export interface QuoteResultStored {
  inputs: {
    monthlyConsumptionKwh: number;
    systemSizeKw: number;
    downPaymentEurCents: number;
    installationAddress?: string;
    fullName?: string;
    email?: string;
  };
  derived: {
    currency: 'EUR';
    systemPriceEurCents: number;
    principalEurCents: number;
    riskBand: RiskBand;
    aprPercent: number;
  };
  offers: QuoteOfferStored[];
}

export function serializeQuoteResultPayload(
  payload: QuoteResultPayload,
): QuoteResultStored {
  return {
    inputs: {
      monthlyConsumptionKwh: payload.inputs.monthlyConsumptionKwh,
      systemSizeKw: payload.inputs.systemSizeKw,
      downPaymentEurCents: eurToCents(payload.inputs.downPaymentEur),
      ...(payload.inputs.installationAddress !== undefined &&
      payload.inputs.installationAddress !== ''
        ? { installationAddress: payload.inputs.installationAddress }
        : {}),
      ...(payload.inputs.fullName !== undefined
        ? { fullName: payload.inputs.fullName }
        : {}),
      ...(payload.inputs.email !== undefined
        ? { email: payload.inputs.email }
        : {}),
    },
    derived: {
      currency: payload.derived.currency,
      systemPriceEurCents: eurToCents(payload.derived.systemPriceEur),
      principalEurCents: eurToCents(payload.derived.principalEur),
      riskBand: payload.derived.riskBand,
      aprPercent: payload.derived.aprPercent,
    },
    offers: payload.offers.map((o) => ({
      termYears: o.termYears,
      apr: o.apr,
      principalUsedCents: eurToCents(o.principalUsed),
      monthlyPaymentCents: eurToCents(o.monthlyPayment),
    })),
  };
}

export function deserializeQuoteResultStored(
  stored: QuoteResultStored,
): QuoteResultPayload {
  return {
    inputs: {
      monthlyConsumptionKwh: stored.inputs.monthlyConsumptionKwh,
      systemSizeKw: stored.inputs.systemSizeKw,
      downPaymentEur: centsToEur(stored.inputs.downPaymentEurCents),
      ...(stored.inputs.installationAddress !== undefined &&
      stored.inputs.installationAddress !== ''
        ? { installationAddress: stored.inputs.installationAddress }
        : {}),
      ...(stored.inputs.fullName !== undefined
        ? { fullName: stored.inputs.fullName }
        : {}),
      ...(stored.inputs.email !== undefined
        ? { email: stored.inputs.email }
        : {}),
    },
    derived: {
      currency: stored.derived.currency,
      systemPriceEur: centsToEur(stored.derived.systemPriceEurCents),
      principalEur: centsToEur(stored.derived.principalEurCents),
      riskBand: stored.derived.riskBand,
      aprPercent: stored.derived.aprPercent,
    },
    offers: stored.offers.map((o) => ({
      termYears: o.termYears,
      apr: o.apr,
      principalUsed: centsToEur(o.principalUsedCents),
      monthlyPayment: centsToEur(o.monthlyPaymentCents),
    })),
  };
}

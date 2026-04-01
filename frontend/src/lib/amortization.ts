/**
 * Fixed-rate loan amortization (annuity method): each period allocates payment
 * to interest on the outstanding balance and the rest to principal.
 * Last payment adjusts so the balance reaches zero (handles rounded PMT).
 */

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balanceRemaining: number;
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildAmortizationSchedule(input: {
  principalUsd: number;
  annualAprPercent: number;
  termYears: number;
  monthlyPaymentUsd: number;
}): AmortizationRow[] {
  const { principalUsd, annualAprPercent, termYears, monthlyPaymentUsd } = input;
  if (principalUsd <= 0 || termYears <= 0) {
    return [];
  }

  const n = Math.round(termYears * 12);
  const monthlyRate = annualAprPercent / 100 / 12;
  const rows: AmortizationRow[] = [];
  let balance = roundUsd(principalUsd);

  const contractual = roundUsd(monthlyPaymentUsd);

  for (let month = 1; month <= n; month++) {
    const interest = roundUsd(balance * monthlyRate);
    let payment: number;
    let principal: number;

    if (month < n) {
      payment = contractual;
      principal = roundUsd(payment - interest);
      if (principal < 0) principal = 0;
      if (principal > balance) {
        principal = balance;
        payment = roundUsd(interest + principal);
      }
      balance = roundUsd(balance - principal);
    } else {
      principal = balance;
      payment = roundUsd(interest + principal);
      balance = 0;
    }

    rows.push({
      month,
      payment,
      principal,
      interest,
      balanceRemaining: balance,
    });
  }

  return rows;
}

export function totalInterestPaid(rows: AmortizationRow[]): number {
  return roundUsd(rows.reduce((sum, r) => sum + r.interest, 0));
}

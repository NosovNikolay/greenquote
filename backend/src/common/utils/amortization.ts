export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balanceRemaining: number;
}

function roundEur(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildAmortizationSchedule(input: {
  principalEur: number;
  annualAprPercent: number;
  termYears: number;
  monthlyPaymentEur: number;
}): AmortizationRow[] {
  const { principalEur, annualAprPercent, termYears, monthlyPaymentEur } =
    input;
  if (principalEur <= 0 || termYears <= 0) {
    return [];
  }

  const n = Math.round(termYears * 12);
  const monthlyRate = annualAprPercent / 100 / 12;
  const rows: AmortizationRow[] = [];
  let balance = roundEur(principalEur);

  const contractual = roundEur(monthlyPaymentEur);

  for (let month = 1; month <= n; month++) {
    const interest = roundEur(balance * monthlyRate);
    let payment: number;
    let principal: number;

    if (month < n) {
      payment = contractual;
      principal = roundEur(payment - interest);
      if (principal < 0) principal = 0;
      if (principal > balance) {
        principal = balance;
        payment = roundEur(interest + principal);
      }
      balance = roundEur(balance - principal);
    } else {
      principal = balance;
      payment = roundEur(interest + principal);
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
  return roundEur(rows.reduce((sum, r) => sum + r.interest, 0));
}

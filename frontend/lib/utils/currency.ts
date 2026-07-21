export type CurrencyCode = 'GBP' | 'TRY' | 'EUR' | 'USD';

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  GBP: 1,
  TRY: 40.5, // Mock rates for North Cyprus real estate context
  EUR: 1.17,
  USD: 1.25,
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  TRY: '₺',
  EUR: '€',
  USD: '$',
};

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  
  // Convert to GBP first (base currency)
  const amountInGBP = amount / EXCHANGE_RATES[from];
  // Convert from GBP to target
  return amountInGBP * EXCHANGE_RATES[to];
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'GBP', maximumFractionDigits: number = 0): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits,
  }).format(amount);
}

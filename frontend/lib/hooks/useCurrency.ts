import { useCallback, useSyncExternalStore } from 'react';
import { CurrencyCode, convertCurrency, formatCurrency } from '../utils/currency';

const CURRENCY_STORAGE_KEY = 'house_agent_preferred_currency';

function readStoredCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
    if (stored && ['GBP', 'TRY', 'EUR', 'USD'].includes(stored)) return stored;
  } catch {
    // Ignore
  }
  return 'GBP';
}

function subscribeCurrency(cb: () => void): () => void {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export function useCurrency() {
  const currency = useSyncExternalStore(
    subscribeCurrency,
    readStoredCurrency,
    () => 'GBP' as CurrencyCode
  );

  const changeCurrency = useCallback((newCurrency: CurrencyCode) => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore
    }
  }, []);

  const formatAmount = useCallback((amountInGBP: number) => {
    const converted = convertCurrency(amountInGBP, 'GBP', currency);
    return formatCurrency(converted, currency);
  }, [currency]);

  return {
    currency,
    changeCurrency,
    formatAmount,
    isLoaded: true
  };
}
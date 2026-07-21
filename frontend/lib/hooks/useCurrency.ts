import { useState, useEffect, useCallback } from 'react';
import { CurrencyCode, convertCurrency, formatCurrency } from '../utils/currency';

const CURRENCY_STORAGE_KEY = 'house_agent_preferred_currency';

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
      if (stored && ['GBP', 'TRY', 'EUR', 'USD'].includes(stored)) {
        setCurrency(stored);
      }
    } catch (e) {
      // Ignore
    }
    setIsLoaded(true);
  }, []);

  const changeCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (e) {
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
    isLoaded
  };
}

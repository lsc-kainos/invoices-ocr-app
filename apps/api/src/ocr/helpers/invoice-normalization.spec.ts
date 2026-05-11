import {
  normalizeBrazilianCurrencyToCents,
  normalizeBrazilianTaxId,
  normalizeDateToIso,
} from './invoice-normalization';

describe('invoice normalization helpers', () => {
  describe('normalizeBrazilianTaxId', () => {
    it('removes CNPJ masks', () => {
      expect(normalizeBrazilianTaxId('12.345.678/0001-90')).toBe(
        '12345678000190',
      );
    });

    it('removes CPF masks', () => {
      expect(normalizeBrazilianTaxId('123.456.789-09')).toBe('12345678909');
    });
  });

  describe('normalizeBrazilianCurrencyToCents', () => {
    it('converts Brazilian currency with symbol and thousands separator to cents', () => {
      expect(normalizeBrazilianCurrencyToCents('R$ 1.234,56')).toBe(123456);
    });

    it('converts Brazilian currency without symbol to cents', () => {
      expect(normalizeBrazilianCurrencyToCents('184.520,00')).toBe(18452000);
    });

    it('converts values without cents as Brazilian reais', () => {
      expect(normalizeBrazilianCurrencyToCents('1234')).toBe(123400);
    });
  });

  describe('missing values', () => {
    it('returns null for absent tax IDs and currency values', () => {
      expect(normalizeBrazilianTaxId(null)).toBeNull();
      expect(normalizeBrazilianTaxId('  ')).toBeNull();
      expect(normalizeBrazilianCurrencyToCents(undefined)).toBeNull();
      expect(normalizeBrazilianCurrencyToCents('-')).toBeNull();
    });
  });

  describe('normalizeDateToIso', () => {
    it('normalizes Brazilian dates to ISO when possible', () => {
      expect(normalizeDateToIso('31/01/2026')).toBe('2026-01-31');
    });

    it('returns null for invalid dates', () => {
      expect(normalizeDateToIso('31/02/2026')).toBeNull();
    });
  });
});

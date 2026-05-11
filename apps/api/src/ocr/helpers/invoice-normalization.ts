export type MaybeString = string | null | undefined;

function emptyToNull(value: MaybeString): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null')
    return null;
  return trimmed;
}

export function normalizeBrazilianTaxId(value: MaybeString): string | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  return digits || null;
}

export function normalizeBrazilianCurrencyToCents(
  value: MaybeString,
): number | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;

  const isNegative = /^\s*-/.test(trimmed) || /^\s*\(.*\)\s*$/.test(trimmed);
  const numeric = trimmed.replace(/[^\d.,]/g, '');
  if (!/\d/.test(numeric)) return null;

  const lastComma = numeric.lastIndexOf(',');
  const lastDot = numeric.lastIndexOf('.');
  const decimalSeparator =
    lastComma >= 0 && lastDot >= 0
      ? lastComma > lastDot
        ? ','
        : '.'
      : lastComma >= 0
        ? ','
        : lastDot >= 0
          ? '.'
          : null;

  let reais: string;
  let centavos = '00';

  if (decimalSeparator) {
    const separatorIndex = numeric.lastIndexOf(decimalSeparator);
    const integerPart = numeric.slice(0, separatorIndex).replace(/\D/g, '');
    const fractionalPart = numeric.slice(separatorIndex + 1).replace(/\D/g, '');
    const shouldTreatAsDecimal =
      fractionalPart.length > 0 && fractionalPart.length <= 2;

    if (shouldTreatAsDecimal) {
      reais = integerPart || '0';
      centavos = fractionalPart.padEnd(2, '0');
    } else {
      reais = numeric.replace(/\D/g, '');
    }
  } else {
    reais = numeric.replace(/\D/g, '');
  }

  const cents =
    Number.parseInt(reais || '0', 10) * 100 + Number.parseInt(centavos, 10);
  if (!Number.isFinite(cents)) return null;

  return isNegative ? -cents : cents;
}

export function normalizeDateToIso(value: MaybeString): string | null {
  const trimmed = emptyToNull(value);
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return isValidDate(Number(year), Number(month), Number(day))
      ? trimmed
      : null;
  }

  const brMatch = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})$/.exec(trimmed);
  if (!brMatch) return null;

  const [, rawDay, rawMonth, rawYear] = brMatch;
  const year = Number(rawYear.length === 2 ? `20${rawYear}` : rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);

  if (!isValidDate(year, month, day)) return null;

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

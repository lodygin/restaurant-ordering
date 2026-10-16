const PRICE_PATTERN = /^\d+([.,]\d{1,2})?$/;

/** `12.50` or `12,5` to cents; null for anything else or zero. */
export function parsePrice(text: string): number | null {
  const normalized = text.trim();

  if (!PRICE_PATTERN.test(normalized)) {
    return null;
  }

  const cents = Math.round(Number(normalized.replace(',', '.')) * 100);

  return cents > 0 ? cents : null;
}

/**
 * Utilidades para registrar y agregar analíticas de clics.
 */

/** Detecta categoría de dispositivo a partir del User-Agent. */
export function detectDevice(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|slurp/.test(ua)) return 'bot';
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

export interface DailyClicks {
  date: string; // YYYY-MM-DD
  clicks: number;
}

/**
 * Rellena los días sin clics con 0 y devuelve la serie ordenada.
 * Recibe una lista de pares [date, clicks] ya agregada por la BD.
 */
export function fillDailySeries(raw: Array<{ date: string; clicks: number }>, days: number): DailyClicks[] {
  const byDate = new Map(raw.map((r) => [r.date, Number(r.clicks)]));
  const out: DailyClicks[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, clicks: byDate.get(key) ?? 0 });
  }
  return out;
}

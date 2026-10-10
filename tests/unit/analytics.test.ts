import { describe, it, expect } from 'vitest';
import { detectDevice, fillDailySeries } from '@/lib/analytics';

describe('detectDevice', () => {
  it('detecta móviles', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile');
    expect(detectDevice('Mozilla/5.0 (Linux; Android 14)')).toBe('mobile');
  });

  it('detecta tablets', () => {
    expect(detectDevice('Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('tablet');
  });

  it('detecta bots', () => {
    expect(detectDevice('Googlebot/2.1')).toBe('bot');
  });

  it('trata el resto como desktop', () => {
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');
  });

  it('devuelve unknown sin user-agent', () => {
    expect(detectDevice(null)).toBe('unknown');
  });
});

describe('fillDailySeries', () => {
  it('rellena los días sin clics con 0', () => {
    const today = new Date().toISOString().slice(0, 10);
    const series = fillDailySeries([{ date: today, clicks: 5 }], 3);
    expect(series).toHaveLength(3);
    expect(series[2]).toEqual({ date: today, clicks: 5 });
    expect(series[0]?.clicks).toBe(0);
    expect(series[1]?.clicks).toBe(0);
  });

  it('mantiene el orden cronológico ascendente', () => {
    const series = fillDailySeries([], 5);
    const dates = series.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

describe('checkRateLimit (backend en memoria)', () => {
  beforeEach(() => {
    // Sin credenciales de Upstash, el limitador usa memoria.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('permite hasta el máximo de peticiones', async () => {
    const ip = `test-max-${Date.now()}`;
    for (let i = 0; i < 3; i += 1) {
      const result = await checkRateLimit(ip, 3, 60_000);
      expect(result.success).toBe(true);
      expect(result.backend).toBe('memory');
    }
  });

  it('bloquea al superar el máximo', async () => {
    const ip = `test-block-${Date.now()}`;
    await checkRateLimit(ip, 2, 60_000);
    await checkRateLimit(ip, 2, 60_000);
    const third = await checkRateLimit(ip, 2, 60_000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('decrementa el contador de restantes', async () => {
    const ip = `test-remaining-${Date.now()}`;
    const first = await checkRateLimit(ip, 5, 60_000);
    expect(first.remaining).toBe(4);
    const second = await checkRateLimit(ip, 5, 60_000);
    expect(second.remaining).toBe(3);
  });

  it('aísla el límite por IP', async () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    await checkRateLimit(a, 1, 60_000);
    const blockedA = await checkRateLimit(a, 1, 60_000);
    const allowedB = await checkRateLimit(b, 1, 60_000);
    expect(blockedA.success).toBe(false);
    expect(allowedB.success).toBe(true);
  });
});

describe('getClientIp', () => {
  it('extrae la primera IP de x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' });
    expect(getClientIp(headers)).toBe('203.0.113.1');
  });

  it('usa x-real-ip como fallback', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.7' });
    expect(getClientIp(headers)).toBe('198.51.100.7');
  });

  it('devuelve unknown sin cabeceras', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  generateUniqueSlug,
  isReservedSlug,
  SLUG_LENGTH,
  SLUG_ALPHABET,
} from '@/lib/slug';

describe('generateSlug', () => {
  it('genera un slug de la longitud esperada', () => {
    expect(generateSlug()).toHaveLength(SLUG_LENGTH);
  });

  it('solo usa caracteres del alfabeto permitido', () => {
    for (let i = 0; i < 50; i += 1) {
      const slug = generateSlug();
      for (const char of slug) {
        expect(SLUG_ALPHABET).toContain(char);
      }
    }
  });

  it('no incluye caracteres ambiguos (0, O, 1, l, I)', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateSlug()).not.toMatch(/[0O1lI]/);
    }
  });

  it('produce valores distintos en llamadas consecutivas', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});

describe('isReservedSlug', () => {
  it('detecta slugs reservados', () => {
    expect(isReservedSlug('api')).toBe(true);
    expect(isReservedSlug('dashboard')).toBe(true);
  });

  it('detecta reservados sin distinguir mayúsculas', () => {
    expect(isReservedSlug('API')).toBe(true);
  });

  it('no marca slugs normales como reservados', () => {
    expect(isReservedSlug('mi-enlace')).toBe(false);
  });
});

describe('generateUniqueSlug', () => {
  it('devuelve un slug cuando está libre a la primera', async () => {
    const slug = await generateUniqueSlug(async () => false);
    expect(slug).toHaveLength(SLUG_LENGTH);
  });

  it('reintenta cuando el slug está ocupado', async () => {
    let calls = 0;
    const slug = await generateUniqueSlug(async () => {
      calls += 1;
      return calls < 3; // ocupado las dos primeras veces
    });
    expect(calls).toBe(3);
    expect(slug).toHaveLength(SLUG_LENGTH);
  });

  it('lanza error si nunca encuentra un slug libre', async () => {
    await expect(generateUniqueSlug(async () => true, 3)).rejects.toThrow(
      /No se pudo generar un slug único/,
    );
  });
});

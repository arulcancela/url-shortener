import { describe, it, expect } from 'vitest';
import { validateUrl, validateCustomSlug } from '@/lib/url-validation';

describe('validateUrl', () => {
  it('acepta URLs https válidas', () => {
    const result = validateUrl('https://example.com/ruta?query=1');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.com/ruta?query=1');
  });

  it('acepta URLs http válidas', () => {
    expect(validateUrl('http://example.com').ok).toBe(true);
  });

  it('añade https:// si falta el esquema', () => {
    const result = validateUrl('example.com/pagina');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.com/pagina');
  });

  it('rechaza cadenas vacías', () => {
    expect(validateUrl('').ok).toBe(false);
    expect(validateUrl('   ').ok).toBe(false);
  });

  it('rechaza esquemas peligrosos javascript:', () => {
    const result = validateUrl('javascript:alert(1)');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/http|https/i);
  });

  it('rechaza data: URIs', () => {
    expect(validateUrl('data:text/html;base64,PHNjcmlwdD4=').ok).toBe(false);
  });

  it('rechaza file://', () => {
    expect(validateUrl('file:///etc/passwd').ok).toBe(false);
  });

  it('rechaza vbscript:', () => {
    expect(validateUrl('vbscript:msgbox(1)').ok).toBe(false);
  });

  it('rechaza hosts locales y privados', () => {
    expect(validateUrl('http://localhost:3000').ok).toBe(false);
    expect(validateUrl('http://127.0.0.1/admin').ok).toBe(false);
    expect(validateUrl('http://192.168.1.1').ok).toBe(false);
    expect(validateUrl('http://10.0.0.5').ok).toBe(false);
    expect(validateUrl('http://172.16.0.1').ok).toBe(false);
  });

  it('rechaza hostnames sin dominio de nivel superior', () => {
    expect(validateUrl('https://intranet').ok).toBe(false);
  });

  it('rechaza URLs demasiado largas', () => {
    const longUrl = `https://example.com/${'a'.repeat(2100)}`;
    expect(validateUrl(longUrl).ok).toBe(false);
  });

  it('normaliza la URL de salida', () => {
    const result = validateUrl('  https://Example.com  ');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.com/');
  });
});

describe('validateCustomSlug', () => {
  it('acepta slugs alfanuméricos con guiones', () => {
    expect(validateCustomSlug('mi-enlace_123').ok).toBe(true);
  });

  it('rechaza slugs demasiado cortos', () => {
    expect(validateCustomSlug('ab').ok).toBe(false);
  });

  it('rechaza slugs demasiado largos', () => {
    expect(validateCustomSlug('a'.repeat(33)).ok).toBe(false);
  });

  it('rechaza caracteres especiales', () => {
    expect(validateCustomSlug('mi enlace').ok).toBe(false);
    expect(validateCustomSlug('mi/enlace').ok).toBe(false);
    expect(validateCustomSlug('mi.enlace').ok).toBe(false);
  });

  it('recorta espacios alrededor del slug', () => {
    const result = validateCustomSlug('  valido  ');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('valido');
  });
});

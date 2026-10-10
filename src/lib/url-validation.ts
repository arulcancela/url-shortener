/**
 * Validación de URLs para el acortador.
 *
 * Reglas:
 *  - Solo se permiten esquemas http y https.
 *  - Se rechazan esquemas peligrosos: javascript:, data:, file:, vbscript:, etc.
 *  - Se rechazan hosts locales/privados para evitar SSRF y auto-redirección.
 *  - La URL debe tener un hostname con al menos un punto (dominio válido).
 */

export const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

/** Esquemas explícitamente peligrosos que deben bloquearse siempre. */
const DANGEROUS_SCHEMES = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'blob:',
  'ftp:',
  'ftps:',
  'ws:',
  'wss:',
  'mailto:',
  'tel:',
  'about:',
  'chrome:',
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
]);

const PRIVATE_IPV4 = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.)/;

export interface UrlValidationResult {
  ok: boolean;
  /** URL normalizada (solo presente si ok === true). */
  url?: string;
  /** Mensaje de error legible (solo presente si ok === false). */
  error?: string;
}

/** Detecta un esquema explícito al inicio (p. ej. "javascript:"). */
function hasExplicitScheme(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value);
}

/**
 * Valida y normaliza una URL introducida por el usuario.
 */
export function validateUrl(input: string): UrlValidationResult {
  const raw = input.trim();

  if (raw.length === 0) {
    return { ok: false, error: 'La URL no puede estar vacía.' };
  }

  if (raw.length > 2048) {
    return { ok: false, error: 'La URL es demasiado larga (máx. 2048 caracteres).' };
  }

  const lower = raw.toLowerCase();

  // 1) Bloquea esquemas peligrosos ANTES de intentar normalizar,
  //    para poder devolver un mensaje de error preciso.
  if (DANGEROUS_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return {
      ok: false,
      error: 'Solo se permiten URLs con protocolo http o https.',
    };
  }

  // 2) Si hay un esquema explícito distinto de http/https, recházalo.
  //    Si no hay esquema (ej. "example.com"), se asume https.
  const withProtocol = hasExplicitScheme(raw)
    ? raw
    : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return { ok: false, error: 'La URL no tiene un formato válido.' };
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number])) {
    return {
      ok: false,
      error: 'Solo se permiten URLs con protocolo http o https.',
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host) || PRIVATE_IPV4.test(host)) {
    return { ok: false, error: 'No se permiten direcciones locales o privadas.' };
  }

  if (!host.includes('.')) {
    return { ok: false, error: 'El dominio debe ser válido (ej. example.com).' };
  }

  return { ok: true, url: parsed.toString() };
}

/** Comprueba si un slug personalizado es válido. */
export const CUSTOM_SLUG_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export function validateCustomSlug(slug: string): UrlValidationResult {
  const trimmed = slug.trim();
  if (!CUSTOM_SLUG_REGEX.test(trimmed)) {
    return {
      ok: false,
      error: 'El slug debe tener entre 3 y 32 caracteres (letras, números, "-" o "_").',
    };
  }
  return { ok: true, url: trimmed };
}

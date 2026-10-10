import { customAlphabet } from 'nanoid';

/**
 * Generación de slugs.
 *
 * Usamos un alfabeto base62 sin caracteres ambiguos (se eliminan 0/O, 1/l/I)
 * para que los enlaces sean fáciles de leer y transcribir. La longitud por
 * defecto (7) ofrece 56^7 ≈ 1,7·10^12 combinaciones, suficiente para el MVP.
 */

export const SLUG_ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export const SLUG_LENGTH = 7;

const generator = customAlphabet(SLUG_ALPHABET, SLUG_LENGTH);

/** Genera un slug aleatorio base62 no ambiguo. */
export function generateSlug(): string {
  return generator();
}

/** Slugs reservados que colisionan con rutas de la aplicación. */
export const RESERVED_SLUGS = new Set([
  'api',
  'dashboard',
  'admin',
  'login',
  'logout',
  'signup',
  'static',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'about',
  'privacy',
  'terms',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Genera un slug único comprobando disponibilidad contra la base de datos.
 * Reintenta hasta `maxAttempts` veces y lanza error si no lo consigue.
 */
export async function generateUniqueSlug(
  isTaken: (slug: string) => Promise<boolean>,
  maxAttempts = 5,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generateSlug();
    if (isReservedSlug(candidate)) continue;
    // eslint-disable-next-line no-await-in-loop
    const taken = await isTaken(candidate);
    if (!taken) return candidate;
  }
  throw new Error('No se pudo generar un slug único tras varios intentos.');
}

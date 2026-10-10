/**
 * Acceso centralizado y validado a variables de entorno.
 * Falla rápido en producción si falta lo imprescindible.
 */

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

export const env = {
  /** URL pública de la app, usada para construir enlaces cortos. */
  appUrl: readEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
} as const;

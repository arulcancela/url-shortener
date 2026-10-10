#!/usr/bin/env node
/**
 * Cambia el provider de Prisma de SQLite a PostgreSQL (o vuelve a SQLite).
 *
 * Uso:
 *   node scripts/use-postgres.mjs          # cambia a postgresql
 *   node scripts/use-postgres.mjs sqlite   # vuelve a sqlite
 *
 * Esto solo edita prisma/schema.prisma. Recuerda actualizar DATABASE_URL.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const target = (process.argv[2] ?? 'postgresql').toLowerCase();

if (!['postgresql', 'sqlite'].includes(target)) {
  console.error(`Provider no soportado: "${target}". Usa "postgresql" o "sqlite".`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(root, 'prisma', 'schema.prisma');

const original = readFileSync(schemaPath, 'utf8');
const updated = original.replace(
  /(datasource db \{[^}]*provider\s*=\s*")([^"]+)(")/s,
  (_match, prefix, _current, suffix) => `${prefix}${target}${suffix}`,
);

if (updated === original) {
  console.log(`El provider ya estaba en "${target}". Nada que cambiar.`);
  process.exit(0);
}

writeFileSync(schemaPath, updated, 'utf8');
console.log(`✔ Provider de Prisma cambiado a "${target}".`);
console.log('  Recuerda:');
console.log('   - Actualiza DATABASE_URL en tu .env o en Vercel.');
console.log('   - Ejecuta "npx prisma db push" para aplicar el schema.');

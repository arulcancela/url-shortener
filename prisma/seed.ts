import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.link.count();
  if (existing > 0) {
    console.warn('La base de datos ya tiene enlaces; se omite el seed.');
    return;
  }

  // Enlace anónimo de ejemplo (userId = null).
  const link = await prisma.link.create({
    data: {
      slug: 'nextjs',
      url: 'https://nextjs.org',
    },
  });

  const now = Date.now();
  await prisma.click.createMany({
    data: Array.from({ length: 12 }).map((_, i) => ({
      linkId: link.id,
      timestamp: new Date(now - i * 3_600_000),
      referrer: i % 2 === 0 ? 'https://twitter.com' : 'https://google.com',
      userAgent: 'seed-agent/1.0',
      country: ['ES', 'US', 'FR', 'DE'][i % 4] ?? 'ES',
      device: i % 3 === 0 ? 'mobile' : 'desktop',
    })),
  });

  console.warn(`Seed completado: enlace /${link.slug} con 12 clics.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fillDailySeries } from '@/lib/analytics';
import { getOwnedLinkById, LinkError } from '@/lib/links';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface RawCount {
  date: string;
  clicks: bigint | number;
}

/**
 * GET /api/links/:id/clicks?days=30
 * Devuelve la serie diaria de clics (rellenando días sin clics con 0).
 * Solo accesible por el propietario del enlace.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    await getOwnedLinkById(params.id, user?.id ?? null);
  } catch (error) {
    if (error instanceof LinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get('days') ?? '30');
  const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 90) : 30;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  // Agregación por día compatible con SQLite y Postgres.
  const rows = await prisma.$queryRaw<RawCount[]>`
    SELECT strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch') AS date,
           COUNT(*) AS clicks
    FROM "Click"
    WHERE "linkId" = ${params.id} AND timestamp >= ${since.getTime()}
    GROUP BY date
    ORDER BY date ASC
  `.catch(async () => {
    // Fallback para Postgres (strftime no existe).
    return prisma.$queryRaw<RawCount[]>`
      SELECT to_char(timestamp, 'YYYY-MM-DD') AS date, COUNT(*)::int AS clicks
      FROM "Click"
      WHERE "linkId" = ${params.id} AND timestamp >= ${since}
      GROUP BY date
      ORDER BY date ASC
    `;
  });

  const normalized = rows.map((r) => ({ date: r.date, clicks: Number(r.clicks) }));
  const series = fillDailySeries(normalized, days);

  return NextResponse.json({ series });
}

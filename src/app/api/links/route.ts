import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createLink, listLinks, LinkError } from '@/lib/links';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CreateLinkSchema = z.object({
  url: z.string().min(1).max(2048),
  customSlug: z.string().max(32).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/** GET /api/links — lista los enlaces del usuario (o anónimos si no hay sesión). */
export async function GET() {
  const user = await getCurrentUser();
  const links = await listLinks(user?.id ?? null);
  return NextResponse.json({ links });
}

/** POST /api/links — crea un enlace (con rate limit por IP). */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = await checkRateLimit(ip);

  if (!limit.success) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Inténtalo de nuevo en un minuto.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)),
          'X-RateLimit-Backend': limit.backend,
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = CreateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    const link = await createLink(
      {
        url: parsed.data.url,
        customSlug: parsed.data.customSlug,
        expiresAt: parsed.data.expiresAt ?? null,
      },
      user?.id ?? null,
    );
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    if (error instanceof LinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creando enlace:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

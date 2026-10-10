import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isExpired } from '@/lib/links';
import { detectDevice } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

/**
 * Redirección de enlaces cortos.
 *
 * GET /[slug] resuelve el enlace, registra el clic (timestamp, referrer,
 * user-agent, país y dispositivo) y redirige 302 a la URL destino.
 *
 * Nota: se registra el clic de forma "best effort"; si falla el insert no
 * se bloquea la redirección del usuario.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;

  const link = await prisma.link.findUnique({ where: { slug } });

  if (!link) {
    return NextResponse.redirect(new URL('/not-found', request.url), 302);
  }

  if (isExpired(link)) {
    return NextResponse.redirect(new URL('/not-found?expired=1', request.url), 302);
  }

  const userAgent = request.headers.get('user-agent');
  const referrer = request.headers.get('referer');
  const country = request.headers.get('x-vercel-ip-country') ?? null;

  try {
    await prisma.click.create({
      data: {
        linkId: link.id,
        referrer: referrer ?? null,
        userAgent: userAgent ?? null,
        country,
        device: detectDevice(userAgent),
      },
    });
  } catch (error) {
    console.error('No se pudo registrar el clic:', error);
  }

  return NextResponse.redirect(link.url, 302);
}

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
 * IMPORTANTE: si el slug no existe o el enlace ha expirado, devolvemos una
 * página 404 directamente en lugar de redirigir a "/not-found". Redirigir a
 * una ruta interna crearía un bucle infinito, porque esa misma ruta también
 * coincide con el patrón dinámico [slug] (ERR_TOO_MANY_REDIRECTS).
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

  if (!link || isExpired(link)) {
    const html = notFoundPage(!link ? 'no-existe' : 'expirado');
    return new NextResponse(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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

/** Página 404 mínima y autocontenida para slugs inexistentes o expirados. */
function notFoundPage(reason: 'no-existe' | 'expirado'): string {
  const message =
    reason === 'expirado'
      ? 'Este enlace ha expirado.'
      : 'Este enlace no existe.';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 · URL Shortener</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif;
           display: flex; min-height: 100vh; align-items: center; justify-content: center;
           background: #fff; color: #0f172a; }
    @media (prefers-color-scheme: dark) { body { background: #020617; color: #f8fafc; } }
    main { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin: 0 0 0.5rem; }
    p { color: #64748b; margin: 0 0 1.5rem; }
    a { color: inherit; text-decoration: underline; text-underline-offset: 4px; }
  </style>
</head>
<body>
  <main>
    <h1>404</h1>
    <p>${message}</p>
    <a href="/">Volver al inicio</a>
  </main>
</body>
</html>`;
}

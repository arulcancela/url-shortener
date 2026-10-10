import { NextResponse, type NextRequest } from 'next/server';
import { deleteOwnedLink, getOwnedLinkById, LinkError } from '@/lib/links';
import { getCurrentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET /api/links/:id — detalle de un enlace propio con sus últimos clics. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const link = await getOwnedLinkById(params.id, user?.id ?? null);
    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof LinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

/** DELETE /api/links/:id — elimina un enlace propio (y sus clics en cascada). */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    await deleteOwnedLink(params.id, user?.id ?? null);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof LinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

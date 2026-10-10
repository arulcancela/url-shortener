import { prisma } from '@/lib/prisma';
import { generateUniqueSlug, isReservedSlug } from '@/lib/slug';
import { validateUrl, validateCustomSlug } from '@/lib/url-validation';
import type { CreateLinkInput, LinkWithCount } from '@/types';

export class LinkError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'LinkError';
  }
}

/**
 * Crea un enlace tras validar URL, slug y expiración.
 * `userId` es opcional: si hay sesión, el enlace queda asociado al usuario.
 */
export async function createLink(input: CreateLinkInput, userId?: string | null) {
  const urlResult = validateUrl(input.url);
  if (!urlResult.ok || !urlResult.url) {
    throw new LinkError(urlResult.error ?? 'URL inválida.', 400);
  }

  let slug: string;
  if (input.customSlug && input.customSlug.trim().length > 0) {
    const slugResult = validateCustomSlug(input.customSlug);
    if (!slugResult.ok || !slugResult.url) {
      throw new LinkError(slugResult.error ?? 'Slug inválido.', 400);
    }
    slug = slugResult.url;
    if (isReservedSlug(slug)) {
      throw new LinkError('Ese slug está reservado.', 409);
    }
    const taken = await prisma.link.findUnique({ where: { slug } });
    if (taken) {
      throw new LinkError('Ese slug ya está en uso.', 409);
    }
  } else {
    slug = await generateUniqueSlug(async (candidate) => {
      const found = await prisma.link.findUnique({ where: { slug: candidate } });
      return found !== null;
    });
  }

  let expiresAt: Date | null = null;
  if (input.expiresAt) {
    const parsed = new Date(input.expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new LinkError('La fecha de expiración no es válida.', 400);
    }
    if (parsed.getTime() <= Date.now()) {
      throw new LinkError('La fecha de expiración debe ser futura.', 400);
    }
    expiresAt = parsed;
  }

  return prisma.link.create({
    data: { slug, url: urlResult.url, expiresAt, userId: userId ?? null },
    include: { _count: { select: { clicks: true } } },
  });
}

/**
 * Lista los enlaces del usuario.
 * Si `userId` es null, devuelve solo los enlaces anónimos (sin dueño).
 */
export async function listLinks(userId?: string | null): Promise<LinkWithCount[]> {
  return prisma.link.findMany({
    where: { userId: userId ?? null },
    include: { _count: { select: { clicks: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtiene un enlace por id verificando la propiedad.
 * Lanza LinkError 404 si no existe o no pertenece al usuario.
 */
export async function getOwnedLinkById(id: string, userId?: string | null) {
  const link = await prisma.link.findUnique({
    where: { id },
    include: {
      clicks: { orderBy: { timestamp: 'desc' }, take: 100 },
      _count: { select: { clicks: true } },
    },
  });

  if (!link) {
    throw new LinkError('Enlace no encontrado.', 404);
  }
  if ((link.userId ?? null) !== (userId ?? null)) {
    throw new LinkError('Enlace no encontrado.', 404);
  }
  return link;
}

export async function getLinkBySlug(slug: string) {
  return prisma.link.findUnique({ where: { slug } });
}

/** Elimina un enlace verificando la propiedad. */
export async function deleteOwnedLink(id: string, userId?: string | null): Promise<void> {
  await getOwnedLinkById(id, userId);
  await prisma.link.delete({ where: { id } });
}

/** Indica si un enlace ha expirado. */
export function isExpired(link: { expiresAt: Date | null }, now: Date = new Date()): boolean {
  return link.expiresAt !== null && link.expiresAt.getTime() <= now.getTime();
}

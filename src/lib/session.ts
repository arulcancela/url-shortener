import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Devuelve el usuario de la sesión actual o null si no hay sesión.
 * Envuelve getServerSession para centralizar el acceso y facilitar tests.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (user && 'id' in user && typeof (user as { id?: unknown }).id === 'string') {
    return user as SessionUser;
  }
  return null;
}

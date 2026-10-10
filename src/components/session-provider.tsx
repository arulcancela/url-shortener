'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Envuelve la app con el SessionProvider de NextAuth.
 *
 * `refetchOnWindowFocus={false}` evita peticiones innecesarias a /api/auth/session.
 * Al ser un Client Component, NextAuth gestiona la sesión en el cliente y el
 * SSR de páginas estáticas no intenta leer un contexto no inicializado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Menú de usuario.
 *
 * `mounted` evita renderizar contenido dependiente de la sesión durante el
 * SSR/hidratación inicial, donde `useSession` aún no tiene contexto. Esto
 * previene el error "Invalid hook call" al integrarse con un layout de servidor.
 */
export function UserMenu() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Placeholder estable en servidor y primer render del cliente (evita mismatch).
  if (!mounted || status === 'loading') {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn('github')}>
        <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
      </Button>
    );
  }

  const user = session.user;
  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Menú de usuario" className="rounded-full">
          <Avatar>
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? 'Usuario'} /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="truncate">{user.name ?? user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="w-full">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

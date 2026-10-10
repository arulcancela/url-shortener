import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { UserMenu } from '@/components/user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Server Component: la estructura del header se renderiza en servidor.
 * Los componentes que necesitan estado/sesión (UserMenu, ThemeToggle) son
 * Client Components ("islas") y se hidratan en el navegador.
 */
export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Link2 className="h-5 w-5" />
          <span>URL Shortener</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}

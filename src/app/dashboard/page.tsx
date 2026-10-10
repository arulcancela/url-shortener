import Link from 'next/link';
import { listLinks } from '@/lib/links';
import { getCurrentUser } from '@/lib/session';
import { LinkTable } from '@/components/link-table';
import { LinkForm } from '@/components/link-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogIn } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const links = await listLinks(user?.id ?? null);
  const totalClicks = links.reduce((acc, l) => acc + l._count.clicks, 0);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {user
              ? `Enlaces de ${user.name ?? user.email}`
              : 'Enlaces anónimos (inicia sesión para guardarlos en tu cuenta)'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Nuevo enlace
          </Link>
        </Button>
      </header>

      {!user ? (
        <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Inicia sesión con GitHub para que tus enlaces queden asociados a tu cuenta.
          </p>
          <Button asChild size="sm">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Enlaces" value={links.length} />
        <StatCard label="Clics totales" value={totalClicks} />
      </div>

      <LinkForm />

      {links.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Todavía no hay enlaces. Crea el primero con el formulario de arriba.
        </div>
      ) : (
        <LinkTable links={links} />
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getOwnedLinkById, LinkError } from '@/lib/links';
import { getCurrentUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { ClicksChart } from '@/components/clicks-chart';
import { QrDialog } from '@/components/qr-dialog';
import { CopyButton } from '@/components/copy-button';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const link = await getOwnedLinkById(params.id, user?.id ?? null);
    return { title: `/${link.slug}` };
  } catch {
    return { title: 'Enlace no encontrado' };
  }
}

export default async function LinkDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();

  let link;
  try {
    link = await getOwnedLinkById(params.id, user?.id ?? null);
  } catch (error) {
    if (error instanceof LinkError && error.status === 404) notFound();
    throw error;
  }

  const shortUrl = `${env.appUrl.replace(/\/$/, '')}/${link.slug}`;
  const countryCounts = countBy(link.clicks, (c) => c.country ?? 'Desconocido');
  const referrerCounts = countBy(link.clicks, (c) => c.referrer ?? 'Directo');

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </Button>
        <div className="flex gap-2">
          <CopyButton value={shortUrl} />
          <QrDialog url={shortUrl} />
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">/{link.slug}</h1>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {link.url}
        </a>
        <p className="text-sm text-muted-foreground">
          Creado el {new Date(link.createdAt).toLocaleDateString('es-ES')} · {link._count.clicks}{' '}
          {link._count.clicks === 1 ? 'clic' : 'clics'}
          {link.expiresAt
            ? ` · Expira el ${new Date(link.expiresAt).toLocaleDateString('es-ES')}`
            : ''}
        </p>
      </header>

      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Clics por día (últimos 30 días)</h2>
        <ClicksChart linkId={link.id} />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <BreakdownCard title="Países" data={countryCounts} />
        <BreakdownCard title="Referrers" data={referrerCounts} />
      </div>

      <section className="rounded-lg border">
        <h2 className="border-b p-4 text-lg font-semibold">Últimos accesos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">País</th>
                <th className="px-4 py-2 font-medium">Dispositivo</th>
                <th className="px-4 py-2 font-medium">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {link.clicks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    Sin clics todavía.
                  </td>
                </tr>
              ) : (
                link.clicks.map((click) => (
                  <tr key={click.id} className="border-t">
                    <td className="px-4 py-2">
                      {new Date(click.timestamp).toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-2">{click.country ?? '—'}</td>
                    <td className="px-4 py-2">{click.device ?? '—'}</td>
                    <td className="max-w-[240px] truncate px-4 py-2">
                      {click.referrer ?? 'Directo'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Array<[string, number]> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function BreakdownCard({ title, data }: { title: string; data: Array<[string, number]> }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos.</p>
      ) : (
        <ul className="space-y-2">
          {data.slice(0, 5).map(([label, count]) => (
            <li key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{label}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

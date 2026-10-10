'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ExternalLink, BarChart3 } from 'lucide-react';
import type { LinkWithCount } from '@/types';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/copy-button';
import { QrDialog } from '@/components/qr-dialog';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function LinkTable({ links }: { links: LinkWithCount[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este enlace y todos sus clics?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Enlace</th>
            <th className="px-4 py-3 font-medium">Destino</th>
            <th className="px-4 py-3 font-medium">Clics</th>
            <th className="px-4 py-3 font-medium">Creado</th>
            <th className="px-4 py-3 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const short = `${APP_URL}/${link.slug}`;
            return (
              <tr key={link.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/${link.id}`} className="font-medium hover:underline">
                    /{link.slug}
                  </Link>
                </td>
                <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                  {link.url}
                </td>
                <td className="px-4 py-3">{link._count.clicks}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(link.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <CopyButton value={short} />
                    <QrDialog url={short} />
                    <Button asChild variant="ghost" size="icon" title="Ver analíticas">
                      <Link href={`/dashboard/${link.id}`}>
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" title="Abrir destino">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Eliminar"
                      onClick={() => handleDelete(link.id)}
                      disabled={deleting === link.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

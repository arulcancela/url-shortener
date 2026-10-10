'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Link } from '@/types';
import { CopyButton } from '@/components/copy-button';
import { QrDialog } from '@/components/qr-dialog';

interface FormState {
  url: string;
  customSlug: string;
  expiresAt: string;
}

const initialState: FormState = { url: '', customSlug: '', expiresAt: '' };

export function LinkForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Link | null>(null);

  const shortUrl = created
    ? `${(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/${created.slug}`
    : '';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCreated(null);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: form.url,
          customSlug: form.customSlug || undefined,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });

      const data = (await response.json()) as { link?: Link; error?: string };

      if (!response.ok) {
        setError(data.error ?? 'No se pudo crear el enlace.');
        return;
      }

      setCreated(data.link ?? null);
      setForm(initialState);
      router.refresh();
    } catch {
      setError('Error de red. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="url">URL larga</Label>
          <Input
            id="url"
            name="url"
            type="text"
            placeholder="https://example.com/mi-ruta-muy-larga"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            required
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customSlug">Slug personalizado (opcional)</Label>
            <Input
              id="customSlug"
              name="customSlug"
              placeholder="mi-enlace"
              value={form.customSlug}
              onChange={(e) => setForm((f) => ({ ...f, customSlug: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expira el (opcional)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando…
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" /> Acortar URL
            </>
          )}
        </Button>
      </form>

      {created ? (
        <div
          data-testid="created-link"
          className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm text-muted-foreground">Enlace creado</p>
            <a
              href={shortUrl}
              className="break-all font-medium underline underline-offset-4"
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortUrl}
            </a>
          </div>
          <div className="flex gap-2">
            <CopyButton value={shortUrl} />
            <QrDialog url={shortUrl} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

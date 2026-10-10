'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode as QrIcon, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function QrDialog({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(url, { width: 320, margin: 2 })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Código QR">
          <QrIcon className="h-4 w-4" />
          <span className="sr-only">Ver código QR</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Código QR</DialogTitle>
          <DialogDescription className="break-all">{url}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`Código QR de ${url}`} className="h-64 w-64" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded border text-muted-foreground">
              Generando…
            </div>
          )}
          <Button asChild disabled={!dataUrl}>
            <a href={dataUrl ?? '#'} download="qr.png">
              <Download className="mr-2 h-4 w-4" /> Descargar PNG
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-semibold">Algo ha ido mal</h2>
      <p className="text-muted-foreground max-w-md">{error.message}</p>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}

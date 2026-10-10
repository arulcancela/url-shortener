import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Este enlace no existe o ha expirado.</p>
      <Link href="/" className="underline underline-offset-4 hover:text-foreground">
        Volver al inicio
      </Link>
    </div>
  );
}

import Link from 'next/link';
import { Link2, BarChart3, QrCode } from 'lucide-react';
import { LinkForm } from '@/components/link-form';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Acorta, comparte y mide
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl">
          Convierte URLs largas en enlaces cortos, genera códigos QR y consulta analíticas de
          clics en tiempo real.
        </p>
      </header>

      <LinkForm />

      <section className="grid gap-6 sm:grid-cols-3">
        <Feature icon={<Link2 className="h-5 w-5" />} title="Enlaces cortos" text="Slugs únicos generados con nanoid." />
        <Feature icon={<BarChart3 className="h-5 w-5" />} title="Analíticas" text="Clics por día, referrers, país y dispositivo." />
        <Feature icon={<QrCode className="h-5 w-5" />} title="Códigos QR" text="Descarga el QR de cada enlace en PNG." />
      </section>

      <footer className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
          Ir al dashboard →
        </Link>
      </footer>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center gap-2 font-medium">
        {icon}
        {title}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

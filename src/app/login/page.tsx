import { GitHubLoginButton } from '@/components/github-login-button';

export const metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  const githubEnabled = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-6 px-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-muted-foreground">
          Accede para gestionar tus enlaces y ver sus analíticas privadas.
        </p>
      </div>

      {githubEnabled ? (
        <GitHubLoginButton />
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">GitHub OAuth no configurado</p>
          <p>
            Define <code className="rounded bg-muted px-1">GITHUB_ID</code> y{' '}
            <code className="rounded bg-muted px-1">GITHUB_SECRET</code> en tu <code>.env</code> para
            habilitar el login. Consulta el README.
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Sin sesión puedes seguir creando enlaces anónimos, pero no verás tus estadísticas privadas.
      </p>
    </main>
  );
}

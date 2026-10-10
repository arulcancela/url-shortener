'use client';

import { signIn } from 'next-auth/react';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GitHubLoginButton() {
  return (
    <Button onClick={() => signIn('github', { callbackUrl: '/dashboard' })} className="w-full">
      <Github className="mr-2 h-4 w-4" /> Continuar con GitHub
    </Button>
  );
}

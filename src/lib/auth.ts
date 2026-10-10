import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from '@/lib/prisma';

const hasGitHub = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

/**
 * Configuración de NextAuth.
 *
 * Estrategia de sesión: JWT (necesaria para el PrismaAdapter en algunos
 * escenarios serverless). El `userId` se propaga a la sesión para poder
 * filtrar enlaces por usuario.
 *
 * Si no hay credenciales de GitHub configuradas (p. ej. en CI o en un clon
 * recién bajado), el proveedor se omite y la app funciona en modo anónimo.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me',
  providers: hasGitHub
    ? [
        GitHubProvider({
          clientId: process.env.GITHUB_ID as string,
          clientSecret: process.env.GITHUB_SECRET as string,
        }),
      ]
    : [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: false,
};

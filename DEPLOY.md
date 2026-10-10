# 🚀 Guía de despliegue paso a paso

Esta guía te lleva desde cero hasta una app **funcionando en producción, gratis**.

Stack de producción (todo en capa gratuita):

- **Base de datos:** [Neon](https://neon.tech) (Postgres serverless)
- **Hosting:** [Vercel](https://vercel.com) (Next.js)
- **Auth:** GitHub OAuth (gratis)
- **Rate limiting:** [Upstash Redis](https://upstash.com) — _opcional_

> Tiempo estimado: **20-30 minutos**.

---

## Índice

1. [Crear la base de datos en Neon](#1-crear-la-base-de-datos-en-neon)
2. [Cambiar Prisma a Postgres](#2-cambiar-prisma-a-postgres)
3. [Crear la OAuth App de GitHub](#3-crear-la-oauth-app-de-github)
4. [Desplegar en Vercel](#4-desplegar-en-vercel)
5. [(Opcional) Upstash Redis](#5-opcional-upstash-redis)
6. [Verificar el despliegue](#6-verificar-el-despliegue)

---

## 1. Crear la base de datos en Neon

1. Ve a **https://neon.tech** y crea una cuenta (con GitHub, en 10 segundos).
2. **Create project**:
   - **Name:** `url-shortener`
   - **Database name:** `urlshortener`
   - **Region:** la más cercana a ti (p. ej. `Europe (Frankfurt)` o `AWS eu-central-1`).
3. Una vez creado, copia la **Connection string**. Se ve así:

   ```
   postgresql://user:password@ep-xxx-xxx.eu-central-1.aws.neon.tech/urlshortener?sslmode=require
   ```

   > ⚠️ Guarda esta URL. La necesitarás en el paso 4.

4. Guarda esa URL. **No la compartas ni la subas a Git.**

> 💡 Neon tiene un plan gratuito de 0,5 GB que sobra de sobra para este proyecto.

---

## 2. Cambiar Prisma a Postgres

En tu copia local del repositorio:

```bash
cd url-shortener

# Cambia el provider de SQLite a PostgreSQL automáticamente
node scripts/use-postgres.mjs

# Comprueba que ha cambiado
grep -A3 'datasource db' prisma/schema.prisma
# Debe decir: provider = "postgresql"
```

Ahora actualiza tu `.env` local con la URL de Neon:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/urlshortener?sslmode=require"
```

Y aplica el schema a la base de datos de Neon:

```bash
npx prisma db push
```

> Si vas a seguir desarrollando en local, puedes volver a SQLite con:
> `node scripts/use-postgres.mjs sqlite`

---

## 3. Crear la OAuth App de GitHub

Mientras no subas la app a Vercel, no sabrás la URL final. Puedes hacerlo ahora con una URL provisional y **editar después**, o esperar al paso 4 y hacerlo entonces.

1. Ve a **https://github.com/settings/developers** → **New OAuth App**.
2. Rellena:
   - **Application name:** `URL Shortener`
   - **Homepage URL:** `https://TU-APP.vercel.app` (lo ajustarás tras el deploy)
   - **Authorization callback URL:** `https://TU-APP.vercel.app/api/auth/callback/github`
3. **Register application**.
4. Copia el **Client ID** y genera un **Client Secret** (cópialo, solo se muestra una vez).

---

## 4. Desplegar en Vercel

### Opción A — Desde la web (recomendada)

1. Ve a **https://vercel.com/new**.
2. **Import Git Repository** → selecciona `arulcancela/url-shortener`.
3. Antes de darle a Deploy, abre **Environment Variables** y añade:

   | Variable              | Valor                                                 |
   | --------------------- | ----------------------------------------------------- |
   | `DATABASE_URL`        | tu connection string de Neon                          |
   | `NEXT_PUBLIC_APP_URL` | `https://TU-APP.vercel.app` (Vercel te da el dominio) |
   | `NEXTAUTH_SECRET`     | un secreto aleatorio (ver abajo)                      |
   | `NEXTAUTH_URL`        | `https://TU-APP.vercel.app`                           |
   | `GITHUB_ID`           | Client ID de la OAuth App                             |
   | `GITHUB_SECRET`       | Client Secret de la OAuth App                         |

   Genera el `NEXTAUTH_SECRET` con:

   ```bash
   openssl rand -base64 32
   ```

4. **Deploy**. Vercel ejecutará `prisma generate && prisma db push && next build` (definido en `vercel.json`).

### Opción B — Desde la terminal con Vercel CLI

```bash
npm i -g vercel
cd url-shortener
vercel login
vercel link          # vincula el proyecto
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GITHUB_ID production
vercel env add GITHUB_SECRET production
vercel --prod
```

### Tras el deploy

1. Copia la URL que te da Vercel (p. ej. `https://url-shortener-arulcancela.vercel.app`).
2. Si creaste la OAuth App con una URL provisional, **edítala** en GitHub:
   - **Homepage URL:** `https://TU-APP.vercel.app`
   - **Authorization callback URL:** `https://TU-APP.vercel.app/api/auth/callback/github`
3. En Vercel → **Settings → Environment Variables**, corrige `NEXT_PUBLIC_APP_URL` y `NEXTAUTH_URL` con la URL final y **redeploy**.

---

## 5. (Opcional) Upstash Redis

Para que el rate limiting funcione de verdad en serverless (compartido entre instancias):

1. Ve a **https://console.upstash.com** → **Create Database**.
   - **Name:** `url-shortener-ratelimit`
   - **Type:** Regional · **TLS** activado
2. En la pestaña **REST API**, copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Añádelos como variables de entorno en Vercel y redeploy.

> Sin estas variables, la app usa el limitador en memoria (funciona, pero no se comparte entre instancias serverless).

---

## 6. Verificar el despliegue

Abre `https://TU-APP.vercel.app` y comprueba:

- [ ] La home carga y el formulario funciona.
- [ ] Crear un enlace devuelve un slug y aparece el QR.
- [ ] Al visitar el slug corto, redirige al destino.
- [ ] `/dashboard` lista el enlace con su número de clics.
- [ ] Iniciar sesión con GitHub funciona (si configuraste OAuth).
- [ ] La página de detalle muestra la gráfica de clics.

### Solución de problemas comunes

| Síntoma                              | Causa probable                          | Solución                                                      |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| Error 500 al crear enlaces           | `DATABASE_URL` mal o schema no aplicado | Revisa la variable y ejecuta `npx prisma db push` con esa URL |
| Login falla o redirige a error       | `NEXTAUTH_URL` incorrecta               | Debe ser exactamente la URL de producción, sin barra final    |
| Error `OAuthCallback`                | Callback URL de GitHub incorrecta       | Debe ser `https://TU-APP.vercel.app/api/auth/callback/github` |
| Página en blanco / errores de sesión | Falta `NEXTAUTH_SECRET`                 | Añádelo en Vercel y redeploy                                  |
| Assets 404 en producción             | Build cacheada                          | Redeploy con "Clear cache"                                    |

---

## 🔒 Checklist de seguridad antes de publicar

- [ ] `NEXTAUTH_SECRET` es un valor aleatorio único (no el de desarrollo).
- [ ] Ninguna clave/token está en el repo (`.env` está ignorado).
- [ ] `NEXT_PUBLIC_APP_URL` y `NEXTAUTH_URL` apuntan a HTTPS en producción.
- [ ] La OAuth App tiene el callback correcto.

---

## 💰 Coste

Todo lo anterior cabe en capas gratuitas:

| Servicio       | Plan gratuito             |
| -------------- | ------------------------- |
| Vercel (Hobby) | 100 GB ancho de banda/mes |
| Neon           | 0,5 GB almacenamiento     |
| Upstash Redis  | 10.000 comandos/día       |
| GitHub OAuth   | Ilimitado                 |

**Total: 0 €/mes.**

# Contribuir

¡Gracias por tu interés! Este proyecto nació como portfolio, pero las contribuciones son bienvenidas.

## Flujo de trabajo

1. Haz un **fork** y crea una rama descriptiva:
   ```bash
   git checkout -b feat/nombre-descriptivo
   ```
2. Instala dependencias y prepara la base de datos:
   ```bash
   npm install
   cp .env.example .env
   npm run db:push
   ```
3. Desarrolla con la app en marcha:
   ```bash
   npm run dev
   ```
4. **Antes de hacer commit**, asegúrate de que todo pasa:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
5. Abre un Pull Request siguiendo las plantillas.

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):

```
feat:     nueva funcionalidad
fix:      corrección de un bug
docs:     cambios en documentación
test:     añadir o corregir tests
refactor: cambios de código que no alteran comportamiento
chore:    tareas de mantenimiento
perf:     mejoras de rendimiento
ci:       cambios en la integración continua
```

Ejemplo: `feat(slug): permitir slugs personalizados de hasta 32 caracteres`

## Estilo de código

- **TypeScript estricto**. Prohibido `any` (lo verifica ESLint).
- Formatea con Prettier antes de subir: `npm run format`.
- Lógica de negocio en `src/lib` con sus tests unitarios correspondientes.
- Los route handlers deben ser finos: validar (zod) y delegar.

## Tests

- Añade **tests unitarios** (Vitest) para nueva lógica en `src/lib`.
- Añade/actualiza **tests E2E** (Playwright) si cambias el flujo de usuario.

## ¿Dudas?

Abre un [issue](https://github.com/TU-USUARIO/url-shortener/issues) describiendo tu pregunta o idea.

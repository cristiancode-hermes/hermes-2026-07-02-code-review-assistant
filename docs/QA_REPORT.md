# QA Report — Code Review Assistant

## Resumen
✅ **PASS** — 69 tests passing, 0 failing, 0 skipped

## Build
- `tsc --build`: ✅ (API compila sin errores)
- `ng build`: ✅ (Web compila sin errores, 302.77 kB initial chunk)

## Tests
- **Existentes:** 21 pass (3 suites originales)
  - `AuthService` — 8 tests
  - `AgentCoordinatorService` — 4 tests
  - `LocalHeuristicStrategy` — 8 tests
- **Nuevos añadidos:** 48 tests en 7 nuevas suites
  - `ReviewsService` — 9 tests
  - `DashboardService` — 6 tests
  - `HistoryService` — 7 tests
  - `RepositoriesService` — 10 tests
  - `PullRequestsService` — 8 tests
  - `AuthController` — 4 tests
  - `PreferencesService` — 4 tests
- **Total:** **69 tests, 10 suites, 0 fallos**

## Auditoría

| Aspecto | Estado | Detalle |
|---|---|---|
| Build API | ✅ | `tsc --build --force` exitoso |
| Build Web | ✅ | Angular 22 build exitoso, lazy chunks well-split |
| Tests API | ✅ | 69/69 pass, cobertura de servicios clave |
| Tests Web | ❌ | **0 tests.** Sin test framework configurado (angular.json sin `test` builder). `skipTests: true` en todos los schematics. |
| Lint | ⚠️ | No hay config de ESLint en API ni Web. Sin `eslint` o `prettier` en dependencias del API. Web tiene prettier pero sin script de lint configurado. |
| Types | ✅ | `strictNullChecks: true`, TypeScript 6.0 en web, ~6.5 en API |
| Código | ⚠️ | LocalHeuristicStrategy.BUG-003 inalcanzable: `!lines[i].includes('parseInt(')` anula la detección de parseInt sin radix. `nun` se ejecuta. |
| Docs | ✅ | ARCHITECTURE.md, API.md, FRONTEND.md, LEARNINGS.md, DECISIONS.md, DATABASE.md, AI_INTEGRATION.md — todos completos |
| Edge cases | ⚠️ | DashboardService: `In(prIds)` con array vacío podría fallar con ciertos drivers SQL. HistoryService y DashboardService no tienen tests de borde para `prIds.length === 1` (se usa `In(...)` pero el código maneja ese caso con ternario). |
| Design system | ⚠️ | `styles.css` usa colores simplificados (`--color-primary: #6366f1`) vs el spec que define escalas completas 50-900. El spec de diseño no se implementó al 100% (faltan --color-primary-50 a 900). |
| Accesibilidad | ⚠️ | Componentes usan clases de color de Tailwind (`text-neutral-900`) directamente sin consideración de contraste. Sin tests de accesibilidad. |
| States loading/error | ✅ | DashboardPageComponent maneja loading, error y empty states con componentes SkeletonComponent, ErrorStateComponent y EmptyStateComponent |

## Issues

### [⚠️ Media] BUG-003 en LocalHeuristicStrategy inalcanzable
- **Archivo:** `apps/api/src/agents/strategies/local-heuristic.strategy.ts` línea 219
- **Problema:** `if (/parseInt\s*\([^,)]+\)/.test(lines[i]) && !lines[i].includes('parseInt(') && !lines[i].includes(','))` — la condición `!lines[i].includes('parseInt(')` es siempre `false` cuando el regex coincide, porque `parseInt(` acaba de coincidir en el regex. Esto hace que el chequeo BUG-003 (parseInt sin radix) sea inalcanzable.
- **Solución:** Eliminar `&& !lines[i].includes('parseInt(')`. La línea debería ser: `if (!lines[i].includes(',') && /parseInt\s*\(/.test(lines[i]))`

### [⚠️ Media] Sin tests en Angular
- **Problema:** El frontend Angular tiene 0 tests. No hay Karma configurado ni test runner. Todos los schematics tienen `skipTests: true`.
- **Impacto:** Cualquier refactor del frontend no tiene red de seguridad. Componentes como `DashboardPageComponent`, `AuthService`, `ApiService` no tienen cobertura.
- **Solución:** Configurar Karma + Jasmine (o migrar a Jest + `@angular-builders/jest`). Agregar TestBed tests para servicios y componentes clave.

### [⚠️ Media] Design system incompleto
- **Archivo:** `apps/web/src/styles.css`
- **Problema:** El `DESIGN_SYSTEM.md` define escalas completas de color (50-900) y tokens específicos. `styles.css` solo define `--color-primary`, `--color-primary-dark`, etc. sin las escalas. Las sombras usan `shadow-*` de Tailwind en vez de los valores personalizados del spec.
- **Solución:** Migrar `styles.css` a usar las escalas completas del spec (`--color-primary-50` a `--color-primary-900`) o documentar que se usa la convención simplificada de Tailwind v4.

### [📝 Baja] SeedService hardcodea contraseña
- **Archivo:** `apps/api/src/seed/seed.service.ts`
- **Problema:** `const hash = await bcrypt.hash('demo1234', 10)` — contraseña hardcodeada para usuarios demo.
- **Sugerencia:** Usar variable de entorno `SEED_PASSWORD` o generar una aleatoria en producción.

### [📝 Baja] Sin linting configurado
- **Problema:** `apps/api/package.json` no incluye ESLint ni scripts de lint. `apps/web` tiene prettier pero no hay script de lint.
- **Sugerencia:** Agregar ESLint con configuración compartida (NestJS + TypeScript strict) y un hook pre-commit.

### [📝 Baja] ReviewsService.getMockFilesForPR no valida entrada
- **Archivo:** `apps/api/src/reviews/reviews.service.ts`
- **Problema:** `getMockFilesForPR(prId)` acepta cualquier `prId` y crea archivos mock sin verificar permisos o existencia del PR.
- **Sugerencia:** Agregar verificación del PR antes de crear archivos mock, o refactorizar para usar solo seed data.

## Tests nuevos

| Suite | Tests | Qué prueba |
|---|---|---|
| `ReviewsService` | 9 | runReview, getReview, getSummary, rerunAgent, getFindings (con filtros), getFindingsStats |
| `DashboardService` | 6 | getStats (con y sin datos), getRecentReviews, getScoreByCategory |
| `HistoryService` | 7 | findAll (paginación, filtros por fecha), getTrend, getReviewDetail |
| `RepositoriesService` | 10 | CRUD completo, search/sort, findOne con NotFound/Forbidden, getBranches, getStats |
| `PullRequestsService` | 8 | CRUD completo, getDiff, getFileDiff con NotFound |
| `AuthController` | 4 | register, login, getProfile, updateProfile (verifica delegación a AuthService) |
| `PreferencesService` | 4 | getPreferences (existente y default), updatePreferences (con y sin prefs existentes) |

## Resumen de cobertura

| Servicio | Tests | Cobertura |
|---|---|---|
| AuthService | 8 ✅ | register, login, getProfile, updateProfile |
| AuthController | 4 ✅ | Delegate calls |
| AgentCoordinatorService | 4 ✅ | runReview, rerunAgent |
| ReviewsService | 9 ✅ | Nuevo — full CRUD + summary + findings |
| DashboardService | 6 ✅ | Nuevo — stats, recent, scores |
| HistoryService | 7 ✅ | Nuevo — paginated, trends, detail |
| RepositoriesService | 10 ✅ | Nuevo — CRUD + ownership |
| PullRequestsService | 8 ✅ | Nuevo — CRUD + diff + file |
| PreferencesService | 4 ✅ | Nuevo — get + update |
| LocalHeuristicStrategy | 8 ✅ | All 4 agent categories |
| Web (Angular) | 0 ❌ | Sin framework de tests |

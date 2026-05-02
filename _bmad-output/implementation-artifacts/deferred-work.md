# Deferred Work — Motora IA

> Backlog técnico de items diferidos durante reviews. Cada bloque referencia su origen.

## Deferred from: code review of 1-2-user-registration-email-google-apple (2026-05-01)

- **W6** (resolución D6) — Race condition: signUp → trigger `onUserCreated` vs `onboarding-profile.tsx` que lee `users/{uid}` post-redirect. Cold start del trigger Cloud Function 0-3s puede dejar al onboarding leyendo doc inexistente. Reabrir en Story 2.1 (first vehicle onboarding 3-step flow) — agregar retry logic con `onSnapshot` o backoff en `onboarding-profile.tsx` cuando el doc inicial no existe.
- **W2** — Performance micro-opts en `mobile/app/(auth)/register.tsx`: `handleAuthError` fresh identity por render, `primaryButtonStyle`/`fieldWrapperStyle`/`ssoButtonStyle` recreados cada render, `useEffect` de Apple availability corre en cada mount sin cache. No son bugs funcionales — futurible cleanup en story de performance pass.
- **W3** — T8.8 smoke tests manuales pendientes de Dario en device físico (cold start → register → SSO Google + Apple iOS → Firestore Emulator UI). Requiere Firebase real config (Google web client ID, `GoogleService-Info.plist`, Apple Dev account). Bloqueante de Beta release, no del code review de esta story.
- **W4** — `modulePaths: ["<rootDir>/../node_modules"]` hack en `functions/jest.config.js` y `mobile/jest.config.js` para compensar pnpm hoisting. Patrón heredado de Story 1.1. Reabrir solo si hay regresiones por package no-hoisted.
- **W5** — `ref.set()` rejection sin try/catch en trigger `onUserCreated` (`functions/src/controllers/auth.controller.ts:57`). Cloud Functions tiene retry default → riesgo marginal de orphan account solo si todos los retries fallan. Documentar o agregar try/catch en story de backend hardening.

## Deferred from: code review of 1-3-user-login-session-persistence (2026-05-02)

- **W7** — Story 1.6 trap: el handler de logout explícito DEBE llamar `clearSessionFlag()` antes/durante `signOut()`, sino el listener `onAuthStateChanged` en `_layout.tsx:92-100` dispara el toast "Tu sesión expiró" en cada logout intencional. Ya documentado en T2.2 de la spec, pero crítico de no olvidar al implementar Story 1.6.
- **W8** — `auth/user-disabled` (cuentas baneadas / desactivadas por admin) cae a `"generic"` en `classifyAuthError` → user ve toast "Algo salió mal. Vamos a intentar de nuevo." con CTA retry inútil. Hardening UX post-MVP: agregar clase `"account-disabled"` con copy específico ("Tu cuenta está deshabilitada. Contactanos.").
- **W9** — `auth/account-exists-with-different-credential` no mapeado — user que se registró con Google y prueba email/password (o vice-versa) ve "Algo salió mal" en vez de hint del provider correcto. Hardening UX post-MVP: clase `"account-conflict"` con copy "Esta cuenta usa otro método de inicio. Probá Google/Apple/email."
- **W10** — Re-entrancy teórica de `onAuthStateChanged` durante soft-logout: si Firebase fire 2 eventos rápidos con `firebaseUser=null` y el flag está en `"1"`, ambas invocaciones leen `flag=true` antes que la primera lo borre, agendan 2 `setTimeout` y muestran el toast duplicado. Edge raro (requiere flicker auth state). Fix posible: in-flight ref / mutex.
- **W11** — `params.email` no se trimea antes del `useState(params.email ?? "")` en `login.tsx:48` — si el router pasa `"  user@x.com\n"`, la validación on-blur dispara error sobre un valor que el screen previo entregó tal cual. Cosmetic; agregar `.trim()` al inicializar el state.

# Deferred Work — Motora IA

> Backlog técnico de items diferidos durante reviews. Cada bloque referencia su origen.

## Deferred from: code review of 1-2-user-registration-email-google-apple (2026-05-01)

- **W6** (resolución D6) — Race condition: signUp → trigger `onUserCreated` vs `onboarding-profile.tsx` que lee `users/{uid}` post-redirect. Cold start del trigger Cloud Function 0-3s puede dejar al onboarding leyendo doc inexistente. Reabrir en Story 2.1 (first vehicle onboarding 3-step flow) — agregar retry logic con `onSnapshot` o backoff en `onboarding-profile.tsx` cuando el doc inicial no existe.
- **W2** — Performance micro-opts en `mobile/app/(auth)/register.tsx`: `handleAuthError` fresh identity por render, `primaryButtonStyle`/`fieldWrapperStyle`/`ssoButtonStyle` recreados cada render, `useEffect` de Apple availability corre en cada mount sin cache. No son bugs funcionales — futurible cleanup en story de performance pass.
- **W3** — T8.8 smoke tests manuales pendientes de Dario en device físico (cold start → register → SSO Google + Apple iOS → Firestore Emulator UI). Requiere Firebase real config (Google web client ID, `GoogleService-Info.plist`, Apple Dev account). Bloqueante de Beta release, no del code review de esta story.
- **W4** — `modulePaths: ["<rootDir>/../node_modules"]` hack en `functions/jest.config.js` y `mobile/jest.config.js` para compensar pnpm hoisting. Patrón heredado de Story 1.1. Reabrir solo si hay regresiones por package no-hoisted.
- **W5** — `ref.set()` rejection sin try/catch en trigger `onUserCreated` (`functions/src/controllers/auth.controller.ts:57`). Cloud Functions tiene retry default → riesgo marginal de orphan account solo si todos los retries fallan. Documentar o agregar try/catch en story de backend hardening.

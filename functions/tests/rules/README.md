# Firestore Security Rules Tests

These tests validate `firestore.rules` against `users/{uid}` ownership and the
catch-all deny rule, using `@firebase/rules-unit-testing`.

## Pre-requisites

- **Java 11+** in PATH (the Firestore emulator is a Java app).
- `firebase-tools` installed (already a workspace devDep at the repo root).

## Running

```bash
pnpm --filter functions test:rules
```

This wraps the test under `firebase emulators:exec --only firestore "..."`,
which automatically starts the emulator on port 8080, runs the suite, and
shuts down the emulator on exit.

## What's covered

- User can read/update their own `users/{uid}` doc.
- User CANNOT read/update another user's doc (cross-tenant leak guard).
- Anonymous requests blocked entirely.
- Client cannot create or delete `users/{uid}` (Admin SDK only).
- Catch-all blocks every other collection (vehicles, tasks, etc.) — these
  open up in **Story 1.7**.

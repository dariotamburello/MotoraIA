---
project_name: 'motora-ia'
user_name: 'Dario'
date: '2026-04-12'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow', 'critical_rules']
total_rules: 47
optimized_for_llm: true
status: 'complete'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in Motora IA. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Backend (Cloud Functions)
- **Node.js:** 22
- **TypeScript:** 5.7.3 (strict mode enabled)
- **Firebase Admin SDK:** 13.6.0
- **Firebase Cloud Functions:** 7.0.0 (v2 + v1 auth triggers)
- **Vercel AI SDK:** ai 6.0.140, @ai-sdk/openai 3.0.48
- **Validation:** Zod 4.3.6
- **Linting:** ESLint 8.9.0 + TypeScript parser + Google config
- **Build Target:** ES2017 (Node.js compatibility)

### Mobile (React Native + Expo)
- **React Native:** 0.83.2
- **React:** 19.2.0
- **Expo:** 55.0.8
- **TypeScript:** 5.9.2 (strict mode, baseUrl: ".", paths: "@/*" → "src/*")
- **State Management:** Zustand 5.0.12
- **Data Sync:** TanStack Query 5.95.2
- **Hardware Integration:** react-native-bluetooth-classic 1.73.0
- **Persistence:** @react-native-async-storage/async-storage 2.2.0
- **Firebase Client:** 12.11.0
- **Routing:** Expo Router 55.0.7
- **UI Icons:** lucide-react-native 1.7.0

### Architecture Patterns
- Controllers → Services → Models (backend)
- Feature Folder structure (mobile)
- Zustand with AsyncStorage persistence
- TanStack Query for server state
- Firebase Firestore (NoSQL) + Auth + Cloud Functions

---

## Critical Implementation Rules

### TypeScript & Code Quality
1. **Strict Mode Required:** Both backend (`tsconfig.json` strict: true) and mobile (extends expo/tsconfig.base + strict: true).
2. **No `any` Type:** All code must be strictly typed. Use generics and unions when needed.
3. **Naming Conventions:**
   - Components: PascalCase (`UserProfile.tsx`)
   - Functions/variables: camelCase (`getUserProfile`, `activeRole`)
   - Constants: UPPER_SNAKE_CASE (`TIER_LIMITS`, `USERS_COLLECTION`)
   - Enums: PascalCase (`UserRole`, `UserGender`)
4. **Import Paths (Mobile):** Use alias `@/` for `src/` imports (e.g., `@/shared/components`).

### Backend (Cloud Functions) Rules

#### Firebase Cloud Functions v2 Setup
- All HTTPS callable functions use `onCall({ region: "us-central1" }, handler)`.
- Auth triggers (v1) also must be configured with explicit region if needed.
- Must initialize Firebase Admin once at module level before importing controllers.
- Set global options: `setGlobalOptions({ maxInstances: 10, region: "us-central1" })`.

#### Error Handling
- Use `HttpsError` from `firebase-functions/v2/https` for all error responses.
- Always provide error code + Spanish message: `throw new HttpsError("invalid-argument", "Descripción del error en español")`.
- Validate request auth state with `assertAuth(request)` helper (must exist or create it).

#### Data Validation
- Use Zod schemas for all input validation in controllers.
- Parse request.data before passing to services.
- Throw `HttpsError("invalid-argument", message)` on validation failure.

#### Firestore Patterns
- Use `Timestamp.now()` from firebase-admin for all timestamps (never Date objects).
- Race-condition safety: Check if document exists before update (see `updateUserProfile` in user.service.ts for pattern).
- Use partial updates: `ref.update({ "nested.field": value })` for merge updates.
- Constants for collection names: `const USERS_COLLECTION = "users"`.

#### AI Integration (Vercel AI SDK)
- All AI functions require: `subscriptionTier === 'PREMIUM'` check first.
- Use `generateObject` with Zod schemas for structured output (not free text).
- Rate limiting: Write `stats.lastAiUsage: Timestamp.now()` on each call.
- System prompt MUST instruct model to act as "mecánico experto de Córdoba, Argentina" (empathetic, action-oriented).
- Always provide enriched context object (brand, model, km, DTC, freeze frame) to AI prompts.

### Mobile (React Native) Rules

#### State Management
- Use **Zustand stores** for auth, vehicles, and global state.
- Persist to AsyncStorage for critical state (auth tokens, active role).
- Pattern: `AsyncStorage.setItem(key, value).catch(() => {})` (silent fail on permission denied).
- Store reset on logout: `reset()` method must clear all state.

#### Data Fetching & Caching
- Use **TanStack Query** for server state (queries with `["vehicles"]`, `["user", uid]` keys).
- ALWAYS invalidate queries after mutations: `queryClient.invalidateQueries({ queryKey: ["vehicles"] })`.
- Enable optimistic updates where appropriate (e.g., adding a vehicle).
- Query hooks pattern: `useQuery({ queryKey: [...], queryFn: () => callFunction(...) })`.

#### Form Validation & Error Handling
- **Validation errors:** Show inline below field using `error` prop of `AppInput` / `AppSelect`.
  - Clear error on `onChangeText` / `onChange` in each field handler.
- **Backend errors:** ALWAYS show with `showToast(message, "error")` from `useToast()` hook.
- NEVER use OS `Alert.alert()` for error/success feedback.
- Auth screens (login/register) may keep inline error logic as exception.

#### User Feedback
- Use `ToastProvider` (already in `app/_layout.tsx`).
- Hook: `const { showToast } = useToast()`.
- Call: `showToast("Success message", "success")` or `showToast("Error message", "error")`.
- Toasts auto-dismiss after 4 seconds, stack at top of screen.

#### Component Patterns
- Create reusable components in `/src/shared/components` (e.g., `ConfirmationModal`, `EditFormModal`).
- Extract feature logic to feature folders (e.g., `src/features/vehicles/screens/VehicleDetail.tsx`).
- Use composition over prop drilling; pass handlers as props.
- Never duplicate UI code (modals, buttons, etc.).

#### Bluetooth (OBD2) Integration
- Use **react-native-bluetooth-classic** for Android.
- iOS: BLE placeholder (TBD, use Community Bluetooth Library when ready).
- **Development Strategy:** Implement Mocking layer in `OBD2Service.ts`:
  - Return fixed test strings (PIDs) when hardware unavailable.
  - Switch between real device and mock via environment flag.
- Do NOT remove mock on production—use runtime flag to enable/disable.

#### AsyncStorage Persistence
- Use for: auth tokens (handled by Firebase), active role, user preferences.
- Key pattern: `motora_<feature>_<uid>` (e.g., `motora_active_role_${uid}`).
- Always wrap with `.catch(() => {})` to handle permission denied gracefully.

### Project Conventions

#### File Organization
```
functions/src/
├── controllers/    (handle incoming requests, validate, delegate to services)
├── services/       (business logic, Firestore operations)
└── models/         (TypeScript interfaces, Zod schemas, enums)

mobile/src/
├── app/            (Expo Router layout + screens)
├── shared/         (reusable components, hooks, stores, constants, theme)
└── features/       (feature-specific screens, hooks, queries)
```

#### Code Style
- **Indentation:** 2 spaces (backend & mobile).
- **Quotes:** Double quotes in TypeScript.
- **Comments:** Use comment blocks (`/** */`) for complex logic or race-condition safety notes.
- **Unused variables:** Delete them completely (no `_prefix` or commented code).
- **Magic numbers/strings:** Extract to constants or enums.

#### Backend Comment Examples
```typescript
/**
 * Actualiza el perfil del usuario.
 * Race-condition safety: si el documento no existe aún, lo creamos
 * con los campos recibidos para evitar NOT_FOUND error.
 */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  // ...
}
```

### Testing & Development
- **Backend:** Use Firebase Emulators (Auth, Firestore, Functions) for local development.
- **Mobile:** Test with Expo Go or native builds; use mocked Firebase config for local dev.
- **Integration:** Validate TanStack Query cache invalidation after mutations.
- NO production database operations during development—always use emulators.

### Debugging & Logging
- Remove console.logs before committing code (or wrap with debug flag).
- Backend: Use Firebase Logs (`firebase functions:log`) for production debugging.
- Mobile: Use React Native debugger or Flipper for performance profiling.

---

## Known Patterns & Conventions

### Backend
- **Collection names:** Lowercase plural (e.g., `users`, `vehicles`, `maintenanceLog`).
- **Document references:** Use UID for user documents, auto-generated IDs for others.
- **Timestamps:** Always use `Timestamp.now()` from firebase-admin, never `new Date()`.
- **Subscription tiers:** Check `subscriptionTier === SubscriptionTierUser.PREMIUM` before AI features.
- **Error messages:** Spanish-language error messages to match user locale.

### Mobile
- **Route structure:** Stack for auth (`app/(auth)`), Tabs for logged-in (`app/(app)/(tabs)`).
- **Deep linking:** Use Expo Router for native navigation + web URL support.
- **Stores:** Export `useAuthStore`, `useVehicleStore` from `shared/stores/`.
- **Queries:** Use lowercase queryKey arrays (e.g., `["vehicles", ownerId]`).
- **Icons:** From `lucide-react-native` (consistent cross-platform SVG).

---

## AI Integration Specifics

### Prompt Engineering
- System role: **Mecánico experto de Córdoba, Argentina**.
- Tone: Empathetic, action-oriented, justifies decisions based on real part wear.
- Input context: Always include { brand, model, year, km, dtcCode, freezeFrame }.
- Output: Use `generateObject` with strict Zod schema (not free text).
- Rate limit: 1 call per day per user (FREE tier blocked entirely).

### Structured Output Example
```typescript
const taskSchema = z.object({
  title: z.string().describe("Título de la tarea"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  estimatedCost: z.number().positive(),
  description: z.string(),
});

const task = await generateObject({
  model: openai("gpt-4o-mini"),
  schema: taskSchema,
  prompt: `Based on context {...}, suggest maintenance task`,
  system: `Eres un mecánico experto de Córdoba...`,
});
```

---

## Critical Don't-Miss Rules

### Anti-Patterns to AVOID

1. **Firebase Race Conditions:** NEVER call `ref.update()` without checking if document exists first.
   - Problem: Throws `NOT_FOUND` error if doc doesn't exist.
   - Solution: Always `snap = await ref.get(); if (!snap.exists) { ref.set(...) } else { ref.update(...) }`.
   - See: `updateUserProfile` in `user.service.ts` for exact pattern.

2. **Query Cache Invalidation:** NEVER forget to invalidate TanStack Query after mutations.
   - Problem: UI becomes out-of-sync with server.
   - Solution: Always `queryClient.invalidateQueries({ queryKey: ["vehicles"] })` after any add/update/delete.

3. **AsyncStorage Silent Fails:** NEVER let AsyncStorage errors crash the app.
   - Solution: ALWAYS `AsyncStorage.setItem(key, val).catch(() => {})`.
   - Reason: Permission denied in sandbox must not break app startup.

4. **Console.logs in Production:** ALWAYS remove before committing code.
   - Agents tend to leave debugging logs; enforce removal in code review.

5. **Alert.alert() Instead of Toasts:** NEVER use OS `Alert.alert()` for operation feedback.
   - Solution: ALWAYS `const { showToast } = useToast(); showToast(msg, "success"|"error")`.

6. **Date Objects in Firestore:** NEVER use `new Date()` for timestamps.
   - Solution: ALWAYS `Timestamp.now()` from firebase-admin (backend) or firebase client (mobile).

7. **AI Features Without Tier Check:** NEVER allow AI function call without `subscriptionTier === PREMIUM` first check.
   - This must be the FIRST validation in any AI controller function.

8. **Request UID Trust:** NEVER use uid from request body or client; ALWAYS read from `request.auth!.uid`.
   - Security: Admin SDKs verify request.auth is trusted.

### Edge Cases to Handle

1. **onUserCreated Race Condition:** Document may not exist when user tries to update profile immediately after signup.
   - Solution: Service checks `snap.exists` and creates doc with defaults if needed.

2. **Role Switch Without Business:** User cannot switch to BUSINESS role without having a business profile.
   - Solution: Frontend validates before calling backend; backend only persists (backend doesn't enforce logic).

3. **Bluetooth Device Disconnect:** Hardware disconnect must gracefully degrade, never crash app.
   - Solution: Use mocked data, show toast "Device disconnected", allow app to continue.

4. **TanStack Query State on Logout:** Old user's cached data persists on app after logout.
   - Solution: ALWAYS `queryClient.clear()` + all store `reset()` methods on logout.

5. **Subscription Tier Validation:** Multiple calls to same AI function in rapid succession bypass tier check.
   - Solution: Implement rate limiting with `stats.lastAiUsage` timestamp per call.

### Security Rules

- **Admin SDK Only:** NEVER use Firebase Client SDK inside Cloud Functions; use Admin SDK.
- **Subscription Validation:** Backend MUST verify `subscriptionTier === PREMIUM` in ALL AI endpoints.
- **Input Validation:** ALWAYS validate with Zod schemas; throw `HttpsError("invalid-argument", ...)` on failure.
- **UID Verification:** NEVER trust UID from request body; ALWAYS use `request.auth!.uid`.

---

## Usage Guidelines

### For AI Agents

1. **Before implementing any code:** Read this entire file first.
2. **Follow ALL rules exactly** as documented; when in doubt, prefer the more restrictive option.
3. **When you don't know:** Refer to existing code patterns in the codebase (e.g., look at `user.service.ts` for Firestore patterns).
4. **When new patterns emerge:** Update this file with new rules discovered during implementation.
5. **Technology versions:** Use EXACTLY the versions listed in the "Technology Stack" section; do not upgrade without explicit request.

### For Humans (Dario)

1. **Keep this file lean:** Remove rules that become obvious or outdated.
2. **Update when stack changes:** Add new dependencies/versions to Technology Stack section immediately.
3. **Review quarterly:** Remove rules agents no longer need reminding about.
4. **Before major features:** Add new "Critical Don't-Miss Rules" section rules to prevent future mistakes.
5. **Git integration:** Include a link to this file in PR templates or CI checks so agents see it.

---

## Next Steps for Implementation

1. **Phase 5:** Web dashboard (TBD stack).
2. **Phase 6:** Real OBD2 hardware integration with Bluetooth flow.
3. **Phase 7:** Businesses & Appointments CRUD.
4. **Rate Limiting:** Implement token bucket or sliding window for AI calls.
5. **Analytics:** Add Firestore logging for AI usage tracking.

---

---

## File Metadata

- **Generated:** 2026-04-12
- **Maintained by:** Dario
- **Total Rules:** 47 critical implementation rules
- **Sections:** 7 comprehensive categories
- **Optimized for:** LLM context efficiency
- **Status:** Ready for AI agent integration

_This file should be consulted before implementing any code in Motora IA._

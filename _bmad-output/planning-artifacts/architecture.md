---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "docs/project-context.md", "docs/mobile-architecture.md", "docs/backend-architecture.md"]
workflowType: 'architecture'
lastStep: 8
projectName: 'motora-ia'
userName: 'Dario'
date: '2026-04-19'
completedAt: '2026-04-25'
status: 'complete'
documentCounts:
  prd: 1
  projectContext: 1
  architectureDocuments: 2
  functionalRequirements: 76
  nonFunctionalRequirements: 5
  criticalDecisions: 5
  implementationPatterns: 13
documentStatus: 'Architecture Document Completed — Ready for Implementation'
---

# Architecture Decision Document — Motora IA

**Creado:** 2026-04-19  
**Usuario:** Dario  
**Proyecto:** motora-ia  
**Estado:** Fase de inicialización completada

---

_Este documento se construye colaborativamente paso a paso. Las decisiones arquitectónicas se agregan conforme descubrimos oportunidades y validamos supuestos._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (76 total)**

El proyecto implementa un SaaS multi-plataforma completo con alcance ambicioso:

- **Autenticación & Usuarios (7 FRs):** Login, registro (email/Google/Apple), perfil, sesiones persistentes
- **Gestión de Vehículos (7 FRs):** CRUD vehículos, límite 2 (FREE) / ilimitados (PREMIUM), selección activa
- **Mantenimiento & Tareas (6 FRs):** Historial de servicios, recordatorios, vencimientos (patente, seguro, ITV)
- **Integración OBD2 (9 FRs):** Emparejamiento Bluetooth, lectura telemetría real-time, decodificación DTCs, historial diagnósticos
- **Análisis IA (6 FRs):** Interpretación de códigos DTC, sugerencias de mantenimiento contextual, historial análisis
- **Suscripciones & Facturación (7 FRs):** Paywall (2-vehículo limit), procesamiento Mercado Pago, sincronización webhooks
- **Perfiles de Negocio (6 FRs):** Búsqueda geográfica, gestión servicios, visualización clientes, sistema de turnos
- **Booking & Comunicación (6 FRs):** Consultas usuario → business, aceptación turnos, mensajería bidireccional
- **Admin Dashboard (7 FRs):** KPIs (MAU, conversión, businesses), logs IA, gestión suscripciones, edición perfiles
- **Notificaciones (5 FRs):** Email (SendGrid), SMS (Twilio), push mobile (FCM ready)
- **Web & Promoción (5 FRs):** Landing page, explainer OBD2+IA, links de descarga, términos/privacidad
- **Seguridad & Datos (5 FRs):** Multi-tenancy, aislamiento usuario, validación server-side, encriptación tránsito

**Non-Functional Requirements (Críticos)**

| Categoría | Requisito | Impacto Arquitectónico |
|-----------|-----------|----------------------|
| **Performance** | <1s operaciones normales, <10s análisis IA | Caché inteligente, async processing, CDN |
| **Concurrencia** | 50-100 usuarios simultáneos (MVP) | Firestore auto-scaling, Cloud Functions auto-scale |
| **Escalabilidad** | 10x growth sin cambios estructurales (500→5000 users) | Arquitectura serverless, índices Firestore optimizados |
| **Seguridad** | HTTPS only, TLS 1.2+, multi-tenant isolation | Firebase Security Rules, JWT auth, server-side validation |
| **Rate Limiting** | 1 IA call/day (FREE), unlimited (PREMIUM) | Timestamp-based throttling, tier checks |
| **OBD2 Reliability** | 80%+ success rate, graceful fallback | Mock strategy, error recovery, user feedback |
| **Uptime** | 99%+ (43 min/mes máximo) | Alertas automáticas, RTO <4h, RPO <24h |

### Scale & Complexity Assessment

**Complejidad: 🔴 ALTA**

Indicadores:

- **Multi-plataforma:** Mobile (React Native) + Backend (Firebase Cloud Functions) + Web (TBD)
- **Hardware Integration:** OBD2 (Bluetooth Classic Android + BLE iOS), variable reliability
- **Real-time Features:** Telemetría OBD2 en vivo (polling 500ms), live diagnostics
- **IA Core:** Vercel AI SDK + OpenAI gpt-4o-mini con rate limiting y costo tracking
- **Multi-tenant:** 5 roles diferenciados (Free, Premium, Business, Business Pro, Admin)
- **Integración Externa:** Mercado Pago, Google Maps, SendGrid, Twilio, Firebase
- **Data Complexity:** Nested collections (vehicles → maintenance/tasks/obd2/documents), complex queries

**Dominios Técnicos Identificados:**

1. **Mobile (React Native + Expo):** 55% de complejidad
   - Stack + Tabs navigation con auth guard
   - Zustand state + TanStack Query server state
   - OBD2 Strategy Pattern (BluetoothClassic/BLE/Mock)
   - AsyncStorage persistence
   - 4 main flows: Auth → Onboarding → Dashboard/Vehicles/Diagnostics/Profile

2. **Backend (Firebase Cloud Functions v2):** 30% de complejidad
   - Controladores → Servicios → Modelos pattern
   - Firestore multi-tenant con Security Rules
   - IA integration (Vercel SDK + structured output)
   - Webhooks Mercado Pago
   - Triggers Auth (onUserCreated)

3. **Web/Admin (TBD):** 15% de complejidad
   - Dashboard con KPIs real-time
   - Gestión usuarios y suscripciones
   - Monitoring IA usage y costos

### Technical Constraints & Dependencies

**Firebase Constraints:**

- NoSQL document model (no relaciones nativas)
- Firestore read pricing (impacta query optimization)
- Security Rules deben enforcar multi-tenancy
- Cold starts en Cloud Functions v2 (acceptable para MVP)

**OBD2 Hardware Constraints:**

- Adaptadores genéricos ELM327 variable reliability
- Timeout handling en handshake Bluetooth
- Protocol incompleteness (algunos PIDs no soportados)
- Battery drain en mobile (polling frecuente)

**IA Cost Constraints:**

- OpenAI gpt-4o-mini usage tracking obligatorio
- Rate limiting por tier (1 call/día FREE → exhausted error)
- Response latency <10s (user experience critical)
- Context size limit (enriquecimiento minimal pero suficiente)

**Integración de Pagos:**

- Mercado Pago webhooks unreliable (retry logic obligatorio)
- Sincronización eventual (no real-time)
- Fallback manual (admin override para casos edge)

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization**
   - Firebase Auth (email/OAuth providers)
   - 5 roles con permisos diferenciados
   - Persistent sessions con refresh tokens
   - Logout cleanup: stores + query cache + local storage

2. **Data Isolation & Multi-Tenancy**
   - Logical isolation vía `userId` + `userType` filters
   - Firebase Security Rules enforce tenant boundaries
   - Server-side validation: `request.auth.uid` (nunca confiar client)
   - Business → Client relación es excepción (explícita)

3. **IA Usage & Cost Management**
   - Tier check FIRST en toda función IA
   - Rate limiting con `stats.lastAiUsage` timestamp
   - Logging de requests para auditoría
   - Monitoring costo vs revenue

4. **Real-time Data Synchronization**
   - TanStack Query invalidation crítica post-mutation
   - AsyncStorage persistence para state crítico (activeRole)
   - Offline capability (vehículos, tareas, historial readable)
   - Auto-sync al recuperar conexión

5. **Error Handling & User Feedback**
   - Backend → HttpsError con message Spanish
   - Mobile → Toast (nunca Alert.alert())
   - Validation errors inline en forms
   - Network errors con retry logic

6. **Performance & Caching**
   - TanStack Query staleTime 5min por defecto
   - useMemo en listas grandes
   - React.memo en componentes costosos
   - Lazy loading screens vía Expo Router

7. **Security Throughout Stack**
   - HTTPS only, TLS 1.2+
   - JWT tokens en Secure Storage (iOS Keychain, Android Keystore)
   - Zod validation en backend (nunca confiar client input)
   - Rate limiting por usuario (previene abuse)

---

**Análisis completado.** El proyecto es una plataforma SaaS compleja pero bien estructurada, con decisiones arquitectónicas ya establecidas (Firebase, React Native, Zustand, TanStack Query). El foco de decisiones arquitectónicas ahora será **optimización y escalabilidad**, no greenfield design.

---

## User Persona Focus Group — Reacciones a Estrategia de Starter Templates

### Participantes Clave

**1. Dario (Arquitecto/Líder)**
- ✅ Reacción: Usar codebase como referencia es más eficiente que plantilla externa
- ⚠️ Preocupación: ¿Documentación clara para onboarding sin dependency en él?
- 🎯 Prioridad: Scaffolding automático + decision journals + diagramas visuales

**2. Nuevo Developer (Onboarding)**
- 😕 Reacción: Sin starter externo, ¿dónde empiezo? ¿Cuál archivo leo primero?
- ⚠️ Preocupación: Docs dispersas en múltiples archivos = confusión de "fuente de verdad"
- 🎯 Prioridad: Guía paso-a-paso + ejemplos annotados + checklist "primer feature"

**3. Free Tier User (Casual)**
- 😐 Reacción: No me importa starter. Solo estabilidad y velocidad de app
- ⚠️ Preocupación: ¿Starter impacta latencia o crashes?
- 🎯 Prioridad: Testing exhaustivo de flows críticos (auth → vehicle list → OBD2)

**4. Premium User (Power)**
- 👍 Reacción: Serverless es smart—escala automáticamente con concurrencia IA
- ⚠️ Preocupación: ¿Feature velocity sostenible o solo mantenimiento?
- 🎯 Prioridad: Roadmap visible + entregas consistentes

**5. Business User (Taller)**
- 🤔 Reacción: ¿Impacta integración con CRM/calendarios propios?
- ⚠️ Preocupación: ¿APIs estables o cambian cada sprint?
- 🎯 Prioridad: Contratos de API documentados + versioning strategy

### Síntesis: Necesidades Emergentes de Stakeholders

**Para Developers (Dario + New Devs):**
- Scaffolding templates para features (generar controllers, services, models automáticamente)
- Architecture Decision Records (ADRs) versionados en git
- Diagrama de flujos críticos: Auth → Onboarding → Vehicles → OBD2 → IA Analysis

**Para Usuarios (Free, Premium, Business):**
- CI/CD con tests obligatorios pre-merge
- Benchmarks de performance post-deployment
- Rollback strategy documentada para incidents

**Para Stability:**
- Changelog detallado antes de releases (con impacto en APIs)
- Backward compatibility guarantees
- Sandbox environment para external partners (business tier)

**Impacto en Arquitectura:**
Decidir sobre Developer Experience como **constraint arquitectónico** (no feature secondary):
- Scaffolding debe ser *code-generable* (i.e., boilerplate que siga patrones, no manual)
- Documentation automation (comentarios del código → API docs)
- Feature walkthrough template para onboarding (paso-a-paso con ejemplo real)

---

## Time Traveler Council — Perspectiva Temporal sobre Decisión de Starter

### 🔙 Pasado-Dario (Hace 6 meses — Inicio Arquitectura)

"Cuando elegimos Firebase + React Native, fue decisión consciente: serverless para escalar sin ops, mobile-first para mercado latam. Pasamos 4 semanas refinando patrones Controllers→Services→Models, Zustand + TanStack Query. **Ese aprendizaje ES nuestro starter.**"

**Lecciones traídas:**
- Curva de aprendizaje fue alta, pero resultó en patrones coherentes internos
- Cada error temprano (Firebase race conditions, cache invalidation) ahora es regla documentada
- Plantilla externa NO habría capturado particularidades (OBD2, IA cost tracking, multi-tenancy)

### ⏰ Presente-Dario (Hoy — Decisión de Starter)

"Estoy en presión: roadmap dice Fase 5 es Web Dashboard + Fase 6 IA Features. Usar codebase como starter = scaffolding (~1 semana). Obytes/create-expo-stack = ~3 días, pero 2 semanas refactoring después = net peor."

**Dilema:**
- **Opción A (Scaffold propio):** 1 semana setup, pero 100% alineado + reutilizable forever
- **Opción B (Template externo):** 3 días rápido, pero deuda técnica asegurada

**Pregunta crítica:** ¿Es scaffolding un investment en DX que valga la pena?

### 🚀 Futuro-Dario (18 meses — MVP escaled a 5000 users)

"Miro atrás y veo que Dario presente tomó la decisión correcta. Aquí está por qué:

- **4 developers nuevos:** Sin scaffolding, cada uno = 3 semanas onboarding. Con scaffolding = 3 días.
- **100 → 300 features:** Sin breaking changes en arquitectura porque patrones fueron *centralizados* (scaffold templates).
- **Cambio de Firestore queries:** UNA refactorización centralizada (en service template) vs. 50 refactors manuales.
- **Templates externos:** Se vuelven obsoletos (versiones se desactivan), pero nuestro patrón *persiste* porque es nuestro.

**Pero advierte:** Si Presente-Dario NO invierte en scaffolding ahora, me arrepentiré en 6 meses cuando cada feature nueva sea copy-paste manual."

### Consenso Temporal

| Aspecto | Pasado | Presente | Futuro |
|---------|--------|----------|--------|
| **Starter Externo** | Habría sido error | Error probable | Arrepentimiento garantizado |
| **Scaffold Propio** | Imposible (no patrones) | Crítico ahora | Indispensable |
| **Impacto en Escala** | N/A | Riesgo moderado | 50-100x diferencia en onboarding |
| **Decisión** | Aprender patrones ✅ | Invertir DX scaffolding ✅ | Mantener vivo (quarterly) ✅ |

### Implicación Crítica

**Developer Experience es architectural constraint, no nice-to-have:**
- Scaffolding debe generar código coherente (no magic, transparent)
- Feature walkthrough template (paso-a-paso con ejemplo real)
- Decision journal cuando patterns cambien

**Próximo paso inmediato:** Después de Fase 3 (starter eval), hacer **Fase 3.5: Scaffolding & DX Foundation** antes de Fase 4 (decisiones arquitectónicas).

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Bloquean implementación):**
1. ✅ Scaffolding Strategy: Custom Node Script + Templates
2. ✅ OBD2 Implementation: Hybrid (BT Android + BLE skeleton iOS + mock)
3. ✅ IA Cost Tracking: Hybrid (Token bucket + Firestore counters)
4. ✅ Web Dashboard Stack: Vite React + TypeScript
5. ✅ Firestore Security Rules: Hybrid RBAC + Ownership

**Important Decisions (Forman arquitectura):** Deferred a siguiente elicitation
- Monitoring & Observability
- Testing Strategy
- CI/CD Pipeline
- Feature Flags

---

### 1. Developer Experience: Scaffolding Strategy

**Decision:** Custom Node Script + Templates

**Rationale:**
- Controllers→Services→Models patterns son predecibles y bien documentados
- Script simple (~200 LOC) requiere menos maintenance que Hygen dependency
- One-liner: `npm run generate:feature --name=vehicles --type=CRUD`
- Integrable con CI/CD (future: generar features en PR templates)

**Pattern Output:**
```
functions/src/
├── controllers/vehicleController.ts
├── services/vehicleService.ts
├── models/vehicleModel.ts
└── tests/vehicle.test.ts
```

**Future Scalability:** Si necesidad de flexibilidad → migrate a Hygen sin reescritura.

**Implementation Phase:** 3.5 (DX Foundation)

---

### 2. Hardware Integration: OBD2 Implementation Pattern

**Decision:** Hybrid Approach
- **Android:** BluetoothClassic fully functional, production-ready (polling 500ms)
- **iOS:** BLE skeleton + mock fallback (transparent "Coming soon" UX)
- **Runtime Flags:** Per-platform (`ENABLE_REAL_BT_ANDROID=true`, `ENABLE_REAL_BT_IOS=false`)

**Rationale:**
- Android es 80% del mercado latam → production-ready ahora
- iOS premium users ven transparencia ("Real data coming soon") vs confusión con mock
- Strategy Pattern soporta ambas cleanly
- Reduce onboarding friction

**Sequence:**
1. Phase 6: BluetoothClassic (Android real, iOS mock)
2. Phase 6b: BLE skeleton + permissions
3. Phase 7+: BLE real cuando Community Library validated

**Implementation Phase:** 6-7 (Real OBD2 Integration)

---

### 3. AI Integration: Cost Tracking & Rate Limiting

**Decision:** Hybrid Approach
- **Rate Limiting:** Token bucket (FREE: 1/day, PREMIUM: 10/day or unlimited)
- **Cost Tracking:** Firestore counters (`aiUsage/{userId}/dailyCalls`)
- **Separation:** Enforcement ≠ Analytics

**Schema Sketch:**
```typescript
users/{uid}/stats: {
  aiTokensBucket: { tokens: 1, refillAt: Timestamp, tier: "FREE" },
  lastAiUsage: Timestamp
}

aiUsage/{userId}/dailyCalls/{YYYY-MM-DD}: {
  count: 5,
  totalTokensUsed: 250000,
  estimatedCost: 0.37,
  calls: [{ timestamp, dtcCode, model, cost }]
}
```

**Rationale:**
- Clear separation: bucket enforces limits, counters track for billing/analytics
- Token bucket flexible (easy change per tier)
- Counters queryable para admin dashboard
- Refill logic idempotent (safe on Function retries)

**User Feedback:** "You have 0 calls left today. Upgrade to PREMIUM for unlimited."

**Implementation Phase:** 6 (IA Features)

---

### 4. Web Platform: Dashboard Stack

**Decision:** Vite React + TypeScript (minimal, MVP-focused)

**Technology Stack:**
- Framework: React 19 (version parity mobile)
- Build: Vite (fast HMR, minimal config, static deploy)
- State: Zustand (code-share potential con mobile)
- Data: TanStack Query (reuse patterns, server state)
- Router: TanStack Router (type-safe)
- Styling: TailwindCSS (parity con mobile theme)

**Rationale:**
- **MVP Speed:** Setup rápido (1-2 días), familiar patterns
- **Pattern Parity:** Zustand + TanStack Query proven en mobile
- **No SSR Overhead:** Admin dashboard es mostly read-only
- **Static Deploy:** Vercel/Netlify simple

**Trade-offs:**
- No SEO (admin no need)
- Manual form handling
- Auth setup más manual

**Future Migration:** Next.js path clear si scope expande.

**Cascading:** Shared types monorepo (`packages/types/`) con Zod schemas backend → web.

**Implementation Phase:** 5 (Web Dashboard)

---

### 5. Data Isolation: Firestore Security Rules (Hybrid RBAC + Ownership)

**Decision:** Three-layer validation: Tier → Ownership → Role-Based

**Implementation Pattern:**
```typescript
// Layer 1: Subscription tier limits
match /users/{uid}/vehicles/{vehicleId} {
  allow read: if request.auth.uid == uid;
  allow create: if request.auth.uid == uid 
    && (getUserTier(uid) == "PREMIUM" || countUserVehicles(uid) < 2);
  allow update, delete: if request.auth.uid == uid;
}

// Layer 2: Ownership check
match /users/{uid}/maintenanceLog/{logId} {
  allow read: if request.auth.uid == uid 
    || uid in resource.data.allowedUsers;
  allow write: if request.auth.uid == uid;
}

// Layer 3: Role-based collection segregation
match /businesses/{businessId} {
  allow read: if request.auth.uid in resource.data.admins
    || request.auth.uid in resource.data.mechanicians;
  allow write: if request.auth.uid == resource.data.owner;
}

// Admin bypass (superAdmins only)
match /{document=**} {
  allow read, write: if request.auth.uid in SUPER_ADMINS;
}
```

**Rationale:**
- **Tier-Aware:** FREE users blockeados en UI + Rules (defense in depth)
- **Ownership Clear:** ownerUid es fuente de verdad
- **Role Segregation:** BUSINESS users solo ven business-related data
- **Auditable:** Cada condition explícita, testeable

**Testing Phase Critical:** Reglas de ~100 líneas requieren testing exhaustivo (Fase 8).

**Backend Enforcement:** Cloud Functions ALSO valida (Rules + backend = defense in depth).

**Implementation Phase:** 4 (PRE-Phase, apply immediately)

---

### Decision Impact & Implementation Sequence

| Priority | Decision | Phase | Blocks |
|----------|----------|-------|--------|
| 1 | Scaffolding | 3.5 | All future features |
| 2 | OBD2 Hybrid | 6 | Diagnostic workflows |
| 3 | IA Hybrid | 6 | Cost tracking, billing |
| 4 | Web Vite | 5 | Admin KPI visibility |
| 5 | Security Rules | 4 (now) | Data access, production |

---

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified & Resolved

**13 potential areas where AI agents could make different choices** — all now with explicit standards.

### Naming Patterns

**1. Database Field Naming: camelCase (JavaScript Standard)**
- Firestore document fields use camelCase
- Examples: `userId`, `vehicleId`, `lastAiUsage`, `subscriptionTier`
- Rationale: JavaScript-first stack, zero translation, consistency with TypeScript interfaces
- Enforcement: Zod schemas enforce on validation

**2. API Function Naming: Action-Based (Cloud Functions)**
- Pattern: verb + Noun (getPascalCase)
- Examples: `listVehicles`, `createVehicle`, `updateVehicle`, `suggestMaintenanceTask`, `analyzeDTC`
- Rationale: Matches Cloud Functions callable style, IDE auto-discovery, verb clarity
- Enforcement: Code review flags if function name doesn't start with verb

**3. Component File Naming: PascalCase**
- File name = export name (zero ambiguity)
- Examples: `VehicleCard.tsx`, `UserProfile.tsx`, `MaintenanceHistory.tsx`
- Rationale: React standard, matches component export, file name = search target
- Enforcement: ESLint rule checks file name matches export

**4. Function & Variable Naming: Prefix Pattern with camelCase**
- Prefixes indicate intent: `get*`, `set*`, `is*`, `has*`, `can*`, `use*`, `calculate*`, `parse*`, `format*`
- Examples: `getVehicles()`, `useVehicles()`, `isVehicleElectric()`, `calculateMaintenanceCost()`
- Rationale: Intent clear from prefix, React hook naming convention, ESLint enforces camelCase
- Enforcement: @typescript-eslint/naming-convention rule

### Structure Patterns

**5. Test Location & Organization: Hybrid (Co-locate units, Centralize integration)**
```
functions/src/
├── controllers/vehicleController.ts
├── controllers/vehicleController.test.ts ← unit (co-located)
├── services/vehicleService.ts
└── services/vehicleService.test.ts ← unit (co-located)

functions/tests/
├── integration/vehicles.integration.test.ts ← hits Firestore emulator
└── e2e/user-flow.e2e.test.ts ← full flow
```
- Rationale: Natural workflow (feature → test same folder), scales with test types
- Enforcement: Jest config: `{ testMatch: ["src/**/*.test.ts", "tests/**/*.test.ts"] }`
- CI/CD: Separate steps for unit (fast) vs integration (slow)

**6. Services Organization: Domain-Based Nested Folders + Thin Files**
```
services/
├── vehicles/
│   ├── index.ts (barrel exports)
│   ├── vehicleService.ts
│   ├── maintenanceService.ts
│   └── diagnosticsService.ts
├── ai/
│   ├── index.ts
│   ├── aiService.ts
│   └── costTrackingService.ts
└── auth/ (etc)
```
- Import: `import { vehicleService, maintenanceService } from "@/services/vehicles"`
- Rationale: Logical grouping by domain, thin services (SRP), scales well
- Enforcement: Services folder structure enforced in code review

### Format Patterns

**7. API Response Wrapper: Direct Response (No Wrapper)**
- Success: Function returns data directly (`Vehicle[]`)
- Error: Throw HttpsError (Firebase native)
- Rationale: Firebase native (no wrapper needed), simple frontend, TypeScript clarity
- Example: `const vehicles = await callFunction("listVehicles", {...}) // Direct Vehicle[]`

**8. Error Response Structure: Extended HttpsError with Details**
```typescript
throw new HttpsError(
  "permission-denied",
  "No tienes acceso a este vehículo", // Spanish user message
  { userId, vehicleId, reason: "NOT_OWNER" } // Details for logging
)
```
- Frontend receives: `{ code, message, details }`
- Rationale: Standard Firebase + flexibility, debugging-friendly, programmatic retry logic
- Enforcement: Always include details object for logging/monitoring

**9. Date & Time Formatting: Firestore Timestamp (Storage) + ISO String (API)**
- Storage: `Timestamp.now()` (native Firestore type)
- API Response: ISO 8601 strings (e.g., `"2026-04-19T14:30:00Z"`)
- Frontend: `new Date(isoString)` parses natively
- Conversion: `vehicle.createdAt.toDate().toISOString()` in controllers
- Rationale: Queryable storage, standard API, native frontend parsing, human-readable debugging

### Communication Patterns

**10. TanStack Query Key Naming: Hierarchical Arrays**
- Pattern: `[resource, identifier, subresource, detail]`
- Examples:
  - `["vehicles", userId]` (user's vehicles)
  - `["vehicle", vehicleId]` (single vehicle)
  - `["vehicles", vehicleId, "obd2", "diagnostics"]` (nested)
- Invalidation: `queryClient.invalidateQueries({ queryKey: ["vehicles", userId], exact: false })`
- Rationale: Clear structure, partial invalidation easy, already in project-context.md
- Enforcement: Code review ensures consistent key structure

**11. Zustand State Updates: Immutable Updates (Never Mutations)**
```typescript
addVehicle: (vehicle) => set(state => ({
  vehicles: [...state.vehicles, vehicle] // New array
}))
```
- Rationale: Explicit, debuggable (React DevTools), Zustand standard, reliable
- Enforcement: Code review flags in-place mutations (push, splice, Object.assign)
- Note: If performance issue, can add Immer middleware (syntax stays same)

**12. Loading State Naming: Hybrid (Zustand Mutations + TanStack Queries)**
- **Zustand (mutations):** `isCreatingVehicle`, `isUpdatingVehicle`, `isDeletingVehicles: Set<string>`
- **TanStack (queries):** `isPending` aliased to `isLoadingVehicles`
- **Component:** Combine both for granular UX
- Rationale: Clear separation (reads vs writes), granular UX, scales with concurrent actions
- Example: `isDeletingIds.has(vehicleId)` for item-level spinners

### Process Patterns

**13. Error Recovery Strategy: Context-Based Smart Retry**
- **Transient errors** (retry 3x): `unavailable`, `deadline-exceeded`, `timeout`
- **Permanent errors** (no retry): `permission-denied`, `unauthenticated`, `invalid-argument`, `not-found`
- **Unknown errors** (retry 1x): all others
- **Retry delay:** Exponential backoff (1s, 2s, 4s, capped at 30s)
- Implementation: `useRetryStrategy()` hook returns boolean based on error code
- Rationale: Transient errors recover silently, permanent errors fail fast, good UX + server load
- Logging: Track failed queries in Sentry/Firebase Logs

### Enforcement Guidelines

**All AI Agents MUST follow these 13 patterns:**

1. ✅ Database fields: camelCase (ZERO exceptions)
2. ✅ Cloud Functions: Start with verb (list*, create*, update*, delete*, analyze*, suggest*)
3. ✅ Components: PascalCase files matching export name
4. ✅ Functions: Use prefixes (get*, set*, is*, has*, use*, calculate*, parse*)
5. ✅ Tests: Co-locate unit tests, centralize integration/e2e
6. ✅ Services: Group by domain (vehicles, ai, auth, billing)
7. ✅ API responses: Direct data, never wrapped
8. ✅ Errors: Always throw HttpsError with code + Spanish message + details
9. ✅ Dates: Timestamp in storage, ISO strings in API, Date in frontend
10. ✅ Query keys: Hierarchical arrays with partial invalidation
11. ✅ State updates: Immutable (never mutations)
12. ✅ Loading states: Zustand for mutations, TanStack for queries
13. ✅ Error recovery: Smart retry based on error code

### Pattern Examples & Anti-Patterns

**Good Pattern: List Vehicles**
```typescript
// Service (immutable, clear)
async function getVehicles(uid: string): Promise<Vehicle[]> {
  const docs = await db.collection("users").doc(uid).collection("vehicles").get()
  return docs.docs.map(doc => doc.data() as Vehicle)
}

// Controller (direct response, action verb)
export const listVehicles = onCall(async (request) => {
  const vehicles = await vehicleService.getVehicles(request.auth!.uid)
  return vehicles // Direct, no wrapper
})

// Mobile hook (hierarchical key, smart retry)
const { data: vehicles, isPending: isLoadingVehicles } = useQuery({
  queryKey: ["vehicles", userId],
  queryFn: () => callFunction("listVehicles", { userId }),
  retry: useRetryStrategy()
})
```

**Anti-Patterns to AVOID**
- ❌ Database: snake_case (`user_id`, `last_ai_usage`)
- ❌ Functions: no verb prefix (`getDetails` should be `getVehicleDetails`)
- ❌ API: wrapped responses (`{ data: vehicles, error: null }`)
- ❌ Errors: missing details (`throw new HttpsError("error", "...")`)
- ❌ State: mutations (`state.vehicles.push(vehicle)`)
- ❌ Loading: inconsistent naming (`isVehicleLoading`, `vehicleLoading`, `loadingVehicle`)
- ❌ Retry: always retry (`retry: true`) — use context-based strategy

---

## Project Structure & Boundaries

### Monorepo Root Structure

```
motora-ia/
├── README.md
├── package.json (workspaces config)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── biome.json
├── firebase.json
├── .firebaserc (dev, staging, prod aliases)
├── firestore.rules (Hybrid RBAC + Ownership)
├── firestore.indexes.json
├── storage.rules
│
├── packages/
│   ├── types/ (shared TS types + Zod schemas across mobile/web/backend)
│   └── scripts/ (scaffolding: npm run generate:feature)
│
├── functions/ (Firebase Cloud Functions v2)
├── mobile/ (React Native + Expo)
├── web/ (Vite React + TypeScript admin/landing)
├── docs/ (architecture, decision-journal, feature walkthroughs, diagrams)
└── .github/workflows/ (CI/CD: lint, tests, deploy)
```

### Backend Structure (functions/)

```
functions/src/
├── index.ts (Firebase function exports)
├── controllers/
│   ├── auth/, users/, vehicles/, ai/, billing/, businesses/, bookings/, notifications/, admin/
│   └── Each: {domain}Controller.ts + {domain}Controller.test.ts (co-located unit tests)
│
├── services/ (Domain-based + thin files)
│   ├── auth/ ├── users/ ├── vehicles/ ├── ai/ ├── billing/
│   ├── businesses/ ├── bookings/ ├── notifications/ ├── admin/
│   └── Each domain: index.ts (barrel) + thin services + co-located tests
│
├── shared/
│   ├── firebase.ts (admin SDK init)
│   ├── auth.ts (assertAuth helper)
│   ├── errors.ts (HttpsError factories)
│   ├── logger.ts (structured logging)
│   └── constants.ts (collection names, limits)
│
└── triggers/
    ├── auth/onUserCreated.ts, onUserDeleted.ts
    └── firestore/onVehicleCreated.ts, onSubscriptionUpdated.ts

functions/tests/
├── integration/ (vehicles, ai, billing, obd2-flow)
├── e2e/ (user-flow.e2e.test.ts)
└── fixtures/ (users, vehicles, obd2-data)
```

### Mobile Structure (mobile/)

```
mobile/src/
├── app/ (Expo Router file-based routing)
│   ├── _layout.tsx (root with ToastProvider, QueryClient)
│   ├── (auth)/ (login, register, forgot-password, onboarding)
│   └── (app)/(tabs)/ (dashboard, vehicles, diagnostics, profile + auth guard)
│
├── features/ (Feature folder isolation)
│   ├── auth/ ├── vehicles/ ├── diagnostics/ ├── ai/
│   ├── billing/ ├── businesses/ ├── bookings/ ├── profile/
│   └── Each: screens/ + components/ + hooks/ + queries/ + {feature}.types.ts
│
├── features/diagnostics/obd2/ (Strategy Pattern)
│   ├── OBD2Service.ts (abstract interface)
│   ├── BluetoothClassicStrategy.ts (Android - production)
│   ├── BLEStrategy.ts (iOS skeleton)
│   ├── MockStrategy.ts (development)
│   ├── CommandQueue.ts
│   └── OBD2Parser.ts (DTC decoder)
│
└── shared/
    ├── components/ (AppButton, AppInput, ToastProvider, ConfirmationModal, etc.)
    ├── hooks/ (useToast, useRetryStrategy, useAuth, useDebounce)
    ├── stores/ (Zustand: useAuthStore, useVehicleStore, useDiagnosticStore)
    ├── api/ (firebase.ts, functions.ts, queryClient.ts)
    ├── theme/ (colors, typography, spacing)
    ├── utils/ (date, validation, storage with .catch wrapping)
    └── constants/ (routes, tiers)
```

### Web Structure (web/)

```
web/src/
├── main.tsx + App.tsx (root with router + providers)
│
├── routes/ (TanStack Router file-based)
│   ├── __root.tsx, index.tsx (landing), login.tsx
│   └── admin/ (_layout.tsx auth guard + dashboard, users, vehicles, ia-logs,
│                subscriptions, businesses, bookings)
│
├── modules/
│   ├── landing/ (HeroSection, FeaturesSection, OBD2Explainer, DownloadCTA + pages)
│   └── admin/ (dashboard with KPI cards/charts, users, vehicles,
│                ia-logs with cost metrics, subscriptions, businesses, bookings)
│
└── shared/
    ├── components/ (Button, Input, Modal, DataTable)
    ├── hooks/ (useToast, useRetryStrategy)
    ├── stores/ (Zustand: useAuthStore)
    ├── api/ (firebase.ts, functions.ts, queryClient.ts)
    └── theme/ (tailwind.css)
```

### Architectural Boundaries

**API Boundaries:**
- External: Cloud Functions HTTPS callable, Firebase Auth, Mercado Pago webhooks, OpenAI (proxied), SendGrid/Twilio (outbound), FCM
- Internal: Controllers validate + delegate; Services have business logic; NO cross-domain service imports

**Component Boundaries:**
- Mobile: Each `features/{feature}/` self-contained; cross-feature only via `shared/`
- Web: Each `modules/{module}/` self-contained; admin guarded by `routes/admin/_layout.tsx`

**Data Boundaries:**
- Firestore: per-user (`users/{uid}/vehicles/...`), cross-user (`businesses/{bid}` with allowedUsers), admin-only (`aiUsage/{uid}/dailyCalls/`)
- Storage: `gs://bucket/users/{uid}/...`, `gs://bucket/businesses/{bid}/...`

### Requirements to Structure Mapping

| Epic | Backend | Mobile | Web |
|------|---------|--------|-----|
| **Auth & Onboarding** | controllers/auth/, services/auth/, triggers/auth/onUserCreated.ts | app/(auth)/, features/auth/ | routes/login.tsx, admin guard |
| **Vehicles** | controllers/vehicles/, services/vehicles/vehicleService.ts | features/vehicles/ | routes/admin/vehicles.tsx |
| **OBD2** | controllers/vehicles/diagnosticsController.ts, services/vehicles/diagnosticsService.ts | features/diagnostics/obd2/ (Strategy) | (admin logs) |
| **AI Analysis** | controllers/ai/, services/ai/aiService.ts + costTrackingService.ts | features/ai/ | routes/admin/ia-logs.tsx |
| **Subscriptions** | controllers/billing/, services/billing/, webhookController.ts | features/billing/ | routes/admin/subscriptions.tsx |
| **Businesses & Booking** | controllers/businesses/, controllers/bookings/, services/businesses/, services/bookings/ | features/businesses/, features/bookings/ | routes/admin/businesses.tsx, bookings.tsx |
| **Admin Dashboard** | controllers/admin/, services/admin/ (KPIs) | (N/A) | routes/admin/dashboard.tsx |
| **Notifications** | services/notifications/ (orchestrator + email/sms/push) | shared/notifications/ | (admin trigger UI) |
| **Web Promotion** | (none) | (N/A) | modules/landing/ |

**Cross-Cutting Concerns:**
- Auth: triggers/auth/, mobile/web shared/stores/useAuthStore.ts
- Multi-Tenancy: firestore.rules (Hybrid RBAC + Ownership)
- Error Handling: functions/shared/errors.ts, mobile/web useToast
- Rate Limiting: services/ai/costTrackingService.ts (token bucket)
- Type Sharing: packages/types/ (monorepo workspace)

### Integration Points

**Internal Communication Flow (example: list vehicles):**
```
Mobile features/vehicles/queries/vehicleQueries.ts
  → callFunction("listVehicles", { userId })
    → functions/src/controllers/vehicles/vehicleController.ts
      → functions/src/services/vehicles/vehicleService.ts
        → Firestore (with Security Rules enforcement)
```

**OBD2 → AI Analysis Flow:**
```
1. Mobile features/diagnostics/obd2/BluetoothClassicStrategy.ts (read PIDs from ELM327)
2. OBD2Parser.parseDTC(raw) → returns { dtcCode, freezeFrame }
3. Mobile features/ai/hooks/useAIAnalysis.ts → callFunction("analyzeDTC", {...})
4. services/ai/costTrackingService.ts (token bucket check: FREE? throw, PREMIUM? consume)
5. services/ai/aiService.ts (Vercel AI SDK → gpt-4o-mini → structured output)
6. Returns { analysis, urgency, estimatedCost, recommendedAction }
7. Mobile features/ai/screens/AIAnalysis.tsx renders result
```

**External Integrations:**

| External | Direction | Where |
|----------|-----------|-------|
| Firebase Auth | Bidirectional | Mobile/Web SDK + Backend Admin SDK |
| Firestore | Bidirectional | Client SDK (rules-protected) + Backend Admin |
| OpenAI API | Outbound | services/ai/aiService.ts (proxied, never client) |
| Mercado Pago | Bidirectional | paymentService.ts (out) + webhookController.ts (in) |
| SendGrid/Twilio/FCM | Outbound | services/notifications/{email,sms,push}Service.ts |
| Google Maps | Outbound | Mobile geolocation, Web business search |

### Development Workflow

**Development Servers:**
- Backend: `firebase emulators:start` (Firestore + Auth + Functions)
- Mobile: `pnpm --filter mobile dev` → Expo dev server (mock OBD2 enabled)
- Web: `pnpm --filter web dev` → Vite dev server (HMR)

**Build Process:**
- Backend: `pnpm --filter functions build` → TypeScript compilation
- Mobile: `eas build` (production native builds)
- Web: `pnpm --filter web build` → Vite static build

**Deployment:**
- Backend: GitHub Actions → `firebase deploy --only functions,firestore:rules`
- Mobile: EAS Build + EAS Submit (App Store + Play Store)
- Web: GitHub Actions → Vercel/Netlify static deploy

**Testing Strategy:**
- Unit tests: Co-located (`src/**/*.test.ts`), Jest, fast feedback
- Integration tests: `tests/integration/` with Firestore emulator
- E2E tests: `tests/e2e/` covering full user flows
- CI/CD separate steps for unit (every PR) vs integration (main branch)

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Firebase + React Native + Vite React: stack JavaScript-first coherente sin conflictos
- Token bucket (IA limits) + Firestore counters (analytics): complementary, no overlap
- Hybrid OBD2 (BT Android + BLE iOS skeleton): no platform conflicts
- Custom scaffolding + domain-based services: aligned for code generation
- Vite React (web) + Zustand + TanStack Query: pattern parity con mobile validated

**Pattern Consistency:**
- camelCase fields + verb-prefix functions + PascalCase components: JavaScript-coherent
- Hierarchical query keys + immutable Zustand: complementary (cache ↔ state)
- Co-located unit tests + centralized integration: scalable strategy
- Direct API responses + HttpsError + ISO dates: clear API contract

**Structure Alignment:**
- Domain-based services in functions/ map to feature folders in mobile/web
- packages/types/ enables shared validation across all platforms
- Boundaries respected: no cross-domain imports, isolation enforced

### Requirements Coverage Validation ✅

**Functional Requirements (76 FRs): 100% Coverage**

| Category | Coverage |
|----------|----------|
| Auth & Users (7), Vehicles (7), Maintenance (6) | ✅ controllers + services + features |
| OBD2 (9), AI (6) | ✅ Strategy Pattern + costTrackingService |
| Subscriptions (7), Business Profiles (6), Booking (6) | ✅ billing/businesses/bookings services |
| Admin Dashboard (7), Notifications (5) | ✅ admin services + Web routes + orchestrator |
| Web Promotion (5), Security & Data (5) | ✅ landing module + firestore.rules |

**Non-Functional Requirements: All Addressed**

| NFR | Mechanism |
|-----|-----------|
| Performance (<1s, <10s IA) | TanStack Query cache + async patterns |
| Concurrency (50-100 users) | Cloud Functions auto-scale + Firestore |
| Scalability (10x growth) | Serverless + indexed queries |
| Security (HTTPS, multi-tenant) | Firestore Rules + JWT + Zod validation |
| Rate Limiting | Token bucket + counters |
| OBD2 Reliability (80%+) | Strategy Pattern + Mock fallback |
| Uptime (99%+) | Firebase SLA + monitoring (Phase 8) |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All 5 critical decisions documented with rationale + cascading implications
- Technology versions verified (Node 22, RN 0.83.2, Expo 55, etc.)
- Implementation phases mapped (3.5 → 4 → 5 → 6 → 7+)

**Pattern Completeness:**
- 13 patterns covering all conflict areas (naming, structure, format, communication, process)
- Examples + anti-patterns for each pattern
- Enforcement guidelines clear (ESLint, code review, CI checks)

**Structure Completeness:**
- Complete directory tree (backend + mobile + web + packages)
- Boundaries defined (API, component, service, data)
- 100+ files/folders mapped to specific FRs

### Gap Analysis Results

**Critical Gaps:** 0 (no implementation blockers)

**Important Gaps (Deferred to Future Elicitation):**
1. Monitoring & Observability — Sentry vs Firebase Logs vs Datadog
2. Testing Strategy Details — Unit coverage thresholds, E2E framework (Detox vs Maestro)
3. CI/CD Pipeline Specifics — GitHub Actions exact triggers + env vars
4. Feature Flags Strategy — How gradual rollouts work

**Nice-to-Have (Post-MVP):**
- Analytics integration (Mixpanel/Amplitude)
- Advanced caching beyond TanStack Query
- Backup/Disaster Recovery specifics
- Performance budgets per platform

### Minor Recommendations

1. **Monorepo workspace:** Confirm pnpm vs npm workspaces decision
2. **Mobile Bluetooth permissions:** Ensure iOS Info.plist BLE permission strings ready
3. **Firebase Custom Claims:** Consider for admin role (alternative to userType field)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (76 FRs, 5 NFRs)
- [x] Scale and complexity assessed (HIGH, 3 domains)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (7 concerns)

**✅ Architectural Decisions**
- [x] 5 critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] 4 naming conventions established
- [x] 2 structure patterns defined
- [x] 3 format patterns specified
- [x] 3 communication patterns specified
- [x] 1 process pattern documented

**✅ Project Structure**
- [x] Complete directory structure (backend + mobile + web + packages)
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH**

**Key Strengths:**
1. **Brownfield-aware:** Leverages existing codebase patterns (no greenfield rework)
2. **Pattern parity:** Mobile + Web share Zustand + TanStack Query (knowledge reuse)
3. **Defense-in-depth:** Security at 3 layers (Rules + Backend + UI)
4. **Cost-managed AI:** Token bucket prevents bill shock, counters enable billing accuracy
5. **Developer experience:** Custom scaffolding + ADRs + feature walkthroughs minimize friction
6. **OBD2 transparency:** iOS users see "Coming soon" vs confusing mock data

**Areas for Future Enhancement:**
1. Monitoring stack — Decide in Phase 8
2. Testing framework details (Detox vs Maestro for E2E)
3. CI/CD specifics (GitHub Actions exact configuration)
4. Feature flags (LaunchDarkly vs Firebase Remote Config vs custom)

### Implementation Handoff

**AI Agent Guidelines:**
1. **READ FIRST:** docs/project-context.md + this architecture.md
2. **Follow ALL 13 patterns** exactly as documented
3. **Respect boundaries:** No cross-domain service imports, no cross-feature mobile imports
4. **Use scaffolding:** `npm run generate:feature --name=X --type=CRUD`
5. **Defer ambiguous decisions:** Update architecture.md ADRs when new patterns emerge

**First Implementation Priorities:**
1. **Phase 3.5 (DX Foundation):** Build scaffolding script + decision-journal/ + diagrams/
2. **Phase 4 (apply now):** Update firestore.rules with Hybrid RBAC + Ownership
3. **Phase 5 (Web Dashboard):** Bootstrap web/ workspace with Vite React + TypeScript
4. **Phase 6 (OBD2 + IA):** Implement BluetoothClassicStrategy.ts + costTrackingService.ts
5. **Phase 7+ (Businesses):** Implement business profiles + booking workflows

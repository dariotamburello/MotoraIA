---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'epics-and-stories'
projectName: 'motora-ia'
userName: 'Dario'
date: '2026-04-25'
status: 'stories-generated'
epicsCount: 9
storiesCount: 52
---

# motora-ia - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **motora-ia**, decomposing the requirements from the PRD, UX Design Specification, and Architecture decisions into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Management & Authentication:**
- **FR1:** Usuario puede registrarse con email, Google, o Apple
- **FR2:** Usuario puede iniciar sesión con credentials o OAuth
- **FR3:** Usuario puede cerrar sesión y limpiar cache
- **FR4:** Usuario puede recuperar contraseña vía email
- **FR5:** Usuario puede ver y editar su perfil (nombre, email, foto)
- **FR6:** Usuario puede ver su tipo de suscripción (free/premium) y fecha de renovación
- **FR7:** Sistema mantiene sesión activa entre app restarts (persistencia)

**Vehicle Management:**
- **FR8:** Usuario puede crear vehículo (marca, modelo, año, VIN, patente)
- **FR9:** Usuario puede editar datos de vehículo existente
- **FR10:** Usuario puede eliminar vehículo de su cuenta
- **FR11:** Usuario free puede registrar máximo 2 vehículos
- **FR12:** Usuario premium puede registrar ilimitados vehículos
- **FR13:** Usuario puede ver listado de todos sus vehículos
- **FR14:** Usuario puede seleccionar vehículo "activo" para diagnóstico

**Maintenance & Task Tracking:**
- **FR15:** Usuario puede registrar vencimiento (patente, seguro, ITV)
- **FR16:** Usuario puede crear tarea de mantenimiento
- **FR17:** Usuario puede marcar tarea como completada
- **FR18:** Usuario puede ver historial de mantenimientos realizados
- **FR19:** Sistema muestra recordatorio de vencimientos próximos (notificación)
- **FR20:** Usuario puede establecer recordatorios personalizados

**OBD2 Integration:**
- **FR21:** Usuario puede buscar adaptadores Bluetooth disponibles
- **FR22:** Usuario puede emparejar adaptador OBD2 Bluetooth genérico
- **FR23:** Usuario puede desemparejar adaptador OBD2
- **FR24:** Usuario puede iniciar lectura de diagnóstico OBD2
- **FR25:** Sistema decodifica códigos de error OBD2 (P0300, P0134, etc.)
- **FR26:** Sistema muestra valores en tiempo real (RPM, temperatura, consumo)
- **FR27:** Sistema maneja fallos de conexión con mensajes claros
- **FR28:** Usuario puede ver historial de lecturas OBD2
- **FR29:** Sistema requiere aceptación de términos antes de usar OBD2

**IA Analysis & Recommendations:**
- **FR30:** Usuario premium puede solicitar análisis IA de diagnóstico
- **FR31:** Sistema envía datos OBD2 + contexto vehículo a IA
- **FR32:** IA retorna análisis: problema identificado, urgencia, costo estimado
- **FR33:** Usuario puede ver historial de análisis IA
- **FR34:** Usuario free obtiene 1 análisis IA gratis (trial/demo)
- **FR35:** Sistema muestra costo de IA usage al admin

**Subscription & Billing:**
- **FR36:** Usuario puede ver opciones de suscripción (free/premium)
- **FR37:** Usuario free ve paywall al intentar: 3er vehículo o análisis IA
- **FR38:** Usuario puede comprar suscripción premium vía Mercado Pago
- **FR39:** Sistema sincroniza estado de suscripción (activa/expirada)
- **FR40:** Usuario recibe confirmación de pago vía email
- **FR41:** Usuario puede cancelar suscripción en cualquier momento
- **FR42:** Sistema revoca acceso premium si suscripción caduca

**Business Profile & Services:**
- **FR43:** Usuario business puede crear perfil de negocio (nombre, servicios, ubicación)
- **FR44:** Usuario business puede editar servicios ofrecidos
- **FR45:** Usuario business puede ver lista de clientes conectados
- **FR46:** Usuarios pueden buscar businesses por geolocalización (mapa)
- **FR47:** Usuarios pueden ver perfil de business (servicios, ubicación, contacto)
- **FR48:** Usuario business aparece en resultados de búsqueda de otros usuarios

**Booking & Communication:**
- **FR49:** Usuario puede enviar consulta/solicitud de turno a business
- **FR50:** Usuario business recibe notificación de nueva consulta
- **FR51:** Usuario business puede aceptar/rechazar solicitud de turno
- **FR52:** Sistema envía confirmación a usuario cuando business acepta
- **FR53:** Usuario puede ver historial de turnos/consultas
- **FR54:** Usuario business puede enviar mensaje a cliente

**Admin Dashboard & Monitoring:**
- **FR55:** Admin puede ver dashboard con KPIs: usuarios activos, conversión, businesses
- **FR56:** Admin puede filtrar usuarios por tipo (free, premium, business)
- **FR57:** Admin puede visualizar logs de uso de IA (quién, cuántos requests, costo)
- **FR58:** Admin puede crear business manualmente (invite/onboarding)
- **FR59:** Admin puede editar perfil de usuario (support)
- **FR60:** Admin puede activar/desactivar suscripción de usuario
- **FR61:** Admin puede ver métricas de ingresos (suscripciones, conversión)

**Notifications & Communication:**
- **FR62:** Sistema envía email de confirmación de registro
- **FR63:** Sistema envía email de recordatorio de vencimiento
- **FR64:** Sistema envía SMS de alerta (OBD2 crítico, mantenimiento urgente)
- **FR65:** Usuario puede recibir notificaciones push en mobile
- **FR66:** Usuario puede desuscribirse de notificaciones específicas

**Web & Promotional:**
- **FR67:** Web landing page muestra value proposition de Motora
- **FR68:** Web contiene explainer de cómo funciona OBD2 + IA
- **FR69:** Web contiene links de descarga a App Store y Google Play
- **FR70:** Web contiene términos y condiciones
- **FR71:** Web contiene política de privacidad

**Data & Security:**
- **FR72:** Sistema aísla datos de cada usuario (multi-tenancy)
- **FR73:** Usuario business puede ver solo datos de clientes que compartieron vehículos
- **FR74:** Admin puede ver datos agregados (no individuales sin need-to-know)
- **FR75:** Sistema encripta datos en tránsito (HTTPS)
- **FR76:** Sistema valida permisos antes de cualquier operación

### NonFunctional Requirements

**Performance:**
- **NFR1:** Sistema soporta mínimo 50 usuarios concurrentes simultáneamente sin degradación; picos hasta 100 usuarios con <20% degradación
- **NFR2:** Operaciones móviles (navegación, registro, búsqueda) responden en <1 segundo
- **NFR3:** Carga de listados (vehículos, tareas, búsqueda businesses) en <2 segundos
- **NFR4:** OBD2 lectura inicial en <30 segundos (limitado por hardware)
- **NFR5:** Análisis IA en <10 segundos desde request a respuesta (incluye Vercel AI); loading indicator progresivo si excede
- **NFR6:** App móvil permite ver vehículos, tareas e historial en modo offline; sincronización automática al recuperar conexión; indicador visual claro de modo offline

**Security:**
- **NFR7:** Todos los datos viajados mediante HTTPS only con TLS 1.2 mínimo; no hay data en HTTP
- **NFR8:** Datos en Firebase protegidos por Security Rules; tokens JWT en Secure Storage (iOS Keychain, Android Keystore)
- **NFR9:** Autenticación vía Firebase Auth (email, Google, Apple); sin MFA en MVP; sessions timeout 30 días con renovación automática; logout limpia datos locales
- **NFR10:** Cloud Functions validan request.auth.uid antes de cualquier operación; nunca confiar en UID del client
- **NFR11:** Rate limiting: 1 IA request/usuario/día (FREE), unlimited (PREMIUM)
- **NFR12:** Cumple leyes de privacidad locales de Argentina (sin GDPR específico); términos y condiciones aceptados en primer login

**Scalability:**
- **NFR13:** MVP soporta 500 usuarios activos; arquitectura debe soportar 10x growth (5,000 usuarios) sin cambios estructurales
- **NFR14:** Firestore auto-scaling habilitado; índices estratégicos optimizados antes de launch
- **NFR15:** Cloud Functions con auto-scaling configurado; no cold-start timeouts aceptables; budget límite configurado
- **NFR16:** Storage: data retention policy 2 años de datos históricos; ~1MB/usuario/año

**Integration:**
- **NFR17:** Mercado Pago: reintentar automáticamente fallos de pago 3 veces (5min, 15min, 1hora); notificar via email+SMS si todas fallan; bloquear acceso premium hasta resolver; webhook timeout 30s; validar firma IPN
- **NFR18:** Google Maps: precisión ±50 metros; fallback a búsqueda por nombre/categoría si no disponible; API key protegida server-side
- **NFR19:** Email entrega <5 minutos (SendGrid); SMS entrega <10 minutos (Twilio); retry 3 veces si falla; no crítico para MVP si hay delays

**Reliability & Uptime:**
- **NFR20:** 99% uptime (máximo 43 minutos/mes downtime); planned maintenance máximo 2 horas/mes con notificación 24h antes
- **NFR21:** Error tracking: Firebase Crashlytics (mobile) + Cloud Logging (backend); alertas automáticas si uptime cae bajo 99%
- **NFR22:** Backups diarios automáticos de Firebase; RTO <4 horas; RPO <24 horas

### Additional Requirements

**Starter Template & Scaffolding (Architecture Decision 1):**
- **AR1:** NO usar starter externo (Obytes/create-expo-stack); usar codebase existente como referencia + scaffolding propio
- **AR2:** Crear Custom Node Script + Templates: `npm run generate:feature --name=X --type=CRUD` (~200 LOC)
- **AR3:** Generar boilerplate Controllers→Services→Models con tests co-located según pattern
- **AR4:** Crear Architecture Decision Records (ADRs) versionados en `docs/decision-journal/`
- **AR5:** Diagramas visuales de flujos críticos (Auth → Onboarding → Vehicles → OBD2 → IA Analysis) en `docs/diagrams/`

**Monorepo Structure:**
- **AR6:** Configurar monorepo con pnpm workspaces (raíz: package.json + pnpm-workspace.yaml + tsconfig.base.json + biome.json + firebase.json)
- **AR7:** Crear packages/types/ — TypeScript types + Zod schemas compartidos entre mobile/web/backend
- **AR8:** Crear packages/scripts/ — scripts de scaffolding y generación de features
- **AR9:** Crear packages/design-tokens/ — fuente de verdad para colors/typography/spacing/radii/shadows/animations (dark + light)

**Backend Architecture (functions/):**
- **AR10:** Estructura Firebase Cloud Functions v2 con dominios: auth, users, vehicles, ai, billing, businesses, bookings, notifications, admin
- **AR11:** Pattern Controllers→Services→Models con tests co-located (`{domain}Controller.test.ts` junto a `{domain}Controller.ts`)
- **AR12:** Services organizados domain-based + thin files con barrel exports (index.ts)
- **AR13:** Triggers separados: triggers/auth/onUserCreated.ts, onUserDeleted.ts; triggers/firestore/onVehicleCreated.ts, onSubscriptionUpdated.ts
- **AR14:** Shared modules: firebase.ts (admin SDK init), auth.ts (assertAuth helper), errors.ts (HttpsError factories), logger.ts, constants.ts
- **AR15:** Tests: unit co-located + integration en functions/tests/integration/ (Firestore emulator) + e2e en functions/tests/e2e/

**Web Platform Stack (Architecture Decision 4):**
- **AR16:** Web admin/landing con Vite React + TypeScript + Zustand + TanStack Query + TanStack Router + TailwindCSS
- **AR17:** Estructura web/src/: routes/ (TanStack Router file-based), modules/ (landing + admin), shared/ (components, hooks, stores, api, theme)
- **AR18:** Admin guarded por routes/admin/_layout.tsx con auth + role check
- **AR19:** Static deploy via Vercel/Netlify con GitHub Actions
- **AR20:** No SSR (admin read-only mostly); future migration path a Next.js documentada

**Firestore Security Rules (Architecture Decision 5):**
- **AR21:** Implementar Hybrid RBAC + Ownership en 3 capas: Tier (subscription) → Ownership (uid match) → Role-Based (collection segregation)
- **AR22:** Layer 1 — Tier-aware: FREE users blockeados en Rules para 3er vehículo (`countUserVehicles(uid) < 2`)
- **AR23:** Layer 2 — Ownership: `request.auth.uid == uid` o `uid in resource.data.allowedUsers`
- **AR24:** Layer 3 — Role: businesses readable por admins/mechanicians, writeable solo por owner
- **AR25:** SuperAdmins bypass para support
- **AR26:** Backend Cloud Functions ALSO valida (defense in depth — Rules + backend)
- **AR27:** Reglas con testing exhaustivo (target ~100 líneas + suite de tests)

**OBD2 Implementation (Architecture Decision 2):**
- **AR28:** Strategy Pattern en mobile/src/features/diagnostics/obd2/: OBD2Service abstract interface + BluetoothClassicStrategy (Android prod) + BLEStrategy (iOS skeleton) + MockStrategy (dev)
- **AR29:** CommandQueue.ts para serializar comandos al ELM327
- **AR30:** OBD2Parser.ts para decodificar DTCs y respuestas PID
- **AR31:** Runtime flags per-platform: `ENABLE_REAL_BT_ANDROID=true`, `ENABLE_REAL_BT_IOS=false` (transparente "Coming soon" UX iOS)
- **AR32:** Polling 500ms (mockup) → 1000ms producción para prevenir CPU/battery drain
- **AR33:** Permisos iOS: Info.plist BLE permission strings ready

**IA Cost Tracking (Architecture Decision 3):**
- **AR34:** Hybrid: Token bucket para enforcement + Firestore counters para analytics (separación clara)
- **AR35:** Schema users/{uid}/stats: `aiTokensBucket: { tokens, refillAt, tier }`, `lastAiUsage: Timestamp`
- **AR36:** Schema aiUsage/{userId}/dailyCalls/{YYYY-MM-DD}: `count, totalTokensUsed, estimatedCost, calls[]`
- **AR37:** Refill logic idempotent (safe on Function retries)
- **AR38:** User feedback: "You have 0 calls left today. Upgrade to PREMIUM for unlimited."
- **AR39:** Servicio dedicado services/ai/costTrackingService.ts (separado de aiService.ts)

**Mobile Architecture (mobile/):**
- **AR40:** Expo Router file-based routing: app/(auth)/, app/(app)/(tabs)/ con auth guard
- **AR41:** Feature folder isolation: features/{feature}/ con screens/ + components/ + hooks/ + queries/ + types
- **AR42:** Cross-feature solo via shared/; no cross-feature imports directos
- **AR43:** Shared: components (AppButton, AppInput, ToastProvider, ConfirmationModal, etc.), hooks (useToast, useRetryStrategy, useAuth), stores (Zustand: useAuthStore, useVehicleStore, useDiagnosticStore), api (firebase.ts, functions.ts, queryClient.ts), theme, utils, constants
- **AR44:** AsyncStorage persistence para state crítico (activeRole, theme, last-paired BT device)

**Implementation Patterns (13 Enforced Standards):**
- **AR45:** Database fields: camelCase strict (NO snake_case)
- **AR46:** Cloud Functions: action verb prefix (`listVehicles`, `createVehicle`, `analyzeDTC`, `suggestMaintenanceTask`)
- **AR47:** Components: PascalCase files matching export name
- **AR48:** Functions: prefix pattern (`get*`, `set*`, `is*`, `has*`, `use*`, `calculate*`, `parse*`, `format*`)
- **AR49:** Tests: co-locate units, centralize integration/e2e
- **AR50:** Services: domain-based nested folders + thin files + barrel exports
- **AR51:** API responses: direct data (NO wrappers like `{ data, error }`)
- **AR52:** Errors: HttpsError con code + Spanish user message + details object para logging
- **AR53:** Dates: Timestamp en storage, ISO 8601 strings en API, Date en frontend
- **AR54:** TanStack Query keys: hierarchical arrays `[resource, identifier, subresource, detail]`
- **AR55:** Zustand: immutable updates only (no mutations)
- **AR56:** Loading states: Zustand para mutations (`isCreatingVehicle`), TanStack para queries (`isLoadingVehicles`)
- **AR57:** Error recovery: context-based smart retry (transient retry 3x exponential backoff, permanent fail fast)

**Integration Endpoints:**
- **AR58:** OpenAI proxied vía services/ai/aiService.ts (NUNCA client-side); Vercel AI SDK con structured output
- **AR59:** Mercado Pago: paymentService.ts (out) + webhookController.ts (in con IPN signature validation)
- **AR60:** SendGrid (email), Twilio (SMS), FCM (push) en services/notifications/{email,sms,push}Service.ts
- **AR61:** Google Maps API key server-side proxied; client-side solo geolocation + display

**Cross-Cutting Concerns:**
- **AR62:** Authentication: triggers/auth/ + mobile/web shared/stores/useAuthStore.ts; logout cleanup completo (stores + query cache + AsyncStorage)
- **AR63:** Multi-tenancy via firestore.rules (Hybrid RBAC + Ownership) — defense in depth con backend
- **AR64:** Error handling: functions/shared/errors.ts (HttpsError factories) + mobile/web useToast (NUNCA Alert.alert())
- **AR65:** Type sharing: packages/types/ con Zod schemas (validation backend + types frontend)

**Development Workflow & CI/CD:**
- **AR66:** Development: firebase emulators:start + pnpm --filter mobile dev (Expo + mock OBD2) + pnpm --filter web dev (Vite HMR)
- **AR67:** Build: pnpm --filter functions build (TS) + eas build (mobile native) + pnpm --filter web build (Vite static)
- **AR68:** Deploy: GitHub Actions firebase deploy (functions + rules) + EAS Build/Submit (mobile) + Vercel/Netlify (web)
- **AR69:** CI/CD pipelines en .github/workflows/: lint, tests (unit fast, integration slow separados), deploy

### UX Design Requirements

**Design Tokens & Foundation:**
- **UX-DR1:** Crear workspace `packages/design-tokens/` con exports: colors.dark, colors.light, typography, spacing, radii, animations
- **UX-DR2:** Cargar fonts Inter + JetBrains Mono via expo-google-fonts (mobile) y `<link>` Google Fonts (web) con weights 400/500/600/700
- **UX-DR3:** Setup NativeWind config (mobile) consumiendo tokens; cero `style={{ padding: 16, backgroundColor: '#1E293B' }}` — siempre tokens
- **UX-DR4:** Setup TailwindCSS config (web) consumiendo tokens
- **UX-DR5:** Implementar dark theme tokens completos (background, border, text, brand, status, premium con soft/line/gradient variants)
- **UX-DR6:** Implementar light theme tokens completos (paridad con dark) — toggle MVP en Profile + AsyncStorage persistence
- **UX-DR7:** Type scale completo: hero (48px) → display → title-1/2 → body-lg/body/body-sm → caption → meta → micro (11px) → nano (10px) con weights y letter-spacing definidos
- **UX-DR8:** Spacing scale base 4pt: 0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64)
- **UX-DR9:** Radii scale: sm(10), default(14), lg(18), xl(22), full(9999) — refinado del mockup
- **UX-DR10:** Animation tokens: durations (instant/fast/normal/slow), easings (premium/smooth/standard) — spring sutiles, NO bouncy

**Layout Primitives (Tier 2):**
- **UX-DR11:** Construir `<Box>` — container con design system shortcuts (p, px, py, m, bg, border, radius)
- **UX-DR12:** Construir `<Stack>` — flex container con gap consistente (direction, gap, align, justify)
- **UX-DR13:** Construir `<Text>` — text con design tokens (variant + color + mono)
- **UX-DR14:** Construir `<Hairline>` — divisor 1px hairline color, horizontal/vertical

**Visual Primitives (Tier 2):**
- **UX-DR15:** Construir `<Card>` — bg.secondary + border.default + radius.default + padding 16; variant `hero` con padding 18-20 + radius.lg + scale 0.995 on press
- **UX-DR16:** Construir `<Chip>` — pill badge color-coded (variants: ok/warn/err/premium/brand/neutral) con icon Lucide y mono support
- **UX-DR17:** Construir `<Dot>` — indicador circular color-coded tamaños 6/8/10 con prop `live` (keyframe pulse 1.6s)
- **UX-DR18:** Construir `<Halo>` — radial gradient blur tinted (props: tint ok/warn/err/brand, position, intensity); inset -40%, blur 50px, opacity 0.5
- **UX-DR19:** Construir `<Avatar>` — círculo con inicial, gradient bg (metallic/premium/brand), tamaños 36/52/60
- **UX-DR20:** Construir `<Skeleton>` — loading placeholder con shimmer animation 1.6s (variants card/text/circle/custom)
- **UX-DR21:** Construir `<EmptyState>` — pantalla vacía con icon 56×56 muted + title 17px 600 + description body muted + primary CTA

**Animation Primitives (Tier 2):**
- **UX-DR22:** Construir `<FadeUp>` — wrapper con fade-up entry (opacity 0→1 + translateY 8→0, 360ms premium); delay configurable 0-5 mapped a 0/40/80/120/160/200ms; respeta prefers-reduced-motion
- **UX-DR23:** Construir `<PageTransition>` — wrapper de screen con page-in (translateX 12→0, 280ms premium)

**Hook Utilities:**
- **UX-DR24:** Construir `useTheme()` — colors según dark/light + activeRole tint; solo en primitives, nunca en composites
- **UX-DR25:** Construir `useReducedMotion()` — disable animations si prefers-reduced-motion
- **UX-DR26:** Construir `useHaptics()` — Expo Haptics wrapper safe (no-op si no available)

**Form Primitives Refactor (Brownfield):**
- **UX-DR27:** Refactor `AppInput` para consumir tokens (mantener API, no breaking changes)
- **UX-DR28:** Refactor `AppSelect` para consumir tokens + verificar segmented control variant
- **UX-DR29:** Refactor `AppDatePicker` para consumir tokens
- **UX-DR30:** Refactor `EditFormModal` para consumir tokens (base para sheets nuevos)
- **UX-DR31:** Refactor `ConfirmationModal` para consumir tokens
- **UX-DR32:** Refactor `ToastProvider` para consumir tokens + agregar haptic feedback integrado
- **UX-DR33:** Refactor `AuthBackground` para consumir tokens

**Composite Components (Tier 3) — Dashboard:**
- **UX-DR34:** Construir `<StatusHero>` ⭐ DEFINING — status hero card del Dashboard (props: status, label, metric, unit, subText, onPress); dot + label uppercase + km hero number mono + sub-text contextual; tappeable cuando warn/err
- **UX-DR35:** Construir `<VehicleStrip>` — card horizontal vehículo activo (icon car + brand+model + plate+km + chevron)
- **UX-DR36:** Construir `<LastDiagnosticCard>` — card de último diagnóstico OBD2 con DTC chips
- **UX-DR37:** Construir `<ReminderRow>` — row de vencimiento (seguro, VTV, service) con hairline dividers internos
- **UX-DR38:** Construir `<MiniStat>` — mini-stat card para grids 2×2

**Composite Components (Tier 3) — OBD2 + Telemetry:**
- **UX-DR39:** Construir `<MiniGauge>` — telemetry gauge lineal (barra horizontal con label + value + bar)
- **UX-DR40:** Construir `<ArcGauge>` — telemetry gauge semicircular SVG (RPM, Velocidad)
- **UX-DR41:** Construir `<DTCCard>` — card de código DTC con icon Alert + code mono bold + descripción
- **UX-DR42:** Construir `<LiveBanner>` — banner top con connection state (disconnected/connecting/connected/failed/scanning) + dot live + chip "Live" + metadata mono ECU

**Composite Components (Tier 3) — Vehicle Detail:**
- **UX-DR43:** Construir `<MaintenanceTimelineItem>` — item de timeline con left dot+line conectora + Card con chips inline (km mono, costo mono con icon Wallet, shop name muted)
- **UX-DR44:** Construir `<SegmentedControl>` — pill-segmented tab control con animation deslizante (left+width 320ms smooth cubic-bezier); usado en Vehicle Detail tabs (Mantenimiento · OBD2 · Tareas · Documentación) y Profile menu role switch
- **UX-DR45:** Construir `<BackHeader>` — top bar para screens drill-down con chevron-back

**Composite Components (Tier 3) — Navigation:**
- **UX-DR46:** Construir `<BottomNavWithFab>` — bottom navigation con 5 tabs (Inicio · Vehículos · [+ FAB azul] · Diagnóstico · Perfil) + FAB central que abre AddMaintenanceSheet; bg.primary 88% alpha + backdrop-blur 18px + border-top
- **UX-DR47:** Adaptación tab CLIENT vs BUSINESS: BUSINESS muestra "Clientes" en lugar de "Vehículos", "Solicitudes" en lugar de "Diagnóstico"

**Composite Components (Tier 3) — Sheets:**
- **UX-DR48:** Construir `<AIDiagnosisSheet>` — bottom sheet con diagnóstico de "El Negro": header avatar circular gradient púrpura `linear-gradient(135deg, #A855F7, #7C3AED)` con inicial "N", role "Mecánico IA · Córdoba"; banner "Resumen IA" púrpura PREMIUM; 3 secciones stagger reveal 280ms cada una (Qué pasa con icon AlertCircle warn / Qué hacer con icon Wrench brand / Urgencia con icon Clock + chip "Hoy"/"Esta semana"/"Cuando puedas"); CTA secundario "Buscar talleres cerca"
- **UX-DR49:** Construir `<AddMaintenanceSheet>` — bottom sheet quick-capture (FAB-triggered): handle 36×4px gris + header "Nuevo registro" + tipo grid 3×2 con icons Lucide (Aceite=Droplet, Filtros=Filter, Neumáticos=CircleDot, Frenos=Octagon, Service=Wrench, Otro=Sparkles) con last-used preselected en AsyncStorage + KM auto-completado del vehicle activo (mono numeric, editable) + Costo opcional (mono prefix $) + Notas opcional (textarea 3 rows) + sticky footer "Guardar registro" disabled hasta tipo+KM válidos
- **UX-DR50:** Construir `<ProfileMenuSheet>` — sheet con user card (avatar grande + nombre + role chip color-coded CLIENT brand-blue / BUSINESS metallic-silver) + toggle pill SegmentedControl "Cliente / Negocio" + settings rows (Apariencia, Cuenta, Dispositivos OBD2, Cerrar sesión); switch role actualiza Zustand activeRole + AsyncStorage + navigation rebuild
- **UX-DR51:** Construir `<PaywallSheet>` — sheet Free → Premium SIN dark patterns: hero icon 60×60 premium gradient + title + sub + 3 bullets value prop (Vehículos ilimitados / El Negro IA / IA sugiere mantenimientos) + pricing card "$9.99/mes · 7 días gratis · Cancelá cuando quieras" + CTA primary "Empezar gratis" + CTA ghost "Quizás más tarde" (NO countdown, NO FOMO, NO guilt, NO hidden cost)

**Wise Calm Direction Implementation:**
- **UX-DR52:** Refactor `Dashboard` screen → estructura Wise Calm: greeting "Hola, {firstName}" + StatusHero dominante (dot + label uppercase + km hero 48px mono + sub-text factual) + sub-cards (VehicleStrip, LastDiagnosticCard, ReminderRow) + section labels uppercase letterspaced 11px muted entre secciones
- **UX-DR53:** Refactor `VehicleDetail` screen → SegmentedControl + Hero card con halo según status + tab content (Maintenance/OBD2/Tasks/Docs)
- **UX-DR54:** Refactor `OBD2Screen` → LiveBanner top + ArcGauge mix (RPM + Velocidad) + MiniGauge secundarios (Refrigerante, Batería) con toggle Pro Mode (+4 gauges) + DTC cards + AI button premium gradient
- **UX-DR55:** Refactor `Profile` screen → light/dark toggle + role switch via ProfileMenuSheet
- **UX-DR56:** Refactor `BottomNav` → 5 tabs con FAB central (cambio del spec original de 4 tabs)
- **UX-DR57:** Splash screen 600ms con logo Motora + brand color background `#3B82F6` sobre dark
- **UX-DR58:** App icon con badge nativo iOS/Android dot color cuando hay status warn/err (passive signaling, no pulse)

**UX Patterns — Status Signaling (Critical):**
- **UX-DR59:** Status NUNCA solo-color — 3 signals redundantes obligatorios: Color (dot/border/halo) + Label uppercase ("TODO EN ORDEN" / "ATENCIÓN" / "ACCIÓN REQUERIDA") + Halo gradient tinted (hero-only)
- **UX-DR60:** Pulsing dot (`dot-live` keyframe 1.6s scale 0.6→2.4 opacity 0.5→0) RESERVED for err state ONLY — no warn
- **UX-DR61:** Hero number coloring: default `text.heading`, err state `status.err`, ok/warn neutral (color va al dot+halo)

**UX Patterns — Animation Catalog:**
- **UX-DR62:** Implementar fade-up cascade (stagger 40ms entre elementos del Dashboard)
- **UX-DR63:** Implementar page-in (drill-down navigation): opacity 0→1 + translateX 12→0, 280ms premium
- **UX-DR64:** Implementar sheet-up (bottom sheet open): translateY 100%→0, 280ms premium; sheet-down: translateY 0→100%, 220ms standard
- **UX-DR65:** Implementar segmented pill (tab control): left + width 320ms smooth
- **UX-DR66:** Implementar gauge fill (telemetry update): stroke-dasharray 500-600ms ease
- **UX-DR67:** Implementar shimmer (Skeleton loading): linear-gradient sweep 1.6s infinite
- **UX-DR68:** Implementar scale-tap (card/button press): scale 0.995-0.98, 100ms instant
- **UX-DR69:** Restricciones globales: NO bouncy springs (damping ≥0.7), NO confetti/explosions/parallax, NO efectos sonoros, SÍ haptic feedback sutil en confirmaciones

**UX Patterns — Iconography:**
- **UX-DR70:** Library oficial: Lucide (`lucide-react-native` mobile, `lucide-react` web)
- **UX-DR71:** NO emojis en producción — reemplazar emojis del mockup AddMaintenanceSheet con icons Lucide específicos (Droplet, Filter, CircleDot, Octagon, Wrench, Sparkles)
- **UX-DR72:** Sizes estándar: 11-14px (chip), 15-18px (card leading), 20-22px (tab bar), 26-28px (hero), 56-72px (avatar)

**UX Patterns — Form & Feedback:**
- **UX-DR73:** Inline form validation con field highlight border + helper text muted (NO popup, NO scroll-jump)
- **UX-DR74:** Validation timing: real-time en blur (no onChange) + Submit-time (highlight all + scroll first error + haptic)
- **UX-DR75:** Toast feedback patterns: success silencioso (3s auto-dismiss + haptic light), error con action (5s o persistente con close X + haptic error), warning con action button, info 4s no haptic
- **UX-DR76:** Defaults inteligentes: last-used type, current vehicle.km, default Argentina, last-paired BT device

**UX Patterns — Confirmation:**
- **UX-DR77:** Confirmar SOLO destructive irreversible (delete vehicle/maintenance, logout, cancel subscription, delete account); NO confirmar create/edit/save (Banking-paranoia anti-pattern)
- **UX-DR78:** Delete account requiere double confirm (typing nombre user)

**UX Patterns — Empty States:**
- **UX-DR79:** Empty states con anatomía estándar: icon en círculo elevated + title (17px 600 "Aún no tenés…") + description body muted + primary CTA action-oriented; NO mascots/cartoons/emojis

**UX Patterns — Copy Tone:**
- **UX-DR80:** Voice cordobés/argentino auténtico: voseo ("Tenés", "Estás", "Vas a"), empático sin caricaturizar, action-oriented CTAs, factual no alarmista
- **UX-DR81:** Common phrases canonical: greeting "Hola, {firstName}", save "Listo"/"Guardado", error "Algo salió mal. Vamos a intentar de nuevo.", network "Sin conexión. Reintentá cuando vuelvas online.", empty "Aún no tenés {noun}"
- **UX-DR82:** Localization es-AR: vocabulario regional (patente, VTV, nafta, service), currency ARS con punto miles "$48.000", dates "12 abr 2026"/"Hace 2 días", KM "87.420 km"
- **UX-DR83:** Toda copy en `i18n/es-AR.json` (no hardcoded strings); Intl API para currency/dates; reserve 30-40% extra width en UI para multi-locale futuro

**Accessibility (WCAG 2.1 AA):**
- **UX-DR84:** Touch targets ≥44pt × 44pt (iOS HIG / Android Material); padding invisible si icon visualmente chico
- **UX-DR85:** Color contrast WCAG AA: body text ≥4.5:1, large text + UI elements ≥3:1; `text.dim` solo para metadata terciaria
- **UX-DR86:** Validar UI bajo simulaciones color blindness: Protanopia/Deuteranopia/Tritanopia/Monochromacy
- **UX-DR87:** Screen readers: `accessibilityRole` + `accessibilityLabel` + `accessibilityState` (disabled/busy/selected/expanded) en todos los elementos interactivos; iconos decorativos con `accessibilityElementsHidden={true}`
- **UX-DR88:** DTC codes leídos letra-letra: `accessibilityLabel="P, cero, tres, cero, uno"`
- **UX-DR89:** StatusHero composite label: "Estado del auto: {label}. {metric} {unit}. {subText}"
- **UX-DR90:** Toasts anunciados via `accessibilityLiveRegion="polite"` y `accessibilityRole="alert"`
- **UX-DR91:** Focus management: modal/sheet open → focus heading; close → focus trigger button; form submit error → focus first invalid field
- **UX-DR92:** Dynamic Type / Font Scaling: soporte hasta 200% (`allowFontScaling={true}` RN, `rem` web); containers flex-based, NO heights fijos
- **UX-DR93:** Reduced Motion: respetar `prefers-reduced-motion` (web) y `AccessibilityInfo.isReduceMotionEnabled()` (RN); fade-up → fade simple, page-in/sheet-up → snap, dot-live pulse → disable, gauge fill → snap
- **UX-DR94:** Web: `lang="es-AR"`, skip-link "Saltar al contenido principal", focus visible 2px brand outline, tab order matches visual order

**Responsive Design:**
- **UX-DR95:** Mobile-first MVP — single-column vertical scrolling; sticky elements (bottom nav, CTA footer, pull-to-refresh top); horizontal scroll SOLO secondary content; máximo 2 cols (MiniStat, telemetry gauges)
- **UX-DR96:** Mobile breakpoints: compact 320-374pt (typography reduce 1 step), standard 375-414pt (default), large 415-480pt (más padding lateral)
- **UX-DR97:** Web breakpoints (TailwindCSS): xs (<640) / sm (640-767) / md (768-1023) / lg (1024-1279) / xl (1280+) — admin primary target xl
- **UX-DR98:** Container max-widths: public landing 1200px / admin 1440px / forms 480px center
- **UX-DR99:** Tablet handling: best effort, no first-class target — layout mobile escala con flex + max-width
- **UX-DR100:** Safe areas: iOS useSafeAreaInsets() (top + home indicator), Android status bar bg.primary, tab bar bottom padding 22px (incluye home indicator iOS)

**Performance Targets (UX-driven):**
- **UX-DR101:** Time to Verdict (TTV) Dashboard: <2s P95 — non-negotiable, defining experience
- **UX-DR102:** Cold start Dashboard mount: <2.5s P95
- **UX-DR103:** OBD2 connection ELM327 → handshake: <5s P95
- **UX-DR104:** AI Diagnosis: first token <3s P95, full response <8s P95
- **UX-DR105:** Bundle size mobile <50MB; web admin <500KB initial JS
- **UX-DR106:** Web vitals: LCP <2.5s, FID <100ms, CLS <0.1

**Mockup Reference & Implementation Rules:**
- **UX-DR107:** Mockup interactivo `docs/mockup/Motora IA Prototype.html` con 4 directions (Wise Calm elegida) queda como referencia archivada — las otras 3 directions descartadas para producción
- **UX-DR108:** NUNCA copiar/pegar JSX del mockup directamente — reescribir en RN/web con primitives propios
- **UX-DR109:** SIEMPRE consumir tokens (`useTheme().colors.background.primary`, NO `'#0F172A'`)
- **UX-DR110:** NUNCA introducir nuevos directions o variants — Wise Calm es THE direction única producción

### FR Coverage Map

| FR | Epic | Brief Description |
|----|------|-------------------|
| FR1 | Epic 1 | Registro con email/Google/Apple |
| FR2 | Epic 1 | Login credentials u OAuth |
| FR3 | Epic 1 | Logout + limpiar cache |
| FR4 | Epic 1 | Recuperar contraseña vía email |
| FR5 | Epic 1 | Ver y editar perfil (nombre, email, foto) |
| FR6 | Epic 1 | Ver tipo suscripción y fecha renovación |
| FR7 | Epic 1 | Sesión persistente entre app restarts |
| FR8 | Epic 2 | Crear vehículo (marca/modelo/año/VIN/patente) |
| FR9 | Epic 2 | Editar datos vehículo |
| FR10 | Epic 2 | Eliminar vehículo |
| FR11 | Epic 2 | Free tier máximo 2 vehículos |
| FR12 | Epic 2 | Premium ilimitados vehículos |
| FR13 | Epic 2 | Listado de vehículos |
| FR14 | Epic 2 | Seleccionar vehículo activo |
| FR15 | Epic 3 | Registrar vencimiento (patente/seguro/ITV) |
| FR16 | Epic 3 | Crear tarea de mantenimiento |
| FR17 | Epic 3 | Marcar tarea como completada |
| FR18 | Epic 3 | Ver historial de mantenimientos |
| FR19 | Epic 3 | Recordatorio de vencimientos próximos (in-app) |
| FR20 | Epic 3 | Recordatorios personalizados |
| FR21 | Epic 4 | Buscar adaptadores Bluetooth |
| FR22 | Epic 4 | Emparejar adaptador OBD2 BT genérico |
| FR23 | Epic 4 | Desemparejar adaptador OBD2 |
| FR24 | Epic 4 | Iniciar lectura de diagnóstico OBD2 |
| FR25 | Epic 4 | Decodificar códigos OBD2 (P0300, P0134, etc.) |
| FR26 | Epic 4 | Valores tiempo real (RPM, temp, consumo) |
| FR27 | Epic 4 | Manejo de fallos de conexión con mensajes claros |
| FR28 | Epic 4 | Historial de lecturas OBD2 |
| FR29 | Epic 4 | Aceptación de términos antes de usar OBD2 |
| FR30 | Epic 5 | Premium solicita análisis IA de diagnóstico |
| FR31 | Epic 5 | Enviar datos OBD2 + contexto vehículo a IA |
| FR32 | Epic 5 | IA retorna análisis (problema, urgencia, costo) |
| FR33 | Epic 5 | Historial de análisis IA |
| FR34 | Epic 5 | Free obtiene 1 análisis IA gratis (trial) |
| FR35 | Epic 5 | Mostrar costo IA usage al admin |
| FR36 | Epic 6 | Ver opciones de suscripción (free/premium) |
| FR37 | Epic 6 | Free ve paywall (3er vehículo o IA) |
| FR38 | Epic 6 | Comprar suscripción premium vía Mercado Pago |
| FR39 | Epic 6 | Sincronizar estado de suscripción |
| FR40 | Epic 6 | Confirmación de pago vía email |
| FR41 | Epic 6 | Cancelar suscripción en cualquier momento |
| FR42 | Epic 6 | Revocar acceso premium si suscripción caduca |
| FR43 | Epic 8 | Crear perfil de negocio (nombre/servicios/ubicación) |
| FR44 | Epic 8 | Editar servicios ofrecidos |
| FR45 | Epic 8 | Ver lista de clientes conectados |
| FR46 | Epic 8 | Buscar businesses por geolocalización (mapa) |
| FR47 | Epic 8 | Ver perfil business (servicios, ubicación, contacto) |
| FR48 | Epic 8 | Business aparece en resultados de búsqueda |
| FR49 | Epic 8 | Enviar consulta/solicitud de turno a business |
| FR50 | Epic 8 | Business recibe notificación de nueva consulta |
| FR51 | Epic 8 | Business acepta/rechaza solicitud |
| FR52 | Epic 8 | Confirmación a usuario cuando business acepta |
| FR53 | Epic 8 | Historial de turnos/consultas |
| FR54 | Epic 8 | Business envía mensaje a cliente |
| FR55 | Epic 9 | Admin dashboard con KPIs (MAU, conversión, businesses) |
| FR56 | Epic 9 | Admin filtra usuarios por tipo |
| FR57 | Epic 9 | Admin visualiza logs de IA usage |
| FR58 | Epic 9 | Admin crea business manualmente |
| FR59 | Epic 9 | Admin edita perfil de usuario (support) |
| FR60 | Epic 9 | Admin activa/desactiva suscripción |
| FR61 | Epic 9 | Admin ve métricas de ingresos |
| FR62 | Epic 7 | Email de confirmación de registro |
| FR63 | Epic 7 | Email de recordatorio de vencimiento |
| FR64 | Epic 7 | SMS de alerta (OBD2 crítico, mantenimiento urgente) |
| FR65 | Epic 7 | Notificaciones push en mobile |
| FR66 | Epic 7 | Desuscribirse de notificaciones específicas |
| FR67 | Epic 9 | Web landing — value proposition |
| FR68 | Epic 9 | Web — explainer OBD2 + IA |
| FR69 | Epic 9 | Web — links de descarga (App Store, Google Play) |
| FR70 | Epic 9 | Web — términos y condiciones |
| FR71 | Epic 9 | Web — política de privacidad |
| FR72 | Epic 1 | Multi-tenancy aislamiento de datos |
| FR73 | Epic 8 | Business ve solo datos de clientes que compartieron |
| FR74 | Epic 9 | Admin ve datos agregados (no individuales) |
| FR75 | Epic 1 | Encripta datos en tránsito (HTTPS) |
| FR76 | Epic 1 | Validación de permisos antes de operaciones |

**Coverage Total:** 76/76 FRs ✅ — sin omisiones.

## Epic List

### Epic 1: Foundation & Authentication

Establecer la base arquitectónica del producto (monorepo + design tokens + primitives + Firestore Security Rules + CI/CD) entregando un sistema de autenticación completo donde usuarios pueden registrarse con email/Google/Apple, iniciar sesión, gestionar su perfil, y mantener sesión persistente entre app restarts — todo dentro de un sistema multi-tenant aislado por usuario y comunicado por HTTPS.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR72, FR75, FR76

**User outcome:** Usuario puede crear cuenta, autenticarse, gestionar perfil y confiar que sus datos están aislados y seguros.

**Standalone:** ✅ Sistema de auth completo + foundation técnica que habilita todos los epics siguientes sin requerir ninguno futuro.

---

### Epic 2: Mi Garage — Vehicles & 2-Second Verdict Dashboard

Permitir a los usuarios completar onboarding rápido (primer vehículo en <90s), gestionar sus vehículos respetando límite free (2) o premium (ilimitados), y experimentar el "2-Second Verdict" — abrir la app y saber en 2 segundos el estado de su auto vía Wise Calm Dashboard con StatusHero dominante.

**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14

**User outcome:** Usuario puede registrar/editar/eliminar vehículos, seleccionar uno activo, y obtener verdict instantáneo del estado al abrir la app.

**Standalone:** ✅ Garage + Dashboard funcionales sin OBD2 ni IA. Depende solo de Epic 1 (auth).

---

### Epic 3: Mantenimiento, Tareas & Recordatorios In-App

Habilitar a los usuarios a llevar control completo del mantenimiento de sus vehículos: registrar mantenimientos en <30s con Quick Capture (FAB central), trackear vencimientos (patente/seguro/ITV), crear y completar tareas, ver historial timeline completo y recibir recordatorios in-app de vencimientos próximos.

**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20

**User outcome:** Usuario puede registrar mantenimientos sin fricción, ver historia clínica del vehículo y no olvidar vencimientos.

**Standalone:** ✅ Maintenance workflow completo sin OBD2 ni IA ni notifications externas. Depende de Epic 2 (vehículos existen).

---

### Epic 4: OBD2 Live Diagnostics

Permitir a los usuarios conectar adaptadores OBD2 Bluetooth genéricos (ELM327 compatible), ver telemetría en tiempo real (RPM, velocidad, temperatura, batería), escanear y decodificar códigos DTC, y consultar historial de lecturas — con consentimiento explícito y manejo robusto de fallos hardware.

**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29

**User outcome:** Usuario puede conectar OBD2, ver métricas live de su auto, y obtener códigos de error decodificados (interpretación raw sin IA).

**Standalone:** ✅ OBD2 funciona independiente con interpretación raw + historial. Depende de Epic 2 (vehículo activo). NO requiere Epic 5 (IA).

---

### Epic 5: AI Premium — El Negro Diagnostics

Entregar a usuarios premium diagnósticos IA empáticos en argentino claro mediante la persona "El Negro" (Mecánico IA · Córdoba): cada análisis explica qué pasa, qué hacer y urgencia, basado en datos OBD2 + contexto del vehículo. Free tier obtiene 1 análisis trial. Admin puede monitorear costos y rate limits.

**FRs covered:** FR30, FR31, FR32, FR33, FR34, FR35

**User outcome:** Usuario premium recibe interpretación humana de códigos OBD2 con acción clara; admin controla costos IA.

**Standalone:** ✅ AI features funcionan independientemente; potencian Epic 4 pero Epic 4 entrega valor sin IA. Depende de Epic 4 (datos OBD2 existen) + Epic 6 (gating premium).

---

### Epic 6: Subscriptions, Premium Gating & Mercado Pago Paywall

Implementar el sistema de suscripciones Premium ($9.99/mes) con paywall transparente (NO dark patterns, 7 días gratis upfront, copy honesto), integración Mercado Pago con webhooks IPN, sincronización en tiempo real del estado de suscripción y revocación automática si caduca. Paywall se dispara en 4 puntos: 3er vehículo, IA analysis, IA task suggestions, push reminders.

**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR41, FR42

**User outcome:** Usuario free ve paywall justificado, puede suscribirse fácil con trial, premium accede a features gateadas; cancelación inmediata sin fricción.

**Standalone:** ✅ Billing system completo. Las features que gatea (Epic 2 vehículos, Epic 5 IA, Epic 7 push) ya existen y funcionan en free con sus límites; este epic agrega la capa de upgrade.

---

### Epic 7: Notifications — Push, Email & SMS

Construir el sistema multi-canal de notificaciones que envía email de confirmación de registro, recordatorios de vencimientos por email, alertas SMS críticas (OBD2/mantenimiento urgente), notificaciones push en mobile, con opción del usuario para desuscribirse de canales específicos. Incluye retry logic e infraestructura SendGrid + Twilio + FCM.

**FRs covered:** FR62, FR63, FR64, FR65, FR66

**User outcome:** Usuario recibe alertas relevantes en el canal apropiado, sin spam, con opción de control granular.

**Standalone:** ✅ Sistema de notifications independiente. Cross-cuts Epic 3 (vencimientos), Epic 4 (alertas críticas), Epic 6 (payment confirmation), Epic 8 (booking notifications) — pero el infrastructure es propio y reutilizable.

---

### Epic 8: Business Side — Profiles, Geo Discovery, Bookings & Role Switch

Habilitar el ecosistema B2B: talleres/mecánicos pueden crear perfil de negocio con servicios y ubicación geográfica; usuarios pueden buscar businesses cercanos en mapa, ver perfil completo, solicitar turnos y comunicarse vía mensajería. Adicionalmente, usuarios con dual role (Carlos persona) pueden alternar CLIENT↔BUSINESS sin re-login mediante ProfileMenuSheet, con UI adaptada (tabs "Clientes"/"Solicitudes").

**FRs covered:** FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR73

**User outcome:** Talleres aparecen en plataforma y reciben turnos; usuarios encuentran y agendan; Carlos persona maneja ambos roles fluidamente.

**Standalone:** ✅ Ecosistema business completo (perfiles + discovery + bookings + role switch). Depende de Epic 1 (auth) + integración con Epic 7 (notificaciones de booking).

---

### Epic 9: Web Platform — Admin Backoffice & Public Landing

Construir la plataforma web con dos módulos: (1) Admin backoffice con Vite React + TanStack Router para que Dario monitoree KPIs (MAU, conversión, businesses, IA costs), gestione suscripciones, revise logs IA y edite usuarios/businesses; (2) Public landing con value proposition, explainer OBD2+IA, links de descarga a App Store/Google Play, términos y privacidad.

**FRs covered:** FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR67, FR68, FR69, FR70, FR71, FR74

**User outcome:** Admin tiene visibilidad operacional completa; visitantes descubren el producto y descargan la app.

**Standalone:** ✅ Web platform independiente del mobile (stack propio). Depende de Epic 1 (auth compartido) y consume datos generados por Epics 2-8 sin requerirlos para deployar.

---

## Epic 1: Foundation & Authentication

Establecer la base arquitectónica del producto (monorepo + design tokens + primitives + Firestore Security Rules + CI/CD) entregando un sistema de autenticación completo donde usuarios pueden registrarse con email/Google/Apple, iniciar sesión, gestionar su perfil, y mantener sesión persistente entre app restarts — todo dentro de un sistema multi-tenant aislado por usuario y comunicado por HTTPS.

### Story 1.1: Project Foundation & Welcome Screen

As a new user opening the app for the first time,
I want to see a branded welcome screen that loads quickly with a clear "Empezar" call to action,
So that I trust this is a professional product and know how to begin.

**Acceptance Criteria:**

**Given** the monorepo is initialized
**When** developer runs `pnpm install` at root
**Then** pnpm workspaces resolve packages/types, packages/scripts, packages/design-tokens, mobile, web, functions correctly
**And** root-level configs exist: package.json (workspaces), pnpm-workspace.yaml, tsconfig.base.json, biome.json, firebase.json, .firebaserc

**Given** I open the app on cold start
**When** the splash screen renders
**Then** I see the Motora logo over `brand.primary` background for ~600ms before transitioning to the welcome screen
**And** the splash respects safe areas (top inset + home indicator)

**Given** the welcome screen has rendered
**When** I read the screen
**Then** I see logo + tagline + primary CTA "Empezar" + ghost CTA "Ya tengo cuenta"
**And** entry uses fade-up cascade (stagger 40ms) honoring `prefers-reduced-motion`

**Given** fonts are integrated
**When** any text renders
**Then** Inter is used for sans-serif copy and JetBrains Mono is available for technical data, both loaded via `expo-google-fonts/inter` + `expo-google-fonts/jetbrains-mono` with weights 400/500/600/700

**Given** the design tokens package exists
**When** I inspect any styled element in the welcome flow
**Then** no hex literals appear in component files — all colors come from `useTheme().colors.*` or NativeWind classes resolving from tokens
**And** `packages/design-tokens/` exports `colors.dark`, `colors.light`, `typography`, `spacing`, `radii`, `animations`

**Given** the foundation primitives are built
**When** developers consume them
**Then** `<Box>`, `<Stack>`, `<Text>`, `<Card>`, `<Hairline>`, `<Halo>`, `<Avatar>`, `<Skeleton>`, `<EmptyState>`, `<FadeUp>`, `<PageTransition>` are exported from `mobile/src/shared/components/primitives/`
**And** hooks `useTheme()`, `useReducedMotion()`, `useHaptics()` are available from `mobile/src/shared/hooks/`

**Given** dark theme is the default
**When** I open the app
**Then** the welcome screen renders in dark theme tokens
**And** light theme tokens are also defined and switching works (toggle UI lands in Story 1.5)

**Given** the scaffolding script exists in `packages/scripts/`
**When** developer runs `pnpm run generate:feature --name=test --type=CRUD`
**Then** Controllers/Services/Models templates are generated under functions/src/ following the documented pattern with co-located tests

**Given** CI/CD pipelines exist in `.github/workflows/`
**When** a PR is opened
**Then** lint (biome) + unit tests run automatically and block merge on failure

---

### Story 1.2: User Registration (email, Google, Apple)

As a new user who tapped "Empezar" on the welcome screen,
I want to create an account using email/password, Google, or Apple Sign-In,
So that I can start using the app with my preferred authentication method.

**Acceptance Criteria:**

**Given** I tap "Empezar" on the welcome screen
**When** the registration screen loads
**Then** I see fields for email + password (≥8 chars) plus SSO buttons "Continuar con Google" and "Continuar con Apple"
**And** copy follows es-AR voseo ("Creá tu cuenta", "Continuar con…")

**Given** I enter a valid email and password ≥8 chars
**When** I tap "Crear cuenta"
**Then** a Firebase Auth user is created
**And** the `onUserCreated` trigger creates a Firestore doc `users/{uid}` with `{ email, displayName, photoURL, country: "AR", subscriptionTier: "FREE", createdAt: Timestamp.now() }`
**And** I am navigated to onboarding flow (delivered in Epic 2 — Story 2.1)

**Given** Google Sign-In is integrated
**When** I tap "Continuar con Google" and select my Google account
**Then** a Firebase Auth user with provider "google.com" is created
**And** the same `onUserCreated` trigger runs hydrating displayName + photoURL from Google profile

**Given** Apple Sign-In is integrated
**When** I tap "Continuar con Apple" on iOS and authorize
**Then** a Firebase Auth user with provider "apple.com" is created
**And** on Android the Apple button is hidden (graceful platform-aware UI)

**Given** I enter an email already in use
**When** I tap "Crear cuenta"
**Then** I see inline message "Esta cuenta ya existe. ¿Querés iniciar sesión?" with switch-to-login button
**And** password input is preserved (form state retained)

**Given** the device is offline
**When** I attempt registration
**Then** I see toast "Sin conexión. Reintentá." with retry button
**And** form state is preserved (no data loss)

**Given** email format is invalid or password <8 chars
**When** I tap "Crear cuenta"
**Then** validation errors appear inline (border `status.err` + helper text muted) on offending field(s)
**And** submit button stays disabled, no network request fires, haptic error fires

**Given** backend creates a user
**When** I inspect Firestore
**Then** `users/{uid}` is readable/writable ONLY by that uid (Security Rules Layer 2 — ownership)
**And** createdAt is a Firestore Timestamp (storage convention)

---

### Story 1.3: User Login & Session Persistence

As a returning user,
I want to log in with my credentials or OAuth provider and have my session persist between app restarts,
So that I don't have to re-authenticate every time I open the app.

**Acceptance Criteria:**

**Given** I have an existing account
**When** I open login screen and enter valid credentials and tap "Iniciar sesión"
**Then** Firebase Auth signs me in
**And** my session token persists in iOS Keychain / Android Keystore via Secure Storage
**And** I am navigated to Dashboard

**Given** I use Google or Apple SSO on login screen
**When** OAuth flow completes
**Then** session is persisted equivalently and I land on Dashboard

**Given** I enter wrong credentials
**When** I tap "Iniciar sesión"
**Then** I see toast "Email o contraseña incorrectos" (no enumeration of which field failed)
**And** password input is cleared, email is preserved

**Given** I close the app fully and reopen it
**When** the splash screen loads
**Then** session is restored automatically from Secure Storage
**And** I bypass the login screen
**And** Dashboard renders within TTV target <2s P95

**Given** my session has expired (>30 days inactive)
**When** the app reopens
**Then** a silent refresh attempt runs first
**And** if refresh fails, soft logout occurs with toast "Tu sesión expiró. Iniciá sesión de nuevo." and the login screen shows

**Given** I am on the login screen
**When** I tap "¿Olvidaste tu contraseña?"
**Then** I navigate to password reset flow (Story 1.4)

**Given** I am on the login screen
**When** I tap "Crear cuenta"
**Then** I navigate to registration screen (Story 1.2) preserving entered email if any

**Given** Zustand `useAuthStore` exists
**When** login completes
**Then** `useAuthStore.user` is populated
**And** AsyncStorage key `motora.auth` reflects authenticated state for cold-start hydration

---

### Story 1.4: Password Reset via Email

As a user who forgot my password,
I want to request a password reset email and set a new password,
So that I can regain access to my account without contacting support.

**Acceptance Criteria:**

**Given** I tap "¿Olvidaste tu contraseña?" on the login screen
**When** the reset screen loads
**Then** I see a single email input + primary CTA "Enviar enlace"
**And** a back chevron returns me to login preserving form state

**Given** I enter a valid email and tap "Enviar enlace"
**When** Firebase Auth processes the request
**Then** a password reset email is sent
**And** I see success toast "Te enviamos un mail con el link para resetear tu contraseña"

**Given** I enter an email that doesn't exist
**When** I tap "Enviar enlace"
**Then** the same success toast appears (no account enumeration for security)

**Given** the email link arrives in my inbox
**When** I tap it on my device
**Then** a Firebase-hosted reset page opens accepting new password ≥8 chars
**And** on success I can return to the app and login with the new password

**Given** the device is offline when I tap "Enviar enlace"
**When** the request fires
**Then** I see toast "Sin conexión. Reintentá." with retry button
**And** the email field state is preserved

---

### Story 1.5: User Profile View & Edit

As an authenticated user,
I want to view and edit my profile (name, email, photo) and see my current subscription tier and renewal date plus toggle dark/light theme,
So that I have control over my personal information and visibility into my plan.

**Acceptance Criteria:**

**Given** I am logged in and tap the avatar in the top-right header
**When** ProfileMenuSheet opens
**Then** I see my avatar + name + role chip (CLIENT default) + settings rows: "Apariencia", "Cuenta", "Cerrar sesión"

**Given** I tap "Cuenta" in ProfileMenuSheet
**When** the profile edit screen loads
**Then** I see editable fields (displayName, photoURL via image picker) and read-only fields (email, subscriptionTier badge, renewal date if PREMIUM)

**Given** I edit displayName and tap "Guardar"
**When** the mutation completes
**Then** `users/{uid}` updates in Firestore (immutable update)
**And** toast "Listo" appears with haptic light impact
**And** the new name reflects immediately in the header avatar (optimistic UI via TanStack Query)

**Given** I tap photo to change it
**When** the image picker resolves
**Then** the image uploads to Firebase Storage path `gs://bucket/users/{uid}/avatar.jpg`
**And** photoURL updates in user doc
**And** avatar refreshes in header

**Given** I am FREE tier
**When** profile screen renders
**Then** I see badge "FREE" and CTA "Mejorá a Premium" (links to PaywallSheet — gating delivered in Epic 6)

**Given** I am PREMIUM tier
**When** profile screen renders
**Then** I see badge "PREMIUM" with renewal date formatted "Renovación: 12 may 2026" using es-AR Intl

**Given** I tap "Apariencia" in ProfileMenuSheet
**When** the appearance screen loads
**Then** I see toggle for dark/light theme
**And** toggling persists choice to AsyncStorage `motora.theme` and applies tokens immediately app-wide

**Given** I rotate the screen or change Dynamic Type to 200%
**When** profile renders
**Then** no text truncates and layout flexes appropriately (containers flex-based, no fixed heights)

---

### Story 1.6: Logout & Session Cleanup

As a logged-in user who wants to securely sign out,
I want a logout option that clears all my data from the device,
So that my account is not accessible to others using my device.

**Acceptance Criteria:**

**Given** I am in ProfileMenuSheet
**When** I tap "Cerrar sesión"
**Then** ConfirmationModal appears with title "¿Cerrar sesión?" + description "Vas a tener que volver a iniciar sesión para ver tus datos" + Cancel ghost + Confirm destructive

**Given** I tap Confirm in the logout modal
**When** logout action runs
**Then** Firebase Auth signs out
**And** Zustand stores reset (`useAuthStore`, `useVehicleStore`, `useDiagnosticStore`)
**And** TanStack Query cache is cleared via `queryClient.clear()`
**And** AsyncStorage keys under namespace `motora.*` are removed (auth, theme, activeRole, lastPairedBT)

**Given** logout completes
**When** navigation processes
**Then** the app redirects to the login screen
**And** the welcome experience is preserved for next login (no stale data leaks)

**Given** I tap Cancel in the logout modal
**When** the modal closes
**Then** no state changes occur
**And** I return to ProfileMenuSheet

**Given** I am offline
**When** I tap logout
**Then** logout still proceeds locally (clear stores/cache/AsyncStorage)
**And** server signout queues until online (acceptable failure mode for local cleanup)

---

### Story 1.7: Multi-Tenant Security Rules & Permission Validation

As the platform owner,
I want Firestore Security Rules and backend Cloud Functions to enforce strict multi-tenant isolation with defense in depth,
So that no user can ever access another user's data without explicit authorization.

**Acceptance Criteria:**

**Given** firestore.rules exists at repo root
**When** the emulator runs and authenticated user A attempts to read `users/{uidB}/vehicles`
**Then** Rules deny the read (Layer 2 ownership check `request.auth.uid == uid`)

**Given** Layer 1 (tier) is enabled in rules
**When** a FREE user attempts to create a 3rd vehicle via direct Firestore write (bypassing UI)
**Then** Rules deny the create with predicate `getUserTier(uid) == "PREMIUM" || countUserVehicles(uid) < 2`
**And** the operation throws "permission-denied"

**Given** Layer 3 (role) is enabled in rules
**When** a non-business user attempts to write to `businesses/{bid}`
**Then** Rules deny the write
**And** business owners (uid in `resource.data.owner`) can write their own business

**Given** backend Cloud Functions exist
**When** any callable function runs
**Then** `request.auth.uid` is asserted via `assertAuth()` helper from `functions/src/shared/auth.ts` before any service call
**And** unauthenticated calls throw `HttpsError("unauthenticated", "Iniciá sesión para continuar")`

**Given** Zod validation is integrated
**When** a callable receives input
**Then** the corresponding Zod schema (from `packages/types/`) validates payload
**And** invalid input throws `HttpsError("invalid-argument", "<Spanish message>", { details: { fields } })`

**Given** the test suite for Rules exists
**When** CI runs
**Then** a Jest suite hits the Firestore emulator and verifies allow/deny matrix for: own data read/write (allow), others' data read/write (deny), tier limits, role boundaries, super-admin bypass — minimum 15 test cases

**Given** HTTPS enforcement is in place
**When** any Cloud Function is invoked
**Then** only TLS 1.2+ connections succeed (no plain HTTP)

**Given** structured logging is set up via `functions/src/shared/logger.ts`
**When** an IA call or destructive operation occurs
**Then** Cloud Logging receives an entry `{ uid, action, timestamp, details }` for audit purposes

---

## Epic 2: Mi Garage — Vehicles & 2-Second Verdict Dashboard

Permitir a los usuarios completar onboarding rápido (primer vehículo en <90s), gestionar sus vehículos respetando límite free (2) o premium (ilimitados), y experimentar el "2-Second Verdict" — abrir la app y saber en 2 segundos el estado de su auto vía Wise Calm Dashboard con StatusHero dominante.

### Story 2.1: First Vehicle Onboarding (3-step flow)

As a newly registered user,
I want to add my first vehicle through a guided 3-step flow that completes in under 90 seconds,
So that I can start using Motora without friction and get immediate value.

**Acceptance Criteria:**

**Given** I just completed registration (Story 1.2)
**When** I am redirected to onboarding
**Then** I see Step 1/3 "Tu nombre + país" with name pre-filled from auth provider if available + country dropdown defaulting to Argentina

**Given** I am on Step 1
**When** I complete name + country and tap "Continuar"
**Then** I advance to Step 2/3 "Agregar primer vehículo" with fields: Marca (search dropdown), Modelo (filtered by brand), Año (year picker 1990-current)
**And** progress indicator shows "Paso 2 de 3"

**Given** I am on Step 2 with valid brand+model+year
**When** I tap "Continuar"
**Then** I advance to Step 3/3 "Patente + KM actual" with patente input (regex AR `XX 123 XX` or `ABC123`) + KM numeric input

**Given** I am on Step 3 with optional VIN field
**When** I skip VIN
**Then** flow proceeds without error (VIN is optional)
**And** if I attempt VIN decode and it fails, I see toast "No pudimos leer el VIN. Completá manual" + skip to manual fields

**Given** I complete all 3 steps
**When** I tap "Listo"
**Then** vehicle is created in Firestore at `users/{uid}/vehicles/{vehicleId}` with `{ brand, model, year, plate, km, vin?, createdAt: Timestamp }`
**And** toast "¡Listo, {firstName}!" appears
**And** I am navigated to Dashboard with this vehicle as `activeVehicleId`

**Given** I tap back arrow at any step
**When** navigation processes
**Then** I return to previous step preserving form state (no data loss)

**Given** total time from welcome to Dashboard
**When** measured P50
**Then** it is under 90 seconds for happy path (validation post-launch via instrumentation)

**Given** patente format is invalid
**When** I attempt to advance from Step 3
**Then** inline error highlights field with helper "Formato AR: XX 123 XX o ABC123"
**And** Continue button stays disabled

---

### Story 2.2: Vehicle CRUD (create, edit, delete)

As a logged-in user,
I want to create additional vehicles, edit any vehicle's data, and delete vehicles I no longer own,
So that my garage reflects my real-world vehicle ownership over time.

**Acceptance Criteria:**

**Given** I am on the Vehicles tab and tap "+" or "Agregar vehículo"
**When** the new-vehicle screen loads
**Then** I see the same form as onboarding Step 2+3 (brand/model/year/plate/km/optional VIN) with no pre-filled values

**Given** I complete the form and tap "Guardar"
**When** the mutation runs
**Then** a new doc is created at `users/{uid}/vehicles/{vehicleId}`
**And** toast "Vehículo agregado" appears
**And** the vehicle list refreshes via TanStack Query invalidation `["vehicles", userId]`

**Given** I tap a vehicle card and then tap "Editar"
**When** EditFormModal opens
**Then** I see pre-filled fields and can edit any field (brand/model/year/plate/km/VIN)

**Given** I edit and tap "Guardar"
**When** mutation runs
**Then** Firestore doc updates with immutable patterns
**And** toast "Listo" appears
**And** vehicle card refreshes optimistically

**Given** I tap "Eliminar" on a vehicle
**When** ConfirmationModal appears
**Then** I see title "¿Eliminar este vehículo?" + description "Esta acción no se puede deshacer y borra todo el historial asociado"

**Given** I tap Confirm to delete
**When** mutation runs
**Then** the vehicle doc is deleted along with subcollections (maintenance, tasks, obd2 readings) via Cloud Function `deleteVehicle` cascade
**And** toast "Eliminado" appears
**And** if this was the active vehicle, another vehicle becomes active automatically

**Given** I attempt to delete the only remaining vehicle
**When** I tap Confirm
**Then** the vehicle is deleted and the user lands on an EmptyState screen with CTA "Agregar vehículo"

**Given** I am offline when attempting any vehicle CRUD
**When** the mutation fires
**Then** I see toast "Sin conexión. Probá cuando vuelvas online" with retry option
**And** form state is preserved

---

### Story 2.3: Vehicle List & Active Vehicle Selection

As a user with one or more vehicles,
I want to view a list of all my vehicles and select one as "active" for diagnostics and quick capture,
So that the app knows which vehicle context to use across features.

**Acceptance Criteria:**

**Given** I tap the Vehicles tab in BottomNavWithFab
**When** the screen loads
**Then** I see a list of all my vehicles as cards (VehicleStrip pattern: icon + brand+model + plate+km + chevron)
**And** the currently active vehicle has a visual indicator (border `brand.line` or chip "ACTIVO")

**Given** I have 0 vehicles
**When** the screen loads
**Then** I see EmptyState with icon Car + title "Aún no tenés vehículos" + CTA "Agregar vehículo"

**Given** I tap a vehicle card
**When** drill-down navigates with page-in animation
**Then** I land on Vehicle Detail screen for that vehicle (delivered fully in Epic 3)

**Given** I long-press a vehicle card
**When** the action menu appears
**Then** I see options "Marcar como activo" + "Editar" + "Eliminar"

**Given** I tap "Marcar como activo"
**When** the action runs
**Then** Zustand `useVehicleStore.activeVehicleId` updates
**And** AsyncStorage `motora.activeVehicleId` persists
**And** toast "Vehículo activo: {brand} {model}" appears
**And** Dashboard StatusHero refreshes context

**Given** I have only 1 vehicle
**When** the list renders
**Then** that vehicle is automatically the active vehicle (no manual selection needed)

**Given** the list is loading
**When** data is fetching
**Then** Skeleton placeholders render (max 300ms before content) — never a generic centered spinner

---

### Story 2.4: Wise Calm Dashboard — StatusHero & 2-Second Verdict ⭐ DEFINING

As any user (Pablo, Mariana, or Carlos persona),
I want to open the app and see the status of my active vehicle in under 2 seconds via a dominant StatusHero card,
So that I can decide in <5s whether I need to take action or close the app with peace of mind.

**Acceptance Criteria:**

**Given** I am authenticated with at least 1 vehicle
**When** I tap the app icon (cold start) or foreground (warm start)
**Then** the Dashboard renders StatusHero within Time-to-Verdict <2s P95
**And** the Status Hero shows: dot color (ok/warn/err) + label uppercase ("TODO EN ORDEN" / "ATENCIÓN" / "ACCIÓN REQUERIDA") + km hero number 48px JetBrains Mono + sub-text contextual ("VW Golf · próximo service en 2.580 km")

**Given** the data is fresh in TanStack Query cache (<5min staleTime)
**When** Dashboard renders
**Then** content renders instant from cache (no skeleton flash)

**Given** the data is stale or missing (cold start)
**When** Dashboard mounts
**Then** Skeleton shimmer renders for ≤300ms followed by fade-up cascade reveal (greeting 0ms, status hero 40ms, sub-cards 80/120/160ms)

**Given** status is "ok"
**When** the StatusHero renders
**Then** dot + label use `status.ok` color, halo gradient is sutil opacity 0.18, no pulse, hero number uses `text.heading`

**Given** status is "warn"
**When** the StatusHero renders
**Then** dot + label use `status.warn` color, halo opacity 0.5, no pulse, hero number stays neutral

**Given** status is "err"
**When** the StatusHero renders
**Then** dot pulses (`dot-live` keyframe 1.6s), label "ACCIÓN REQUERIDA" appears, halo opacity 0.7, hero number uses `status.err`
**And** the StatusHero card itself is tappable (atajo to Diagnóstico tab with auto-scan)

**Given** status signaling is multi-redundant
**When** I view the StatusHero
**Then** color is NEVER the only signal — label uppercase + halo + (pulse for err) provide 3 redundant cues for accessibility

**Given** I have prefers-reduced-motion enabled
**When** Dashboard renders
**Then** fade-up cascade degrades to fade-only, dot-live pulse disables, gauge fills snap to value

**Given** screen reader is enabled (VoiceOver/TalkBack)
**When** focus reaches StatusHero
**Then** composite label is announced: "Estado del auto: {label}. {km} kilómetros. {subText}"

**Given** I pull-to-refresh at top of Dashboard
**When** the gesture completes
**Then** all queries refetch and fade-up cascade replays
**And** light haptic impact fires

**Given** I am in offline mode
**When** Dashboard renders
**Then** cached data shows + sutil top banner "Sin conexión · datos del {date}" appears + pull-to-refresh is disabled

---

### Story 2.5: Dashboard Sub-Cards (VehicleStrip, LastDiagnostic, ReminderRow)

As a user viewing the Dashboard,
I want supporting context cards below the StatusHero showing my active vehicle, last OBD2 diagnostic, and upcoming vencimientos,
So that I can drill down into any specific area I want to explore.

**Acceptance Criteria:**

**Given** I have an active vehicle
**When** Dashboard renders below StatusHero
**Then** a section labeled "VEHÍCULO ACTIVO" (uppercase 11px muted letterspaced 0.12em) shows VehicleStrip card with icon Car + brand+model + plate (mono) + km (mono) + chevron

**Given** there is at least one OBD2 reading in history
**When** Dashboard renders
**Then** section "DIAGNÓSTICO" shows LastDiagnosticCard with date, dot status, count of DTCs found (chips), and chevron

**Given** there are no OBD2 readings yet
**When** Dashboard renders
**Then** the diagnóstico section shows EmptyState mini-card with copy "Aún no escaneaste tu auto" + CTA "Empezar diagnóstico"

**Given** I have vencimientos within 30 days
**When** Dashboard renders
**Then** section "PRÓXIMOS VENCIMIENTOS" shows a list of ReminderRow items with hairline dividers between, each showing icon + label (Patente/Seguro/VTV/Service) + days remaining mono + dot color (warn if <7 days, err if vencido)

**Given** there are no upcoming vencimientos
**When** Dashboard renders
**Then** the vencimientos section is hidden (no empty placeholder cluttering the verdict)

**Given** I tap VehicleStrip
**When** drill-down navigates
**Then** I land on Vehicle Detail screen for the active vehicle (page-in animation 280ms)

**Given** I tap LastDiagnosticCard
**When** drill-down navigates
**Then** I land on the OBD2 history detail for that reading

**Given** I tap a ReminderRow
**When** drill-down navigates
**Then** I land on Vehicle Detail → Mantenimiento tab with the relevant vencimiento highlighted

**Given** all sub-cards render
**When** I scroll the Dashboard
**Then** the verdict (StatusHero) stays at the top and sub-cards flow naturally below in a single column with consistent margins (16 horizontal, 12 between cards)

---

### Story 2.6: BottomNavWithFab — 5 tabs + central FAB

As a user navigating the app,
I want a persistent bottom navigation with 5 tabs and a prominent FAB in the center for quick maintenance entry,
So that I can move between core areas and capture mantenimientos with minimal friction.

**Acceptance Criteria:**

**Given** I am authenticated and on any main screen
**When** the bottom nav renders
**Then** I see 5 slots: Inicio · Vehículos · `+ FAB azul` · Diagnóstico · Perfil
**And** active tab uses `brand.primary` icon + heading text + dot indicator below label
**And** inactive tabs use `text.muted` icon + 10.5px 600 muted label

**Given** the FAB is rendered
**When** I see it
**Then** it is a 38×38 box with `brand.primary` background, radius 12, icon Plus white 20px, and a soft shadow
**And** effective touch target ≥44pt

**Given** I tap the FAB
**When** the action runs
**Then** AddMaintenanceSheet opens (delivered in Epic 3 — Story 3.1) contextual to the active vehicle

**Given** I tap any non-active tab
**When** navigation processes
**Then** I switch to that screen and the screen-stack resets to top (consistent native pattern)

**Given** the bottom nav has visual treatment
**When** rendered
**Then** background is `bg.primary` at 88% alpha with backdrop-blur 18px and a 1px top border `border.default`

**Given** I am in BUSINESS role (delivered in Epic 8)
**When** the bottom nav renders
**Then** tabs adapt: "Vehículos"→"Clientes", "Diagnóstico"→"Solicitudes" (other tabs unchanged)

**Given** I am inside a sheet/modal
**When** sheet is open
**Then** the bottom nav is hidden behind the sheet backdrop (no overlap)

**Given** I have safe-area insets (iOS home indicator)
**When** the nav renders
**Then** bottom padding includes the home indicator (22px effective)

---

### Story 2.7: Free Tier Vehicle Limit Enforcement

As a FREE-tier user,
I want to be informed clearly when I hit the 2-vehicle limit and see a transparent path to upgrade,
So that I understand why I can't add more and can choose to upgrade with full context.

**Acceptance Criteria:**

**Given** I am FREE tier with 2 vehicles already
**When** I tap "+" to add a 3rd vehicle
**Then** PaywallSheet opens (delivered fully in Epic 6 — Story 6.3) with hero icon + copy "Sumá vehículos sin límite" + value props + pricing card "$9.99/mes · 7 días gratis" + CTA "Empezar gratis" + ghost CTA "Quizás más tarde"

**Given** PaywallSheet is open
**When** I tap "Quizás más tarde"
**Then** the sheet closes
**And** I return to the vehicle list with no penalty (no countdown, no FOMO)

**Given** Layer 1 of Security Rules is enforced
**When** a FREE user attempts to bypass the UI and create a 3rd vehicle via direct Firestore write
**Then** Rules deny the create with `getUserTier(uid) == "PREMIUM" || countUserVehicles(uid) < 2`

**Given** Cloud Function `createVehicle` exists
**When** invoked by a FREE user with 2 vehicles already
**Then** the function throws `HttpsError("permission-denied", "Llegaste al límite de vehículos free. Subí a Premium para sumar más.", { reason: "FREE_TIER_LIMIT" })` (defense in depth: Rules + backend)

**Given** I upgrade to PREMIUM mid-flow (Epic 6)
**When** my subscription syncs
**Then** the limit is removed
**And** I can add the 3rd vehicle without seeing the paywall again

**Given** my subscription expires/cancels and I have 3+ vehicles
**When** the system detects FREE state
**Then** existing vehicles remain visible (no destructive enforcement)
**And** attempts to add MORE vehicles trigger paywall again

---

## Epic 3: Mantenimiento, Tareas & Recordatorios In-App

Habilitar a los usuarios a llevar control completo del mantenimiento de sus vehículos: registrar mantenimientos en <30s con Quick Capture (FAB central), trackear vencimientos (patente/seguro/ITV), crear y completar tareas, ver historial timeline completo y recibir recordatorios in-app de vencimientos próximos.

### Story 3.1: Add Maintenance Quick Capture (FAB → AddMaintenanceSheet)

As a user (Carlos in workshop, or Mariana post-mechanic visit),
I want to register a maintenance entry in under 30 seconds via the central FAB with smart defaults,
So that I can capture maintenance without friction even with messy hands or limited time.

**Acceptance Criteria:**

**Given** I tap the central FAB in BottomNavWithFab
**When** AddMaintenanceSheet opens with sheet-up animation 280ms
**Then** I see header "Nuevo registro" + sub "Llevá el control de tu mantenimiento" + handle 36×4px gris + close X top-right + hairline divider

**Given** the type grid 3×2 renders
**When** I see it
**Then** options are Aceite (Droplet) · Filtros (Filter) · Neumáticos (CircleDot) · Frenos (Octagon) · Service mayor (Wrench) · Otro (Sparkles) — all Lucide icons, NO emojis
**And** the last-used type (persisted in AsyncStorage `motora.lastMaintenanceType`) is preselected with `bg.brand.soft` + `border.brand.line`

**Given** I see the KM field
**When** the sheet opens
**Then** the field is auto-filled with `vehicle.km` of the active vehicle (mono numeric)
**And** I can edit it (e.g., for retrospective entries)
**And** validation enforces 0 ≤ km ≤ 999.999

**Given** the optional Costo field is shown
**When** I tap it
**Then** it accepts numeric input with mono font and prefix "$"
**And** field label reads "COSTO (OPCIONAL)" — skip is permitted

**Given** the optional Notas field is shown
**When** I tap it
**Then** a 3-row textarea opens with placeholder "Lubricentro Avellaneda · aceite 5W30 sintético"

**Given** I have selected a type and KM is valid
**When** the sticky footer renders
**Then** "Guardar registro" primary button is enabled (disabled until tipo + KM valid)

**Given** I tap "Guardar registro"
**When** the mutation runs
**Then** a doc is created at `users/{uid}/vehicles/{vid}/maintenance/{mid}` with `{ type, km, cost?, notes?, createdAt: Timestamp }`
**And** sheet closes with sheet-down animation 220ms
**And** toast "Listo" appears with light haptic
**And** the timeline (Story 3.2) auto-refreshes via TanStack Query invalidation

**Given** I am offline when I tap save
**When** the mutation fires
**Then** I see toast "Sin conexión. Guardado local, sincroniza cuando vuelvas" — entry persists in AsyncStorage queue + syncs on reconnect

**Given** end-to-end measurement
**When** measured P50 from FAB tap to save complete
**Then** the flow finishes in under 30 seconds for happy path

**Given** I tap backdrop or swipe handle down
**When** sheet dismisses
**Then** form state is discarded (no auto-save draft) — user can re-tap FAB to start fresh

---

### Story 3.2: Maintenance History Timeline

As a vehicle owner,
I want to view a chronological timeline of all maintenance entries for my vehicle,
So that I have a complete clinical history of what's been done and when.

**Acceptance Criteria:**

**Given** I navigate to Vehicle Detail and tap "Mantenimiento" tab in SegmentedControl
**When** the tab content loads
**Then** I see a vertical timeline of MaintenanceTimelineItem cards, sorted descending by date (newest first)

**Given** each timeline item renders
**When** I see one
**Then** it shows: left dot (`brand.primary`) + vertical hairline conector + Card with type icon + title + date "Hace 2 días" / "12 abr 2026" + chips inline (km mono, costo mono with Wallet icon, shop name muted if present)

**Given** there are 0 maintenance entries
**When** the tab loads
**Then** EmptyState renders: icon Wrench + title "Sin mantenimientos registrados" + description + CTA "Agregar mantenimiento" (opens AddMaintenanceSheet)

**Given** I long-press a timeline item
**When** the action menu appears
**Then** I see options "Editar" + "Eliminar"

**Given** I tap "Editar" on a timeline item
**When** EditFormModal opens
**Then** I see pre-filled fields and can edit type/km/cost/notes; Save updates the doc

**Given** I tap "Eliminar"
**When** ConfirmationModal appears
**Then** I see title "¿Eliminar este registro?" with destructive confirm; on confirm, doc is removed and timeline refreshes

**Given** the timeline has >20 entries
**When** the tab renders
**Then** FlatList virtualization is used (no perf degradation on long lists)

**Given** TanStack Query is set up
**When** maintenance is added/edited/deleted from any screen
**Then** the timeline auto-refreshes via key `["vehicles", userId, vehicleId, "maintenance"]`

---

### Story 3.3: Vencimientos Tracking (patente, seguro, ITV)

As a vehicle owner in Argentina,
I want to register and track upcoming legal/insurance vencimientos (patente, seguro, VTV/ITV) for my vehicle,
So that I never get caught off guard by an expired document.

**Acceptance Criteria:**

**Given** I am on Vehicle Detail and tap "Mantenimiento" tab
**When** scrolling, I see a sub-section "VENCIMIENTOS" above the maintenance timeline (or as a separate sub-tab)
**Then** I see a list of registered vencimientos as ReminderRow items with hairline dividers

**Given** I tap "Agregar vencimiento" CTA
**When** an EditFormModal opens
**Then** I see fields: Tipo (Patente / Seguro / VTV / Otro) + Fecha de vencimiento (DatePicker) + Notas opcional

**Given** I save a vencimiento
**When** mutation runs
**Then** a doc is created at `users/{uid}/vehicles/{vid}/vencimientos/{vencId}` with `{ type, dueDate: Timestamp, notes? }`

**Given** I tap a vencimiento row
**When** EditFormModal opens
**Then** I can edit type/date/notes or tap "Eliminar" (with ConfirmationModal)

**Given** a vencimiento is within 30 days
**When** ReminderRow renders
**Then** dot is `status.warn` color and days-remaining shows mono "Vence en 12 días"

**Given** a vencimiento is within 7 days
**When** ReminderRow renders
**Then** dot is `status.warn` (brighter) and copy reads "Vence en 5 días"

**Given** a vencimiento is past due
**When** ReminderRow renders
**Then** dot is `status.err` and copy reads "Vencido hace 3 días"
**And** this contributes to Dashboard StatusHero "warn" or "err" state (Story 2.4)

**Given** there are 0 vencimientos registered
**When** the section renders
**Then** EmptyState mini-card shows with copy "Aún no registraste vencimientos · Agregar"

---

### Story 3.4: Tasks Tab — Create, Complete, Delete

As a vehicle owner,
I want to create a list of pending maintenance tasks (e.g., "cambiar bujías", "revisar frenos") and check them off as I complete them,
So that I have an explicit todo for my vehicle care.

**Acceptance Criteria:**

**Given** I navigate to Vehicle Detail and tap "Tareas" tab in SegmentedControl
**When** the tab loads
**Then** I see a list of task rows with custom checkbox (border `status.ok` when done, soft fill, icon Check Lucide) + task title + optional due-date metadata

**Given** I tap "+" floating button or "Agregar tarea" CTA
**When** an EditFormModal or inline input opens
**Then** I can enter title (required) + optional due date (DatePicker)

**Given** I save the task
**When** mutation runs
**Then** a doc is created at `users/{uid}/vehicles/{vid}/tasks/{taskId}` with `{ title, dueDate?, completed: false, createdAt: Timestamp, completedAt?: null }`

**Given** I tap a task checkbox
**When** the action runs
**Then** task is marked completed (`completed: true, completedAt: Timestamp.now()`)
**And** strike-through animation plays on the title (200ms premium)
**And** light haptic fires

**Given** I tap an already-completed checkbox
**When** the action runs
**Then** task is unmarked (`completed: false, completedAt: null`)

**Given** I long-press a task
**When** the action menu appears
**Then** I see "Editar" + "Eliminar" options
**And** Eliminar requires ConfirmationModal

**Given** there are 0 tasks
**When** the tab renders
**Then** EmptyState renders: icon ClipboardList + title "Sin tareas pendientes" + CTA "Agregar tarea"

**Given** the list has both pending and completed tasks
**When** the tab renders
**Then** pending appear at top, completed below a divider with section label "COMPLETADAS"

---

### Story 3.5: In-App Reminders for Vencimientos Próximos

As a vehicle owner,
I want the Dashboard and notifications layer to surface upcoming vencimientos prominently in-app,
So that I am aware of expirations without relying on external push (which is gated by Epic 7 and tier limits).

**Acceptance Criteria:**

**Given** I have one or more vencimientos within 30 days
**When** Dashboard renders (Story 2.5)
**Then** "PRÓXIMOS VENCIMIENTOS" section shows top 3 most urgent ReminderRows sorted by daysRemaining ascending

**Given** any vencimiento is within 7 days or past due
**When** Dashboard StatusHero computes status
**Then** status is at least "warn" (or "err" if past-due) reflecting the worst case across vencimientos + DTCs + tasks-overdue

**Given** I navigate to Vehicle Detail
**When** the Mantenimiento tab loads
**Then** vencimientos section shows ALL upcoming and past-due entries (not just top 3)

**Given** a vencimiento is within 7 days
**When** I open the app
**Then** the relevant ReminderRow on Dashboard pulses sutil halo (only for `err` past-due) — `warn` does NOT pulse, reserve pulse for critical

**Given** I am FREE tier
**When** vencimientos approach
**Then** in-app surfacing works fully (no gating)
**And** push notifications are NOT delivered (push reminders are PREMIUM, gated in Epic 6+7 — Story 7.3)

**Given** I am PREMIUM tier
**When** vencimientos approach
**Then** in-app surfacing PLUS push notification fires (push delivery is delivered in Epic 7 — this story focuses on in-app surfacing)

**Given** a vencimiento is past 30 days post-due
**When** Dashboard renders
**Then** it stays visible until user explicitly resolves (edit due date or delete) — no auto-archive

---

## Epic 4: OBD2 Live Diagnostics

Permitir a los usuarios conectar adaptadores OBD2 Bluetooth genéricos (ELM327 compatible), ver telemetría en tiempo real (RPM, velocidad, temperatura, batería), escanear y decodificar códigos DTC, y consultar historial de lecturas — con consentimiento explícito y manejo robusto de fallos hardware.

### Story 4.1: OBD2 Strategy Pattern & Mock Foundation

As a developer working on OBD2 features,
I want a Strategy Pattern abstraction that supports BluetoothClassic (Android), BLE skeleton (iOS), and Mock (development/test),
So that the rest of the OBD2 feature is platform-independent and testable.

**Acceptance Criteria:**

**Given** the strategy pattern exists
**When** I inspect `mobile/src/features/diagnostics/obd2/`
**Then** I find: `OBD2Service.ts` (abstract interface), `BluetoothClassicStrategy.ts` (Android prod), `BLEStrategy.ts` (iOS skeleton), `MockStrategy.ts` (dev), `CommandQueue.ts`, `OBD2Parser.ts`

**Given** the OBD2Service interface is defined
**When** I read it
**Then** it exposes: `connect(deviceAddress)`, `disconnect()`, `sendCommand(cmd)`, `subscribeStream(pid, callback)`, `getDTCs()`, `clearDTCs()`, `getStatus(): "disconnected" | "connecting" | "connected" | "scanning"`

**Given** runtime flags exist
**When** the strategy is selected at runtime
**Then** `ENABLE_REAL_BT_ANDROID=true` selects BluetoothClassicStrategy on Android
**And** `ENABLE_REAL_BT_IOS=false` selects MockStrategy on iOS (transparent "Coming soon" UX)
**And** dev builds default to MockStrategy regardless of platform

**Given** CommandQueue serializes ELM327 commands
**When** multiple commands are sent rapidly
**Then** commands are queued and dispatched sequentially with configurable timeouts
**And** corrupted/timeout responses surface graceful errors via Toast (never crash)

**Given** OBD2Parser decodes responses
**When** a DTC raw response arrives (e.g., "P0301")
**Then** the parser returns a structured object `{ code, description, severity, freezeFrame? }` with description in Spanish from a local dictionary

**Given** MockStrategy is in use
**When** I open OBD2 screen in dev
**Then** I see realistic mock telemetry (RPM cycling 800-3000, temp 80-95°C, battery 12-14V) and 0-2 mock DTCs
**And** I can toggle "Inject error" via dev settings to test error UI

**Given** unit tests exist
**When** CI runs
**Then** OBD2Parser has tests covering: known DTCs (P0301, P0134, P0441), unknown codes, malformed responses, multi-frame responses (≥10 test cases)

---

### Story 4.2: Bluetooth Pairing & Device Management

As a user with an ELM327 OBD2 adapter,
I want to scan for nearby Bluetooth devices, pair my adapter, and have it remembered for future sessions,
So that I don't need to re-pair every time I open the app.

**Acceptance Criteria:**

**Given** I navigate to Diagnóstico tab and have no paired device
**When** the screen loads
**Then** I see EmptyState with icon Plug + title "Sin dispositivo vinculado" + CTA "Vincular dispositivo"

**Given** I tap "Vincular dispositivo"
**When** the pairing flow starts
**Then** Bluetooth permission is requested (Android: BLUETOOTH_SCAN/CONNECT, iOS: NSBluetoothAlwaysUsageDescription)
**And** if denied, I see banner "Activá Bluetooth para conectar tu dispositivo" + button "Abrir ajustes"

**Given** Bluetooth is enabled and permissions granted (Android)
**When** the device scan starts
**Then** I see a list of available Bluetooth devices with name + MAC address (mono)
**And** scanning has a 30s timeout with "Reintentar" CTA on timeout

**Given** I tap a device in the list
**When** the pairing handshake runs (Android only — iOS sees "Próximamente disponible en iOS" empty)
**Then** the device address is saved in AsyncStorage `motora.lastPairedBT.{userId}`
**And** I see toast "Dispositivo vinculado: OBDLink MX+"

**Given** OBD2 terms have not been accepted yet
**When** I attempt to start a session for the first time
**Then** a consent screen blocks usage with copy explaining what data is read + button "Acepto"
**And** acceptance is persisted to `users/{uid}/preferences.obd2TermsAcceptedAt`

**Given** I want to unpair
**When** I open Diagnóstico → device settings → "Desvincular dispositivo"
**Then** ConfirmationModal appears; on confirm, AsyncStorage entry is cleared and EmptyState returns

**Given** iOS user attempts pairing
**When** the screen loads
**Then** content reads "Bluetooth en iOS · Próximamente" with explanation that mock data still works for exploring features (transparent UX, NOT confusion)

---

### Story 4.3: OBD2 Connection Lifecycle & LiveBanner

As a user with a paired OBD2 adapter,
I want to see connection status clearly at all times via a top banner with appropriate copy and animations,
So that I understand whether I'm receiving live data or experiencing issues.

**Acceptance Criteria:**

**Given** I navigate to Diagnóstico tab with a paired device
**When** the screen loads
**Then** auto-connection attempts run using saved address
**And** LiveBanner shows state-appropriate copy

**Given** the LiveBanner state is "Disconnected"
**When** rendered
**Then** background `bg.elevated` + dot gray + copy "Sin conexión" + CTA "Conectar"

**Given** state transitions to "Connecting"
**When** rendered
**Then** background `status.warnSoft` + dot warn + copy "Conectando a OBDLink MX+..." + spinner inline

**Given** state transitions to "Connected"
**When** rendered
**Then** background `status.okSoft` + dot ok with `dot-live` pulse animation + copy "OBDLink MX+ conectado · ECU MED17.5" + chip "Live" + Plug icon

**Given** state transitions to "Failed"
**When** rendered
**Then** background `status.errSoft` + dot err + copy "No se pudo conectar" + button "Reintentar" + auto-retry with exponential backoff (3 attempts)

**Given** state transitions to "Scanning"
**When** rendered
**Then** background `brand.soft` + copy "Escaneando códigos..." + progress indicator

**Given** I have prefers-reduced-motion enabled
**When** dot-live pulse would animate
**Then** the pulse is disabled and the dot remains static

**Given** the device falls out of range mid-session
**When** connection drops
**Then** banner transitions to "Failed" + auto-retry 3 times with backoff (1s, 2s, 4s capped 30s)
**And** if all fail, copy reads "Conexión perdida. Acercate al adaptador y reintentá"

**Given** I leave the Diagnóstico tab
**When** I return
**Then** connection state persists (no re-handshake required if still connected)

---

### Story 4.4: Live Telemetry — ArcGauge & MiniGauge

As a user with an active OBD2 connection,
I want to see real-time telemetry from my vehicle via clear 2D gauges (NOT skeumorphic),
So that I can monitor engine health visually and intuitively.

**Acceptance Criteria:**

**Given** OBD2 is connected
**When** I view the telemetry section
**Then** I see 2 ArcGauges large (RPM 0-8000, Velocidad 0-260 km/h) above 2 MiniGauges (Refrigerante °C, Batería V)

**Given** each ArcGauge renders
**When** I see it
**Then** it is a semicircular SVG with stroke colored according to value range (ok/warn/err thresholds), large mono number in center, label below

**Given** each MiniGauge renders
**When** I see it
**Then** it is a horizontal lineal bar with label (e.g., "REFRIGERANTE") + mono value + bar fill colored by status

**Given** Pro Mode toggle exists
**When** I tap "Pro Mode" in Profile or settings
**Then** the telemetry section expands to show 4 additional gauges (Aceite, Combustible, MAF, MAP)

**Given** PIDs update from the OBD2 stream
**When** values change
**Then** gauge fill animates with stroke-dasharray transition (500-600ms ease)
**And** mono numbers use `tnum` (tabular numerals) so dígitos cambian sin layout shift

**Given** the polling rate is configured
**When** real adapter is connected
**Then** the polling interval is 1000ms in production (mockup uses 600ms — production uses 1000ms to prevent CPU/battery drain)

**Given** the connection drops mid-stream
**When** new values stop arriving
**Then** gauges fade to muted state with "—" placeholder
**And** LiveBanner reflects the disconnect

**Given** prefers-reduced-motion is enabled
**When** values update
**Then** gauge transitions snap to value (no animation)

---

### Story 4.5: DTC Scanning & Decoding

As a user concerned about my vehicle's health,
I want to trigger an explicit DTC scan and see decoded codes with Spanish descriptions,
So that I understand any issues my vehicle is reporting in plain language.

**Acceptance Criteria:**

**Given** OBD2 is connected
**When** I see a button "Re-escanear DTCs" on the OBD2 screen
**Then** it is prominent and easy to tap (touch target ≥44pt)

**Given** I tap "Re-escanear DTCs"
**When** the scan runs
**Then** LiveBanner transitions to "Escaneando códigos..." for 500-2000ms
**And** results render below

**Given** the scan finds 0 codes
**When** results render
**Then** I see a Card with status `ok`, copy "Sin códigos · Tu auto está limpio" + freeze-frame snapshot timestamp

**Given** the scan finds N codes
**When** results render
**Then** I see N DTCCard items, each with: icon AlertCircle (warn/err by severity) + code mono bold ("P0301") + descripción Spanish ("Falla de encendido en cilindro 1") + severity chip
**And** codes are sorted by severity (err first, then warn)

**Given** I long-press a DTCCard
**When** Pro Mode is enabled
**Then** I see snapshot of freeze-frame data (engine state at the time of error: RPM, speed, coolant, etc.)

**Given** OBD2Parser cannot decode a code (unknown)
**When** rendered
**Then** the card shows code mono + copy "Código no reconocido" + helper "Consultá con un mecánico"

**Given** I am PREMIUM and tap "Interpretar con IA" on a DTCCard
**When** the action runs
**Then** AIDiagnosisSheet opens (delivered in Epic 5 — Story 5.2)

**Given** I am FREE
**When** I tap "Interpretar con IA"
**Then** PaywallSheet (Epic 6 — Story 6.3) opens with feature-specific copy "El Negro lee tus códigos en argentino claro"

---

### Story 4.6: OBD2 Reading History

As a user who has scanned my vehicle multiple times,
I want to view a chronological history of all OBD2 readings with quick access to past diagnostics,
So that I can track patterns and reference past issues.

**Acceptance Criteria:**

**Given** I have at least 1 OBD2 reading saved
**When** I navigate to Vehicle Detail → OBD2 tab
**Then** I see a vertical list of past readings sorted descending by date

**Given** each history item renders
**When** I see one
**Then** it shows: date "Hace 2 días" / "12 abr 2026" + dot status + count of DTCs (chips with codes mono) + km mono at the time

**Given** I tap a history item
**When** drill-down navigates with page-in 280ms
**Then** I see the full reading detail (telemetry snapshot + DTCs + freeze-frame if available)

**Given** there are 0 readings yet
**When** the tab loads
**Then** EmptyState renders: icon Activity + title "Aún no escaneaste tu auto" + CTA "Empezar diagnóstico" (links to Diagnóstico tab)

**Given** OBD2 readings are saved
**When** the scan completes (Story 4.5)
**Then** a doc is created at `users/{uid}/vehicles/{vid}/obd2/{readingId}` with `{ km, dtcs: [...], telemetry: {...}, freezeFrames: [...], createdAt: Timestamp }`

**Given** Dashboard "Último diagnóstico" sub-card (Story 2.5)
**When** rendered
**Then** it reads from this same collection (most recent reading) — single source of truth

**Given** I have prefers-reduced-motion or am on a low-end device
**When** rendering long lists
**Then** FlatList virtualization keeps scroll performance smooth (>30 readings)

---

## Epic 5: AI Premium — El Negro Diagnostics

Entregar a usuarios premium diagnósticos IA empáticos en argentino claro mediante la persona "El Negro" (Mecánico IA · Córdoba): cada análisis explica qué pasa, qué hacer y urgencia, basado en datos OBD2 + contexto del vehículo. Free tier obtiene 1 análisis trial. Admin puede monitorear costos y rate limits.

### Story 5.1: AI Backend Integration (Vercel AI SDK + token bucket + cost tracking)

As the platform owner,
I want a robust AI backend with cost tracking, rate limiting via token bucket, and structured output via Vercel AI SDK + gpt-4o-mini,
So that AI feature costs are predictable and abuse is prevented.

**Acceptance Criteria:**

**Given** the AI service is implemented
**When** I inspect `functions/src/services/ai/`
**Then** I find `aiService.ts` (Vercel AI SDK + gpt-4o-mini integration) and `costTrackingService.ts` (token bucket + Firestore counters)

**Given** the Cloud Function `analyzeDTC` is exposed
**When** invoked with `{ vehicleId, dtcCode, freezeFrame? }`
**Then** the function: (1) asserts auth, (2) checks tier via `costTrackingService.checkBucket(uid)`, (3) consumes token if available, (4) calls Vercel AI SDK with structured output schema, (5) saves analysis to Firestore, (6) returns analysis + remaining tokens

**Given** the token bucket schema exists
**When** I read `users/{uid}/stats`
**Then** I see `aiTokensBucket: { tokens: 1, refillAt: Timestamp, tier: "FREE" | "PREMIUM" }` and `lastAiUsage: Timestamp`

**Given** the cost tracking schema exists
**When** I read `aiUsage/{userId}/dailyCalls/{YYYY-MM-DD}`
**Then** I see `{ count, totalTokensUsed, estimatedCost, calls: [{ timestamp, dtcCode, model, cost }] }`

**Given** a FREE user has 0 tokens left
**When** they invoke `analyzeDTC`
**Then** the function throws `HttpsError("resource-exhausted", "Llegaste al límite de hoy. Subí a Premium para análisis ilimitados", { tier: "FREE", refillAt })`
**And** mobile UI shows the message + CTA to PaywallSheet

**Given** a PREMIUM user invokes `analyzeDTC`
**When** the function runs
**Then** rate limiting still applies but with higher tier limits (e.g., 10/day initial; configurable to "unlimited")
**And** cost counters increment regardless of tier (analytics)

**Given** structured output is configured
**When** the AI responds
**Then** the response strictly conforms to schema `{ analysis: string, urgency: "hoy" | "esta-semana" | "cuando-puedas", estimatedCost: { min, max, currency }, recommendedAction: string }`

**Given** AI request fails (timeout, model error)
**When** the failure surfaces
**Then** the function does NOT consume the token (refund) and returns user-friendly error "Estamos teniendo problemas con la IA. Intentá de nuevo en un rato"

**Given** structured logging is configured
**When** any AI call completes
**Then** Cloud Logging receives `{ uid, model, tokensUsed, cost, dtcCode, durationMs, status }` for monitoring + admin dashboard (Epic 9 — Story 9.5)

**Given** unit + integration tests exist
**When** CI runs
**Then** suite covers: tier check, refill logic idempotency (safe on retries), structured output validation, error refund — minimum 10 test cases

---

### Story 5.2: AIDiagnosisSheet — El Negro Persona UI

As a PREMIUM user with a DTC code,
I want to see an AI-powered diagnostic via the "El Negro" mechanic persona with a warm, structured 3-section reveal,
So that I receive empathetic guidance in plain Argentine Spanish about what's wrong, what to do, and how urgent it is.

**Acceptance Criteria:**

**Given** I am PREMIUM and tap "Interpretar con IA" on a DTCCard (Story 4.5)
**When** AIDiagnosisSheet opens with sheet-up animation 280ms
**Then** I see header with avatar circular gradient púrpura `linear-gradient(135deg, #A855F7, #7C3AED)` with inicial "N" + name "El Negro" + role "Mecánico IA · Córdoba"

**Given** the call is in progress
**When** the sheet content loads
**Then** I see a Skeleton shimmer for the 3 sections + LiveBanner equivalent showing "El Negro está analizando..."

**Given** the AI response arrives
**When** content reveals
**Then** banner "Resumen IA" purple PREMIUM (opacity 0.14) renders first
**And** 3 sections fade-up cascade with stagger 280ms each:
  - Section 1: icon AlertCircle warn + heading "Qué está pasando" + body (technical empathetic explanation)
  - Section 2: icon Wrench brand + heading "Qué te recomiendo hacer" + body (concrete action)
  - Section 3: icon Clock + heading "Urgencia" + chip with color-coded severity ("Hoy" err / "Esta semana" warn / "Cuando puedas" ok)

**Given** the response includes estimated cost
**When** rendered
**Then** at the bottom of section 2, I see "Costo estimado: $80-120 USD" in mono (es-AR Intl format adjusted to ARS if available)

**Given** footer CTAs are shown
**When** rendered
**Then** primary CTA "Buscar talleres cerca" (links to Talleres geo — Epic 8) + ghost CTA "Cerrar"

**Given** AI request times out or fails (>10s)
**When** the failure surfaces
**Then** sheet shows fallback copy "Estamos teniendo problemas con la IA. Te dejamos ver los códigos manualmente" + ghost button "Cerrar"
**And** the token IS refunded (per Story 5.1)

**Given** screen reader is enabled
**When** sheet opens
**Then** focus moves to the heading + sections are announced sequentially in semantic order

**Given** prefers-reduced-motion enabled
**When** sections reveal
**Then** stagger animation degrades to instant fade (no slide)

**Given** I tap backdrop or swipe handle
**When** sheet dismisses
**Then** the analysis is saved to Firestore (no data loss) and accessible later via Story 5.4 history

---

### Story 5.3: Free Trial Analysis (1 análisis free per user)

As a FREE-tier user curious about AI features,
I want to be granted 1 free AI analysis as a trial,
So that I can experience the value of "El Negro" before deciding to upgrade to Premium.

**Acceptance Criteria:**

**Given** a new FREE user is created
**When** the `onUserCreated` trigger runs
**Then** their `aiTokensBucket` is initialized to `{ tokens: 1, refillAt: null, tier: "FREE" }` (no auto-refill — single trial)

**Given** I am FREE with 1 trial token left
**When** I tap "Interpretar con IA" on a DTCCard
**Then** AIDiagnosisSheet runs the analysis (consuming the trial token)
**And** after the response, the sheet shows footer chip "Trial usado · Subí a Premium para más análisis"

**Given** my trial token is consumed
**When** I tap "Interpretar con IA" again
**Then** PaywallSheet opens (no further trials) with copy adapted to "Ya probaste El Negro · Sumate a Premium para análisis ilimitados"

**Given** the trial is consumed during the AI call but the call fails
**When** the function refunds the token (Story 5.1)
**Then** I retain the trial — I can retry without paywall

**Given** an admin manually grants a bonus token
**When** the user tries again
**Then** the bonus token works and is consumed (no UX change)

---

### Story 5.4: AI Analysis History & Admin Cost View

As a user who used AI analysis,
I want to view my history of AI analyses sorted by date,
And as an admin, I want to monitor aggregate AI usage and costs.

**Acceptance Criteria:**

**Given** AI analyses are persisted
**When** the cloud function saves an analysis
**Then** a doc is created at `users/{uid}/aiAnalyses/{analysisId}` with `{ vehicleId, dtcCode, analysis: { whatHappens, whatToDo, urgency, estimatedCost, recommendedAction }, modelUsed, costUsd, createdAt: Timestamp }`

**Given** I am a user navigating to my profile or vehicle detail
**When** I open "Mis análisis IA"
**Then** I see a list of past analyses sorted descending by date with mini-card preview (date + DTC code mono + urgency chip)

**Given** I tap an analysis item
**When** drill-down navigates
**Then** I see the full AIDiagnosisSheet content (read-only, no token consumed)

**Given** there are 0 analyses yet
**When** the screen renders
**Then** EmptyState: icon Sparkles + title "Aún no usaste El Negro" + CTA "Probá tu análisis gratis"

**Given** an admin uses the web admin dashboard (delivered in Epic 9 — Story 9.5)
**When** the admin opens "Logs IA"
**Then** they see aggregated metrics: total calls, total cost, top-N DTC codes analyzed, per-user breakdown, daily/monthly trends — sourced from `aiUsage/` collection

**Given** an admin filters by date range
**When** the filter applies
**Then** the dashboard recomputes metrics and updates charts (this story prepares the data; UI delivery is Epic 9)

**Given** a Cloud Function `getAIUsageStats` exists
**When** invoked by an admin (RBAC check)
**Then** it returns aggregated stats from `aiUsage/` for admin consumption — Cloud Function is part of this story; admin UI is Epic 9

---

## Epic 6: Subscriptions, Premium Gating & Mercado Pago Paywall

Implementar el sistema de suscripciones Premium ($9.99/mes) con paywall transparente (NO dark patterns, 7 días gratis upfront, copy honesto), integración Mercado Pago con webhooks IPN, sincronización en tiempo real del estado de suscripción y revocación automática si caduca. Paywall se dispara en 4 puntos: 3er vehículo, IA analysis, IA task suggestions, push reminders.

### Story 6.1: Subscription Tiers Schema & Status Sync

As the platform owner,
I want a robust subscription model in Firestore that tracks tier, status, renewal date, and payment method,
So that the rest of the platform can gate features reliably and the user always sees correct subscription state.

**Acceptance Criteria:**

**Given** the subscriptions collection exists
**When** I read `subscriptions/{userId}`
**Then** I see `{ tier: "FREE" | "PREMIUM", status: "active" | "cancelled" | "expired" | "pending", renewalDate: Timestamp, paymentMethodId: string, mpSubscriptionId: string, createdAt, updatedAt }`

**Given** every user has a subscription doc
**When** the `onUserCreated` trigger runs (Story 1.2)
**Then** the user starts with `{ tier: "FREE", status: "active", renewalDate: null, paymentMethodId: null }`

**Given** a TanStack Query hook `useSubscription()` exists in mobile
**When** any screen reads it
**Then** it returns current tier + status + remaining trial days
**And** subscribes to Firestore real-time updates so tier changes propagate without manual refresh

**Given** Firestore Security Rules enforce visibility
**When** a user reads their own subscription
**Then** read is allowed; write is denied for non-admins (writes only via Cloud Functions or webhook)

**Given** Cloud Function `getSubscription` exists
**When** invoked by authenticated user
**Then** it returns enriched data including computed fields (daysUntilRenewal, isTrialActive, gracePeriodEnd)

**Given** subscription tier changes mid-session
**When** the listener detects the change
**Then** UI auto-updates (e.g., "Mejorá a Premium" CTA disappears, paywalls release, vehicle limit lifts)

---

### Story 6.2: Mercado Pago Checkout Integration

As a FREE user ready to upgrade,
I want a frictionless checkout flow via Mercado Pago that handles trial activation, payment processing, and confirmation,
So that I can subscribe in seconds without leaving the app for too long.

**Acceptance Criteria:**

**Given** I tap "Empezar gratis" in PaywallSheet
**When** the action runs
**Then** a Cloud Function `createMpSubscription` is invoked, creating a Mercado Pago subscription preference for $9.99/mes with 7-day free trial
**And** I am redirected to MP checkout (webview or external) with prefilled email

**Given** MP checkout completes successfully
**When** the user returns to the app
**Then** the app shows a loading screen "Activando tu Premium..." until the IPN webhook confirms (Story 6.4)
**And** if confirmation takes >30s, fallback to optimistic UI ("Pronto vas a tener acceso" + retry option)

**Given** MP returns user to app via deeplink
**When** the deeplink is parsed
**Then** the app navigates to the screen the user was on before Paywall (preserving context — vehicle add, IA analysis, etc.)

**Given** MP checkout fails (declined card, etc.)
**When** the user returns
**Then** I see a sheet "El pago no se pudo procesar" with retry button + support link

**Given** the user cancels MP checkout
**When** they return
**Then** sheet closes with NO penalty (per "no dark patterns" principle)
**And** subscription status remains FREE

**Given** payment method is captured
**When** subscription activates
**Then** `subscriptions/{userId}.paymentMethodId` is updated with MP method reference (no card data stored locally)

**Given** the integration is via official MP SDK
**When** I review the code
**Then** API key is server-side only (Cloud Functions); client only handles redirect URLs and deeplinks

---

### Story 6.3: PaywallSheet (4 trigger points, no dark patterns)

As a FREE user encountering a premium-gated feature,
I want a transparent paywall sheet with clear value proposition and zero dark patterns,
So that I can make an informed decision without feeling manipulated.

**Acceptance Criteria:**

**Given** the 4 trigger points exist
**When** any of these occurs, PaywallSheet opens with feature-specific copy:
  - 3rd vehicle attempt → "Sumá vehículos sin límite"
  - IA analysis tap → "El Negro lee tus códigos en argentino claro"
  - Task suggestions tap → "IA te sugiere mantenimientos a tiempo"
  - Push reminders tap → "Avisos antes de que venza algo"

**Given** the sheet structure is rendered
**When** I see it
**Then** I see: hero icon (60×60 premium gradient bg, Lucide icon) + title (title-2 700) + sub muted + 3 bullets value prop with brand icons + pricing card + CTAs

**Given** the pricing card renders
**When** I see it
**Then** it shows "$9.99 / mes" (hero number sm) + "7 días gratis" (caption ok-color) + sub "Cancelá cuando quieras" (caption muted)

**Given** primary CTA "Empezar gratis" is shown
**When** I tap it
**Then** Story 6.2 MP checkout flow starts

**Given** ghost CTA "Quizás más tarde" is shown
**When** I tap it
**Then** sheet closes with NO penalty (no countdown, no FOMO, no guilt)
**And** I return to the screen the user was on (preserving context)

**Given** dark patterns are forbidden
**When** I review the sheet
**Then** there is NO countdown timer ("¡solo por hoy!") + NO fake social proof ("47 personas se suscribieron") + NO guilt ("¿no querés cuidar tu auto?") + NO hidden cost (always shows $9.99 + 7 días explicitly)

**Given** I am already PREMIUM
**When** any trigger fires
**Then** PaywallSheet does NOT show — feature works directly

**Given** the sheet is open
**When** I tap backdrop or swipe handle down
**Then** sheet closes (same as ghost CTA, no penalty)

**Given** I purchased premium successfully
**When** I return to app
**Then** PaywallSheet auto-dismisses + toast "Bienvenido a Premium" (sutil, no celebración exagerada) + sutil chip PREMIUM púrpura appears in avatar header

---

### Story 6.4: Webhook IPN & Premium Auto-Revocation

As the platform owner,
I want Mercado Pago IPN webhooks to update subscription status reliably with retry logic, signature validation, and automatic premium revocation on expiry,
So that the platform handles billing lifecycle without manual intervention.

**Acceptance Criteria:**

**Given** Cloud Function `mpWebhookHandler` exists
**When** Mercado Pago POSTs an IPN
**Then** the function: (1) validates IPN signature against MP secret, (2) parses payload, (3) updates `subscriptions/{userId}` with new status/renewalDate, (4) responds 200 within 30s timeout

**Given** the signature validation fails
**When** an IPN arrives
**Then** the function returns 401 + logs the attempt to Cloud Logging (audit trail)
**And** subscription state is NOT modified

**Given** an IPN indicates payment success
**When** processed
**Then** subscription tier upgrades to "PREMIUM" + status "active" + renewalDate is set (current date + 30 days)
**And** the user receives a confirmation email (via Epic 7 — Story 7.1)

**Given** an IPN indicates payment failure
**When** processed
**Then** retry logic activates: 3 retries at 5min, 15min, 1hour intervals
**And** if all fail, status transitions to "expired" + user is notified via email + SMS (Epic 7 — Stories 7.1, 7.2)

**Given** subscription is "expired"
**When** mobile app reads subscription
**Then** tier reverts to "FREE" + features re-gate immediately
**And** existing data (vehicles >2, AI history) remains visible (no destructive enforcement per Story 2.7)

**Given** the IPN webhook timeout exceeds 30s
**When** MP retries
**Then** the function is idempotent (uses MP transaction ID as dedup key) — duplicate IPNs do NOT double-charge or double-update

**Given** integration tests exist
**When** CI runs
**Then** webhook test suite covers: valid signature, invalid signature, payment success, payment failure, retry idempotency, network timeout — minimum 8 test cases

---

### Story 6.5: Cancel Subscription Flow

As a PREMIUM user who wants to stop my subscription,
I want a simple cancel flow with clear consequences and a retention offer,
So that I can cancel without friction but understand what I'm losing.

**Acceptance Criteria:**

**Given** I navigate to Profile → Cuenta → "Mi suscripción"
**When** the screen loads
**Then** I see current plan + renewal date + button "Cancelar suscripción"

**Given** I tap "Cancelar suscripción"
**When** ConfirmationModal appears
**Then** it shows title "¿Cancelar Premium?" + description listing what I lose (IA analysis, vehículos ilimitados, push reminders) + retention offer "Si cancelás ahora, mantenés Premium hasta el {renewalDate}"

**Given** I tap Confirm to cancel
**When** Cloud Function `cancelMpSubscription` runs
**Then** MP API is called to cancel at end of billing period (no immediate refund; user keeps access until renewalDate)
**And** `subscriptions/{userId}.status` updates to "cancelled" + cancelledAt timestamp

**Given** subscription is "cancelled" but still within billing period
**When** mobile app reads tier
**Then** tier remains "PREMIUM" until renewalDate
**And** UI shows banner "Tu Premium termina el {renewalDate}"

**Given** the renewalDate passes after cancellation
**When** the system processes the lifecycle
**Then** tier auto-downgrades to "FREE" + status "expired"
**And** features re-gate as Free (existing data preserved)

**Given** I tap Cancel in the ConfirmationModal
**When** modal closes
**Then** no state changes occur

**Given** I want to resume after cancelling
**When** I tap "Volver a Premium" before renewalDate
**Then** Cloud Function reactivates the existing subscription (no new MP checkout) + status returns to "active"

---

## Epic 7: Notifications — Push, Email & SMS

Construir el sistema multi-canal de notificaciones que envía email de confirmación de registro, recordatorios de vencimientos por email, alertas SMS críticas (OBD2/mantenimiento urgente), notificaciones push en mobile, con opción del usuario para desuscribirse de canales específicos. Incluye retry logic e infraestructura SendGrid + Twilio + FCM.

### Story 7.1: Email Notifications (SendGrid + templates es-AR)

As a user receiving emails from Motora,
I want emails to be branded, in es-AR Spanish, and triggered for relevant events (registration, payment, vencimiento reminders),
So that I get useful information in my preferred channel.

**Acceptance Criteria:**

**Given** SendGrid is integrated
**When** I inspect `functions/src/services/notifications/`
**Then** I find `emailService.ts` exposing `sendEmail({ to, template, vars })` with retry logic 3x exponential backoff
**And** API key is in environment config (NOT hardcoded)

**Given** email templates exist in SendGrid (or local repo for dev)
**When** I list them
**Then** I have minimum: `welcome-registration`, `payment-confirmation`, `vencimiento-reminder`, `subscription-cancelled`, `subscription-expired` — all in es-AR voseo

**Given** the welcome email triggers on user creation
**When** `onUserCreated` runs
**Then** an email is queued via `sendEmail({ to: user.email, template: "welcome-registration", vars: { firstName } })`
**And** delivery within 5 minutes (NFR19)

**Given** payment confirmation triggers on premium activation (Story 6.4)
**When** an IPN signals success
**Then** email is sent with subject "¡Bienvenido a Motora Premium!" + content explaining benefits + renewal date

**Given** vencimiento reminder is scheduled
**When** a user has a vencimiento ≤7 days away
**Then** a daily Cloud Function cron job at 9am AR queries vencimientos and sends emails to opted-in users
**And** message body includes vehicle details + days remaining + CTA "Ver en la app"

**Given** retry logic exists
**When** SendGrid returns 5xx
**Then** the function retries up to 3 times with exponential backoff (5s, 30s, 5min)
**And** persistent failures log to Cloud Logging + admin alert

**Given** delivery time targets
**When** measured in production
**Then** email delivery completes in under 5 minutes for >95% of events (NFR19)

**Given** unsubscribe links are in every email
**When** user clicks
**Then** they land on a SendGrid unsubscribe page that updates `users/{uid}/preferences.notifications.email = false`

---

### Story 7.2: SMS Alerts (Twilio + critical OBD2/maintenance events)

As a user with critical events (urgent OBD2 codes, very-soon vencimiento),
I want to receive an SMS alert as a fail-safe channel beyond push,
So that I am informed even if my phone is offline or push is disabled.

**Acceptance Criteria:**

**Given** Twilio is integrated
**When** I inspect `functions/src/services/notifications/smsService.ts`
**Then** I find `sendSms({ to, message, priority })` with retry logic 3x and credentials in environment config

**Given** SMS triggers are defined
**When** the system identifies a critical event
**Then** SMS fires for: vencimiento past-due (status err), high-severity DTC detected (err code on most recent scan), payment failure (after email retries exhausted)

**Given** SMS body length limits exist
**When** the message is composed
**Then** content is concise <160 chars (single SMS) when possible — e.g., "Motora: tu seguro venció el 12 abr. Renová cuanto antes. Detalle en la app."

**Given** delivery targets
**When** measured in production
**Then** SMS arrives within 10 minutes (NFR19) for >95% of events

**Given** the user opts out of SMS
**When** preferences toggle
**Then** `users/{uid}/preferences.notifications.sms = false` and SMS dispatch is skipped server-side

**Given** Twilio returns rate limit or 5xx
**When** retry logic activates
**Then** retries 3x at 5s, 30s, 5min — persistent failures log + admin alert

**Given** phone number is required
**When** a user has no phone in profile
**Then** SMS dispatch is skipped silently (email/push fallback per channel preferences)

**Given** SMS feature is gated to PREMIUM (cost control)
**When** a FREE user has critical event
**Then** push + email fire (free), SMS does NOT fire (premium-gated per Epic 6)

---

### Story 7.3: Push Notifications (FCM + permission flow + deep-link)

As a user with the app installed,
I want to receive timely push notifications for vencimientos, payment, and critical OBD2 events,
With deep-links that take me directly to the relevant screen.

**Acceptance Criteria:**

**Given** FCM (Firebase Cloud Messaging) is integrated
**When** I inspect `functions/src/services/notifications/pushService.ts`
**Then** I find `sendPush({ uid, title, body, deeplink, data })` resolving FCM token from `users/{uid}/fcmTokens[]`

**Given** mobile app handles FCM token registration
**When** the user grants notification permission post-onboarding
**Then** the token is added to `users/{uid}/fcmTokens` (de-duplicated)
**And** token refresh on app restart updates the array (older tokens removed)

**Given** push permission flow is implemented
**When** the app is opened first time post-registration
**Then** a soft-prompt screen explains the value before requesting OS permission ("Avisos antes de que venza algo · Alertas si tu auto reporta algo")
**And** permission denial gracefully falls back to email/SMS only

**Given** push triggers are defined
**When** these events occur push fires:
  - Vencimiento ≤7 days (PREMIUM only — gating per Epic 6)
  - Severe DTC detected (PREMIUM only)
  - Payment confirmation/failure
  - Booking confirmed/rejected (Epic 8)

**Given** a push payload includes deeplink
**When** user taps the notification
**Then** the app opens directly to the relevant screen (Vehicle Detail, OBD2 history, booking detail, etc.)
**And** deeplink format: `motora://vehicle/{vid}/maintenance` etc.

**Given** the app is in foreground when push arrives
**When** the message comes
**Then** an in-app banner shows (instead of system notification) and tapping it does the same deeplink

**Given** the user opts out of push category-specific
**When** preferences toggle
**Then** server-side dispatch checks `users/{uid}/preferences.notifications.push.{category}` before sending

**Given** delivery targets
**When** measured P50
**Then** push arrives within 30s of trigger event

---

### Story 7.4: Notification Preferences (channel-level unsubscribe)

As a user who wants to control my notification experience,
I want granular preferences for each channel (push/email/SMS) and category (vencimientos/diagnostics/payment/marketing),
So that I receive only what I want.

**Acceptance Criteria:**

**Given** I navigate to Profile → Cuenta → "Notificaciones"
**When** the screen loads
**Then** I see a matrix of channels (Push / Email / SMS) × categories (Vencimientos / Diagnósticos / Pagos / Marketing) as toggles

**Given** the schema supports preferences
**When** I read `users/{uid}/preferences.notifications`
**Then** I see structure: `{ push: { vencimientos, diagnostics, payment, marketing }, email: {...}, sms: {...} }` — all booleans defaulting true (except marketing default false)

**Given** I toggle off a category for a channel
**When** the change saves
**Then** `users/{uid}/preferences.notifications.{channel}.{category} = false` updates Firestore
**And** future dispatches skip this channel for this category

**Given** I toggle off entire push channel
**When** I see the consequence
**Then** a sutil disclaimer reads "Vas a perder avisos críticos como vencimientos vencidos o problemas serios. Alternativamente recibirás email y SMS si tenés activos."

**Given** SMS is PREMIUM-gated
**When** a FREE user views the preferences screen
**Then** SMS toggles are disabled with chip "PREMIUM" + ghost CTA "Subí a Premium para activar SMS"

**Given** changes save optimistically
**When** I toggle
**Then** UI reflects immediately (TanStack Query mutation) + toast "Listo" silent + haptic light

**Given** I am offline
**When** I toggle
**Then** I see toast "Sin conexión. Probá cuando vuelvas online" — no false-positive UI feedback

---

## Epic 8: Business Side — Profiles, Geo Discovery, Bookings & Role Switch

Habilitar el ecosistema B2B: talleres/mecánicos pueden crear perfil de negocio con servicios y ubicación geográfica; usuarios pueden buscar businesses cercanos en mapa, ver perfil completo, solicitar turnos y comunicarse vía mensajería. Adicionalmente, usuarios con dual role (Carlos persona) pueden alternar CLIENT↔BUSINESS sin re-login mediante ProfileMenuSheet, con UI adaptada (tabs "Clientes"/"Solicitudes").

### Story 8.1: Business Profile Creation & Edit

As a workshop owner or independent mechanic,
I want to create a business profile with name, description, contact, hours, and address,
So that customers can find and reach me through Motora.

**Acceptance Criteria:**

**Given** I am authenticated and tap "Crear perfil de negocio" in ProfileMenuSheet
**When** the onboarding screen loads
**Then** I see fields: Nombre del negocio (req) + Descripción (textarea) + Teléfono (req) + Email (req) + Dirección (with autocomplete via Google Places) + Horarios (per day-of-week) + Foto de portada (optional)

**Given** I save the profile
**When** mutation runs
**Then** a doc is created at `businesses/{businessId}` with `{ ownerUid, name, description, phone, email, address: { street, city, lat, lng }, hours: {...}, coverPhotoUrl, services: [], createdAt, status: "active" }`
**And** my user record updates with `businessIds: [businessId]` (a user can own multiple)

**Given** Layer 3 of Security Rules enforces ownership
**When** another user attempts to write my business profile
**Then** Rules deny — `request.auth.uid == resource.data.ownerUid`

**Given** I navigate to my business profile (BUSINESS mode)
**When** I tap "Editar perfil"
**Then** EditFormModal opens with current values; I can edit and save with toast "Listo"

**Given** the address autocomplete uses Google Places API
**When** I type
**Then** suggestions appear with full address + lat/lng saved automatically (geocoding)

**Given** I upload cover photo
**When** image picker resolves
**Then** image uploads to `gs://bucket/businesses/{businessId}/cover.jpg` + URL saved in doc

**Given** profile is active
**When** users search nearby (Story 8.3)
**Then** my business appears in results (subject to geo radius and service filters)

**Given** I want to deactivate temporarily
**When** I toggle "Visibilidad" off in settings
**Then** `businesses/{bid}.status = "inactive"` and the profile is hidden from discovery (but my data is preserved)

---

### Story 8.2: Business Services Management

As a business owner,
I want to manage the list of services I offer (e.g., cambio de aceite, alineación, OBD2 diagnostics),
So that customers can filter and find businesses by what they need.

**Acceptance Criteria:**

**Given** I am in BUSINESS mode and navigate to my profile → Servicios tab
**When** the screen loads
**Then** I see a list of my services as Cards with icon + name + optional price/duration + edit/delete actions

**Given** I tap "Agregar servicio"
**When** the form opens
**Then** I can enter: name (req) + select category (Mantenimiento / Diagnóstico / Reparación / Otro) + optional description + optional price range + optional duration estimate

**Given** I save a service
**When** mutation runs
**Then** the service is added to `businesses/{bid}/services` array with `{ id, name, category, description?, priceRange?, durationMinutes? }`

**Given** I have 0 services
**When** the tab loads
**Then** EmptyState: icon Wrench + title "Sin servicios cargados" + CTA "Agregar primer servicio"

**Given** I edit/delete a service
**When** mutations run
**Then** state updates with optimistic UI; delete requires ConfirmationModal

**Given** users filter discovery by category (Story 8.3)
**When** filter applies
**Then** businesses with at least one matching service category appear in results

---

### Story 8.3: Google Maps Integration & Geo Discovery

As a user looking for a workshop nearby,
I want to search businesses on a map filtered by service category and distance,
So that I can find help quickly.

**Acceptance Criteria:**

**Given** I navigate to "Talleres cerca" (entry from AIDiagnosisSheet CTA, Profile menu, or main tab)
**When** the screen loads
**Then** I see a Google Map centered on my current location (with permission) or default city center
**And** active businesses appear as pins
**And** a list view toggles below the map

**Given** I have not granted location permission
**When** the screen first loads
**Then** a soft prompt explains why before requesting OS permission
**And** if denied, defaults to manual address input ("Buscar en {ciudad}")

**Given** location permission is granted
**When** the map renders
**Then** my position shows as a blue dot + nearby businesses (default radius 10km) load as pins with brand colors

**Given** I tap a pin
**When** the bottom card animates up
**Then** I see business name + rating chip + distance mono ("2.3 km") + categories chips + CTA "Ver perfil" + CTA "Llamar"

**Given** I tap "Ver perfil"
**When** drill-down navigates
**Then** I land on Business Profile public view (Story 8.4)

**Given** filters are available
**When** I tap filter button
**Then** chip filters horizontal: Categories (Diagnóstico/Mantenimiento/Reparación) + Distance (5/10/25/50 km) — multi-select

**Given** map and list render
**When** I scroll list
**Then** map pins highlight in sync (selected pin gets larger)

**Given** Maps API precision is ±50m
**When** location resolves
**Then** business pins are placed at exact lat/lng from Story 8.1 (no offset)

**Given** Google Maps API is unavailable or quota exceeded
**When** the map fails to load
**Then** fallback list-only mode appears with copy "Mapa no disponible. Mostramos lista de talleres cerca" + manual location toggle

**Given** the API key is protected
**When** I inspect bundle/code
**Then** key is not exposed in client — server-side proxied where critical (place autocomplete via Cloud Function)

---

### Story 8.4: Business Profile Public View

As a user evaluating a business,
I want to view a complete public profile with services, hours, contact, photos, and ratings,
So that I have enough information to decide whether to contact them.

**Acceptance Criteria:**

**Given** I tap "Ver perfil" from a business card or pin
**When** drill-down navigates
**Then** I see hero section with cover photo + business name + rating + distance + halo gradient subtle

**Given** the profile renders below hero
**When** I scroll
**Then** sections appear: "Sobre el negocio" (description) + "Servicios" (chips) + "Horarios" (week table) + "Ubicación" (mini-map + address) + "Contacto" (phone, email)

**Given** I tap "Llamar"
**When** the action runs
**Then** native phone dialer opens with the business phone pre-filled

**Given** I tap "Enviar consulta"
**When** action runs
**Then** booking request flow starts (Story 8.5)

**Given** ratings are computed
**When** profile loads
**Then** average rating + count of reviews displayed (review system: post-MVP, but read-only display reads from `businesses/{bid}.aggregateRating` initially nullable)

**Given** the business is inactive
**When** I navigate to it via stale link
**Then** EmptyState: "Este negocio ya no está disponible" + back button

---

### Story 8.5: Booking Request Flow (user → business)

As a user wanting to schedule service,
I want to send a booking request to a business with my vehicle and preferred service,
So that I can arrange an appointment without phone tag.

**Acceptance Criteria:**

**Given** I tap "Enviar consulta" on a business profile
**When** the booking sheet opens
**Then** I see fields: Vehículo (selector from my garage) + Servicio (selector from business services) + Fecha preferida (DatePicker) + Horario preferido (Mañana/Tarde) + Notas opcional + share OBD2 history toggle

**Given** I optionally toggle "Compartir mi último diagnóstico"
**When** I send the request
**Then** the business gets read access to my last OBD2 reading (Layer 2 Security Rules: `uid in resource.data.allowedUsers`)

**Given** I tap "Enviar consulta"
**When** the mutation runs
**Then** a doc is created at `bookings/{bookingId}` with `{ userId, businessId, vehicleId, serviceId, preferredDate, preferredTimeSlot, notes, status: "pending", sharedDiagnosticIds: [], createdAt }`
**And** the business receives notification (Story 8.6)
**And** I see toast "Consulta enviada"

**Given** I navigate to "Mis turnos"
**When** the screen loads
**Then** I see a list of my bookings sorted descending by date with status chips (Pendiente / Aceptado / Rechazado / Completado)

**Given** I tap a booking
**When** detail loads
**Then** I see full request + business response + messaging thread (Story 8.7)

---

### Story 8.6: Booking Acceptance/Rejection & Notifications (business side)

As a business owner,
I want to receive booking requests, accept or reject them, and have customers automatically notified,
So that I can manage my workflow efficiently.

**Acceptance Criteria:**

**Given** I am in BUSINESS mode (Story 8.8)
**When** a customer submits a booking
**Then** I receive a push notification "Nueva consulta de {customerName}" + the booking appears in my "Solicitudes" tab

**Given** I navigate to Solicitudes tab
**When** the screen loads
**Then** I see pending bookings sorted by date with customer name, vehicle (brand+model+plate), service requested, preferred date/time, optional notes, optional shared diagnostic chip

**Given** I tap a booking to view detail
**When** the screen loads
**Then** I see full request + customer profile mini-view + buttons: "Aceptar" (primary brand) + "Rechazar" (ghost)

**Given** I tap "Aceptar"
**When** mutation runs
**Then** booking status updates to "accepted" + customer receives push + email + status chip on customer side updates

**Given** I tap "Rechazar"
**When** flow opens
**Then** I see optional message field "Razón opcional para el cliente" + Confirm
**And** on confirm, status updates to "rejected" + customer notified with my message (if any)

**Given** I want to complete a booking after the appointment
**When** I tap "Marcar como completado" in detail view
**Then** status updates to "completed" + customer can leave review (post-MVP feature, schema-ready)

**Given** OBD2 sharing was enabled by customer
**When** I view the booking
**Then** I can read the shared OBD2 reading (Story 4.6 read-only) but not other vehicle data

**Given** Cloud Function security exists
**When** business attempts to read customer data outside booking
**Then** Rules deny (Layer 2 + 3) — defense in depth

---

### Story 8.7: Business↔Client Messaging

As a user (customer or business),
I want to send and receive messages within a booking thread,
So that we can clarify details without leaving the app.

**Acceptance Criteria:**

**Given** a booking exists with status "pending" or "accepted"
**When** I open the booking detail
**Then** I see a messaging thread at the bottom with input field

**Given** I type a message and tap send
**When** mutation runs
**Then** a doc is created at `bookings/{bid}/messages/{mid}` with `{ senderUid, body, sentAt: Timestamp, readAt?: null }`
**And** the recipient receives a push notification (if push category enabled)

**Given** the thread renders
**When** I scroll
**Then** messages are sorted ascending by sentAt with chat-bubble UI (sent right brand-soft, received left bg-elevated) + timestamps relative ("Hace 2 min")

**Given** I view received messages
**When** rendered
**Then** messages auto-mark `readAt: Timestamp.now()` on view (visible to sender as "Leído")

**Given** the booking is "rejected" or "completed"
**When** I open the detail
**Then** the messaging input is disabled (read-only thread) — historical context preserved

**Given** Security Rules ensure isolation
**When** any user not in the booking attempts to read messages
**Then** Rules deny — only userId and businessOwnerUid have read access

**Given** offline messaging
**When** I send while offline
**Then** message queues in AsyncStorage + syncs on reconnect with optimistic UI (sutil "Enviando..." chip until confirmed)

---

### Story 8.8: Role Switch CLIENT ↔ BUSINESS (ProfileMenuSheet)

As a user who is both a vehicle owner and a business owner (Carlos persona),
I want to switch between CLIENT and BUSINESS mode in 1 tap without re-login,
So that I can manage both contexts fluidly throughout the day.

**Acceptance Criteria:**

**Given** I have created a business profile (Story 8.1)
**When** I open ProfileMenuSheet (avatar tap top-right)
**Then** I see SegmentedControl pill toggle "Cliente / Negocio" highlighting current activeRole

**Given** I tap "Negocio"
**When** the action runs
**Then** SegmentedControl pill animates 320ms smooth + Zustand `useAuthStore.activeRole = "BUSINESS"` + AsyncStorage `motora.activeRole` persists

**Given** activeRole changes to BUSINESS
**When** UI rebuilds (navigation stack replace)
**Then** BottomNavWithFab adapts (per Story 2.6): Vehículos→Clientes, Diagnóstico→Solicitudes
**And** Dashboard adapts: shows "X clientes activos" + "Y solicitudes pendientes" instead of vehicle status

**Given** I tap "Cliente"
**When** action runs
**Then** activeRole switches back + UI reflows to CLIENT mode within 280ms

**Given** I close and reopen the app
**When** AsyncStorage hydrates
**Then** activeRole restores from `motora.activeRole` (no default to CLIENT if I last used BUSINESS)

**Given** I do NOT have a business profile yet
**When** ProfileMenuSheet renders
**Then** instead of toggle, I see CTA "Crear perfil de negocio" linking to Story 8.1 onboarding

**Given** my business profile is deleted/inactive while in BUSINESS mode
**When** the app detects state mismatch
**Then** auto-switch to CLIENT mode with toast "Tu perfil de negocio ya no está disponible · Volviste al modo Cliente"

**Given** visual differentiation
**When** I am in CLIENT mode
**Then** role chip in header is `brand.primary` blue
**Given** I am in BUSINESS mode
**When** rendered
**Then** role chip in header is `brand.metallic` silver

**Given** screen reader is enabled
**When** focus reaches the role toggle
**Then** announcement: "Modo actual: Cliente · Doble tap para cambiar a Negocio"

---

## Epic 9: Web Platform — Admin Backoffice & Public Landing

Construir la plataforma web con dos módulos: (1) Admin backoffice con Vite React + TanStack Router para que Dario monitoree KPIs (MAU, conversión, businesses, IA costs), gestione suscripciones, revise logs IA y edite usuarios/businesses; (2) Public landing con value proposition, explainer OBD2+IA, links de descarga a App Store/Google Play, términos y privacidad.

### Story 9.1: Web Stack Setup (Vite + TanStack Router/Query + TailwindCSS + tokens)

As a developer building the web platform,
I want a Vite React + TypeScript workspace that consumes shared design tokens and follows the same conventions as mobile,
So that I have pattern parity and can develop fast.

**Acceptance Criteria:**

**Given** the web workspace is initialized
**When** I run `pnpm --filter web dev`
**Then** Vite dev server starts with HMR + TypeScript strict mode + React 19

**Given** dependencies are configured
**When** I read `web/package.json`
**Then** I see: react 19, vite, typescript, zustand, @tanstack/react-query, @tanstack/react-router, tailwindcss, lucide-react, @motora/types (shared workspace), @motora/design-tokens (shared workspace)

**Given** the directory structure exists
**When** I list `web/src/`
**Then** I find: `main.tsx`, `App.tsx`, `routes/` (TanStack Router file-based with `__root.tsx`, `index.tsx`, `login.tsx`, `admin/_layout.tsx`), `modules/` (landing/, admin/), `shared/` (components, hooks, stores, api, theme)

**Given** TailwindCSS consumes design tokens
**When** I open `web/src/shared/theme/tailwind.css`
**Then** CSS vars from `@motora/design-tokens` are imported and Tailwind config maps tokens (no hex literals in JSX)

**Given** Inter + JetBrains Mono fonts are loaded
**When** any text renders
**Then** fonts load via `<link>` Google Fonts with preconnect

**Given** Firebase is integrated
**When** I open `web/src/shared/api/firebase.ts`
**Then** Firebase Web SDK initializes with same project as mobile + auth + Firestore + functions client

**Given** TanStack Query is configured
**When** I open `web/src/shared/api/queryClient.ts`
**Then** I see staleTime 5min default + same retry strategy as mobile (`useRetryStrategy()`)

**Given** GitHub Actions CI/CD pipeline exists
**When** a PR touches `web/`
**Then** lint + tsc + tests run + build succeeds before merge
**And** main branch deploys automatically to Vercel/Netlify (static)

**Given** primitives parity exists
**When** I list `web/src/shared/components/primitives/`
**Then** I find Button, Input, Modal, Card, DataTable, Skeleton, etc. with same APIs as mobile (CSS-based instead of RN-based)

---

### Story 9.2: Admin Authentication & Layout Guard

As an admin (Dario),
I want to log in to the admin web with my Firebase credentials and only access admin routes if I have admin role,
So that the backoffice is secured against unauthorized access.

**Acceptance Criteria:**

**Given** I navigate to `/admin/*`
**When** I am not authenticated
**Then** the layout guard redirects me to `/login` preserving the original URL as query param

**Given** I navigate to `/login`
**When** the screen loads
**Then** I see fields email + password + button "Iniciar sesión" + Google SSO option

**Given** I enter credentials and submit
**When** Firebase Auth signs me in
**Then** the app reads my user role from Firestore `users/{uid}/role` (or custom claim)
**And** if role is "ADMIN" or "SUPER_ADMIN", I'm redirected to `/admin/dashboard`
**And** if role is anything else, I see toast "No tenés acceso al backoffice" and remain logged out

**Given** I am authenticated as admin
**When** I navigate to any `/admin/*` route
**Then** the layout `routes/admin/_layout.tsx` renders with sidebar nav (Dashboard / Usuarios / Vehículos / IA Logs / Suscripciones / Businesses / Bookings) + topbar with avatar + logout

**Given** I tap logout
**When** confirmed
**Then** Firebase signs out + tokens cleared + redirect to `/login`

**Given** session expires (>30 days inactive)
**When** I attempt admin action
**Then** silent refresh tries first; if fails, soft logout with toast and redirect to login

**Given** Firestore Rules verify role
**When** any admin action invokes a Cloud Function
**Then** the function asserts admin role server-side via `assertAdmin(uid)` before executing — defense in depth

**Given** I keep the page open and an admin role is revoked
**When** the listener detects the change
**Then** UI auto-redirects to `/login` with toast "Tu acceso fue revocado"

---

### Story 9.3: Admin Dashboard with KPIs (MAU, conversion, businesses, IA cost)

As an admin (Dario, the founder),
I want a real-time dashboard with key business metrics,
So that I can monitor product health and make data-driven decisions.

**Acceptance Criteria:**

**Given** I navigate to `/admin/dashboard`
**When** the screen loads
**Then** I see KPI cards in a grid: MAU (count vs target 500) + Free→Premium conversion % (vs target 5%) + Businesses activos (vs target 10) + IA cost MTD (USD) + revenue MTD

**Given** each KPI card renders
**When** I see one
**Then** it shows: label + large mono number + delta vs previous period (chip green/red) + sparkline mini-chart

**Given** I click a KPI card
**When** drill-down navigates
**Then** I see a detailed view with chart over time + breakdown segments + filters

**Given** charts are powered by aggregated stats
**When** the dashboard loads
**Then** TanStack Query fetches from Cloud Function `getAdminMetrics` with date range params + caching staleTime 5min

**Given** real-time monitoring of IA cost
**When** I view IA cost section
**Then** it shows: total cost MTD + total calls + cost per call avg + cost vs revenue ratio (alarm if > 50%)

**Given** the dashboard updates in near-real-time
**When** new events occur (new user, IA call, payment)
**Then** Firestore listeners refresh affected KPIs without manual reload (where feasible)

**Given** I select a date range filter
**When** the filter applies
**Then** all KPIs and charts recompute for the selected range (today / 7d / 30d / custom)

**Given** I want to drill into a specific cohort
**When** I click "Ver usuarios que llegaron a paywall"
**Then** I land on Users list filtered by that cohort criteria (Story 9.4)

---

### Story 9.4: Admin User & Subscription Management

As an admin,
I want to search, filter, view, and edit user records — including subscription status overrides for support cases,
So that I can resolve customer issues without engineering involvement.

**Acceptance Criteria:**

**Given** I navigate to `/admin/users`
**When** the page loads
**Then** I see a paginated DataTable with columns: avatar + email + name + role + tier + status + signupDate + last activity
**And** filters: tier (Free/Premium/Business/Admin) + status (active/suspended) + search (email contains)

**Given** I click a user row
**When** drill-down navigates
**Then** I see user detail with profile + vehicles + subscription history + AI usage history + support notes

**Given** I tap "Editar perfil"
**When** EditFormModal opens
**Then** I can edit name + role (admin override) + status + add internal note
**And** save triggers Cloud Function `updateUserAdmin` with audit log entry

**Given** I tap "Activar/Desactivar suscripción"
**When** the action runs
**Then** ConfirmationModal appears + on confirm Cloud Function `setSubscriptionAdmin({ uid, tier, durationDays })` runs (e.g., grant Premium 30 days for support resolution)
**And** subscription doc updates + user is notified via email (Epic 7)

**Given** an admin override happens
**When** logged
**Then** an audit entry is created at `auditLogs/{logId}` with `{ adminUid, targetUid, action, before, after, reason, timestamp }`

**Given** RBAC enforcement
**When** a non-admin attempts to call admin Cloud Functions
**Then** Rules + assertAdmin denies with `HttpsError("permission-denied", "No tenés permisos de administrador")`

**Given** I navigate to `/admin/subscriptions`
**When** loaded
**Then** I see a table of all subscriptions with similar filtering + ability to manually mark expired/active for billing edge cases

---

### Story 9.5: Admin IA Logs & Cost Monitoring

As an admin,
I want a detailed view of AI usage logs and cost trends,
So that I can monitor abuse, optimize costs, and ensure margin viability.

**Acceptance Criteria:**

**Given** I navigate to `/admin/ia-logs`
**When** the page loads
**Then** I see filters: date range + tier + DTC code + per-user search
**And** a table of AI calls with columns: timestamp + user + DTC + tokens used + cost + duration + status

**Given** charts above the table
**When** rendered
**Then** I see: daily cost trend (line) + top 10 DTCs analyzed (bar) + cost per tier (pie) + average response time (line)

**Given** I detect an outlier user (high usage)
**When** I click their row
**Then** drill-down shows their full AI history + ability to set custom rate-limit override

**Given** the data source is `aiUsage/` collection
**When** queries execute
**Then** Cloud Function `getAIUsageStats` (from Story 5.4) aggregates and serves data with composite indexes for fast queries

**Given** alerting is configured
**When** daily cost exceeds budget threshold (configurable)
**Then** Cloud Logging triggers an alert email to admin

**Given** I want to export
**When** I click "Exportar CSV"
**Then** the current filtered view exports to CSV with all columns

---

### Story 9.6: Public Landing — Hero, OBD2 Explainer, Downloads, Legal

As a potential customer (or visitor) discovering Motora online,
I want a marketing landing that clearly explains the value, shows how OBD2+IA works, and provides download links + legal pages,
So that I can decide to download the app and trust the brand.

**Acceptance Criteria:**

**Given** I navigate to root URL `/`
**When** the landing loads
**Then** I see Hero section with brand logo + headline value prop + sub + primary CTA "Descargar app" + visual mockup

**Given** I scroll down
**When** sections render with fade-up cascade
**Then** I see: "Cómo funciona" (3 steps with icons + screenshots) + "El Negro IA" (explainer with avatar) + "Tarifas" (Free vs Premium pricing card) + "Para talleres" (B2B value prop) + footer

**Given** the OBD2 explainer section renders
**When** I scroll to it
**Then** I see animated diagram showing: phone + ELM327 + auto + arrows showing data flow + IA insight bubble

**Given** the download CTAs render
**When** I tap them
**Then** App Store badge links to apps.apple.com/.../motora-ia + Google Play badge links to play.google.com/.../motora-ia

**Given** I navigate to `/terminos`
**When** loaded
**Then** I see full T&C in es-AR (Argentine law) — content static MD-converted

**Given** I navigate to `/privacidad`
**When** loaded
**Then** I see privacy policy explaining data collection (OBD2 + IA proxying + Firebase storage) + user rights + contact

**Given** the landing is responsive
**When** I view on mobile web (Tailwind sm breakpoint)
**Then** layout reflows to single column + hero adapts + downloads remain prominent

**Given** SEO meta tags are configured
**When** crawlers visit
**Then** title, description, og:image, twitter:card are set per page in `<head>` via TanStack Router meta

**Given** Web vitals targets
**When** measured via Lighthouse
**Then** LCP <2.5s + FID <100ms + CLS <0.1 for landing page (UX-DR106)

**Given** the static deploy is configured
**When** changes merge to main
**Then** GitHub Actions builds + deploys to Vercel/Netlify with cache invalidation

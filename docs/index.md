# Índice de Documentación — Motora IA

**Proyecto:** Plataforma Integral Automotriz + OBD2 + IA  
**Última actualización:** 2026-04-12  
**Versión de documentación:** 2.0  
**Lenguaje:** Español

---

## 📋 Descripción General del Proyecto

Motora es una plataforma multiplataforma que actúa como **historia clínica digital** para vehículos, **gestor de mantenimiento** y **lector de telemetría OBD2**. Conecta propietarios de vehículos (role CLIENT) con negocios del sector (role BUSINESS) mediante un sistema de autenticación unificado con cambio de perfil sin necesidad de re-login.

### Estadísticas del Proyecto

- **Partes:** 2 (Mobile + Backend)
- **Líneas de código:** ~2500+ (sin node_modules)
- **Cloud Functions:** 25+ endpoints callable
- **Colecciones Firestore:** 6 (users, vehicles + 4 subcolecciones por vehículo)
- **Stack Principal:** React Native, Firebase, Node.js 22
- **Fase Actual:** 7 (Integración OBD2 Real)

---

## 📚 Documentación Disponible

### 1. **Contexto y Reglas del Proyecto**

| Documento | Propósito | Audiencia |
|---|---|---|
| [`project-context.md`](./project-context.md) | **Reglas críticas para IA/developers.** Patrones obligatorios, convenciones de código, manejo de errores, patrones de arquitectura. | Developers, IA agents |
| [`motora-context.md`](./motora-context.md) | **Visión de negocio y estado actual.** Qué es Motora, en qué fase estamos, qué ya está hecho. | Product managers, stakeholders |
| [`project-fase*.md`](./project_fase45_refinamiento.md) | **Registro de fases completadas.** Documentación incremental de cada fase de desarrollo. | Auditoría, histórico |

### 2. **Arquitectura y Diseño**

| Documento | Descripción |
|---|---|
| **[`mobile-architecture.md`](./mobile-architecture.md)** | Arquitectura completa de la app móvil (React Native + Expo). Estructura de directorios, state management (Zustand), routing, Firebase integration, módulo OBD2, flujos de usuario. |
| **[`backend-architecture.md`](./backend-architecture.md)** | Arquitectura de Cloud Functions (Node.js + TypeScript). Controllers, services, modelos Firestore, validación Zod, integración IA (Vercel AI SDK). |

### 3. **Características Específicas**

| Documento | Tema |
|---|---|
| [`diagnostico-obd2.md`](./diagnostico-obd2.md) | Módulo OBD2: protocolo ELM327, Strategy Pattern, comandos soportados, flujo de diagnóstico. |
| [`APP vehiculos.md`](./APP%20vehiculos.md) | Gestión de vehículos en la app: pantallas, flujos, datos persistidos. |
| [`frontend.md`](./frontend.md) | Componentes UI, patrones de desarrollo, manejo de formularios. |
| [`backend.md`](./backend.md) | Endpoints, Cloud Functions callable, validación de datos. |

---

## 🗂️ Estructura de Directorios del Proyecto

```
motora-ia/
├── mobile/                               # App React Native + Expo
│   ├── app/                             # Routing (Expo Router)
│   ├── src/
│   │   ├── features/diagnostics/        # Módulo OBD2
│   │   ├── services/firebase/           # Integración Firebase
│   │   └── shared/                      # Componentes, stores, utils compartidos
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
│
├── functions/                            # Backend Cloud Functions
│   ├── src/
│   │   ├── controllers/                 # HTTP endpoints
│   │   ├── services/                    # Lógica de negocio
│   │   └── models/                      # Tipos Firestore
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                                 # Documentación (este directorio)
│   ├── index.md                         # Este archivo
│   ├── project-context.md               # Reglas del proyecto
│   ├── mobile-architecture.md
│   ├── backend-architecture.md
│   ├── motora-context.md
│   ├── diagnostico-obd2.md
│   └── ...
│
└── README.md                             # Descripción general del repo
```

---

## 🔑 Conceptos Clave

### Stack Tecnológico

**Mobile:**
- React Native 0.83.2 + Expo 55.0.8
- Expo Router (file-based routing)
- Zustand (state management) + TanStack Query (server state)
- Firebase Auth + Firestore client
- react-native-bluetooth-classic (OBD2)

**Backend:**
- Node.js 22 + Firebase Cloud Functions v2
- TypeScript 5.7.3 (strict mode)
- Firestore (NoSQL database)
- Vercel AI SDK + OpenAI gpt-4o-mini

### Modelos de Datos Principales

```
users/
  ├─ uid (document ID)
  ├─ profile { name, gender, age, country, activeRole }
  ├─ stats { vehicleCount, businessCount, aiTaskCount, lastAiUsage }
  ├─ subscriptionTier (FREE | PREMIUM)
  └─ timestamps

vehicles/{vehicleId}/
  ├─ id, ownerId
  ├─ data { brand, model, year, licensePlate, currentKm }
  ├─ maintenanceLog/{entryId} (subcolección)
  ├─ tasks/{taskId} (subcolección)
  ├─ odb2Diagnostics/{diagnosticId} (subcolección)
  └─ documents/{docId} (subcolección)
```

### Roles y Tiers

| Rol | Descripción | Tier |
|---|---|---|
| **CLIENT** | Propietario de vehículos | FREE (2 vehículos) / PREMIUM (∞) |
| **BUSINESS** | Taller / negocio automotriz | — (futuro) |

### Flujos Críticos

1. **Autenticación:** Firebase Auth → trigger `onUserCreated` → documento user en Firestore
2. **Gestión de Vehículos:** CRUD local (Zustand) + sync remoto (TanStack Query + Cloud Functions)
3. **Diagnóstico OBD2:** Bluetooth connection → telemetry polling → DTC scan → save to Firestore + IA interpretation
4. **IA (PREMIUM):** Sugerencia de mantenimiento via Vercel AI SDK (gpt-4o-mini con prompt "Mecánico de Córdoba")

---

## 🚀 Guía de Inicio Rápido

### Desarrolladores Nuevos

1. **Leer primero:**
   - [`project-context.md`](./project-context.md) — Entender reglas obligatorias
   - [`motora-context.md`](./motora-context.md) — Visión general

2. **Según tu área:**
   - **Mobile:** [`mobile-architecture.md`](./mobile-architecture.md)
   - **Backend:** [`backend-architecture.md`](./backend-architecture.md)

3. **Detalles específicos:**
   - OBD2: [`diagnostico-obd2.md`](./diagnostico-obd2.md)
   - Features: otros `.md` en `docs/`

### Ejecutar Localmente

**Backend:**
```bash
cd functions
npm install
npm run build
npm run serve  # Firebase Emulator
```

**Mobile:**
```bash
cd mobile
npm install
expo start      # Expo dev server
npx expo run:android  # o :ios
```

---

## 💡 Patrones Importantes

### State Management

- **Zustand stores:** `useAuthStore`, `useVehicleStore`, `useDiagnosticStore`
- **TanStack Query:** Caché inteligente de datos remotos
- **AsyncStorage:** Persistencia local (activeRole, tokens)

### Validación

- **Backend:** Zod schemas para todas las entradas
- **Mobile:** Validación inline en formularios + errores backend con toasts

### Manejo de Errores

- **Backend:** `HttpsError` siempre (con código + msg español)
- **Mobile:** 
  - Errores validación → inline bajo campo
  - Errores backend → Toast (showToast con "error")

### Cloud Functions Pattern

```typescript
export const functionNameHandler = onCall(
  { region: "us-central1" },
  async (request: CallableRequest<InputType>) => {
    // 1. Autenticación
    assertAuth(request);
    const uid = request.auth!.uid;
    
    // 2. Validación
    const validated = SomeSchema.parse(request.data);
    
    // 3. Lógica (delegada a service)
    return someService.operation(uid, validated);
  }
);
```

---

## 📊 Documentación por Fase

### Fase Completadas

| Fase | Descripción | Docs |
|---|---|---|
| **1-2** | Setup inicial, Auth, CRUD básico | `project_fase*` |
| **3-4** | Vehículos, Mantenimiento, Edición avanzada | `project_fase*` |
| **5** | Auditoría de optimización, cleanup | `project_auditoria_optimizacion.md` |
| **6** | IA: Sugerencias de tareas (gpt-4o-mini) | `project_fase6_ia_tasks.md` |
| **7** | OBD2 Real (Bluetooth, Strategy Pattern) | `project_fase7_obd2_real.md`, `diagnostico-obd2.md` |

---

## 🔗 Documentos por Caso de Uso

### "Quiero agregar una nueva pantalla en la app móvil"

1. Lee: [`project-context.md`](./project-context.md) (convenciones)
2. Lee: [`mobile-architecture.md`](./mobile-architecture.md) (estructura Expo Router, Zustand)
3. Crea pantalla en `app/(app)/` con estructura feature-folder
4. Usa componentes reutilizables de `src/shared/components`

### "Quiero crear una nueva Cloud Function"

1. Lee: [`project-context.md`](./project-context.md) (reglas IA, validación)
2. Lee: [`backend-architecture.md`](./backend-architecture.md) (pattern controllers → services)
3. Crea controller en `functions/src/controllers/`
4. Implementa service en `functions/src/services/`
5. Exporta en `functions/src/index.ts`
6. Llama desde mobile vía `callFn(FUNCTION_NAMES.XXX)`

### "Necesito integrar una nueva API"

1. Backend: Crear Cloud Function callable
2. Mobile: Agregar `FUNCTION_NAME` en `src/services/firebase/functions.ts`
3. Mobile: Usar TanStack Query `useMutation` con invalidación de caché

### "Quiero entender el flujo OBD2"

1. Lee: [`diagnostico-obd2.md`](./diagnostico-obd2.md)
2. Lee: `useObdData` en [`mobile-architecture.md`](./mobile-architecture.md) sección 8
3. Revisa: `src/features/diagnostics/services/obd/`

---

## 📝 Checklist de Implementación

### Antes de hacer PR:

- ✅ TypeScript strict mode (no `any`)
- ✅ Validación con Zod (backend) o inline (mobile)
- ✅ Manejo de errores (HttpsError backend, showToast mobile)
- ✅ Invalidación de TanStack Query si hay mutación
- ✅ Componentes reutilizables en `shared/`
- ✅ Nombres en español donde corresponde (prompts, mensajes UI)
- ✅ Tests (si aplica)

---

## 🐛 Troubleshooting

### Firebase Emulator no funciona

```bash
# Verificar que los puertos estén libres
lsof -i :9099   # Auth
lsof -i :8080   # Firestore
lsof -i :5001   # Functions

# Limpiar y reiniciar
firebase emulators:start --import=./seed-data
```

### Compilación TypeScript fallando

```bash
# Backend
cd functions && npm run build

# Mobile
cd mobile && npx tsc --noEmit
```

### TanStack Query no invalida caché

```typescript
// Verificar que invalidateQueries() se llama en onSuccess
queryClient.invalidateQueries({ queryKey: ["vehicles"] });

// No olvidar reseteador de estado Zustand
vehicleStore.addVehicle(newVehicle);
```

---

## 📞 Contacto y Ayuda

- **Tech Lead:** Dario Tamburello
- **Slack:** #motora-dev
- **Docs:** Este índice + archivos `.md` en `docs/`

---

## 📌 Próximas Mejoras (Roadmap)

- [ ] iOS BLE (reemplazar `BleStrategy` placeholder)
- [ ] Push Notifications (FCM reminders)
- [ ] Offline Sync (SQLite local)
- [ ] Businesses & Appointments
- [ ] Dark Mode themes
- [ ] Internationalization (i18n)
- [ ] Analytics & Logging

---

## 📖 Referencias Externas

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Docs](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [Zod Validation](https://zod.dev)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [TanStack Query](https://tanstack.com/query)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [ELM327 OBD2 Protocol](https://www.scantool.net/elm327/)

---

**Versión:** 2.0 | **Actualizado:** 2026-04-12 | **Estado:** Documentación Completa

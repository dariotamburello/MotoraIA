# Arquitectura Mobile — Motora (React Native + Expo)

**Última actualización:** 2026-04-12  
**Versión:** 1.0  
**Lenguaje:** Español

---

## 1. Resumen Ejecutivo

La aplicación móvil Motora es una app nativa multiplataforma (iOS/Android) construida con **React Native 0.83.2** y **Expo 55.0.8**. Implementa una arquitectura de navegación de **Stack + Tabs anidados** con gestión de estado centralizada en **Zustand**, sincronización de datos en tiempo real con **TanStack Query**, y comunicación con Firebase mediante **Cloud Functions callable**.

### Características Principales
- **Autenticación:** Firebase Auth con guard centralizado en el root layout
- **Gestión de Vehículos:** CRUD con validación de límites por tier (FREE: 2, PREMIUM: ∞)
- **Diagnóstico OBD2:** Integración Bluetooth Real (Android) y Mock (desarrollo)
- **Inteligencia Artificial:** Interpretación de códigos DTC y sugerencias de mantenimiento (PREMIUM)
- **Historial de Mantenimiento:** Registro de servicios, costos y notas
- **Roles Duales:** Switch de Perfil (CLIENT ↔ BUSINESS) sin re-login

---

## 2. Stack Tecnológico

| Componente | Versión | Propósito |
|---|---|---|
| **React Native** | 0.83.2 | Framework base multiplataforma |
| **Expo** | 55.0.8 | Toolchain, CLI y runtime |
| **Expo Router** | 55.0.7 | Enrutamiento (file-based, tipo Next.js) |
| **Zustand** | 5.0.12 | State management (auth, vehicles, diagnostics) |
| **TanStack Query** | 5.95.2 | Server state sync, caché inteligente |
| **Firebase** | 12.11.0 | Auth + Firestore client + Cloud Functions |
| **TypeScript** | 5.9.2 | Tipado estricto (strict mode) |
| **react-native-bluetooth-classic** | 1.73.0 | Conexión OBD2 (Android, BLE pending iOS) |
| **@react-native-async-storage** | 2.2.0 | Persistencia de estado local |
| **lucide-react-native** | 1.7.0 | Íconos vectoriales |

---

## 3. Estructura de Directorios

```
mobile/
├── app/                           # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout + Firebase Auth listener
│   ├── (auth)/                   # Grupo privado: Sin autenticación
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # WelcomeScreen
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── onboarding-profile.tsx # Paso 2: Completar perfil
│   │   └── onboarding-vehicle.tsx # Paso 3: Agregar primer vehículo (opcional)
│   │
│   └── (app)/                    # Grupo privado: Requiere autenticación
│       ├── _layout.tsx           # Stack raíz (contiene tabs anidados)
│       ├── (tabs)/               # Tabs anidadas
│       │   ├── _layout.tsx       # BottomTabNavigator
│       │   ├── index.tsx         # Home (Dashboard con últimas acciones)
│       │   ├── vehicles.tsx      # Galería de vehículos
│       │   ├── diagnostics.tsx   # Histórico de diagnósticos
│       │   └── profile.tsx       # Perfil de usuario + Switch de rol
│       │
│       ├── add-vehicle.tsx       # Modal de agregar vehículo (Stack screen)
│       ├── vehicle-detail/       # Detalle de vehículo (Stack screen)
│       │   ├── [id].tsx
│       │   └── _components/      # Subcomponentes (tabs internas)
│       │       ├── DiagnosticsTab.tsx
│       │       ├── DocumentsTab.tsx
│       │       ├── MaintenanceTab.tsx
│       │       └── TasksTab.tsx
│       │
│       ├── add-maintenance/[vehicleId].tsx
│       ├── add-task/[vehicleId].tsx
│       ├── add-document/[vehicleId].tsx
│       ├── diagnostics/          # Flujo de diagnóstico OBD2
│       │   ├── live-session.tsx  # Pantalla de escaneo en vivo
│       │   └── detail.tsx        # Detalle de diagnóstico
│       │
│       └── subscription-prompt.tsx
│
├── src/                          # Lógica de aplicación
│   ├── features/                 # Feature folders (módulos)
│   │   └── diagnostics/          # Módulo OBD2 completo
│   │       ├── components/       # Componentes reutilizables (GaugeCard, etc.)
│   │       ├── hooks/            # useObdData (hook principal)
│   │       ├── services/         # OBD2Service, Strategy Pattern
│   │       ├── stores/           # useDiagnosticStore (Zustand)
│   │       └── types.ts          # Tipos locales
│   │
│   ├── services/                 # Servicios compartidos
│   │   └── firebase/
│   │       ├── config.ts         # Inicialización Firebase
│   │       ├── auth.ts           # Helpers de autenticación
│   │       ├── firestore.ts      # Operaciones Firestore
│   │       ├── functions.ts      # Factory callFn + FUNCTION_NAMES
│   │       └── index.ts          # Exports
│   │
│   └── shared/                   # Componentes + stores compartidos
│       ├── components/
│       │   ├── AppInput.tsx      # Input reutilizable
│       │   ├── AppSelect.tsx     # Select reutilizable
│       │   ├── AppDatePicker.tsx
│       │   ├── ConfirmationModal.tsx
│       │   ├── EditFormModal.tsx
│       │   ├── ToastProvider.tsx
│       │   └── ProfileSwitcherButton.tsx
│       ├── stores/
│       │   ├── useAuthStore.ts   # Auth global + activeRole
│       │   └── useVehicleStore.ts # Vehículos + selección actual
│       ├── constants/
│       │   ├── countries.ts
│       │   ├── dtcCodes.ts
│       │   └── vehiclesData.ts
│       ├── utils/
│       │   └── vehicleImages.ts
│       └── theme/
│           └── appTheme.ts
│
├── app.json                      # Configuración Expo (permisos, esquema, etc.)
├── package.json
├── tsconfig.json
└── node_modules/
```

---

## 4. Flujo de Navegación (Routing)

### 4.1 Guard Centralizado (`app/_layout.tsx`)

```
┌─────────────────────────────────────────────────────┐
│ onAuthStateChanged (Firebase)                        │
│ → setUser, setInitialized                            │
└────────────────────────────────────────────────────┐
                                                      │
    ┌─────────────────────────────────────────────────┘
    │
    └─→ useAuthGuard() (useEffect en root)
        ├─ !isInitialized?          → no hacer nada (esperar Firebase)
        ├─ !user                    → /(auth)/
        ├─ user && !displayName      → /(auth)/onboarding-profile
        ├─ user && displayName       → /(app)/(tabs)/
        └─ (lógica especial para onboarding-vehicle)
```

**Puntos clave:**
- Única fuente de verdad: `useAuthStore` (Zustand)
- El guard se ejecuta en cada cambio de segmento (navegación)
- `isInitialized` flag previene redireccionamientos iniciales

### 4.2 Estructura de Grupos

```
app/
├── (auth)              ← Grupo privado (sin autenticación)
│   └── Stack
│       ├── Welcome
│       ├── Login / Register
│       └── Onboarding
│
└── (app)              ← Grupo privado (requiere autenticación)
    └── Stack
        ├── (tabs)    ← Nested Tabs (Home, Vehicles, Diagnostics, Profile)
        └── Screens   ← Sin tab bar (AddVehicle, VehicleDetail, etc.)
```

---

## 5. Gestión de Estado (Zustand)

### 5.1 useAuthStore

**Propósito:** Sincronizar estado de autenticación en toda la app.

```typescript
interface AuthState {
  user: User | null;                      // Firebase Auth user
  activeRole: "CLIENT" | "BUSINESS";      // Rol actual
  availableRoles: ActiveRole[];           // Roles desbloqueados
  isInitialized: boolean;                 // Firebase listener disparó?
  hasProfile: boolean | null;             // Documento Firestore existe?
  
  // Mutaciones
  setUser(user);
  setActiveRole(role);                    // Persiste en AsyncStorage
  toggleRole();
  reset();                                // Al logout
}
```

**Persistencia:**
- `activeRole` → AsyncStorage con clave `motora_active_role_{uid}`
- Se restaura al abrir la app (en `app/_layout.tsx`)

### 5.2 useVehicleStore

**Propósito:** Caché local de vehículos del usuario.

```typescript
interface VehicleState {
  vehicles: VehicleSummary[];             // Lista de vehículos
  selectedVehicle: VehicleSummary | null; // Vehículo actual
  isLoading: boolean;
  
  // Mutaciones
  setVehicles(vehicles);
  addVehicle(vehicle);
  updateVehicle(id, patch);
  removeVehicle(id);
  selectVehicle(vehicle);
}
```

**Actualización:**
- Se carga en `useQueries` (TanStack Query) en `HomeScreen` y `VehiclesScreen`
- Se invalida tras crear/editar/eliminar un vehículo

### 5.3 useDiagnosticStore

**Propósito:** Estado de sesión de diagnóstico OBD2 (sesión actual, no persistente).

```typescript
interface DiagnosticState {
  status: "disconnected" | "connecting" | "connected" | "scanning";
  liveData: LiveTelemetryData | null;     // RPM, velocidad, temp, etc.
  foundDTCs: string[];                    // Códigos de error encontrados
  scanCompleted: boolean;
  supportedPids: Set<string>;
  fuelType: FuelType;
  odometer: number | null;
}
```

**Ciclo de vida:**
- Resetea al desmontar el componente o al presionar "desconectar"
- No persiste (sesión OBD2 es efímera)

---

## 6. Sincronización de Datos (TanStack Query)

### 6.1 Configuración Global

```typescript
// app/_layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,  // 5 minutos antes de marcar stale
    },
  },
});
```

### 6.2 Queries Principales

| Query Key | Endpoint | Caché | Uso |
|---|---|---|---|
| `["userProfile"]` | `getUserProfileHandler` | 5 min | Datos perfil, tier, roles |
| `["vehicles"]` | `getUserVehiclesHandler` | 5 min | Lista de vehículos |
| `["vehicle", id]` | `getMaintenanceLogHandler` | 5 min | Detalle + historial |
| `["obd2", vehicleId]` | `getOdb2DiagnosticsHandler` | 5 min | Histórico de diagnósticos |

### 6.3 Invalidación de Caché

```typescript
// Después de crear vehículo:
const { mutate: addVehicle } = useMutation({
  mutationFn: (data) => callFn<VehicleData, VehicleDocument>(FUNCTION_NAMES.ADD_VEHICLE)(data),
  onSuccess: (newVehicle) => {
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    vehicleStore.addVehicle(newVehicle);
  },
});
```

---

## 7. Integración Firebase

### 7.1 Configuración (`src/services/firebase/config.ts`)

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const functions = getFunctions(app);

// En desarrollo (emulador):
if (process.env.EXPO_PUBLIC_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}
```

### 7.2 Factory de Cloud Functions (`src/services/firebase/functions.ts`)

```typescript
export function callFn<TInput, TOutput>(name: string) {
  return (data: TInput): Promise<TOutput> =>
    httpsCallable<TInput, TOutput>(functions, name)(data)
      .then((response) => response.data);
}

export const FUNCTION_NAMES = {
  GET_USER_PROFILE: "getUserProfileHandler",
  ADD_VEHICLE: "addVehicleHandler",
  SUGGEST_MAINTENANCE_TASK: "suggestMaintenanceTaskHandler",
  INTERPRET_DIAGNOSTIC: "interpretDiagnostic",
  // ...
} as const;
```

**Uso:**
```typescript
const result = await callFn<VehicleData, VehicleDocument>(
  FUNCTION_NAMES.ADD_VEHICLE
)({ brand: "Fiat", model: "Cronos", ... });
```

---

## 8. Módulo OBD2 (Diagnóstico)

### 8.1 Arquitectura Strategy Pattern

```
┌─────────────────────────────────────┐
│        useObdData (Hook)             │
│  ↓ callback: connect/disconnect     │
│  ↓ polling: startLiveTelemetry      │
│  ↓ scan: scanDTCs                   │
└─────────────────┬───────────────────┘
                  │
        ┌─────────▼──────────┐
        │   OBD2Service      │
        │  (Facade)          │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────────────┐
        │  IBluetoothStrategy         │
        │  (interfaz)                 │
        └─────────┬───────────────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
   ▼             ▼              ▼
BluetoothClassic  BLE         Mock
(Android)       (iOS)       (Desarrollo)
```

### 8.2 Hook useObdData

**Responsabilidades:**
- Preflight (permisos → BT → dispositivo)
- Conexión (handshake ELM327)
- Polling de telemetría
- Escaneo de DTCs

**Propiedades retornadas:**

```typescript
interface ObdHookReturn {
  // Estado del store global
  status: DiagnosticStatus;
  liveData: LiveTelemetryData | null;
  foundDTCs: string[];
  
  // Control de sesión
  isLowQualityAdapter: boolean;
  adapterName: string | null;
  
  // Pre-conexión
  preflightStatus: PreflightStatus;  // permisos, BT, dispositivo
  connectStep: ConnectStep | null;   // Paso actual del handshake
  connectionError: string | null;
  
  // Acciones
  connect(): Promise<void>;
  disconnect(): void;
  scanDTCs(): Promise<void>;
  rescan(): void;
  requestPermissions(): Promise<void>;
  openBluetoothSettings(): Promise<void>;
}
```

### 8.3 Flujo de Conexión

```
1. checkPreflight() [en useFocusEffect]
   ├─ Permisos (BLUETOOTH, LOCATION)
   ├─ BT habilitado?
   └─ Dispositivo OBD2 emparejado?

2. connect() [al presionar botón]
   ├─ Re-validar permisos + BT
   ├─ Encontrar dispositivo OBD2
   ├─ connectBluetooth()
   │  └─ Handshake ELM327
   │     ├─ reset
   │     ├─ version + identificación
   │     ├─ protocolo auto
   │     └─ suporte PIDs
   ├─ startLiveTelemetry() [polling cada 500ms]
   │  └─ Lee RPM, velocidad, temperatura, etc.
   └─ setStatus("connected")

3. scanDTCs()
   ├─ Comando OBD2 "0101" → lista de PIDs soportados
   ├─ Comando "03" → Lee DTC (modo real)
   ├─ parseadas + filtradas
   └─ setFoundDTCs(codes)
```

### 8.4 Componentes OBD2

- **BatteryGaugeCard, CoolantTempGaugeCard, FuelGaugeCard, OilTempGaugeCard:** Visualizan telemetría en tiempo real
- **OBD2DebugModal:** Muestra comandos crudos y respuestas (modo debug)
- **OBD2Parser:** Parsea respuestas de protocolo ELM327
- **CommandQueue:** Encola comandos OBD2 para evitar race conditions

---

## 9. Flujos de Usuario Principales

### 9.1 Flujo de Autenticación

```
WelcomeScreen
  ↓
Login / Register
  ↓
onboarding-profile (Completa perfil: nombre, género, edad, país)
  ↓
onboarding-vehicle (Opcional: agregar primer vehículo)
  ↓
HomeScreen (Dashboard)
```

### 9.2 Flujo de Gestión de Vehículos

```
VehiclesScreen
  ├─ Galería de vehículos (TanStack Query: ["vehicles"])
  │
  ├─ Agregar: add-vehicle.tsx
  │   └─ Validación en client + backend (limit tier)
  │
  ├─ Detalle: vehicle-detail/[id].tsx
  │   ├─ Información general
  │   ├─ Mantenimiento (sub-tab)
  │   ├─ Documentos (sub-tab)
  │   ├─ Diagnósticos (sub-tab)
  │   └─ Tareas pendientes (sub-tab)
  │
  └─ Editar / Eliminar (Modal reutilizable)
```

### 9.3 Flujo de Diagnóstico OBD2

```
DiagnosticsScreen (histórico)
  ↓
Presionar "Iniciar nueva sesión"
  ↓
Checklist Preflight (permisos → BT → dispositivo)
  ↓
live-session.tsx (si todo ✓)
  ├─ Visualizar telemetría en vivo
  ├─ Presionar "Escanear DTCs"
  ├─ Mostrar códigos encontrados
  └─ Opciones:
      ├─ Guardar diagnóstico → Firestore
      ├─ Interpretar con IA (PREMIUM)
      └─ Desconectar
```

### 9.4 Flujo de Sugerencia de Tareas (IA - PREMIUM)

```
vehicle-detail/[id].tsx
  └─ Botón "Sugerir mantenimiento" (ícono mágico 🪄)
      ↓
      callFn(FUNCTION_NAMES.SUGGEST_MAINTENANCE_TASK)
      ↓
      Backend (IA):
        ├─ Verifica tier PREMIUM
        ├─ Analiza historial de vehículo
        ├─ Genera sugerencia con prompt "Mecánico de Córdoba"
        └─ Retorna: { type, description, recommendedDate, explanation }
      ↓
      Modal de resultado
      ├─ Muestra sugerencia
      └─ Opción de agregar como tarea
```

---

## 10. Componentes Reutilizables

| Componente | Props | Propósito |
|---|---|---|
| `AppInput` | label, value, onChangeText, error, placeholder | Input de texto reutilizable |
| `AppSelect` | label, value, options, onSelect, error | Dropdown reutilizable |
| `AppDatePicker` | label, value, onChange | Selector de fecha |
| `ConfirmationModal` | title, message, onConfirm, onCancel | Modal de confirmación genérica |
| `EditFormModal` | title, fields, onSubmit, initialValues | Modal para editar datos |
| `ToastProvider` | — | Proveedor de notificaciones (Snackbars) |
| `ProfileSwitcherButton` | — | Botón para cambiar role CLIENT ↔ BUSINESS |

---

## 11. Manejo de Errores y Toasts

### 11.1 Errores de Validación (En Formularios)

```typescript
// AppInput detecta error inline
<AppInput
  label="Nombre"
  value={name}
  onChangeText={(text) => {
    setName(text);
    setNameError(text.trim() ? "" : "Campo obligatorio");
  }}
  error={nameError}
/>
```

### 11.2 Errores de Backend (Cloud Functions)

```typescript
try {
  const result = await callFn<VehicleData>(FUNCTION_NAMES.ADD_VEHICLE)(data);
  showToast("Vehículo agregado exitosamente", "success");
} catch (error) {
  const msg = error instanceof HttpsError ? error.message : "Error desconocido";
  showToast(msg, "error");
}
```

**Importante:** Nunca mezclar validación local con errores de backend. La UI siempre refleja ambos contextos correctamente.

---

## 12. Consideraciones de Performance

### 12.1 Optimizaciones Implementadas

1. **TanStack Query:** Caché inteligente, reutilización de datos, deduplicación
2. **Zustand:** Suscripciones selectivas (no todos los componentes se re-renderizan)
3. **useMemo:** En listas grandes y cálculos costosos
4. **React.memo:** En componentes que reciben props estables
5. **Lazy Loading:** Pantallas cargadas bajo demanda vía Expo Router

### 12.2 AsyncStorage Persistence

- `activeRole` (pequeño JSON)
- No persistir vehículos completos (usar TanStack Query + Firestore como SSOT)

---

## 13. Testing & Debugging

### 13.1 Emulator vs Mock

```typescript
// .env
EXPO_PUBLIC_OBD2_MOCK=true   // Mock (desarrollo sin hardware)
EXPO_PUBLIC_OBD2_MOCK=false  // Real (hardware OBD2 conectado)
EXPO_PUBLIC_USE_EMULATOR=true // Firebase Emulator
```

### 13.2 OBD2DebugModal

- Muestra comandos crudos enviados al adaptador
- Muestra respuestas sin parsear
- Útil para investigar protocolo ELM327

---

## 14. Próximos Pasos y Mejoras Futuras

1. **iOS BLE:** Implementar `BleStrategy` completamente (actualmente es placeholder)
2. **Push Notifications:** Integrar Firebase Cloud Messaging para recordatorios
3. **Offline Sync:** Mejorar persistencia con SQLite local + sync en background
4. **Dark Mode:** Temas adicionales más allá del oscuro actual
5. **Internacionalización:** i18n para español, inglés, portugués

---

## 15. Referencias y Documentos Relacionados

- [`project-context.md`](./project-context.md) — Reglas críticas de implementación
- [`backend.md`](./backend.md) — Arquitectura de Cloud Functions
- Memoria del proyecto: `MEMORY.md` (fases previas)

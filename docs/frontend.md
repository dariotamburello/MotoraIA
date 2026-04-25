# Motora — Documentación del Frontend

> React Native · Expo Router · TypeScript · TanStack Query · Zustand · Firebase

---

## Índice

1. [Arquitectura general](#arquitectura-general)
2. [Estructura de carpetas](#estructura-de-carpetas)
3. [Navegación](#navegación)
4. [Pantallas principales](#pantallas-principales)
5. [Flujos y pantallas secundarias](#flujos-y-pantallas-secundarias)
6. [Componentes compartidos](#componentes-compartidos)
7. [Estado global (Zustand)](#estado-global)
8. [Caching y queries (TanStack Query)](#caching-y-queries)
9. [Servicios Firebase](#servicios-firebase)
10. [Estado de implementación](#estado-de-implementación)

---

## Arquitectura general

```
mobile/
├── app/                        # Expo Router: rutas = carpetas/archivos
│   ├── _layout.tsx             # Root layout: auth guard, providers
│   ├── (auth)/                 # Grupo no autenticado
│   └── (app)/                  # Grupo autenticado
│       ├── _layout.tsx
│       └── (tabs)/             # Navegación por tabs (fondo)
├── src/
│   ├── services/firebase/      # Config, auth wrapper, callFn factory
│   ├── shared/
│   │   ├── components/         # Componentes reutilizables globales
│   │   └── stores/             # Zustand stores
│   └── features/diagnostics/   # Módulo OBD2 (store + mock service)
└── assets/
```

**Stack de estado:**
- **Servidor / async:** TanStack Query (fetching, caching, invalidación)
- **Local / UI:** Zustand (auth user, vehículos, estado del scanner OBD2)
- **Notificaciones:** `useToast()` de `ToastProvider` (nunca `Alert.alert`)

---

## Estructura de carpetas

```
app/
├── _layout.tsx                          # QueryClientProvider + ToastProvider + ThemeProvider + AuthGuard
├── (auth)/
│   ├── _layout.tsx
│   ├── index.tsx                        # Welcome / Splash
│   ├── login.tsx
│   ├── register.tsx
│   ├── onboarding-profile.tsx           # Paso 2: datos personales
│   └── onboarding-vehicle.tsx           # Paso 3: primer vehículo (opcional)
└── (app)/
    ├── _layout.tsx
    ├── (tabs)/
    │   ├── _layout.tsx                  # Bottom tab bar
    │   ├── index.tsx                    # Home / Dashboard
    │   ├── vehicles.tsx                 # Lista de vehículos
    │   ├── diagnostics.tsx              # Scanner OBD2
    │   └── profile.tsx                  # Perfil y ajustes
    ├── vehicle-detail/
    │   ├── [id].tsx                     # Detalle del vehículo (4 sub-tabs)
    │   └── _components/
    │       ├── VehicleHeroCard.tsx
    │       ├── TabBar.tsx               # Scrollable horizontal con animación de pill deslizante
    │       ├── MaintenanceTab.tsx
    │       ├── DiagnosticsTab.tsx
    │       ├── TasksTab.tsx
    │       ├── TaskCard.tsx
    │       ├── MaintenanceCard.tsx
    │       ├── DocumentsTab.tsx
    │       ├── DocumentCard.tsx
    │       └── types.ts                 # Tipos y utils compartidos de vehicle-detail
    ├── add-vehicle.tsx
    ├── add-maintenance/[vehicleId].tsx
    ├── add-task/[vehicleId].tsx
    ├── diagnostic-detail.tsx
    └── subscription-prompt.tsx
```

---

## Navegación

```
Root (_layout.tsx)  →  AuthGuard
│
├─ (auth)           ← usuario NO autenticado, o autenticado sin displayName
│   ├─ index          Welcome
│   ├─ login
│   ├─ register
│   ├─ onboarding-profile    (Step 2/3)
│   └─ onboarding-vehicle    (Step 3/3, skippable)
│
└─ (app)            ← usuario autenticado con perfil completo (displayName set)
    ├─ (tabs)
    │   ├─ index              Home / Dashboard
    │   ├─ vehicles           Lista de vehículos
    │   ├─ diagnostics        Scanner OBD2
    │   └─ profile            Perfil y cuenta
    │
    └─ Stack (full-screen)
        ├─ add-vehicle
        ├─ vehicle-detail/[id]
        ├─ add-maintenance/[vehicleId]   ?entryId= para edición
        ├─ add-task/[vehicleId]          ?taskId= para edición
        ├─ diagnostic-detail
        └─ subscription-prompt
```

**Auth Guard** (en `_layout.tsx`):
- Observa `user` y `isInitialized` de `useAuthStore`
- Sin usuario fuera de `(auth)` → redirige a `/(auth)`
- Con usuario + `displayName` dentro de `(auth)` → redirige a `/(app)/(tabs)/`
- El `displayName` de Firebase Auth actúa como señal de "perfil completo"

---

## Pantallas principales

### Home (`(tabs)/index.tsx`)

**Propósito:** Dashboard con el último diagnóstico OBD2 registrado entre todos los vehículos.

**Datos:**
- Usa `useQueries()` para obtener `GET_MAINTENANCE_LOG` por cada vehículo en paralelo
- Filtra entradas con `type === "DIAGNOSTIC"`, ordena por fecha más reciente
- Muestra el nombre del usuario (firstName desde `user.displayName`)

**UI:**
- Saludo: `"Hola, {firstName}"`
- Card del último diagnóstico: fecha, vehículo, hasta 3 badges de códigos DTC (+N si hay más)
- Badge verde si no hay errores
- Al presionar → navega a `diagnostic-detail` con `vehicleId` + `entryId`
- Estado vacío si no hay diagnósticos

---

### Vehicles (`(tabs)/vehicles.tsx`)

**Propósito:** Listado de todos los vehículos del usuario, con acceso a detalle y edición rápida.

**Datos:**
- `GET_USER_VEHICLES` al montar + `useFocusEffect` para refetch al volver a la tab
- `UPDATE_VEHICLE` en modal de edición

**UI:**
- `VehicleCard`: marca+modelo (título), año, patente, KM, botón editar, chevron para detalle
- "Agregar vehículo": navega a `add-vehicle`. Si tiene ≥ 2 vehículos en tier FREE → `subscription-prompt`
- Estado vacío con CTA para agregar
- **EditFormModal** inline: editar brand, model, year, KM, licensePlate

---

### Diagnostics (`(tabs)/diagnostics.tsx`)

**Propósito:** Scanner OBD2 con telemetría en tiempo real y guardado de diagnósticos.

**Estados de la UI (máquina de estados):**

```
disconnected → (botón "Conectar") → connecting (2s mock) → connected
connected    → (botón "Escanear") → scanning (3s mock)   → connected (con DTCs)
```

**Datos:**
- `GET_ODB2_DIAGNOSTICS` por cada vehículo (query de historial)
- `GET_USER_PROFILE` para verificar tier (interpretación IA)
- `ADD_ODB2_DIAGNOSTIC` al finalizar el escaneo
- `DELETE_ODB2_DIAGNOSTIC` con confirmación
- `INTERPRET_DIAGNOSTIC` (PREMIUM, actualmente mocked)

**Live Telemetry (mock):**
- Actualización cada 1 segundo vía `MockOBD2Service.startLiveTelemetry()`
- RPM: 800–3000 · Speed: 0–120 km/h · Coolant Temp: 85–95°C
- Estado guardado en `useDiagnosticStore`

**Historial:**
- Listado de diagnósticos pasados por vehículo
- Badge con códigos DTC encontrados
- Tap en entrada → modal con detalle completo
- Botón borrar con `ConfirmationModal`

---

### Profile (`(tabs)/profile.tsx`)

**Propósito:** Perfil del usuario, configuración de cuenta y zona de peligro.

**Datos:**
- `GET_USER_PROFILE` al montar
- `UPDATE_USER_PROFILE` en modal de edición
- `DELETE_ACCOUNT` (eliminación completa y en cascada)
- `signOut()` del wrapper de Firebase Auth

**UI:**
- Avatar con iniciales en círculo de color
- Badge de suscripción: `FREE` (gris) o `PREMIUM` (dorado)
- Cards de datos: nombre, edad, género, país
- Stats: cantidad de vehículos, diagnósticos
- **EditFormModal**: nombre, edad, género, país
- **Cerrar sesión**: `ConfirmationModal` (1 paso)
- **Eliminar cuenta**: `ConfirmationModal` (2 pasos, destructivo), elimina todos los datos

---

## Flujos y pantallas secundarias

### Flujo de autenticación y onboarding

**1. Welcome (`(auth)/index.tsx`)**
- Branding + lista de features
- CTAs: "Crear cuenta" y "Ya tengo cuenta"

**2. Register (`(auth)/register.tsx`)**
- Email + contraseña (mín. 6 caracteres)
- Llama `signUp()` → Firebase crea el usuario → trigger `onUserCreated` inicializa Firestore doc
- En éxito: navega a `onboarding-profile`

**3. Login (`(auth)/login.tsx`)**
- Email + contraseña
- Llama `signIn()` → Auth Guard detecta `user.displayName` → redirige a app principal
- Errores de Firebase mapeados a mensajes en español

**4. Onboarding Profile (`(auth)/onboarding-profile.tsx`) — Paso 2/3**
- Formulario: nombre, edad (16–100), género, país (opcional)
- Barra de progreso visual: paso 2 de 3
- Llama `UPDATE_USER_PROFILE` para guardar en Firestore
- Llama `updateDisplayName()` en Auth → señaliza perfil completo → Auth Guard redirige
- Navega a `onboarding-vehicle`

**5. Onboarding Vehicle (`(auth)/onboarding-vehicle.tsx`) — Paso 3/3**
- Selectores en cascada: Marca → Modelo → Año (cada uno resetea los siguientes)
- Campos adicionales: patente, KM actuales
- Llama `ADD_VEHICLE` si el usuario completa el formulario
- Botón "Omitir": marca en AsyncStorage (`motora_onboarding_vehicle_done_{uid}`) y va directo a la app
- En éxito: invalida `["vehicles"]`, actualiza store, navega a `/(app)/(tabs)/`

---

### Flujo de detalle de vehículo

**Vehicle Detail (`vehicle-detail/[id].tsx`)**

Pantalla central del producto. Compuesta por:

**VehicleHeroCard:** Muestra marca, modelo, año, patente, KM. Botón editar abre `EditFormModal` (llama `UPDATE_VEHICLE`).

**TabBar:** Cuatro tabs internas (no Expo Router tabs): Mantenimiento · OBD2 Analysis · Tareas · Documentación. Scrollable horizontalmente (sin scrollbar visible). Animaciones: pill de fondo deslizante (Animated.spring) + fade de color de texto entre tabs (Animated.timing 200ms).

---

#### Tab Mantenimiento (`MaintenanceTab.tsx`)

**Datos:**
- Lista del `maintenanceLog` filtrada: excluye entradas de tipo `DIAGNOSTIC`
- `DELETE_MAINTENANCE_ENTRY` con `ConfirmationModal`

**UI:**
- Botón "Registrar mantenimiento" → `add-maintenance/[vehicleId]`
- `MaintenanceCard` por entrada: tipo con emoji, fecha, KM, costo opcional
- Tap en card → modal de detalle (tipo, descripción, fecha, KM, costo, notas)
- Botón editar → `add-maintenance/[vehicleId]?entryId=X`
- Botón borrar → `ConfirmationModal`

---

#### Tab OBD2 Analysis (`DiagnosticsTab.tsx`)

**Datos:**
- `GET_ODB2_DIAGNOSTICS` por vehicleId
- `DELETE_ODB2_DIAGNOSTIC` con `ConfirmationModal`

**UI:**
- Botón "Nuevo diagnóstico" → navega a `/(app)/(tabs)/diagnostics` (abre el scanner)
- `DiagnosticCard`: fecha, KM, códigos DTC encontrados
- Tap en card → modal con diagnóstico completo + traducción IA (si existe)
- Borrar con confirmación

---

#### Tab Documentación (`DocumentsTab.tsx`)

**Datos:**
- `GET_VEHICLE_DOCS` por vehicleId — subcolección `documents`
- `ADD_VEHICLE_DOC` / `UPDATE_VEHICLE_DOC` / `DELETE_VEHICLE_DOC`

**Tipos de documento (fijos):**
`DRIVERS_LICENSE` (Carnet de conducir) · `TECHNICAL_INSPECTION` (Inspección técnica ITV/VTV) · `INSURANCE_POLICY` (Póliza de seguro) · `OTHER` (Otro)

**UI:**
- Botón "Agregar documento" → `EditFormModal` con: selector de tipo, date picker de vencimiento, toggle de notificación, notas opcionales
- `DocumentCard`: tipo con emoji, fecha de vencimiento formateada, badge de estado con color semántico (verde/ámbar/rojo según días restantes), badge de notificación activa/inactiva
- Sin modal al hacer tap en la card (la info ya es visible)
- Borrar con `ConfirmationModal`

**Notificación (toggle):**
- Usuarios PREMIUM: pueden activar/desactivar libremente
- Usuarios FREE: al intentar activar → cierra el modal y navega a `subscription-prompt`

**Badge de vencimiento (colores):**
- Verde (`#34D399`): más de 30 días
- Ámbar (`#F59E0B`): 0–30 días
- Rojo (`#EF4444`): vencido

---

#### Tab Tareas (`TasksTab.tsx`)

**Datos:**
- `GET_TASKS` por vehicleId
- `UPDATE_TASK` (cambio de estado)
- `DELETE_TASK` con `ConfirmationModal`
- `ADD_MAINTENANCE_ENTRY` + `DELETE_TASK` (mover a mantenimiento)
- `SUGGEST_MAINTENANCE_TASK` (IA, solo PREMIUM)

**Lógica de vencimiento:**
- Una tarea está vencida si `status === "PENDING"` y `scheduledDate < hoy` (comparación a medianoche)
- Icono `AlertTriangle` (ámbar) debajo del toggle de estado en la card
- Badge rojo "Vencida" junto al badge "Pendiente" en el modal de detalle

**`TaskCard`:** Toggle de estado · título · descripción · fecha estimada · botones editar/borrar (ocultos si COMPLETED) · indicador de vencimiento · overlay de carga cuando se mueve a mantenimiento

**Modal de cambio de estado (3 opciones):**

```
Si tarea está PENDIENTE:
  A. Marcar como lista          → UPDATE_TASK status=COMPLETED
  B. Marcar como lista y mover  → ADD_MAINTENANCE_ENTRY (type=OTHER, desc=task.type, notes=task.description, km=0, performedAt=ahora) + DELETE_TASK
  C. Cancelar

Si tarea está COMPLETADA:
  A. Marcar como pendiente      → UPDATE_TASK status=PENDING
  B. Marcar como lista y mover  → misma lógica que arriba
  C. Cancelar
```

**Estado de carga en "Mover a mantenimiento":**
- La card afectada queda bloqueada (overlay oscuro + spinner) durante las 2 llamadas secuenciales al backend
- Al completarse: toast de éxito + la card desaparece (ambas acciones simultáneas)
- Al fallar: toast de error + card vuelve a estado normal

**Sugerencia IA (PREMIUM):**
- Botón `Wand2` llama `SUGGEST_MAINTENANCE_TASK`
- Spinner mientras carga
- La sugerencia llega pre-completada: navega a `add-task/[vehicleId]` con los datos pre-cargados

---

### Agregar / Editar Vehículo (`add-vehicle.tsx`)

**Selección en cascada:**
- Marca → Modelo (filtra según marca) → Año (filtra según marca+modelo)
- Resetea selectores downstream al cambiar uno upstream
- Fuente: funciones estáticas `getBrandOptions()`, `getModelOptions(brand)`, etc.

**Campos adicionales:** patente, KM actuales

**Mutation:** `ADD_VEHICLE` → invalida `["vehicles"]` → actualiza store → navega atrás

**Error `resource-exhausted`:** Redirige a `subscription-prompt` (límite de tier FREE alcanzado)

---

### Agregar / Editar Mantenimiento (`add-maintenance/[vehicleId].tsx`)

**Modo edición:** Si recibe `?entryId=X`, pre-popula desde la caché de TanStack Query

**Campos:**
- Tipo (selector con 7 opciones del enum `MaintenanceType`)
- Descripción (texto libre)
- KM al momento del servicio (numérico, requerido)
- Costo (opcional)
- Notas (opcional)
- Fecha de realización (date picker, default: hoy)

**Mutations:** `ADD_MAINTENANCE_ENTRY` o `UPDATE_MAINTENANCE_ENTRY` → invalida `["maintenanceLog", vehicleId]`

---

### Agregar / Editar Tarea (`add-task/[vehicleId].tsx`)

**Campos:**
- Tipo de tarea (texto libre)
- Descripción (texto libre)
- Fecha estimada (date picker, opcional)

**Mutation:** `ADD_TASK` → invalida `["tasks", vehicleId]`

Si viene de una sugerencia IA, los campos llegan pre-completados.

---

### Detalle de Diagnóstico (`diagnostic-detail.tsx`)

Pantalla de solo lectura. Muestra el diagnóstico OBD2 completo:
- Vehículo y fecha
- KM al momento del escaneo
- Códigos DTC con descripción
- Traducción/interpretación de la IA (si existe en `iaTranslation`)
- Botón para iniciar nueva interpretación (PREMIUM)

---

### Subscription Prompt (`subscription-prompt.tsx`)

Pantalla de upsell hacia PREMIUM. Se muestra cuando:
- Se intenta agregar un 3er vehículo en tier FREE
- Se intenta usar sugerencias IA sin ser PREMIUM
- Otros gatillos de features bloqueadas

---

## Componentes compartidos

Ubicados en `src/shared/components/`:

### `AppInput.tsx`
TextInput estilizado con label, icono opcional y flag de campo opcional.
Tema oscuro consistente (bg `#1E293B`, borde `#334155`).
Usado en todos los formularios de la app.

### `AppSelect.tsx`
Selector full-screen con búsqueda en tiempo real (match substring, case-insensitive).
Props: `label`, `placeholder`, `value`, `onChange`, `options[]`, `disabled`, `optional`, `searchPlaceholder`.
Muestra checkmark en la opción seleccionada.
Usado para: marca, modelo, año, género, país, tipo de mantenimiento.

### `AppDatePicker.tsx`
Selector de fecha nativo. Usado en formularios de mantenimiento y tareas.

### `EditFormModal.tsx`
Modal tipo bottom-sheet para formularios de edición.
Props: `visible`, `title`, `isLoading`, `saveLabel`, `onClose`, `onSave`, `children`.
Incluye `KeyboardAvoidingView`, backdrop dismissable, handle decorativo.
Usado para: editar perfil, editar vehículo, editar datos de la herocard.

### `ConfirmationModal.tsx`
Dialog de confirmación para acciones importantes o destructivas.
Props: `visible`, `title`, `message`, `confirmLabel`, `cancelLabel`, `isDestructive`, `isLoading`.
`isDestructive=true` → botón de confirmación en rojo. `false` → naranja/amarillo.
Usado para: eliminar cuenta, cerrar sesión, eliminar vehículo/entrada/tarea/diagnóstico.

### `ToastProvider.tsx`
Sistema de notificaciones no bloqueante. Contexto global en el root layout.

```typescript
const { showToast } = useToast();
showToast("Mensaje aquí", "success" | "error");
```

- Toasts apilados verticalmente desde la parte superior (respeta safe area)
- Auto-dismiss a los 4 segundos
- Botón X para cerrar manualmente
- Nuevo toast aparece debajo del anterior; al cerrarse el anterior, el siguiente sube
- Colores: verde (success) · rojo (error)
- `Alert.alert` del sistema operativo **no se usa** en esta app; todos los mensajes van por toasts

---

## Estado global

### `useAuthStore` (Zustand)
```typescript
{
  user: FirebaseUser | null
  activeRole: "CLIENT" | "BUSINESS"
  isLoading: boolean
  isInitialized: boolean     // true cuando onAuthStateChanged disparó por primera vez
}
```
Usado por: root layout (auth guard), profile screen (logout), stores que dependen del uid.

### `useVehicleStore` (Zustand)
```typescript
{
  vehicles: VehicleSummary[]
  selectedVehicle: VehicleSummary | null
  isLoading: boolean
}
```
`VehicleSummary`: `{ id, brand, model, year, plate, km }` — subconjunto liviano para navegación y headers.
Actualizado directamente por mutaciones para UI optimista; TanStack Query es la fuente de verdad.

### `useDiagnosticStore` (Zustand, en `src/features/diagnostics/`)
```typescript
{
  status: "disconnected" | "connecting" | "connected" | "scanning"
  liveData: { rpm, speed, coolantTemp, batteryVoltage } | null
  foundDTCs: string[]
  scanCompleted: boolean
}
```
Estado de la sesión OBD2 en curso. Se resetea al desconectar. Consumido a través del hook `useObdData`.

---

## Caching y queries

TanStack Query con `staleTime: 5 min`, `retry: 1`.

| Query Key | Datos | Invalidado por |
|---|---|---|
| `["vehicles"]` | Lista de vehículos del usuario | `addVehicle`, `deleteVehicle`, `useFocusEffect` en tab |
| `["maintenanceLog", vehicleId]` | Historial de mantenimiento | `addMaintenanceEntry`, `updateMaintenanceEntry`, `deleteMaintenanceEntry`, `moveToMaintenance` |
| `["tasks", vehicleId]` | Tareas del vehículo | `addTask`, `updateTask`, `deleteTask`, `moveToMaintenance` |
| `["odb2Diagnostics", vehicleId]` | Diagnósticos OBD2 | `addOdb2Diagnostic`, `deleteOdb2Diagnostic` |
| `["vehicleDocs", vehicleId]` | Documentos del vehículo | `addVehicleDoc`, `updateVehicleDoc`, `deleteVehicleDoc` |
| `["userProfile"]` | Perfil completo del usuario | `updateUserProfile` |

**Modo edición:** Los formularios de edición (`add-maintenance`, `add-task`) leen el dato a editar desde la caché de TanStack Query por `entryId`/`taskId` en los query params.

---

## Servicios Firebase

### `src/services/firebase/config.ts`
- Inicializa la app de Firebase con variables de entorno
- Configura `Auth` con persistencia en `AsyncStorage` (React Native)
- **Modo desarrollo:** conecta a emuladores locales
  - Auth: `localhost:9099`
  - Firestore: `localhost:8080`
  - Functions: `localhost:5002` (host configurable para dispositivos físicos)

### `src/services/firebase/auth.ts`
Wrappers tipados sobre el SDK de Firebase Auth:
- `signUp(email, password)`
- `signIn(email, password)`
- `signOut()`
- `resetPassword(email)`
- `updateDisplayName(user, name)`

### `src/services/firebase/functions.ts`
Factory genérica `callFn<TInput, TOutput>(name)` sobre `httpsCallable`. Centraliza todos los nombres de funciones en `FUNCTION_NAMES`.

### `src/features/diagnostics/services/OBD2Service.ts`
Servicio singleton que maneja la comunicación real con el adaptador ELM327 via Strategy Pattern.

| Método | Comportamiento |
|---|---|
| `connect(address)` | Secuencia AT: ATZ→ATI→ATE0→ATL0→ATH0→ATS0→ATSP0. Detecta calidad del adaptador. |
| `startLiveTelemetry(cb)` | Polling cada 2s: RPM (010C), Speed (010D), Temp (0105), Batería (AT RV) |
| `scanDTCs()` | Pausa polling, envía cmd 03, parsea respuesta hex a códigos P/C/B/U |
| `stopLiveTelemetry()` | Limpia el intervalo y la cola de comandos |
| `disconnect()` | Cleanup completo (socket, cola, polling) |

Estrategias: `BluetoothClassicStrategy` (Android, `react-native-bluetooth-classic`) · `BleStrategy` (iOS, placeholder). La UI consume este servicio exclusivamente a través del hook `useObdData`.

`MockOBD2Service.ts` permanece en disco como referencia pero ya no se usa.

---

## Paleta de colores (dark theme)

| Token | Hex | Uso |
|---|---|---|
| Background | `#0F172A` | Fondo global, input backgrounds |
| Cards | `#1E293B` | Cards, modales, inputs |
| Borders | `#334155` | Bordes de cards y inputs |
| Muted text | `#64748B` | Labels, metadatos, iconos secundarios |
| Subtitle | `#94A3B8` | Texto secundario |
| Body text | `#CBD5E1` | Texto de cuerpo en modales |
| Headings | `#F8FAFC` | Títulos y texto principal |
| Primary | `#3B82F6` | Botones de acción principal |
| Success | `#34D399` | Estados completados, toasts success |
| Warning | `#F59E0B` | Badges de vencimiento, estado pendiente |
| Error | `#EF4444` | Acciones destructivas, toasts error |
| Premium | `#A855F7` | Badge PREMIUM, botón de sugerencia IA |

---

## Estado de implementación

| Módulo / Pantalla | Estado |
|---|---|
| Flujo de auth (welcome, login, register) | ✅ Completo |
| Onboarding de perfil (paso 2/3) | ✅ Completo |
| Onboarding de vehículo (paso 3/3) | ✅ Completo |
| Home / Dashboard | ✅ Completo |
| Lista de vehículos (CRUD) | ✅ Completo |
| Agregar vehículo con selectores en cascada | ✅ Completo |
| Detalle de vehículo (herocard + 3 tabs) | ✅ Completo |
| Tab Mantenimiento | ✅ Completo |
| Tab OBD2 Analysis (vehicle-detail) | ✅ Completo |
| Tab Tareas (CRUD + mover a mantenimiento + vencimiento) | ✅ Completo |
| Tab Documentación (CRUD + badge de vencimiento + toggle notificación PREMIUM) | ✅ Completo |
| Animación TabBar (pill deslizante + fade de texto) | ✅ Completo |
| Sugerencia de tareas con IA (PREMIUM) | ✅ Completo |
| Scanner OBD2 (mock) | ✅ Completo con mock |
| Scanner OBD2 (hardware real ELM327) | ✅ Completo — Strategy Pattern (BluetoothClassic Android / BLE placeholder iOS), CommandQueue, OBD2Parser, `useObdData` hook, modales de permisos y pairing, botón Cancelar conexión. Requiere `react-native-bluetooth-classic` + prebuild. |
| Interpretación DTC con IA | ⚠️ UI lista, backend mocked |
| Perfil y edición de cuenta | ✅ Completo |
| Eliminar cuenta (cascada) | ✅ Completo |
| Switch de perfil CLIENT ↔ BUSINESS | ⚠️ Handler backend listo, UI de onboarding de negocio pendiente |
| Pantallas de negocios | 🔲 No iniciado |
| Pantallas de turnos / appointments | 🔲 No iniciado |
| Subscription prompt (upsell) | ✅ Completo (pantalla de upsell existente) |
| Sistema de toasts (reemplaza Alert.alert) | ✅ Completo |

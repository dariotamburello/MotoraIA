# Contexto del Proyecto: Motora (Plataforma Automotriz y OBD2)

## 1. Visión General del Proyecto
Actúa como un Tech Lead y desarrollador Full-Stack experto. Vamos a construir "Motora", una plataforma integral orientada al rubro automotor que funciona como historia clínica digital, gestor de mantenimiento y lector de telemetría OBD2. La plataforma conecta dueños de vehículos con negocios del sector mediante una arquitectura donde un mismo usuario puede alternar entre el rol de "Cliente" y "Negocio" ("Switch de Perfil") internamente sin re-loguearse.

## 2. Estado Actual del Proyecto (¡IMPORTANTE!)
El proyecto ya ha superado sus fases de inicialización. **NO debes crear el proyecto desde cero**. Los siguientes cimientos ya están operativos y validados usando Firebase Emulators:

* **Backend (`/functions`):** Firebase Cloud Functions v2 (Node.js + TypeScript).
    * *Auth Trigger:* `onUserCreated` crea automáticamente el documento del usuario en Firestore.
    * *CRUD Vehículos:* Funciones callables operativas (`addVehicleHandler`, `getUserVehiclesHandler`, etc.) con control de límites transaccional (Tier FREE: max 2 vehículos).
    * *Mantenimiento:* Funciones para registrar y leer el log de mantenimiento (`addMaintenanceEntryHandler`, `getMaintenanceLogHandler`).
* **App Móvil (`/mobile`):** React Native + Expo Router + TypeScript.
    * *Navegación:* Arquitectura basada en Stack + Tabs anidados (`app/(auth)` y `app/(app)/(tabs)`).
    * *Auth Guard:* Lógica centralizada en `app/_layout.tsx` que redirige en base al estado de autenticación y si el usuario completó su perfil (usando `displayName`).
    * *Estado y Sincronización:* Zustand (`useAuthStore`, `useVehicleStore`) y TanStack Query ya configurados y funcionando de forma optimista.

## 3. Stack Tecnológico Estricto
Todo el código nuevo generado debe adherirse a esto:
* **Frontend:** Expo Router, NativeWind (o StyleSheet limpio), íconos de `lucide-react-native`.
* **Backend:** Firebase Cloud Functions v2, Firestore (NoSQL), Firebase Auth.
* **Componentes:** Priorizar la creación de componentes reutilizables (ej. Modales nativos de React Native) en `/src/shared/components`.

## 4. Esquema de Base de Datos (Firestore)
Las colecciones principales estructuradas hasta el momento:
* `users`: Contiene `uid`, `profile` ({ name, gender, age, activeRole, country }), y `stats` ({ vehicleCount, businessCount }). Incluye `subscriptionTier` ('FREE' o 'PREMIUM').
* `vehicles`: Contiene `ownerId`, `data` ({ brand, model, year, licensePlate, currentKm }).
* `maintenanceLog` (Sub-colección de vehicles): Registros con tipo, descripción, fecha, km y costo.
Estas aun restan de implementar:
* `businesses`: Contiene `ownerId`, `info` (detalles del local y ubicación), y `subscriptionTier` ('DEFAULT' o 'PLUS').
* `appointments`: Referencias `clientId`, `businessId`, `vehicleId`, fecha/hora y `status`.

## 5. Módulo Crítico: Telemetría OBD2 (Bluetooth)
* La app móvil debe integrarse con el hardware ELM327 (chip PIC18F25K80) vía Bluetooth Classic usando la librería `react-native-bluetooth-classic`.
* **Estrategia de Testing/Mocking:** Dado que no siempre se contará con el hardware conectado, se debe implementar una fase de Mocking ("Fake Bluetooth Serial") en `OBD2Service.ts` que devuelva cadenas de texto fijas para simular la lectura de PIDs mientras se desarrolla la UI.

## 6. Integración de Inteligencia Artificial
* El backend integrará el SDK de OpenAI o Anthropic para interpretar códigos DTC obtenidos vía OBD2.
* **Prompt Engineering Maestro:** La IA no debe devolver diagnósticos genéricos. Debe recibir un objeto de contexto enriquecido (Marca, Modelo, KM, DTC, Freeze Frame).
* **Persona del Sistema:** La IA debe actuar como un experto mecánico argentino (específicamente adaptado al ecosistema de Córdoba). El lenguaje debe ser sencillo, empático, orientado a la acción, estimando urgencias y consecuencias reales en la conducción, no solo el fallo técnico.

## 6. Reglas de Desarrollo Críticas para Claude Code
1.  **Entorno Local:** Todo el desarrollo debe apuntar estrictamente a Firebase Emulators (Auth, Firestore, Functions).
2.  **Mutaciones y Caché:** Al crear, editar o eliminar datos (ej. un vehículo), SIEMPRE debes invalidar la query correspondiente de TanStack Query (ej. `["vehicles"]`) para que la UI se actualice automáticamente.
3.  **Modularidad:** Usa "Feature Folders" y extrae la lógica repetitiva a componentes compartidos. Evita duplicar código de UI (como fondos de modales o botones genéricos).
4.  **Tipado:** Tipado estricto en TypeScript en todo momento. No uses `any`.
5.  **Código Limpio:** Implementar manejo de errores robusto, tipado estricto en TypeScript, y evitar "magic numbers" o strings sueltos.
6.  **Feedback al usuario (Toasts):** NUNCA usar `Alert.alert` del sistema operativo ni mostrar mensajes de error/éxito como texto inline en la UI. Toda notificación de resultado de acción (éxito o error) debe mostrarse con el sistema de toasts de Motora. Usar el hook `useToast()` de `@/shared/components/ToastProvider` y llamar `showToast(message, "success" | "error")`. El `ToastProvider` ya está configurado en el root layout (`app/_layout.tsx`) y los toasts aparecen apilados en la parte superior de la pantalla con auto-dismiss de 4 segundos.
7.  **Manejo de errores en formularios:** Los formularios deben separar dos tipos de errores: (a) **Errores de validación por campo** (campo vacío, formato inválido, etc.): mostrar inline debajo del campo usando el prop `error` de `AppInput` / `AppSelect`. Cada campo limpia su propio error en su handler `onChangeText` / `onChange`. (b) **Errores de backend** (fallos de Cloud Functions, red, etc.): mostrar siempre con `showToast(..., "error")`. Nunca mezclar ambos tipos en un único bloque de error genérico al pie del formulario. Excepción: las pantallas de login/register (auth) pueden mantener su propia lógica de error inline.

## 7. Arquitectura de Inteligencia Artificial (Vercel AI SDK)
Toda implementación de IA en el backend (Cloud Functions) debe seguir este estándar, inspirado en las mejores prácticas de la industria:
* **Librería Core:** Usar el paquete `ai` (Vercel AI SDK) y el provider correspondiente (ej: `@ai-sdk/openai` o `@ai-sdk/anthropic`).
* **Configuración y .env:** Las API keys se leen desde las variables de entorno de Firebase Functions (usando `defineSecret` o `.env` local para el emulador).
* **Endpoints:** Crear funciones callables específicas en `src/controllers/ai.controller.ts`.
* **Rate Limiting y Tier:** TODA función de IA debe verificar primero si el usuario tiene `subscriptionTier === 'PREMIUM'`. Si no lo es, arrojar error de permisos. Implementar un control de rate limit básico escribiendo la fecha del último uso en el documento del usuario (`stats.lastAiUsage`).
* **Generación Estructurada:** Cuando el frontend necesite datos para rellenar formularios o crear registros (ej. sugerir una tarea), usar `generateObject` con un esquema estricto de Zod, en lugar de texto libre.
* **Persona de la IA:** El prompt del sistema SIEMPRE debe instruir al modelo para actuar como un mecánico experto de Córdoba, Argentina. Tono empático, directo, que justifique sus decisiones basándose en el desgaste real de las piezas.
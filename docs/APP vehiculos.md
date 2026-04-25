# Definición del Proyecto

# Documento de Definición del Proyecto

**1\. Visión General** Plataforma integral (App móvil \+ Backoffice Web) orientada al rubro automotor. Funciona como una historia clínica digital, gestor de mantenimiento y lector de telemetría OBD2 para dueños de vehículos. A su vez, actúa como un directorio interactivo para negocios del sector (mecánicos, lavaderos, repuestos). El objetivo es centralizar el ciclo de vida del vehículo y conectar la oferta con la demanda. Nombre sugerido: Motora

**2\. Arquitectura y Roles**

* **Stack Tecnológico:** React Native con Expo (App Móvil), React (Backoffice Web), Node.js (Backend), MySQL (Base de Datos).  
* **Gestión de Roles:** Un mismo usuario puede tener el rol de "Cliente" y "Negocio". El cambio de rol ("Switch de Perfil") se hace internamente en la app sin necesidad de re-loguearse.

**3\. Estrategia de Lanzamiento y MVP**

* **Foco del MVP:** Desarrollo priorizado en la utilidad "Single-Player" del Modo Cliente, incluyendo lectura OBD2 básica, para asegurar la retención inmediata.  
* **Onboarding Ultra Rápido (3 Pasos):**  
  1. Registro: Email \+ Contraseña o Google Auth.  
  2. Datos del Usuario: Nombre, Género y Edad.  
  3. Carga de Vehículo (Opcional/Saltable): Selección mediante listas rápidas (alimentadas por un JSON interno) de Marca \+ Modelo \+ Año \+ Kilometraje inicial.  
* **Estrategia B2B:** Onboarding inicial otorgando a 50-100 negocios locales acceso gratuito completo por 6 meses.  
* **Infraestructura Core:** Uso de Firebase Cloud Messaging (FCM) gratuito para todo el sistema de notificaciones push.

**4\. Funcionalidades: Modo Cliente (Dueño de Vehículo)**

| Característica | Capa Gratuita (Free \+ Ads no intrusivos) | Capa Premium (Suscripción) |
| :---- | :---- | :---- |
| **Gestión de Vehículos** | Límite máximo de **2 vehículos**. Navegación segmentada por vehículo activo. | Vehículos ilimitados en la misma cuenta. |
| **Historial y Recordatorios** | Registro manual de gastos. Vencimientos por fecha y tareas creadas manualmente. | Exportación de historial. Alertas predictivas basadas en kilometraje. |
| **Actualización de Km** | Notificación push interactiva quincenal (ingreso manual del número desde la notificación). | Visión IA: el usuario toma una foto al tablero y la IA extrae el kilometraje. |
| **Diagnóstico OBD2 (Bluetooth)** | Conexión a demanda. Lectura de datos crudos, códigos de error (DTC) y su significado estándar. | El usuario consulta la falla a la IA. El prompt maestro incluye el código de error \+ el historial clínico completo del auto para dar un diagnóstico preciso y humano. |
| **Asistente de Mantenimiento** | (No disponible) El usuario debe saber qué hacerle a su auto. | La IA cruza fechas, KMs y tiempo transcurrido para sugerir proactivamente mantenimientos (ej: rotación de cubiertas, cambio de aceite). |
| **Directorio de Servicios** | Búsqueda manual en mapa o listado por cercanía, solicitud de turnos y lectura de reseñas. | Chatbot IA especializado que guía al usuario interrogándolo para recomendarle el mejor local específico para su necesidad actual. |

**5\. Funcionalidades: Modo Negocio (Talleres y Servicios)**

| Característica | Capa Default (Suscripción Base / Gratis inicial) | Capa Plus (Suscripción \+ IA) |
| :---- | :---- | :---- |
| **Gestión de Locales** | Administración de **1 solo negocio** o sucursal. | Administración de **2 o más negocios** (multisucursal). |
| **Perfil y Turnos** | Perfil público comercial. Calendario básico de coordinación de turnos. | Destacado en búsquedas. Sincronización avanzada de calendario. |
| **Interacción y Consultas** | Bandeja de entrada para recibir consultas y responder a usuarios. | Asistente de IA integrado para redactar respuestas y presupuestos. |
| **Análisis de Clientes** | Acceso al historial del vehículo del cliente (con autorización previa). | IA para resumir reseñas y sugerir campañas de marketing/retención. |

**6\. Roadmap Futuro (Post-MVP)**

* **Red Social B2C/C2C:** "Historias" y "Posts" para mostrar trabajos, con cross-posting a Instagram/TikTok/Facebook.  
* **Sistema de "Follows":** Los usuarios podrán seguir a sus talleres de confianza para fidelización.  
* **Marketplace de Vehículos:** Sección para compra/venta de autos entre usuarios, respaldada por el historial de mantenimiento.

# Módulo OBD2 \+ IA

# **Documento de Especificación Técnica: Módulo OBD2 \+ IA**

**Proyecto:** Integración de Diagnóstico Automotriz Inteligente

**Ubicación de Implementación:** Córdoba, Argentina

**Fecha:** 22 de marzo de 2026

---

## **1\. Estrategia de Hardware y Desarrollo**

La viabilidad técnica del módulo depende de la estabilidad de la lectura de datos. Se han definido dos perfiles de hardware según el caso de uso:

### **1.1 Entorno de Desarrollo (Internal Debugging)**

Para la fase de construcción del *parser* y lógica de negocio, se requiere el uso del adaptador **ELM327 con chip PIC18F25K80** ($22.865 ARS aprox.).

* **Justificación:** A diferencia de las réplicas baratas, este chip ofrece procesamiento nativo de los protocolos. Esto garantiza que cualquier error durante la fase de *coding* en React Native sea atribuible al software y no a un congelamiento (*hang*) del hardware por saturación de comandos AT.

### **1.2 Estrategia de Usuario Final (Product-as-a-Service)**

Para la captación de usuarios en el mercado local, se propone el modelo **HS Line (Versión 2025\)** ($8.900 ARS aprox.).

* **Modelo de Negocio:** Este dispositivo actúa como el "ancla" física para una suscripción mensual. Al representar un costo de adquisición de cliente (CAC) menor a 9 USD, permite ofrecer el hardware "sin cargo" mediante contratos de permanencia.  
* **Limitación Técnica:** Orientado estrictamente a Android (Bluetooth Classic). Para usuarios de iOS, se sugiere el escalado al modelo **Fnirsi FD10 (BT 5.1/BLE)** bajo un esquema de "Plus Premium".

---

## **2\. Implementación en React Native**

La ventaja competitiva reside en el uso de una arquitectura híbrida que permite rapidez de despliegue.

* **Librerías Recomendadas:** `react-native-bluetooth-classic` para los modelos HS Line y 25K80 (BT 2.0).  
* **Flujo de Datos:** El servicio debe gestionar la apertura de un canal serial, el envío de comandos AT de inicialización y el *polling* constante de PIDs específicos (RPM, Temperatura, DTCs).  
* **Próximo Hito:** Implementación del "Hello World" mediante el envío del comando `ATZ` (reset) y `010C` (RPM) para validar el flujo de datos Hexadecimal \-\> Humano.

---

## **3\. Análisis de Mercado y Competencia (Región Córdoba)**

El ecosistema de Córdoba presenta particularidades que definen la oportunidad de negocio:

* **Estado de la Competencia:** El mercado cordobés está dominado por herramientas técnicas como *Torque Pro* o scanners de mano en talleres de la zona de calle Las Heras o cercanías. Estas herramientas fallan en la comunicación: son útiles para el mecánico, pero incomprensibles para el dueño del auto.  
* **Propuesta de Valor Local:** La IA no solo leerá el código `P0301`; interpretará el contexto para un usuario cordobés. Se integrará información sobre costos estimados de reparación en Pesos Argentinos y vinculación directa con repuestos en plataformas locales, optimizando la experiencia de mantenimiento preventivo.

---

## **4\. Apartado de Prompt Engineering: La Capa de Interpretación**

La "joyita" del producto es el motor de interpretación. No se enviará un código crudo a la IA, sino un objeto de contexto enriquecido para maximizar la fiabilidad.

### **4.1 Estructura del Prompt Maestro**

Para evitar alucinaciones y garantizar que la IA se comporte como un experto mecánico, el sistema utilizará el siguiente esquema de entrada:

**Sistema (System Prompt):** "Actúa como un experto mecánico argentino. Tu objetivo es traducir códigos de error OBD2 a un lenguaje sencillo, empático y orientado a la acción. No menciones solo la falla técnica; explica las consecuencias en la conducción y estima la urgencia."

**Contexto del Vehículo (User Input):** \> \* **Vehículo:** \[Marca/Modelo/Año\] (ej: Fiat Cronos 2022\)

* **Kilometraje:** \[KM\] (ej: 45,000 km)  
* **Código detectado:** \[DTC\] (ej: P0301)  
* **Datos en congelado (Freeze Frame):** \[Velocidad, Temperatura, Carga de Motor\]

### **4.2 Ejemplo de Salida Premium**

* **Estado Puro (Free):** "Falla de encendido en cilindro 1."  
* **Interpretación IA (Premium):** "Detecté que el motor de tu Cronos tironea un poco al acelerar. El error P0301 indica que una de tus bujías no está funcionando bien. Dado que tenés 45k km, es muy probable que sea desgaste natural. **Recomendación:** Cambialas pronto para evitar que el auto consuma más nafta de lo normal. El arreglo es rápido y sencillo."

---

## **5\. Modelo de Monetización Sugerido**

* **Plan Free:** Lectura de códigos y borrado de Check Engine.  
* **Plan Smart ($4.500 ARS/mes):** Traducción humana básica mediante modelos de bajo costo (GPT-4o-mini).  
* **Plan Premium ($9.500 ARS/mes):** Incluye el adaptador HS Line. Consultas profundas a la IA experta (Claude 3.5 Sonnet / GPT-5) y estimación de costos locales.

---

## **6\. Esfuerzo de desarrollo aproximado (Técnico)**

### **1\. Stack Tecnológico y Librerías**

* **Mobile (React Native):**  
  * `react-native-bluetooth-classic`: Para manejar el socket serial con el HS Line (BT 2.0).  
  * `react-native-permissions`: Gestión de permisos de ubicación y Bluetooth (crítico en Android 12+).  
  * `zustand` o `redux-toolkit`: Para el estado global (conexión, errores detectados).  
* **Backend (Node.js/NestJS o Express):**  
  * `openai` o `anthropic-sdk`: Para la orquestación de la IA.  
  * `prisma` / `postgresql`: Registro de VINs, usuarios y caché de errores.

---

### **2\. Módulos de Código y Arquitectura**

Estimamos la afectación de aproximadamente **12 a 15 archivos** nuevos o modificados.

#### **A. Frontend (App)**

1. **`OBD2Service.ts`**: Lógica de bajo nivel. Envío de comandos AT (`ATZ`, `ATE0`, `ATL0`) y lectura de PIDs.  
2. **`BluetoothHook.ts`**: Custom hook para manejar escaneo, emparejamiento y reconexión automática.  
3. **`DiagnosticScreen.tsx`**: UI de los "relojes" y el botón "Analizar con IA".  
4. **`ParserUtils.ts`**: Conversor de Hexadecimal a valores decimales (RPM, Temp, DTCs).

#### **B. Backend (Servicio de Interpretación)**

1. **`ai.controller.ts`**: Endpoint que recibe el JSON del auto.  
2. **`prompt-engine.service.ts`**: Donde vive el "Prompt Maestro" con el contexto de Córdoba.  
3. **`dtc-cache.repository.ts`**: Base de datos local para no re-consultar a la IA por el mismo error.

---

### **3\. Estimación de Esfuerzo con Claude Code**

Al usar Claude Code, las iteraciones son rápidas pero requieren supervisión humana para el testing físico con el auto.

| Tarea | Esfuerzo (Horas) | Iteraciones IA |
| :---- | :---- | :---- |
| **Config. Bluetooth & Permisos** | 4h | 2-3 (Ajuste de manifiestos Android) |
| **Servicio de Comandos AT/OBD2** | 8h | 5-6 (Refinamiento de tiempos de espera/timeout) |
| **Parser Hexadecimal a Humano** | 3h | 1-2 (La IA es excelente en esto) |
| **Backend & Prompt Engineering** | 6h | 3 (Ajuste de tono "mecánico argentino") |
| **Integración UI/UX** | 5h | 2 (Pantallas de carga y feedback) |
| **TOTAL ESTIMADO** | **26h \- 30h** | **\~15 Iteraciones totales** |

---

### **4\. Estrategia de Testing (El mayor desafío)**

El testing de OBD2 no se puede hacer 100% en simulador. Necesitas:

1. **Mocking (Fase 1):** Crear un "Fake Bluetooth Serial" que devuelva strings fijas (ej: `41 0C 1A F8`) para que Claude pueda programar la UI sin el auto.  
2. **Hardware Real (Fase 2):** Testeo con el **25K80** en tu auto personal. Aquí se ajustan los `timeouts` (el protocolo CAN a veces es lento).  
3. **Edge Cases:** Probar qué pasa si el usuario desenchufa el adaptador en medio del escaneo.

---

### **Resumen para tu Hoja de Ruta**

Implementar el **MVP (Producto Mínimo Viable)** te llevará aproximadamente **una semana de trabajo intensivo** (6 horas diarias) usando Claude Code.

**Puntos donde Claude te ahorrará más tiempo:**

* Generar las tablas de conversión de PIDs.  
* Escribir el código de infraestructura del Backend.  
* Crear los componentes visuales en React Native con Tailwind (NativeWind) o Styled Components.

# Implementación

# Implementación

## **1\. Stack Tecnológico (Serverless & Cloud Native)**

* **App Móvil:** React Native con **Expo** (TypeScript).  
* **Backoffice Web:** React \+ **Vite** (TypeScript) \+ Tailwind CSS, alojado en **Firebase Hosting**.  
* **Backend:** **Firebase Cloud Functions** (Node.js \+ TypeScript). *Arquitectura sin servidor.*  
* **Base de Datos:** **Cloud Firestore** (NoSQL Document-based).  
* **Autenticación:** **Firebase Auth** (Email/Password, Google Auth).  
* **Notificaciones:** **Firebase Cloud Messaging (FCM)** integrado nativamente.  
* **Almacenamiento:** **Firebase Storage** (Fotos de tableros, repuestos y locales).

---

## **2\. Esquema de Colecciones (Firestore)**

*Priorizamos la lectura rápida y el desacoplamiento.*

* **`users` (Colección):**  
  * `uid`: ID de Firebase Auth.  
  * `profile`: `{ name, gender, age, activeRole: 'CLIENT' | 'BUSINESS' }`.  
  * `stats`: `{ vehicleCount, businessCount }` (Control de límites Free/Premium).  
* **`vehicles` (Colección):**  
  * `ownerId`: Referencia al `uid`.  
  * `data`: `{ brand, model, year, licensePlate, currentKm }`.  
  * `maintenanceLog` (Sub-colección): Registros de servicios, gastos y diagnósticos IA.  
* **`businesses` (Colección):**  
  * `ownerId`: Referencia al `uid`.  
  * `info`: `{ name, category, address, location: { lat, lng }, phone, description }`.  
  * `subscriptionTier`: `'DEFAULT'` o `'PLUS'`.  
* **`appointments` (Colección):**  
  * `clientId`, `businessId`, `vehicleId`: IDs de referencia.  
  * `dateTime`, `status`: `'PENDING' | 'CONFIRMED' | 'CANCELLED'`.

---

## **3\. Arquitectura del Sistema**

### **A. Backend (Cloud Functions)**

* **Estructura por Capas:** Aunque sean funciones aisladas, organizaremos el código en `src/controllers` (entrada), `src/services` (lógica de negocio e integración con IA) y `src/models` (interfaces de Firestore).  
* **Entorno Local:** Uso mandatorio de **Firebase Emulators** para desarrollo seguro y sin costos.

### **B. App (React Native)**

* **Feature Folders:** Organización por funcionalidades (`/features/vehicles`, `/features/auth`, `/features/diagnostics`).  
* **Gestión de Estado:** **Zustand** para el "Switch de Perfil" (`activeRole`) y persistencia de sesión.

---

## **4\. Librerías Clave y Utilidad**

* **Expo Router:** Enrutamiento basado en archivos (Tabs y Stack navigation).  
* **React Native Bluetooth Classic:** Para la comunicación robusta con adaptadores **OBD2 ELM327**.  
* **TanStack Query (React Query):** Gestión de caché y sincronización de datos con Firestore.  
* **Lucide React / Lucide React Native:** Iconografía moderna unificada.  
* **Firebase Admin SDK:** Control total del backend, IA y notificaciones push.

---

## **5\. User Flow Principal (MVP)**

### **Modo Cliente (Dueño)**

1. **Onboarding:** Registro \-\> Selección de Vehículo (Listado predefinido).  
2. **Home:** Estado del auto, accesos rápidos a "Escanear" o "Añadir Gasto".  
3. **Diagnóstico IA:** Lectura de códigos de error vía OBD2 \-\> Procesamiento con Claude \-\> Explicación amigable y sugerencia de talleres.  
4. **Directorio:** Mapa de talleres cercanos y solicitud de turnos.

### **Modo Negocio (Taller)**

1. **Activación:** Configuración de perfil comercial (Servicios, Fotos, Ubicación).  
2. **Dashboard:** Gestión de turnos entrantes y agenda del día.  
3. **Comunicación:** Chat directo con clientes para presupuestos basados en el diagnóstico previo.

---

## **6\. Protocolo de Desarrollo (CI/CD)**

* **Local:** Desarrollo en VS Code \+ Firebase Emulators. Variables sensibles en `.env.local`.  
* **Repositorio:** GitHub como fuente de verdad. Carpeta `/app`, `/functions` y `/web`.  
* **Despliegue:** **GitHub Actions** configurado para deploy automático a Firebase al hacer push a `main`.  
* **Modo Demo:** Implementación de Mocks en `OBD2Service.ts` para desarrollo sin hardware real.


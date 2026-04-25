---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
workflowStatus: "complete"
completionDate: "2026-04-14"
inputDocuments: ["docs/project-context.md", "docs/frontend.md", "docs/backend.md", "docs/mobile-architecture.md", "docs/backend-architecture.md", "docs/diagnostico-obd2.md", "docs/APP vehiculos.md", "docs/index.md"]
workflowType: 'prd'
projectName: 'motora-ia'
userName: 'Dario'
date: '2026-04-12'
documentCounts:
  productBriefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 8
classification:
  projectType: 'SaaS B2B Multi-plataforma'
  domain: 'Automotive'
  complexity: 'high'
  projectContext: 'brownfield'
  businessModel: 'Freemium B2C2B'
---

# Product Requirements Document - motora-ia

**Author:** Dario
**Date:** 2026-04-12

## Executive Summary

**Motora IA** es una plataforma SaaS B2B multi-plataforma que democratiza el diagnóstico vehicular inteligente y la mantenencia predictiva para usuarios finales y negocios (talleres, mecánicos, flotas).

El producto resuelve dos problemas complementarios:
1. Para usuarios normales: falta de visibilidad real sobre el estado de sus vehículos, lo que genera ansiedad sobre costos de reparación inesperados y desgaste prematuro
2. Para negocios automotrices: dificultad para escalar operaciones y retener clientes sin incrementar carga operacional proporcional

La plataforma combina acceso en tiempo real a datos OBD2 del vehículo con inteligencia artificial predictiva para anticipar problemas antes de que ocurran, permitiendo a los usuarios optimizar el uso de sus vehículos y a los negocios ofrecer servicios proactivos basados en datos.

El MVP incluye: aplicación móvil robusta para usuarios normales y businesses, plataforma web de promoción, y backoffice administrativo para gestión de negocio y estadísticas de usuarios.

### What Makes This Special

**UI/UX excepcional:** La plataforma simplifica la complejidad de diagnóstica vehicular en una interfaz intuitiva que genera confianza y engagement desde el primer uso.

**IA integrada como core value:** No es un feature secundario. La IA (GPT-4o-mini) es el corazón de la propuesta de valor — los usuarios pagan por acceso a sugerencias de mantenimiento inteligentes, predictivas y justificadas. El diferenciador clave es que la IA comprende el contexto del vehículo (marca, modelo, km, datos OBD2) y emite recomendaciones accionables.

**Ecosistema completo:** A diferencia de soluciones fragmentadas, Motora conecta a usuarios finales, businesses (talleres/mecánicos), y administradores en una plataforma cohesiva. Los usuarios acceden a IA premium, los businesses escalan sin fricciones operacionales, y los administradores obtienen visibilidad total del negocio.

**Insight central:** La combinación de OBD2 en mobile + IA predictiva + UX superior transforma a usuarios pasivos en administradores proactivos de sus vehículos, mientras habilita a negocios a evolucionar desde reactivos a predictivos.

## Project Classification

| Aspecto | Valor |
|---------|-------|
| **Tipo de Proyecto** | SaaS B2B Multi-plataforma (mobile + web + backoffice) |
| **Dominio** | Automotive (diagnóstico y mantenencia vehicular) |
| **Complejidad** | Alta (integración hardware OBD2, IA/NLP, multi-tenant, datos sensibles) |
| **Contexto** | Brownfield (MVP existente que evoluciona hacia plataforma completa) |
| **Modelo de Negocio** | Freemium B2C2B (usuarios free→premium; businesses como clientes secundarios) |

## Success Criteria

### User Success

El éxito del usuario se mide en dos dimensiones: **adopción inicial** y **engagement sostenido**.

**Adopción Inicial:**
Usuarios deben sentirse atraídos por la facilidad de uso en el primer acceso. El valor inicial está en la capacidad de registrar y hacer seguimiento integral del vehículo: vencimientos (patente, seguro), tareas pendientes, historial de mantenimientos realizados, y análisis OBD2 en tiempo real. La IA premium es el gancho para conversión posterior, no el diferenciador inicial.

**Engagement Sostenido:**
- Usuario debe registrar **al menos 1 vehículo** durante onboarding o primeros usos
- Usuario debe interactuar con diagnóstico OBD2 **mínimo 1 vez/semana**
- Usuario debe abrir la app **2-3 veces por semana** (mínimo 8 sesiones/mes)

Éxito: Usuarios que alcanzan estos hitos permanecen en la plataforma y son candidatos para conversión a premium.

### Business Success

El éxito de negocio depende de dos métricas interconectadas:

**Usuarios Activos (Primary Metric):**
- **MVP Target:** 500 usuarios activos mensuales (MAU) en 3 meses post-lanzamiento
- Usuarios activos = mínimo 1 sesión en el mes, cumpliendo con los hitos de engagement

**Conversión Free→Premium (Primary Metric):**
- **MVP Target:** 5% de usuarios free deben convertir a premium
- A 500 MAU: mínimo 25 usuarios premium pagadores
- Esto genera tracción natural para atracción de businesses

**Businesses en Plataforma (Secondary Metric):**
- **MVP Target:** 10 businesses activos ofreciendo servicios/integraciones
- Indicador de que el ecosistema es atractivo más allá del usuario individual

### Technical Success

La confiabilidad técnica es crítica para retención de usuarios y credibilidad de diagnóstico.

**Application Performance:**
- **Uptime:** 99%+ (máximo 43 minutos/mes de downtime)
- **Response Time:** <1 segundo para todas las operaciones que no requieren IA o comunicación OBD2 (navegación, registro, consulta de historial, búsqueda)

**OBD2 Integration Reliability:**
- **Success Rate:** +80% tasa de funcionamiento sin errores en lecturas OBD2
- **Diagnostic Accuracy:** Diagnósticos completados sin fallos de comunicación hardware

Éxito técnico = usuarios confían en los datos, la app no los frustra con latencia o fallos.

### Measurable Outcomes

| Métrica | MVP Target | Timeframe | Responsable |
|---------|-----------|-----------|-------------|
| Usuarios Activos (MAU) | 500 | 3 meses post-lanzamiento | Producto/Marketing |
| Tasa Conversión Free→Premium | 5% | 3 meses post-lanzamiento | Producto |
| Businesses Activos | 10 | 3 meses post-lanzamiento | Ventas/Producto |
| App Uptime | 99%+ | Sostenido | Infraestructura |
| Response Time (<1s) | 95%+ de operaciones | Sostenido | Desarrollo |
| OBD2 Success Rate | +80% | Sostenido | Hardware/QA |
| Users with ≥1 Vehicle | 80%+ de registros | 1 mes post-lanzamiento | Producto |
| Weekly OBD2 Interaction | 60%+ de usuarios activos | 3 meses post-lanzamiento | Producto |

## Product Scope

### MVP — Minimum Viable Product

**What's essential to prove the concept works:**

El MVP debe demostrar que usuarios adoptan Motora por su capacidad de registrar y monitorear vehículos con facilidad, y que existen businesses interesados en participar en el ecosistema.

**Mobile Application (Users):**
- Autenticación Firebase (email, Google, Apple)
- Gestión de vehículos (crear, editar, eliminar)
- Registro integral: vencimientos, tareas, mantenimientos
- Análisis OBD2 en tiempo real (datos raw + interpretación básica)
- Perfil de usuario (free/premium)
- Premium: Acceso a sugerencias de IA (GPT-4o-mini) basadas en OBD2 + contexto del vehículo

**Mobile Application (Businesses):**
- Acceso a datos de clientes (vehículos, registros, análisis OBD2)
- Capacidad de comunicarse con clientes (mensajes, notificaciones)
- Vista de estadísticas básicas (clientes activos, vehículos, diagnósticos)

**Backoffice (Admin):**
- Dashboard de usuarios activos, tasa de conversión, businesses
- Gestión de suscripciones (free/premium)
- Logs de IA usage
- Monitoreo de infraestructura (uptime, errores OBD2)

**Web (Promotional):**
- Landing page con value proposition
- Explainer de cómo funciona OBD2 + IA
- Links a descargas mobile (App Store, Google Play)

### Growth Features (Post-MVP)

**Features que harían Motora más competitivo:**

- **AI-Powered Scheduling para Businesses:** Turnero automático basado en predicción de mantenimiento
- **AI-Enhanced Recommendations:** IA contextual para businesses (qué clientes contactar, cuándo, qué servicios ofrecer)
- **Integration with Business Tools:** Conexión con sistemas de facturación, CRM
- **Advanced Analytics:** Reportes predictivos, análisis de flota para users business
- **Community Features:** Marketplace de servicios entre businesses y usuarios

### Vision (Future — 3-5 años)

**La versión soñada de Motora:**

- **Predictive Maintenance Platform:** IA que anticipa fallas 6+ meses en adelante, integrándose con ecosistemas de seguros y financieras
- **Connected Ecosystem:** API para que proveedores (repuestos, servicios, seguros) accedan a datos y ofrezcan servicios directamente a usuarios
- **Business AI Automation:** Turnero completamente autónomo, servicio al cliente automático, pricing dinámico
- **Regional Expansion:** Soporte para múltiples mercados (Argentina, Latam, etc)

## User Journeys

### Journey 1: Juan — El Usuario Free que Descubre su Vehículo

**Persona:** Juan, 28 años, propietario de un Chevrolet Onix 2015. Conductor urbano en Córdoba. No es mecánico, pero le preocupa que su auto le falle sin aviso.

**Opening Scene — El Dolor:**
Juan maneja a su trabajo y escucha un ruido extraño. Paniquea. ¿Algo grave? ¿Cuánto costará reparar? Llama a su mecánico de confianza, quien dice "trae el auto para revisarlo". Costo: tiempo perdido, diagnóstico $50 USD. Juan piensa: "¿Cómo no sé qué le pasa a mi auto si lo manejo todos los días?"

**Rising Action — El Descubrimiento:**
Un amigo le recomienda Motora (lo vio en Instagram). Juan descarga la app. Crea su cuenta en 2 minutos. Registra su Onix (marca, modelo, año, VIN). La app lo guía para conectar su adaptador OBD2 Bluetooth al motor. Espera 30 segundos. Los datos llegan.

Juan ve en la pantalla: RPM, velocidad, temperatura del motor, consumo de combustible en tiempo real. Los códigos de error aparecen decodificados (P0300 = Ignition System Malfunction). De repente, entiende su vehículo. Ya no está asustado, está informado.

**Climax — El Momento de Valor:**
Juan abre la sección "Historial de Mantenimientos" y registra: cambio de aceite (Julio), filtro de aire (Marzo). La app le muestra automáticamente: "Tu próximo cambio de aceite vence en 500 km". Estableció un recordatorio. Nunca volvió a olvidar un mantenimiento.

Dos semanas después, Juan aparentemente vuelve a escuchar un ruido extraño. Abre Motora. Los datos OBD2 le muestran que todo está normal (sin códigos de error). Se relaja. No necesita ir al mecánico. Motora acaba de ahorrarle tiempo y dinero.

**Resolution — El Gancho Premium:**
Tres meses después, Juan compra un segundo auto (un Fiat Argo usado). Intenta registrarlo en Motora. La app le dice: "Solo puedes gestionar 2 vehículos con la versión free". Juan ve un botón azul: "Actualiza a Premium ($9.99/mes)". Lee el beneficio: "Gestiona ilimitados vehículos + Acceso a IA que te sugiere mantenimientos automáticos". Juan se suscribe.

### Journey 2: Lucía — La Usuaria Premium que Confía en IA

**Persona:** Lucía, 35 años, profesional independiente en Buenos Aires. Conduce un Volkswagen Polo 2018. Viaja por trabajo frecuentemente.

**Opening Scene — La Ansiedad:**
Lucía viaja 3 horas entre ciudades por trabajo. Mientras maneja, una luz naranja aparece en el dashboard: "Service Soon". ¿Es grave? ¿Debo parar? ¿Puedo esperar a la próxima semana? Llama al taller de confianza a 200 km de distancia. El mecánico dice "es probable que sea el sensor lambda, pero necesito verlo". Lucía continúa nerviosa.

**Rising Action — El Análisis Inteligente:**
Lucía recuerda que usó Motora hace meses (free). Se la reinstala. Conecta el OBD2. Ve el código de error: P0134 (O2 Sensor Circuit). Está asustada. Pero luego ve un botón: "Analizar con IA". Lee que dice "$0.99 este análisis" pero tiene 7 días free. Presiona.

La IA le escribe: "Tu sensor lambda (O2) está mostrando inconsistencia. Es probable que falle en 1-2 meses. No es urgente hoy, pero planifica el cambio pronto. Costo estimado: $80-120 USD."

Lucía siente alivio. No es una avería inminente. Puede llegar a su destino sin riesgo. Puede planificar el arreglo con calma.

**Climax — La Conversión:**
Lucía decide suscribirse a Premium ($9.99/mes). En 2 semanas, viaja nuevamente. Otro código: P0441 (EVAP System Leak). Abre la IA instantáneamente (incluido en Premium). La IA responde en 5 segundos con análisis contextual: "Tu sistema EVAP tiene una pequeña fuga. No afecta rendimiento. Reparación: $40-60 USD, urgencia: baja." Lucía sabe exactamente qué hacer.

**Resolution — El Embajador:**
Lucía comienza a recomendarle a sus amigos. "Pago 10 dólares al mes y tengo un mecánico en mi bolsillo". Su hermano se suscribe. Su colega también. Lucía se convierte en embajador involuntario de Motora.

### Journey 3: Carlos — El Business User que Escala su Taller

**Persona:** Carlos, 48 años, propietario de un pequeño taller de reparaciones en Rosario. 15 clientes regulares. Funciona por recomendación y reparaciones de urgencia. Nunca es proactivo.

**Opening Scene — El Problema:**
Carlos pierde clientes porque no pueden contactarlo cuando necesitan servicios. Un cliente descubre Motora, ve que el taller de Carlos aparece listado, pero no sabe cómo contactarlo. El cliente contrata otro taller. Carlos no se entera de la oportunidad perdida.

**Rising Action — La Propuesta de Motora:**
Un vendedor de Motora llama a Carlos: "Hola Carlos, vimos tu taller en redes. ¿Te gustaría aparecer en Motora y que tus clientes te encuentren directamente?" Carlos es escéptico. El vendedor muestra un demo: usuarios con autos en Rosario ven que el taller de Carlos está disponible, pueden ver sus servicios, pueden contactarlo.

Carlos se registra como Business. Crea su perfil:
- Nombre: "Taller Carlos - Rosario"
- Servicios: "Diagnóstico OBD2, cambios de aceite, alineación, reparaciones varias"
- Teléfono y ubicación visibles

**Climax — Nuevos Clientes:**
En la primera semana, 3 usuarios nuevos lo contactan a través de Motora. Uno de ellos tiene un P0300 (falla de ignición) que Carlos diagnostica y repara. El cliente queda tan satisfecho que escribe una reseña en Motora: "5 estrellas, reparación rápida y honesta".

Dos semanas después, Motora lo contacta: "Hay 12 usuarios en Rosario interesados en tus servicios. 5 han dejado su contacto." Carlos cierra 2 más de esos 5.

**Resolution — La Visión Futura:**
Carlos comienza a ver el potencial. Imagina (en futuro): los clientes comparten sus diagnósticos OBD2 con él. Él usa IA (feature futura) para sugerir mantenimiento predictivo a sus clientes antes de que fallen. Convierte su taller de "reactivo" a "predictivo". Sus clientes lo llaman para mantenimiento preventivo, no solo reparaciones de emergencia.

### Journey 4: Dario — El Admin que Monitorea el Negocio

**Persona:** Dario, 30 años, founder/CEO de Motora. Necesita visibilidad en tiempo real del negocio.

**Opening Scene — La Interrogación:**
Dario abre el Backoffice a las 8am. Pregunta crítica: "¿Estamos logrando los targets?"

**Rising Action — El Dashboard:**
Dario ve el Backoffice con 4 secciones:

1. **Usuarios Activos (MAU):** 120 users (meta: 500 en 3 meses)
2. **Conversión Free→Premium:** 3.2% (meta: 5%)
3. **IA Usage:** 45 análisis realizados, $23 en costos (Vercel AI)
4. **Businesses:** 3 registrados, 1 con clientes activos

**Climax — La Toma de Decisión:**
Dario ve que la conversión está baja (3.2% vs 5%). Drilla-down en el cohort de usuarios que registraron 2+ autos (el trigger de paywall). Ve que 40% llega al paywall pero solo 16% convierte. Identifica: el messaging del premium debe mejorar.

Ve también que la IA está siendo usada (45 análisis en 2 semanas). Calcula: si crece a 500 users con 5% conversión = 25 premium users. Si cada user hace 4 análisis/mes = 400 análisis/mes. Costo IA: ~$80. Si cobro $9.99 premium, ingresos = $25 × $9.99 = $247. Margen: $167. Viable.

Ve que 3 businesses están registrados pero solo 1 tiene interacciones reales. Necesita mejorar onboarding o outreach.

**Resolution — La Iteración:**
Dario decide:
- Mejorar copy del paywall (test A/B)
- Hacer outreach directo a los otros 2 businesses
- Monitorear IA cost vs revenue más agresivamente

Mañana verá si los cambios impactan.

### Journey Requirements Summary

**Common Capabilities (all journeys):**
- Autenticación y onboarding rápido
- Notificaciones/recordatorios push

**User Journeys Reveal:**

| Journey | User Type | Capabilities Needed |
|---------|-----------|-------------------|
| Juan (Free) | Individual | Vehicle registration, OBD2 connection, maintenance tracking, 2-vehicle limit, paywall |
| Lucía (Premium) | Individual | IA analysis integration, responsive AI, contextual recommendations |
| Carlos (Business) | Business | Profile creation, search discovery, contact capabilities, ratings/reviews, basic analytics |
| Dario (Admin) | Operations | Real-time dashboard, KPI tracking, cohort analysis, IA cost monitoring |

## Domain-Specific Requirements

### Compliance & Privacy

Motora IA operará únicamente en Argentina. No hay requerimientos GDPR, CCPA, ni regulaciones específicas de datos vehiculares a nivel nacional.

**Consentimiento de Usuarios:**
- Disclaimer visual antes de usar función OBD2 (explicar qué datos se leen)
- Términos y condiciones aceptados al conectar adaptador OBD2
- Consentimiento explícito cada sesión: "Conectar a OBD2 y leer datos del vehículo?"

### Hardware Compatibility

**OBD2 Adapter Support:**
- Soportamos adaptadores OBD2 Bluetooth genéricos (sin marca específica requerida)
- Cualquier adaptador que siga protocolo ELM327 o compatible
- Failover graceful: si adaptador no responde, mostrar error con instrucciones claras

**Technical Requirements:**
- App debe detectar adaptador Bluetooth disponible (scanning)
- Establecer conexión estable (timeout handling)
- Parsear respuestas OBD2 robustamente (datos corruptos, timeouts)
- Mostrar progreso de lectura a usuario

### Data Security

**No Special Encryption Required:**
- OBD2 data transmitido vía HTTPS standard (Firebase + Vercel AI SDK)
- No se requiere encriptación en reposo adicional
- Datos de vehículos (marca, modelo, km) tratados como datos normales de usuario

**No Audit Requirements:**
- No hay requerimientos de auditoria de acceso
- Logs estándar de infraestructura (Firebase Logs) suficientes

### Payment Integration

**Subscription Processing:**
- Integración con procesador de pago específico (ej: Stripe, Mercado Pago, etc.)
- PCI compliance responsabilidad del procesador (no manejamos datos de tarjeta directamente)
- Webhook para sincronizar estado de suscripción (paid/cancelled)
- Error handling: si falla sincronización, usuario puede reintentar

## SaaS B2B Specific Requirements

### Multi-Tenancy Architecture

Motora utiliza un modelo **single-database, multi-tenant** compartido con separación lógica por usuario.

**Data Isolation:**
- Todos los datos en la misma Firestore (Firebase)
- Separación lógica mediante `userId` y `userType` en cada documento
- Queries filtradas por `userId` para garantizar aislamiento
- Los datos de un usuario nunca son visibles a otro usuario (a menos que haya relación explícita: business-client)

**Infrastructure:**
- Single infrastructure (Firebase, Cloud Functions, Vercel AI)
- No hay instancias separadas por tenant
- Escalabilidad horizontal automática (Cloud Functions, Firestore)

### Role-Based Access Control (RBAC)

El sistema implementa 5 roles con permisos diferenciados:

| Rol | Acceso Mobile | Acceso Backoffice | Capacidades Clave |
|-----|---------------|-------------------|------------------|
| **Free User** | Sí | No | Registrar 1-2 vehículos, OBD2, historial básico, NO IA |
| **Premium User** | Sí | No | Vehículos ilimitados, OBD2, IA análisis, sugerencias mantenimiento |
| **Business** | Sí | Sí (básico) | Perfil de negocio, recibir turnos, listar servicios, ver clientes |
| **Business Pro** | Sí | Sí (completo) | Todo Business + IA marketing, análisis estadísticas (turnos, visualizaciones) |
| **Platform Admin** | No | Sí | Visualizar usuarios, crear businesses, revisar uso IA, modificar perfiles |

**Permission Matrix (Simplified):**
- Free/Premium: pueden ver solo sus datos
- Business/Business Pro: pueden ver datos de sus clientes (solo si compartieron auto)
- Admin: acceso read-only a todos los datos para monitoreo

### Subscription Tiers

**Individual Users:**
- Free: $0/mes (limitado a 2 vehículos, sin IA)
- Premium: $9.99/mes (ilimitados vehículos, acceso IA)

**Business Users:**
- Business: $19.99/mes (backoffice básico, gestión de servicios)
- Business Pro: $49.99/mes (backoffice completo + IA para marketing + analytics)

**Billing Model:**
- Suscripción mensual recurrente
- Procesador: Mercado Pago (principal), Stripe (future)
- Webhook para sincronizar estado de suscripción en tiempo real
- Cancelación inmediata de acceso si suscripción caduca

### Integration Requirements

**Payment Processing:**
- Mercado Pago: gestionar suscripciones, webhooks de confirmación
- Manejo de errores: reintentos automáticos, notificación a usuario si falla

**Analytics & BI:**
- Integración con plataforma analytics (ej: Mixpanel, Amplitude, o custom)
- Métricas en Dashboard Admin: usuarios activos, conversión, uso IA, businesses activos
- Real-time dashboards para decisiones operacionales

**Email & SMS Notifications:**
- Email: confirmación de suscripción, recordatorios de mantenimiento, sugerencias IA
- SMS: notificaciones urgentes (error OBD2, mantenimiento crítico)
- Provider: SendGrid (email), Twilio (SMS)
- Templating: messages personalizados por idioma y contexto

**Maps Integration:**
- Visualizar ubicación de businesses en mapa (app usuario)
- Búsqueda geográfica: "talles cerca de mí"
- Provider: Google Maps API
- No tracking real-time de usuarios

### Data Model & Isolation

**Collection Structure (Firestore):**
```
users/
  {userId}/
    profile (common fields)
    vehicles/
      {vehicleId}/
        data
    preferences

businesses/
  {businessId}/
    profile
    services
    clients (relación many-to-many)
    stats (turnos, visualizaciones)
    subscriptionStatus

subscriptions/
  {userId}/
    tier
    status (active/cancelled/expired)
    renewal_date
    payment_method_id

obd2_readings/
  {userId}/{vehicleId}/{readingId}/
    data

ai_usage/
  {userId}/
    requests_count
    last_request_timestamp
```

**Multi-Tenant Queries:**
- Always filter by `userId` or `businessId`
- Firebase Security Rules enforzan tenant isolation
- No queries globales sin filtro

### Scalability & Performance

**Expected Load (3-month MVP):**
- 500 active users
- 25 premium users (heavy IA usage)
- 10 businesses
- ~400 IA requests/month
- Peak: ~100 concurrent mobile users

**Scaling Strategy:**
- Firebase Auto-scaling (Firestore reads/writes)
- Cloud Functions: auto-scale on demand
- Cache layer: TanStack Query (mobile) para evitar repeated API calls
- Rate limiting: 1 IA call per user per day (FREE), unlimited premium

### Security Considerations

**Multi-Tenant Security:**
- Firebase Security Rules protegen tenant isolation
- No user puede acceder a datos de otro user (a menos que authorized: business→client)
- Server-side validation: uid from `request.auth!.uid` (nunca confiar en client)
- Audit logs: todos los accesos a IA tracked por userId

**API Security:**
- HTTPS only
- Authentication: Firebase Auth (JWT tokens)
- Authorization: Cloud Functions validan rol/permisos antes de operación

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP + Experience MVP

El MVP resuelve el problema crítico: **aplicar IA al uso vehicular de manera accesible**. No es suficiente solo diagnóstico OBD2; la IA es lo que diferencia y atrae a usuarios a pagar premium. El MVP debe demostrar esta propuesta de valor de manera robusta y confiable.

**Scope Philosophy:**
- Incluir todo lo documentado (5 roles, integraciones core, multi-plataforma)
- Excluir features de "escala" que no son necesarias para MVP (Analytics, Business Pro)
- Priorizar experiencia de usuario excelente sobre cantidad de features
- Validar que usuarios pagan por IA antes de expansión

### MVP Feature Set (Phase 1 — Current)

**Core User Journeys Supported:**
1. Juan (Free User) — Descubrimiento y adopción
2. Lucía (Premium User) — Conversión y engagement
3. Carlos (Business User) — Escalabilidad del negocio
4. Dario (Admin) — Monitoreo operacional

**Roles Incluidos en MVP:**
- Free User (1-2 vehículos, sin IA)
- Premium User (ilimitados, IA incluida)
- Business (backoffice básico, gestión servicios)
- Platform Admin (monitoreo, gestión)

**Note:** Business Pro excluido de MVP (sin IA marketing, sin analytics avanzados)

**Mobile Application (Users) — Must-Have:**
- Autenticación (email, Google, Apple)
- Gestión de vehículos (CRUD: marca, modelo, año, VIN)
- Registro integral: vencimientos, tareas pendientes, mantenimientos realizados
- Análisis OBD2 en tiempo real (Bluetooth genérico)
- Historial de diagnósticos
- Premium paywall (2-vehículo limit, IA access)
- IA Analysis (GPT-4o-mini): sugerencias contextuales basadas en OBD2 + vehículo

**Mobile Application (Businesses) — Must-Have:**
- Perfil de negocio (nombre, servicios, ubicación, contacto)
- Búsqueda por usuarios (geolocalización)
- Recibir consultas de usuarios
- Ver clientes registrados (si compartieron auto)
- Sistema de turnos básico (recibir/aceptar solicitudes)

**Backoffice (Admin) — Minimum Viable:**
- Dashboard con KPIs: usuarios activos, conversión, businesses, uso IA
- Gestión de suscripciones (activar/desactivar)
- Logs de IA usage (quién, cuántos requests, costo)
- Crear/listar/editar businesses
- Editar perfiles de usuarios (support)

**Web (Promotional):**
- Landing page con value proposition
- Explainer de OBD2 + IA
- Links de descarga (App Store, Google Play)
- Términos y condiciones, privacidad

**Integraciones Incluidas en MVP:**
- Mercado Pago (suscripciones)
- Email/SMS (confirmaciones, recordatorios)
- Google Maps (búsqueda geográfica de businesses)
- Vercel AI SDK (IA GPT-4o-mini)
- Firebase (auth, Firestore, Cloud Functions)

**Integraciones Excluidas (Phase 2):**
- Analytics/BI platform (Phase 2)

**Technical Requirements (MVP):**
- Uptime: 99%+
- Response time: <1s (non-IA operations)
- OBD2 success rate: +80%
- Security: Firebase Security Rules, server-side validation

### Post-MVP Features

**Phase 2 (Growth — 6-12 meses post-MVP):**

- **Business Pro Role:** Acceso a IA para marketing, análisis estadísticas (turnos, visualizaciones), reportes predictivos
- **Analytics/BI Platform:** Dashboards avanzados para Admin, cohort analysis, revenue tracking
- **Turnero Inteligente:** Sistema de turnos automático basado en predicciones de mantenimiento
- **CRM Básico para Businesses:** Gestión de clientes, historial de interacciones
- **Advanced Notifications:** Notificaciones inteligentes (cuándo contactar clientes, basado en predicciones)

**Phase 3 (Expansion — 12+ meses):**

- **Predictive Maintenance Platform:** IA que predice fallas 6+ meses adelante
- **Connected Ecosystem:** API abierta para proveedores (repuestos, servicios, seguros)
- **Business AI Automation:** Turnero autónomo, servicio al cliente automático, pricing dinámico
- **Regional Expansion:** Multi-país (Latam, España)
- **Insurance Integration:** Conexión con seguros para ofertas personalizadas
- **Parts Marketplace:** Compra de repuestos directamente desde app

### Resource & Timeline

**MVP Team (Estimated):**
- 1 Backend Engineer (Cloud Functions, Firestore, IA integration)
- 2 Mobile Engineers (React Native, iOS/Android)
- 1 Frontend/Backoffice Engineer (React)
- 1 Product Manager (you)
- 1 QA/DevOps (testing, infrastructure)
- Total: ~5 FTE

**Timeline:** No deadline specified — build at sustainable pace

### Risk Mitigation Strategy

**Technical Risks:**
- **OBD2 Hardware Compatibility:** Riesgo: adaptadores genéricos varían en confiabilidad. **Mitigation:** Soporte 2-3 marcas top (ELM327 compatible), graceful fallback con mensajes claros
- **IA Cost Escalation:** Riesgo: costo Vercel AI sube rápidamente. **Mitigation:** Rate limiting (1 call/día free, unlimited premium), monitoreo de costo vs revenue en tiempo real
- **Firebase Scalability:** Riesgo: Firestore queries no optimizadas en escala. **Mitigation:** Índices estratégicos, query benchmarking pre-MVP

**Market Risks:**
- **Adoption Risk:** ¿Usuarios realmente pagan por IA? **Mitigation:** MVP con clara proposición de valor, A/B testing de paywall copy, feedback loops rápidos
- **Business User Attraction:** ¿Talles/mecánicos ven valor? **Mitigation:** Outreach personal, case studies tempranos, incentivos (gratis 1 mes)

**Resource Risks:**
- **Team Capacity:** ¿5 FTE es realista? **Mitigation:** Priorizar core features, usar templates/libraries, outsource non-core (design, QA)
- **Scope Creep:** ¿MVP se expande? **Mitigation:** Rigorous scope management, Phase 2/3 backlog para nice-to-haves, monthly review

## Functional Requirements

### User Management & Authentication

- **FR1:** Usuario puede registrarse con email, Google, o Apple
- **FR2:** Usuario puede iniciar sesión con credentials o OAuth
- **FR3:** Usuario puede cerrar sesión y limpiar cache
- **FR4:** Usuario puede recuperar contraseña vía email
- **FR5:** Usuario puede ver y editar su perfil (nombre, email, foto)
- **FR6:** Usuario puede ver su tipo de suscripción (free/premium) y fecha de renovación
- **FR7:** Sistema mantiene sesión activa entre app restarts (persistencia)

### Vehicle Management

- **FR8:** Usuario puede crear vehículo (marca, modelo, año, VIN, patente)
- **FR9:** Usuario puede editar datos de vehículo existente
- **FR10:** Usuario puede eliminar vehículo de su cuenta
- **FR11:** Usuario free puede registrar máximo 2 vehículos
- **FR12:** Usuario premium puede registrar ilimitados vehículos
- **FR13:** Usuario puede ver listado de todos sus vehículos
- **FR14:** Usuario puede seleccionar vehículo "activo" para diagnóstico

### Maintenance & Task Tracking

- **FR15:** Usuario puede registrar vencimiento (patente, seguro, ITV)
- **FR16:** Usuario puede crear tarea de mantenimiento
- **FR17:** Usuario puede marcar tarea como completada
- **FR18:** Usuario puede ver historial de mantenimientos realizados
- **FR19:** Sistema muestra recordatorio de vencimientos próximos (notificación)
- **FR20:** Usuario puede establecer recordatorios personalizados

### OBD2 Integration

- **FR21:** Usuario puede buscar adaptadores Bluetooth disponibles
- **FR22:** Usuario puede emparejar adaptador OBD2 Bluetooth genérico
- **FR23:** Usuario puede desemparejar adaptador OBD2
- **FR24:** Usuario puede iniciar lectura de diagnóstico OBD2
- **FR25:** Sistema decodifica códigos de error OBD2 (P0300, P0134, etc.)
- **FR26:** Sistema muestra valores en tiempo real (RPM, temperatura, consumo)
- **FR27:** Sistema maneja fallos de conexión con mensajes claros
- **FR28:** Usuario puede ver historial de lecturas OBD2
- **FR29:** Sistema requiere aceptación de términos antes de usar OBD2

### IA Analysis & Recommendations

- **FR30:** Usuario premium puede solicitar análisis IA de diagnóstico
- **FR31:** Sistema envía datos OBD2 + contexto vehículo a IA
- **FR32:** IA retorna análisis: problema identificado, urgencia, costo estimado
- **FR33:** Usuario puede ver historial de análisis IA
- **FR34:** Usuario free obtiene 1 análisis IA gratis (trial/demo)
- **FR35:** Sistema muestra costo de IA usage al admin

### Subscription & Billing

- **FR36:** Usuario puede ver opciones de suscripción (free/premium)
- **FR37:** Usuario free ve paywall al intentar: 3er vehículo o análisis IA
- **FR38:** Usuario puede comprar suscripción premium vía Mercado Pago
- **FR39:** Sistema sincroniza estado de suscripción (activa/expirada)
- **FR40:** Usuario recibe confirmación de pago vía email
- **FR41:** Usuario puede cancelar suscripción en cualquier momento
- **FR42:** Sistema revoca acceso premium si suscripción caduca

### Business Profile & Services

- **FR43:** Usuario business puede crear perfil de negocio (nombre, servicios, ubicación)
- **FR44:** Usuario business puede editar servicios ofrecidos
- **FR45:** Usuario business puede ver lista de clientes conectados
- **FR46:** Usuarios pueden buscar businesses por geolocalización (mapa)
- **FR47:** Usuarios pueden ver perfil de business (servicios, ubicación, contacto)
- **FR48:** Usuario business aparece en resultados de búsqueda de otros usuarios

### Booking & Communication

- **FR49:** Usuario puede enviar consulta/solicitud de turno a business
- **FR50:** Usuario business recibe notificación de nueva consulta
- **FR51:** Usuario business puede aceptar/rechazar solicitud de turno
- **FR52:** Sistema envía confirmación a usuario cuando business acepta
- **FR53:** Usuario puede ver historial de turnos/consultas
- **FR54:** Usuario business puede enviar mensaje a cliente

### Admin Dashboard & Monitoring

- **FR55:** Admin puede ver dashboard con KPIs: usuarios activos, conversión, businesses
- **FR56:** Admin puede filtrar usuarios por tipo (free, premium, business)
- **FR57:** Admin puede visualizar logs de uso de IA (quién, cuántos requests, costo)
- **FR58:** Admin puede crear business manualmente (invite/onboarding)
- **FR59:** Admin puede editar perfil de usuario (support)
- **FR60:** Admin puede activar/desactivar suscripción de usuario
- **FR61:** Admin puede ver métricas de ingresos (suscripciones, conversión)

### Notifications & Communication

- **FR62:** Sistema envía email de confirmación de registro
- **FR63:** Sistema envía email de recordatorio de vencimiento
- **FR64:** Sistema envía SMS de alerta (OBD2 crítico, mantenimiento urgente)
- **FR65:** Usuario puede recibir notificaciones push en mobile
- **FR66:** Usuario puede desuscribirse de notificaciones específicas

### Web & Promotional

- **FR67:** Web landing page muestra value proposition de Motora
- **FR68:** Web contiene explainer de cómo funciona OBD2 + IA
- **FR69:** Web contiene links de descarga a App Store y Google Play
- **FR70:** Web contiene términos y condiciones
- **FR71:** Web contiene política de privacidad

### Data & Security

- **FR72:** Sistema aísla datos de cada usuario (multi-tenancy)
- **FR73:** Usuario business puede ver solo datos de clientes que compartieron vehículos
- **FR74:** Admin puede ver datos agregados (no individuales sin need-to-know)
- **FR75:** Sistema encripta datos en tránsito (HTTPS)
- **FR76:** Sistema valida permisos antes de cualquier operación

## Non-Functional Requirements

### Performance

**Concurrent Users:**
- Sistema debe soportar mínimo **50 usuarios concurrentes simultáneamente** sin degradación de servicio
- Picos ocasionales hasta 100 usuarios: permitido con <20% degradación de performance

**Response Times (Non-IA Operations):**
- Operaciones móviles (navegación, registro vehículos, búsqueda): **<1 segundo**
- Carga de listados (vehículos, tareas, búsqueda businesses): **<2 segundos**
- OBD2 lectura inicial: **<30 segundos** (limitado por hardware)

**IA Response Times:**
- Análisis IA: **<10 segundos** desde request a respuesta (incluye llamada Vercel AI)
- Si excede 10s: mostrar loading indicator progresivo

**Offline Capabilities:**
- App móvil debe permitir: ver vehículos, tareas, historial de mantenimientos en modo offline
- Sincronización automática al recuperar conexión
- Indicador visual claro de modo offline

### Security

**Data in Transit:**
- Todos los datos viajados mediante **HTTPS only**
- TLS 1.2 mínimo
- No hay data en HTTP

**Data at Rest:**
- Datos en Firebase: protegidos por Security Rules de Firebase
- No se requiere encriptación adicional en reposo
- Tokens JWT en device: almacenados en Secure Storage (iOS Keychain, Android Keystore)

**Authentication:**
- Autenticación vía Firebase Auth (email, Google, Apple)
- Sin multifactor auth requerido para MVP
- Sessions timeout: 30 días (renovación automática)
- Logout limpia todos los datos locales

**API Security:**
- Cloud Functions: validar `request.auth.uid` antes de cualquier operación
- Nunca confiar en UID del client
- Rate limiting: 1 IA request/usuario/día (FREE), unlimited (PREMIUM)

**Compliance:**
- Cumplir leyes de privacidad locales de Argentina (sin GDPR específico)
- Términos y condiciones aceptados en primer login
- Política de privacidad accesible en web

### Scalability

**User Growth:**
- MVP: 500 usuarios activos
- Target 6 meses post-MVP: **2,000 usuarios activos**
- Arquitectura debe soportar **10x growth** (5,000 usuarios) sin cambios estructurales

**Database Scaling:**
- Firestore: auto-scaling habilitado
- Reads/writes ilimitados (pay-as-you-go model)
- Índices estratégicos optimizados antes de launch

**Cloud Functions:**
- Auto-scaling configurado
- No cold-start timeouts aceptables (funciones "warm" via cron si necesario)
- Budget límite configurado para evitar surprise costs

**Storage:**
- OBD2 readings: cada usuario ~1MB/año (conservative)
- 2,000 usuarios = 2GB total (acceptable)
- Implement data retention policy: mantener 2 años de datos históricos

### Integration

**Payment Processing (Mercado Pago):**
- Suscripciones procesadas vía Mercado Pago
- En caso de fallo de pago: **reintentar automáticamente** 3 veces (5min, 15min, 1hora)
- Si todas fallan: notificar user vía email + SMS, bloquear acceso premium hasta resolver
- Webhook timeout: máximo 30 segundos (reintentar si no responde)
- IPN (Instant Payment Notification) confiable: validar firma Mercado Pago

**Maps Integration (Google Maps):**
- Búsqueda de businesses por geolocalización
- Precisión requerida: **±50 metros** (nivel callejero)
- Fallback: si Maps no disponible, permitir búsqueda por nombre/categoría
- API key protegida (no exponer en client)

**Email/SMS Notifications:**
- No requieren ser real-time
- Email: entrega en <5 minutos (SendGrid)
- SMS: entrega en <10 minutos (Twilio)
- Retry logic: reintentar 3 veces si falla
- No crítico para MVP si hay delays

**Analytics (Phase 2):**
- No incluida en MVP NFRs
- Será definida en Phase 2

### Reliability & Uptime

**Target Uptime:**
- **99% uptime** (máximo 43 minutos/mes downtime)
- Planned maintenance: máximo 2 horas/mes (notificado 24h antes)
- Error tracking: Firebase Crashlytics para mobile, Cloud Logging para backend
- Alertas automáticas si uptime cae bajo 99%

**Backup & Recovery:**
- Firebase automáticamente realiza backups diarios
- RTO (Recovery Time Objective): <4 horas
- RPO (Recovery Point Objective): <24 horas

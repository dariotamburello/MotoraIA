---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-core-experience", "step-04-emotional-response"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "docs/project-context.md"
  - "docs/motora-context.md"
  - "docs/mobile-architecture.md"
  - "docs/backend-architecture.md"
  - "docs/diagnostico-obd2.md"
  - "docs/APP vehiculos.md"
  - "docs/frontend.md"
  - "docs/index.md"
workflowType: 'ux-design'
projectName: 'motora-ia'
userName: 'Dario'
date: '2026-04-25'
documentStatus: 'Inicialización completada — Listo para Discovery'
---

# UX Design Specification — Motora IA

**Author:** Dario
**Date:** 2026-04-25
**Project:** motora-ia
**Status:** Workflow iniciado — Discovery pending

---

_Este documento se construye colaborativamente paso a paso. Las decisiones de UX se agregan conforme avanzamos por las fases de discovery, definición y especificación visual._

_**Strategy:** Combinación de BMad UX Design (specs documentadas) + Claude Design (mockups visuales) — ver [architecture.md](architecture.md) para context completo._

---

## Executive Summary

### Project Vision

Motora es una plataforma multiplataforma que **consolida la experiencia automotriz** del dueño de auto: historia clínica digital del vehículo, gestor de mantenimiento, lector OBD2 en vivo, y descubrimiento de negocios locales — todo unificado con diagnósticos IA empáticos (persona "mecánico cordobés"). Tier dual **CLIENT** (FREE/PREMIUM) ↔ **BUSINESS** (Default/Plus) con switch de rol sin re-login.

**Posicionamiento:** Primera app local que combina historia + mantenimiento + OBD2 + descubrimiento de talleres con interfaz aproximable (no especializada).

### Target Users (3 Personas)

**Persona 1 — "Pablo Petrolhead"**
- Hombre técnico 28-45 (ingeniero, IT, aficionado automotriz)
- Busca **data automotriz detallada**: RPM curves, DTC codes, freeze frames, tendencias
- Power user PREMIUM, disfruta interpretar OBD2 él mismo
- Mood: *"quiero entender mi auto a fondo"*

**Persona 2 — "Mariana Práctica"**
- Dueña/dueño no-técnico 30-50 (mixto género)
- Busca **simplicidad y peace-of-mind**: estado del auto + reminders + documentación
- Foco en "¿está bien? ¿cuándo es la próxima ITV?" — no en data técnica
- Mood: *"no me hagas pensar como mecánico"*

**Persona 3 — "Carlos Mecánico"** (BUSINESS user)
- Taller independiente o multi-marca, 25-55, hombre
- Necesita **workflow rápido**: ver historia + diagnosticar + presupuestar
- Usa app **en taller** (datos móviles, prisa, manos posiblemente sucias)
- Mood: *"ahorrame 20 minutos por cliente"*

### AHA Moment

> "Es la primera app que entiende mi auto **completamente**: detecta problemas en lenguaje claro, tiene mis papeles digitales, mi historia de mantenimiento, y cuando algo se rompe, me dice qué taller cercano puede arreglarlo."

**Implicación UX:** Motora compite vs **fragmentación** (CarFax + WhatsApp del mecánico + Calendario para vencimientos + Google Maps). El AHA es **consolidación**.

### Pain Points Identificados

1. **Vacío de mercado local** — No existen apps locales que combinen los verticals automotrices
2. **Apps existentes son "duras"** — Diseñadas por/para especialistas (CarFax, Torque Pro, Drivvo)
3. **Interfaces feas** — No transmiten "premium" pese a ser de un dominio técnico

**Implicación UX:** Necesitamos **dignidad técnica + accesibilidad emocional**.

### Contexto de Uso

| Contexto | Lugar | Conectividad | Postura | Frecuencia |
|----------|-------|--------------|---------|------------|
| **Daily check** | Garage casa | Wifi | Two-handed, calmo | Varias veces/semana |
| **Recording maintenance** | Taller externo | Datos móviles | Rápido, posibles manos sucias | Ocasional |

**Implicación UX:** UI debe funcionar en ambos contextos: **profundidad en garage + agilidad en taller**.

### Brand Mood — "Garage Premium"

**Inspiración:** Tesla + Apple CarPlay + Linear

**Característica visual:**
- Dark mode dominante (alineado con paleta actual `#0F172A`)
- Acentos metálicos sutiles (gris frío, plateados)
- Tipografía bold + sans-serif técnica
- Animaciones suaves, no juguetonas
- Iconografía precisa (sin caricaturas)
- Confianza por **sofisticación**

**Tu paleta actual ya está en esa dirección** → necesita refinamiento, no overhaul.

### Key Design Challenges

1. **Tres personas con necesidades opuestas:** densidad técnica (Pablo) vs simplicidad (Mariana) vs velocidad (Carlos). Tensión: ¿UI única o adaptable?

2. **Densidad técnica vs Friendliness:** OBD2 telemetría es inherentemente técnica (RPM, °C, voltage, DTC codes). Tensión: mostrar todo (Petrolhead) sin abrumar (Mariana).

3. **Premium feel + Empathetic IA:** Tesla-cool es premium pero puede ser frío. La persona IA es empática (mecánico cordobés). Tensión: hardware-aesthetic + warmth tonal.

4. **Multi-context UX (garage ↔ taller):** Mismo user, diferentes manos, diferente luz, diferente prisa. Tensión: interface optimizada para ambos sin tradeoffs.

5. **Switch CLIENT ↔ BUSINESS sin confusión:** El mismo user puede ser dueño + mecánico. La UI cambia drásticamente entre roles. Tensión: branding consistente, funcionalidad muy diferente.

### Key Design Opportunities

1. **Progressive Disclosure por User Type:** Default UI simple (Mariana mode) con toggle "Pro Mode" para revelar densidad técnica (Petrolhead). Reduce abrumamiento sin limitar power users.

2. **Dashboard "Cinematográfico" HUD-style:** Reinventar visualización OBD2 — en lugar de tablas, **gauges animados estilo cuadro de auto** (RPM dial, temp gauge, fuel-level). Premium feel + entendible.

3. **Mecánico Cordobés con presencia visual sutil:** La IA tiene voz empática — darle presencia visual sutil (avatar minimalista, color púrpura PREMIUM, tone visual cálido cuando habla). Humanización sin caricatura.

4. **"Quick Capture" mode para BUSINESS:** Modo simplificado para Carlos — 2-tap maintenance entry, OBD2 scanner que prioriza speed sobre prettiness. UI role-aware sin rebuild completo.

5. **"Trust by Transparency":** Cards visuales con historia completa + timeline + iconografía clara (vs spreadsheets de competencia). Diferencial visible al primer vistazo.

### Competitive Landscape

| Competidor | Fortaleza | Debilidad |
|------------|-----------|-----------|
| **CarFax** | Historia vehicular completa | Solo USA, no integra OBD2 ni mantenimiento personal |
| **Drivvo** | Tracking de gastos | UI dura, sin OBD2 ni IA |
| **Torque Pro** | Lectura OBD2 técnica | Solo OBD2, UI para especialistas, sin historia |
| **Google Maps** | Descubrimiento de talleres | No integra contexto del auto |
| **WhatsApp del mecánico** | Cercanía | Sin historial, sin estructura |

**Diferencial Motora:** Consolidación + Accesibilidad + IA empática local + Aesthetic premium

---

## Core User Experience

### Defining Experience — Dual Pattern

**Entry Loop (alta frecuencia, daily/weekly):**
"Peace-of-mind Dashboard" — User abre la app y en 2 segundos sabe el estado de su auto: ¿algo urgente? ¿qué documentos vencen pronto? ¿último mantenimiento? Foco: glanceable, visualmente jerárquico, calmo cuando todo está bien.

**Engagement Loop (cuando hay diagnóstico, ocasional):**
"OBD2 + IA Empática" — User conecta ELM327 → escanea → recibe diagnóstico narrativo del "mecánico cordobés" con urgencia + acción justificada por desgaste real. Foco: profundo, narrativo, transformacional.

**Implicación de diseño:** Dashboard prioriza claridad instantánea (3s máximo). OBD2 puede tomar tiempo y atención porque es el momento de mayor valor agregado.

### Platform Strategy

| Plataforma | Rol | Stack |
|------------|-----|-------|
| **Mobile (PRIMARY)** | 95% UX, todos los flows CLIENT/BUSINESS | React Native + Expo (iOS + Android) |
| **Web (SECONDARY)** | Admin dashboard + KPIs internos | Vite React + TypeScript |
| **Public Web** | Landing + términos + privacidad | Vite React (modules/landing) |

**Offline Strategy: P1 — Offline mínimo**
- Viewing de data cacheada (vehículos, mantenimiento, historia OBD2) funciona sin red
- Editing/mutations requieren conexión → bloquean con toast claro
- TanStack Query staleTime de 5min cubre la mayoría de re-aperturas
- Sin sync queue compleja (no es prioridad MVP)

**Postura de uso:** Touch-based, two-handed default. Quick Capture mode disponible para taller (Carlos) con touch targets más grandes y workflow simplificado.

### Effortless Interactions — Top 3 Priorizados

**#1 PRIORIDAD MÁXIMA — "Saber si todo está bien al abrir la app"**
- Implementación: Splash → Dashboard con status semáforo dominante (verde/amarillo/rojo)
- Cards consolidadas: vehículo activo + último diagnóstico + próximo vencimiento
- Cero pensamiento: el user sabe en 2 segundos si necesita actuar
- Persona target: Mariana (default), también beneficia a Pablo y Carlos

**#2 PRIORIDAD ALTA — "Agregar mantenimiento en <30s"**
- Implementación: 1 tap "Agregar" → tipo preselected (último) → KM auto-completado → costo opcional → guardar
- Cero fricción de captura, formulario inteligente con defaults
- Persona target: Carlos (taller), Mariana (después de visita al mecánico)

**#3 PRIORIDAD MEDIA — "Switch CLIENT ↔ BUSINESS sin friction"**
- Implementación: 1 tap en avatar/header → toggle de rol → UI cambia sin re-login
- Estado `activeRole` persiste en AsyncStorage
- Persona target: Carlos (mecánico que también es dueño)

**Deferred a post-MVP (importantes pero no top 3):**
- Reminders push automáticos antes de vencimientos (crítico para retención, ya en backlog)
- OBD2 reconnect sin re-pairing (mejora UX Pablo, requiere persistir address Bluetooth)

### Critical Success Moments

| # | Momento | Make Condition | Break Condition |
|---|---------|----------------|-----------------|
| 1 | **Onboarding 3/3** | Primer auto en <90s, validación clara | Errores opacos, demasiados campos |
| 2 | **Primera conexión OBD2 exitosa** | Loading states claros, fallback con mock visible | Timeouts sin info, errores Bluetooth crípticos |
| 3 | **Primera lectura "mecánico cordobés"** | Tono argentino auténtico, justificación con piezas reales | "El código P0301 indica falla cilindro 1" (frío) |
| 4 | **Trigger upgrade PREMIUM** | Valor explicado + contexto, sin dark patterns | Paywall agresivo sin justificación |
| 5 | **Reconexión semana 2+** | "Lo último que hiciste fue X, te recomendamos Y" | Dashboard estático ("nada nuevo aquí") |

### Experience Principles

**1. Friendly Tech, no Tech Speak**
- Datos técnicos siempre con contexto humano (RPM con label "régimen del motor")
- DTC sin traducción IA = inaceptable
- Densidad técnica disponible vía toggle, nunca obligatoria

**2. Calm by Default, Power on Demand**
- Default UI: Mariana mode (resumen, semáforo, calma)
- Toggle "Pro Mode": gauges, tendencias, freeze frames detallados
- Mismo app, dos densidades adaptables

**3. Premium feels, never frío**
- Aesthetic: Tesla + Apple CarPlay (dark, metallic, technical)
- Narrative: Mecánico cordobés (cálido, empático, justificado)
- Tensión productiva: visual sofisticado + tono humano

**4. Trust by Transparency**
- Mostrar historia completa, evidencia visual, timestamps reales
- Combatir frustración "no sé si me están timando"
- Cards visuales > spreadsheets

**5. Two-handed Garage / One-handed Workshop**
- Toda interacción funciona en ambos contextos
- Touch targets mínimo 44pt
- Quick Capture mode para situaciones de prisa

---

## Desired Emotional Response

### Primary Emotional Goal — "Control Tranquilo"

> "Tengo el control completo de la salud de mi auto. No me sorprende nada — sé qué pasa, cuándo pasa, y qué hacer. **No vivo con ansiedad por mi auto.**"

Mezcla equilibrada de:
- **Dominio** (Pablo: "entiendo profundamente")
- **Paz mental** (Mariana: "no me preocupo")
- **Eficiencia** (Carlos: "no pierdo tiempo")

**Diferencial vs competidores:** Apps existentes generan ansiedad técnica (Torque Pro) o sobrecarga organizacional (Drivvo). Motora promete **calma activa**.

### Emotional Journey Map

| Momento | Emoción Deseada | Diseño |
|---------|-----------------|--------|
| **Discovery (primer contacto)** | Curiosidad respetada | "Esto se ve serio, profesional" — confianza visual desde el primer pixel |
| **Onboarding** | Progreso satisfactorio | Cada paso me acerca, sin fricción — barra visible, "casi listo" |
| **Daily Open** | Tranquilidad inmediata | Verde = todo bien, puedo cerrar — 2s = veredicto claro |
| **Diagnóstico OBD2** | Comprensión iluminadora | "Ah, entonces ESO es lo que pasa" — narrativa empática + acción clara |
| **Error State** | Frustración mitigada | "Lo arreglo en 1 paso, no me asusta" — errores en lenguaje humano |
| **Reconexión (semana 2+)** | Reconocimiento + Continuidad | "Esta app me conoce, retomé donde dejé" — cards reflejan contexto |

### Micro-Emotions Críticas

| Micro-Emoción | Por qué es Clave | UX Implementation |
|---------------|------------------|-------------------|
| **Confianza** | Data sensible (auto = patrimonio) | Visual sólido, transparencia, sin sorpresas |
| **Competencia** | OBD2 puede intimidar a Mariana | Lenguaje accesible, defaults inteligentes |
| **Premium** | Diferenciador vs apps "feas" | Animaciones suaves, tipografía cuidada, no caricaturas |
| **Progreso** | Mantenimiento = hábito a construir | Streaks visuales sutiles, timeline siempre creciendo |
| **Pertenencia** | Identidad local cordobés/argentino | Lenguaje regional auténtico, descubrimiento de talleres locales |
| **Anticipación positiva** | Trigger para reaperturas | Reminders amigables, "te recomendamos…" no "tenés que…" |

**Micro-emociones a EVITAR:**
- 🚫 **Ansiedad** — "tu auto puede explotar" (drama innecesario)
- 🚫 **Culpa** — "no registraste mantenimiento en 30 días" (shaming)
- 🚫 **Sobrecarga** — "revisá estos 47 datos" (overload técnico)
- 🚫 **Trampa** — "upgrade ahora o pierdes todo" (dark patterns)

### Emotion → Design Connections

| Emoción Deseada | Decisión UX |
|----------------|-------------|
| **Control Tranquilo** | Dashboard semáforo gigante (verde default, amarillo/rojo solo cuando importa) |
| **Confianza** | Timestamps reales ("Editado hace 2 horas") + historial completo visible |
| **Premium** | Animaciones spring (no bouncy), transiciones 200-300ms, NO confetti/celebraciones infantiles |
| **Competencia** | Tooltips opt-in junto a DTCs, IA traduce automáticamente, "Pro Mode" off por default |
| **Pertenencia** | Lenguaje cordobés en IA + naming de marcas locales (Renault Argentina, Fiat regionales) |
| **Progreso** | Timeline de mantenimiento siempre creciendo, milestones sutiles ("100 días con tu auto registrado") |
| **Anticipación positiva** | Reminders 7 días antes con tono amigable: "Che, tu seguro vence el martes" |
| **Comprensión iluminadora** | IA siempre responde con: (1) qué pasa (2) qué hacer (3) cuán urgente |

### Emotional Design Principles

**EP1 — "Mostrar verdad, no alarma"**
- Si el auto tiene problema, decirlo claro pero sin drama
- Jerarquía: Verde > Amarillo > Rojo (semáforo, no fuegos artificiales)
- Tone IA: directo + empático, NO apocalíptico
- *Ejemplo MAL:* "⚠️ ATENCIÓN: PROBLEMA CRÍTICO DETECTADO"
- *Ejemplo BIEN:* "Tu auto reportó un código relacionado con el cilindro 1. No es urgente, pero conviene revisarlo este mes"

**EP2 — "Celebrar progreso, no perseguir engagement"**
- NO gamification artificial (badges sin sentido, streaks que generan culpa)
- SÍ feedback positivo cuando user actúa: "Mantenimiento registrado. Próximo cambio aceite: en 5,000 km"
- Métrica del éxito = retención por valor, no por compulsión
- NUNCA usar dark patterns: notificaciones culposas, FOMO artificial, manipulación emocional

**EP3 — "Cordobés sin caricaturizar"**
- IA habla "como un mecánico de Córdoba": directo, empático, justifica con piezas reales
- NO clichés vulgares: "che boludo, tu auto está jodido"
- SÍ autenticidad respetuosa: "Mirá, este código P0301 indica falla en el cilindro 1 — generalmente es la bobina o la bujía. Te recomiendo revisar antes que se ponga peor"
- Tono = vecino que sabe, no robot ni standup comedian

### Design Anti-Patterns Identificados

Lo que Motora **NO** debe hacer (común en competidores):

1. **CarFax-syndrome:** Reportes legalistas en PDF que nadie lee → Motora muestra cards visuales
2. **Drivvo-overload:** 47 campos para registrar un mantenimiento → Motora usa defaults inteligentes (3 campos críticos)
3. **Torque Pro-coldness:** "P0301: Cylinder 1 Misfire Detected" → Motora lo traduce empático
4. **Duolingo-infantil:** Mascotas, confetti, fuegos artificiales → Motora celebra con discreción técnica
5. **Banking app-paranoia:** "Confirmar acción crítica" en 3 pasos para todo → Motora confirma solo lo destructivo

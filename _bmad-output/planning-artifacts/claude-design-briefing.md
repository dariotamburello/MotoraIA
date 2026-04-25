# Motora IA — Claude Design Briefing Pack

**Para:** [claude.ai/design](https://claude.ai/design)
**Generado:** 2026-04-25
**Source:** UX Design Specification (Steps 1-6 completados via /bmad-create-ux-design)

---

> **Cómo usar este briefing:** Copiá el contenido completo de la sección "## Briefing Prompt" abajo y pegalo como prompt inicial en Claude Design. Incluye todo el context necesario.

---

## Briefing Prompt

# Motora IA — Visual Design Briefing

## Producto
Motora es una plataforma multiplataforma que actúa como **historia clínica digital del auto**, gestor de mantenimiento, lector OBD2 en vivo, y descubrimiento de talleres locales — todo unificado con diagnósticos IA empáticos (persona "mecánico de Córdoba, Argentina").

## Brand Mood: "Garage Premium"
- Inspiración: Tesla App + Apple CarPlay + Linear + **Wise** (referencia ancla)
- Adjetivos: simple, sofisticado, técnico, calmo, profesional, accesible
- **NO**: 3D rendering, skeumorfismo, caricaturas, gamification, infantil

## Emoción Primaria a Transmitir: "Control Tranquilo"
> "Tengo el control completo de la salud de mi auto. No vivo con ansiedad."

## Target Users (3 personas que conviven)
1. **Pablo Petrolhead** — Hombre técnico 28-45, quiere data densa (RPM curves, DTCs, tendencias)
2. **Mariana Práctica** — Dueña/dueño 30-50 no técnico, quiere simplicidad + reminders
3. **Carlos Mecánico** — Taller independiente 25-55, quiere workflow rápido (Quick Capture mode)

## Constraint Visual Clave
**"Simple pero sofisticado — NO 3D"**
Cards 2D limpias > visualizaciones 3D. Densidad inteligente > dashboards saturados.

## Design Tokens (paleta + tipografía propuesta)

### Colors (dark theme)
- background.primary: #0F172A
- background.secondary: #1E293B
- background.elevated: #262F45
- border.default: #334155
- text.heading: #F8FAFC
- text.body: #CBD5E1
- text.muted: #64748B
- status.success: #34D399 (verde menta — todo bien)
- status.warning: #F59E0B (ámbar — atención, no urgente)
- status.error: #EF4444 (rojo — urgente)
- status.premium: #A855F7 (púrpura — feature PREMIUM)
- brand.primary: #3B82F6 (azul Motora)
- brand.metallic: #94A3B8 (acento plateado sutil)

### Typography
- Familia base: **Inter** (Google Fonts)
- Familia mono: **JetBrains Mono** (para DTC codes, RPM values, datos técnicos)
- Hero numbers (dashboard status): 48px bold
- Section titles: 22-28px semibold
- Body: 15px regular
- Metadata/captions: 13px medium

### Spacing
Base 4pt scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64

### Animations
Spring sutiles, NO bouncy. Durations: 200-300ms.

## Pantallas Críticas para Mockup (Priorizadas)

### 1. Dashboard (Home) — PRIORIDAD MÁXIMA
**Goal:** En 2 segundos, el user sabe el estado de su auto.

Componentes visuales:
- Saludo personalizado: "Hola, Dario"
- **Status Hero Card** dominante: ícono circular gigante (verde/amarillo/rojo) con label "Todo en orden" / "Algo necesita atención" / "Acción requerida"
- Sub-cards:
  - Vehículo activo (marca, modelo, KM)
  - Último diagnóstico OBD2 (fecha, badges DTC si los hay)
  - Próximo vencimiento (seguro/ITV con días restantes)
- Bottom tab bar (4 tabs: Home / Vehículos / Diagnóstico / Perfil)

Inspiración: Wise dashboard + Apple Health summary

### 2. Vehicle Detail — PRIORIDAD ALTA
**Goal:** Historia clínica completa del auto.

Componentes:
- **VehicleHeroCard** (top): marca + modelo + año + patente + KM + botón editar
- **TabBar interno** (4 tabs scrollable): Mantenimiento · OBD2 · Tareas · Documentación
- **Cards de timeline** verticales para cada tab
- Animación TabBar: pill deslizante (spring)

Inspiración: Apple Health timeline + Linear cards

### 3. OBD2 Diagnostics — PRIORIDAD ALTA
**Goal:** Telemetría en vivo + escaneo + diagnóstico IA.

Componentes:
- **Estado de conexión** prominente (disconnected → connecting → connected → scanning)
- **Live Telemetry** con gauges 2D minimalistas (NO skeumorfismo):
  - RPM (0-8000)
  - Speed (km/h)
  - Coolant Temp (°C)
  - Battery Voltage
- **DTC Codes encontrados** con badges
- **Botón "Interpretar con IA"** (PREMIUM, púrpura)
- Resultado IA: Card narrativa con 3 secciones (Qué pasa / Qué hacer / Urgencia)

Inspiración: Datadog metrics + Tesla app health

### 4. Add Maintenance — PRIORIDAD MEDIA (Quick Capture)
**Goal:** Registrar mantenimiento en <30 segundos.

Componentes:
- Form vertical con defaults inteligentes
- Campo tipo (selector con emoji)
- Campo KM (auto-completado del último)
- Costo (opcional)
- Notas (opcional)
- Botón "Guardar" prominente

Inspiración: Things 3 quick capture + Wise transaction add

## Stack Técnico (para component code generation)
- React Native 0.83.2 + Expo 55 (mobile)
- React 19 + Vite + TailwindCSS (web)
- TypeScript strict mode
- lucide-react-native / lucide-react (icons)
- NativeWind (mobile utility classes)
- Zustand + TanStack Query (state)

## Codebase Reference
Si Claude Design puede leer mi codebase, está en `/mobile/` — `features/` para screens existentes, `shared/components/` para componentes actuales (AppInput, AppSelect, EditFormModal, ConfirmationModal, ToastProvider). NO los reemplaces, solo refiná visualmente.

## Anti-Patterns a EVITAR

**De competidores automotrices:**
- CarFax-syndrome: PDFs legalistas
- Drivvo-overload: 47 campos por entrada
- Torque Pro-coldness: "P0301: Misfire" sin contexto
- Hum dashboards genéricos

**De UX en general:**
- Duolingo-infantil: mascotas, confetti, "¡Buen trabajo!"
- Banking-paranoia: confirmar todo en 3 pasos
- Slack-overload: notifications constantes

**Específicos Garage Premium:**
- 3D rendering del auto
- Skeumorfismo pesado
- Caricaturas mecánicas
- Gamification artificial

## Output Esperado de Claude Design
1. **3-5 directions visuales** para Dashboard (mostrame variaciones del status hero card)
2. **Mockup de Vehicle Detail** con timeline cards refinadas
3. **OBD2 gauges 2D** (3-5 estilos a elegir)
4. **Componente "AI Diagnosis Card"** (visualización del mecánico cordobés)
5. Cuando tengamos direction final → código RN para componentes elegidos

## Tono de IA del Mecánico Cordobés
La IA habla "como un mecánico de Córdoba": directo, empático, justifica con piezas reales.
- NO clichés vulgares: "che boludo, tu auto está jodido"
- SÍ autenticidad respetuosa: "Mirá, este código P0301 indica falla en el cilindro 1 — generalmente es la bobina o la bujía. Te recomiendo revisar antes que se ponga peor"
- Tono = vecino que sabe, no robot ni standup comedian

---

## Workflow Recomendado en Claude Design

### Sesión 1: Discovery + Directions
1. Pegá el briefing arriba como primer prompt
2. Subí screenshots de tu app actual (para que Claude Design entienda el "feo" actual)
3. Subí 2-3 screenshots de Wise / Tesla / Linear / Apple Health (referencias visuales)
4. Pedí: "Mostrame 3-5 direcciones para el Dashboard"
5. Iterá hasta 1-2 directions sólidas

### Sesión 2: Refinement
6. Tomá la direction elegida y refiná Vehicle Detail
7. Generá OBD2 gauges en esa misma direction
8. Generá AI Diagnosis Card

### Sesión 3: Code Generation
9. Pedí código React Native para los componentes elegidos
10. Aplicá tokens definidos (colors, typography, spacing)

### Vuelta a BMad UX Design
11. Tomá screenshots de mockups finales
12. Volvé a Claude Code y continúa el workflow `/bmad-create-ux-design` desde Step 7 (Defining Experience)
13. Los mockups visuales informan Steps 8-13 (Visual Foundation, User Journeys, Components, Patterns)

---

## Status del Workflow BMad

**Steps Completados (6/14):**
- ✅ Step 1: Init
- ✅ Step 2: Discovery (3 personas + AHA moment + pain points)
- ✅ Step 3: Core Experience (dual pattern + 5 principles)
- ✅ Step 4: Emotional Response (Control Tranquilo + EP1-3)
- ✅ Step 5: Inspiration (10 apps validadas + matriz Adopt/Adapt/Avoid)
- ✅ Step 6: Design System (tokens + Inter + JetBrains Mono + primitives plan)

**Steps Pendientes (post-Claude Design):**
- ⏳ Step 7: Defining Experience
- ⏳ Step 8: Visual Foundation
- ⏳ Step 9: Design Directions
- ⏳ Step 10: User Journeys
- ⏳ Step 11: Component Strategy
- ⏳ Step 12: UX Patterns
- ⏳ Step 13: Responsive & Accessibility
- ⏳ Step 14: Complete

**Próximo paso al volver:** Continuar con `/bmad-create-ux-design` desde Step 7 (Defining Experience) con mockups en mano.

// Motora IA — shared mock data
// All UI copy is in Spanish (Argentina). Code/labels in English.

window.MOTORA_DATA = {
  user: {
    name: "Darío",
    fullName: "Darío Tamburello",
    initial: "D",
  },

  // Active vehicle
  vehicle: {
    brand: "Volkswagen",
    model: "Golf GTI",
    year: 2019,
    plate: "AE 423 PK",
    km: 87420,
    color: "#1E293B",
    fuel: "Nafta",
    engine: "2.0 TSI",
    nextServiceKm: 90000,
  },

  // Garage
  vehicles: [
    { id: "v1", brand: "Volkswagen", model: "Golf GTI", year: 2019, plate: "AE 423 PK", km: 87420, status: "warning" },
    { id: "v2", brand: "Toyota", model: "Hilux SRX", year: 2022, plate: "AF 891 LK", km: 42100, status: "ok" },
    { id: "v3", brand: "Renault", model: "Sandero", year: 2017, plate: "AC 110 GH", km: 134890, status: "ok" },
  ],

  // Last diagnostic — drives status
  lastDiagnostic: {
    date: "12 abr 2026",
    time: "14:32",
    dtcs: [
      { code: "P0301", desc: "Falla de encendido en cilindro 1", severity: "warning" },
      { code: "P0420", desc: "Eficiencia del catalizador por debajo del umbral (banco 1)", severity: "warning" },
    ],
    snapshot: {
      rpm: 850,
      speed: 0,
      coolantC: 92,
      batteryV: 13.8,
      oilTempC: 96,
      fuelPct: 64,
    },
  },

  // Upcoming
  reminders: [
    { kind: "service", title: "Próximo service", value: "2.580 km", sub: "Aceite + filtros", urgency: "soon" },
    { kind: "vtv", title: "VTV", value: "47 días", sub: "Vence 11 jun 2026", urgency: "ok" },
    { kind: "insurance", title: "Seguro", value: "12 días", sub: "Renovación La Caja", urgency: "warning" },
  ],

  // Maintenance timeline
  maintenance: [
    { id: "m1", date: "28 mar 2026", km: 86120, type: "Cambio de aceite", desc: "Aceite 5W30 sintético + filtro", cost: 48000, shop: "Lubricentro Avellaneda" },
    { id: "m2", date: "15 feb 2026", km: 84300, type: "Pastillas de freno", desc: "Delanteras Ferodo Premium", cost: 92000, shop: "Frenos Mitre" },
    { id: "m3", date: "04 ene 2026", km: 82100, type: "Alineación y balanceo", desc: "Las cuatro ruedas", cost: 28000, shop: "Gomería Fangio" },
    { id: "m4", date: "12 nov 2025", km: 79800, type: "Service mayor", desc: "Aceite + 4 filtros + bujías", cost: 165000, shop: "VW Oficial Córdoba" },
  ],

  // Live telemetry tick (for OBD2 screen)
  telemetry: {
    rpm: 2840,
    rpmMax: 8000,
    speed: 64,
    speedMax: 200,
    coolantC: 92,
    coolantMax: 130,
    batteryV: 14.1,
    batteryMin: 11,
    batteryMax: 15,
    oilTempC: 96,
    fuelPct: 64,
  },

  // AI diagnosis (cordobés mechanic, no slang clichés)
  aiDiagnosis: {
    persona: { name: "El Negro", role: "Mecánico IA · Córdoba", initial: "N" },
    summary: "Falla de encendido intermitente en cilindro 1, probablemente por bobina o bujía gastada. El catalizador empieza a sentirlo.",
    sections: [
      {
        kind: "what",
        title: "Qué está pasando",
        body: "El P0301 indica que el cilindro 1 está fallando esporádicamente. Cuando una bujía o bobina se cansa, no enciende bien la mezcla, y eso te baja potencia y manda nafta sin quemar al escape. Por eso también te saltó el P0420 — el catalizador trabaja de más para limpiar lo que no se quemó.",
      },
      {
        kind: "do",
        title: "Qué te recomiendo hacer",
        body: "Primero lo más barato: revisar bujía y bobina del cilindro 1. Si tienen 60.000+ km, cambialas las cuatro de una. Después escaneá de nuevo. Si el P0420 persiste, recién ahí mirás el catalizador.",
      },
      {
        kind: "urgency",
        title: "Urgencia",
        level: "Esta semana",
        body: "No es urgente, pero no lo dejes. Manejar con falla de encendido sostenida termina arruinando el catalizador, y cambiarlo se va a 800 mil tranquilo.",
      },
    ],
  },
};

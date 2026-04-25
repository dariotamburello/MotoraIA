// Motora IA — Dashboard with 4 directions
// Direction A — "Wise Calm" — minimal status pill + huge metric, list of cards
// Direction B — "Health Ring" — Apple Health-inspired circular meter
// Direction C — "Editorial" — Status as a sentence, typographic-first
// Direction D — "Cockpit" — Telemetry-forward with mini live gauges

// ---------- Status logic ----------
const STATUS_COPY = {
  ok:   { label: "Todo en orden",        sentence: "Tu auto está al día.",            short: "OK",     hue: "ok"  },
  warn: { label: "Algo necesita atención", sentence: "Hay 2 puntos para revisar.",     short: "Atención", hue: "warn" },
  err:  { label: "Acción requerida",     sentence: "Algo necesita tu atención hoy.",   short: "Crítico", hue: "err" },
};

// ---------- Shared parts ----------
function VehicleStrip({ v, onClick }) {
  return (
    <button onClick={onClick} className="card card-button" style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "calc(100% - 32px)", textAlign: "left",
      background: "var(--bg-secondary)", color: "var(--text-body)",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "linear-gradient(135deg, #334155, #1E293B)",
        border: "1px solid var(--hairline)",
        display: "grid", placeItems: "center",
      }}>
        <I.Car size={22} color="var(--metallic)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ color: "var(--text-heading)", fontWeight: 600, fontSize: 15 }}>{v.brand} {v.model}</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>· {v.year}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{v.plate}</span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--text-dim)" }} />
          <span className="mono" style={{ color: "var(--text-body)", fontSize: 12 }}>{v.km.toLocaleString("es-AR")} km</span>
        </div>
      </div>
      <I.Chevron size={16} color="var(--text-dim)" />
    </button>
  );
}

function ReminderRow({ r }) {
  const hue = r.urgency === "warning" ? "warn" : r.urgency === "soon" ? "warn" : "ok";
  const Icon = r.kind === "service" ? I.Wrench : r.kind === "vtv" ? I.Shield : I.Doc;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: hue === "warn" ? "var(--warn-soft)" : "var(--bg-elevated)",
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <Icon size={16} color={hue === "warn" ? "var(--warn)" : "var(--metallic)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>{r.title}</div>
        <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 1 }}>{r.sub}</div>
      </div>
      <div className="mono" style={{
        color: hue === "warn" ? "var(--warn)" : "var(--text-body)",
        fontSize: 13, fontWeight: 600, fontFeatureSettings: '"tnum" 1',
      }}>
        {r.value}
      </div>
    </div>
  );
}

function LastDiagnosticCard({ status, data, onClick }) {
  const hue = STATUS_COPY[status].hue;
  return (
    <button onClick={onClick} className="card card-button" style={{
      width: "calc(100% - 32px)", textAlign: "left",
      background: "var(--bg-secondary)", color: "var(--text-body)",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <I.Activity size={16} color="var(--brand)" />
        <span style={{ flex: 1, color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>Último diagnóstico</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }} className="mono">{data.date}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {data.dtcs.length === 0 ? (
          <span className="chip chip-ok"><I.Check size={11} /> Sin códigos</span>
        ) : (
          data.dtcs.slice(0, 3).map(d => (
            <span key={d.code} className={`chip chip-${hue}`}>
              <span className="mono">{d.code}</span>
            </span>
          ))
        )}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.45 }}>
        {data.dtcs.length === 0 ? "Sin errores activos detectados." : data.dtcs[0].desc}
      </div>
    </button>
  );
}

// ---------- DIRECTION A — Wise Calm ----------
function DashboardWiseCalm({ status, statusKey, onOpenVehicle, onOpenDiag }) {
  const D = window.MOTORA_DATA;
  const sc = STATUS_COPY[statusKey];
  return (
    <div className="page">
      <div className="app-top fade-up">
        <div>
          <p className="greeting">Buenas tardes</p>
          <p className="greeting-name">Hola, {D.user.name}</p>
        </div>
        <div className="avatar">{D.user.initial}</div>
      </div>

      {/* Hero status — minimal Wise-style */}
      <div className="fade-up fade-up-1" style={{ margin: "20px 16px 4px", padding: "20px 18px 22px",
        background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span className={`dot dot-${sc.hue}`} />
          <span style={{ color: `var(--${sc.hue})`, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {sc.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
          <span className="hero-number mono">{D.vehicle.km.toLocaleString("es-AR")}</span>
          <span className="hero-unit">km</span>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {D.vehicle.brand} {D.vehicle.model} · próximo service en {(D.vehicle.nextServiceKm - D.vehicle.km).toLocaleString("es-AR")} km
        </div>
      </div>

      <div className="section-label">Vehículo activo</div>
      <VehicleStrip v={D.vehicle} onClick={onOpenVehicle} />

      <div className="section-label">Diagnóstico</div>
      <LastDiagnosticCard status={statusKey} data={D.lastDiagnostic} onClick={onOpenDiag} />

      <div className="section-label">Próximos vencimientos</div>
      <div className="card fade-up fade-up-3" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {D.reminders.map((r, i) => (
          <React.Fragment key={r.kind}>
            <ReminderRow r={r} />
            {i < D.reminders.length - 1 && <div className="hairline" />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ---------- DIRECTION B — Health Ring ----------
function HealthRing({ status, percent }) {
  const hue = STATUS_COPY[status].hue;
  const sc = STATUS_COPY[status];
  const stroke = `var(--${hue})`;
  const r = 84;
  const c = 2 * Math.PI * r;
  const dash = c * (percent / 100);
  return (
    <div style={{ position: "relative", width: 220, height: 220 }}>
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="110" cy="110" r={r} fill="none" stroke={stroke} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 110 110)"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: `var(--${hue})`, textTransform: "uppercase", marginBottom: 6 }}>
            {sc.short}
          </div>
          <div className="mono" style={{ fontSize: 44, fontWeight: 700, color: "var(--text-heading)", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {percent}<span style={{ fontSize: 18, color: "var(--text-muted)", marginLeft: 2 }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Salud general</div>
        </div>
      </div>
    </div>
  );
}

function DashboardHealthRing({ status, statusKey, onOpenVehicle, onOpenDiag }) {
  const D = window.MOTORA_DATA;
  const percent = statusKey === "ok" ? 96 : statusKey === "warn" ? 78 : 42;

  return (
    <div className="page">
      <div className="app-top fade-up">
        <div>
          <p className="greeting">{D.vehicle.brand} {D.vehicle.model}</p>
          <p className="greeting-name">Hola, {D.user.name}</p>
        </div>
        <div className="avatar">{D.user.initial}</div>
      </div>

      <div className="fade-up fade-up-1" style={{ display: "grid", placeItems: "center", padding: "16px 0 10px" }}>
        <HealthRing status={statusKey} percent={percent} />
      </div>

      <div className="fade-up fade-up-2" style={{ textAlign: "center", padding: "0 32px 18px" }}>
        <div style={{ color: "var(--text-heading)", fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>
          {STATUS_COPY[statusKey].sentence}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
          Última revisión: {D.lastDiagnostic.date}
        </div>
      </div>

      {/* Mini-stat chips */}
      <div className="fade-up fade-up-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 4px" }}>
        <MiniStat icon={I.Wrench} label="Service en" value={`${(D.vehicle.nextServiceKm - D.vehicle.km).toLocaleString("es-AR")} km`} hue="ok" />
        <MiniStat icon={I.Shield} label="VTV" value="47 días" hue="ok" />
        <MiniStat icon={I.Doc}    label="Seguro"      value="12 días" hue="warn" />
        <MiniStat icon={I.Activity} label="Errores"   value={D.lastDiagnostic.dtcs.length === 0 ? "—" : `${D.lastDiagnostic.dtcs.length} DTC`} hue={statusKey} />
      </div>

      <div className="section-label">Diagnóstico reciente</div>
      <LastDiagnosticCard status={statusKey} data={D.lastDiagnostic} onClick={onOpenDiag} />

      <div style={{ height: 24 }} />
    </div>
  );
}

function MiniStat({ icon: IconC, label, value, hue }) {
  return (
    <div style={{
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: "var(--r-md)", padding: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <IconC size={14} color={`var(--${hue})`} />
        <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: "var(--text-heading)" }}>{value}</div>
    </div>
  );
}

// ---------- DIRECTION C — Editorial ----------
function DashboardEditorial({ status, statusKey, onOpenVehicle, onOpenDiag }) {
  const D = window.MOTORA_DATA;
  const sc = STATUS_COPY[statusKey];

  return (
    <div className="page">
      <div className="app-top fade-up">
        <div>
          <p className="greeting">12 de abril, 2026</p>
          <p className="greeting-name">Hola, {D.user.name}.</p>
        </div>
        <div className="avatar">{D.user.initial}</div>
      </div>

      {/* Editorial status sentence */}
      <div className="fade-up fade-up-1" style={{ padding: "32px 20px 24px", position: "relative", overflow: "hidden" }}>
        <div className={`halo halo-${sc.hue}`} style={{ inset: "auto -20% -60% -20%", height: 220, borderRadius: 0, opacity: 0.18 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span className={`dot dot-${sc.hue}`} />
          <span className="mono" style={{ color: `var(--${sc.hue})`, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>
            Estado · {sc.short}
          </span>
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 600, color: "var(--text-heading)",
          letterSpacing: "-0.025em", lineHeight: 1.18, margin: 0, textWrap: "pretty",
        }}>
          {statusKey === "ok" && <>Tu <span style={{ color: "var(--ok)" }}>Golf</span> está al día. Disfrutalo.</>}
          {statusKey === "warn" && <>Tu Golf tiene <span style={{ color: "var(--warn)" }}>2 cosas</span> por revisar esta semana.</>}
          {statusKey === "err" && <>Tu Golf necesita <span style={{ color: "var(--err)" }}>atención hoy</span>. Mirá el diagnóstico.</>}
        </h1>
      </div>

      {/* Data slabs */}
      <div className="fade-up fade-up-2" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        margin: "0 16px", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)",
      }}>
        <DataSlab label="Kilometraje" value={D.vehicle.km.toLocaleString("es-AR")} unit="km" />
        <DataSlab label="Próximo service" value={(D.vehicle.nextServiceKm - D.vehicle.km).toLocaleString("es-AR")} unit="km" border />
        <DataSlab label="Última revisión" value={D.lastDiagnostic.date} unit="" topBorder />
        <DataSlab label="Seguro vence en" value="12" unit="días" border topBorder hue={statusKey === "ok" ? "body" : "warn"} />
      </div>

      <div className="section-label">Diagnóstico</div>
      <LastDiagnosticCard status={statusKey} data={D.lastDiagnostic} onClick={onOpenDiag} />

      <div className="section-label">Vehículo activo</div>
      <VehicleStrip v={D.vehicle} onClick={onOpenVehicle} />

      <div style={{ height: 24 }} />
    </div>
  );
}

function DataSlab({ label, value, unit, border, topBorder, hue = "heading" }) {
  return (
    <div style={{
      padding: "16px 4px",
      borderLeft: border ? "1px solid var(--hairline)" : "none",
      borderTop: topBorder ? "1px solid var(--hairline)" : "none",
      paddingLeft: border ? 16 : 4,
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="mono" style={{
          fontSize: 22, fontWeight: 600,
          color: hue === "warn" ? "var(--warn)" : "var(--text-heading)",
          letterSpacing: "-0.02em",
        }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{unit}</span>}
      </div>
    </div>
  );
}

// ---------- DIRECTION D — Cockpit ----------
function MiniGauge({ label, value, max, unit, color = "var(--brand)", warn }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: "var(--r-md)", padding: 14,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
          {label}
        </span>
        {warn && <span className={`dot dot-warn`} style={{ width: 6, height: 6 }} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--text-heading)", letterSpacing: "-0.02em" }}>{value}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{unit}</span>
      </div>
      <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: warn ? "var(--warn)" : color,
          borderRadius: 999, transition: "width 0.6s cubic-bezier(0.2,0.7,0.2,1)" }} />
      </div>
    </div>
  );
}

function DashboardCockpit({ status, statusKey, onOpenVehicle, onOpenDiag }) {
  const D = window.MOTORA_DATA;
  const sc = STATUS_COPY[statusKey];
  const t = D.lastDiagnostic.snapshot;

  return (
    <div className="page">
      <div className="app-top fade-up">
        <div>
          <p className="greeting">Cockpit</p>
          <p className="greeting-name">Hola, {D.user.name}</p>
        </div>
        <div className="avatar">{D.user.initial}</div>
      </div>

      {/* Plate strip */}
      <div className="fade-up fade-up-1" style={{
        margin: "12px 16px 18px",
        padding: "14px 16px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, #475569, #1E293B)",
          border: "1px solid var(--hairline)",
          display: "grid", placeItems: "center",
        }}>
          <I.Car size={18} color="var(--metallic)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>{D.vehicle.brand} {D.vehicle.model}</div>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{D.vehicle.plate} · {D.vehicle.km.toLocaleString("es-AR")} km</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={`dot dot-${sc.hue}`} />
          <span style={{ fontSize: 11, fontWeight: 700, color: `var(--${sc.hue})`, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {sc.short}
          </span>
        </div>
      </div>

      {/* Telemetry grid */}
      <div className="fade-up fade-up-2" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px 4px",
      }}>
        <MiniGauge label="Refrigerante" value={t.coolantC} max={130} unit="°C" />
        <MiniGauge label="Batería" value={t.batteryV} max={15} unit="V" />
        <MiniGauge label="Combustible" value={t.fuelPct} max={100} unit="%" />
        <MiniGauge label="Aceite" value={t.oilTempC} max={150} unit="°C" />
      </div>

      <div className="section-label">Última revisión</div>
      <LastDiagnosticCard status={statusKey} data={D.lastDiagnostic} onClick={onOpenDiag} />

      <div className="section-label">Próximos vencimientos</div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        {D.reminders.map((r, i) => (
          <React.Fragment key={r.kind}>
            <ReminderRow r={r} />
            {i < D.reminders.length - 1 && <div className="hairline" />}
          </React.Fragment>
        ))}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

// ---------- Dashboard router ----------
function Dashboard({ direction, statusKey, ...handlers }) {
  if (direction === "wise") return <DashboardWiseCalm statusKey={statusKey} {...handlers} />;
  if (direction === "ring") return <DashboardHealthRing statusKey={statusKey} {...handlers} />;
  if (direction === "editorial") return <DashboardEditorial statusKey={statusKey} {...handlers} />;
  if (direction === "cockpit") return <DashboardCockpit statusKey={statusKey} {...handlers} />;
  return null;
}

Object.assign(window, {
  Dashboard, STATUS_COPY,
  DashboardWiseCalm, DashboardHealthRing, DashboardEditorial, DashboardCockpit,
  VehicleStrip, ReminderRow, LastDiagnosticCard, MiniStat, MiniGauge, HealthRing, DataSlab,
});

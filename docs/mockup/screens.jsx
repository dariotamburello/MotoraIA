// Motora IA — Vehicle Detail, OBD2, AI Diagnosis, Add Maintenance, Garage, Profile
const { useState: useS, useEffect: useE, useRef: useR } = React;

// ============== VEHICLE DETAIL ==============
function VehicleDetail({ onBack }) {
  const D = window.MOTORA_DATA;
  const [tab, setTab] = useS("maint");
  const segRef = useR(null);
  const [pill, setPill] = useS({ left: 3, width: 0 });
  const tabs = [
    { id: "maint", label: "Mantenimiento" },
    { id: "obd",   label: "OBD2" },
    { id: "tasks", label: "Tareas" },
    { id: "docs",  label: "Documentación" },
  ];

  useE(() => {
    if (!segRef.current) return;
    const btn = segRef.current.querySelector(`[data-tab="${tab}"]`);
    if (btn) {
      const r = btn.getBoundingClientRect();
      const p = segRef.current.getBoundingClientRect();
      setPill({ left: r.left - p.left, width: r.width });
    }
  }, [tab]);

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "14px 12px 10px", gap: 4 }}>
        <button onClick={onBack} className="btn btn-ghost" style={{
          background: "transparent", border: "none", padding: 8, color: "var(--text-body)",
        }}>
          <I.ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.04em" }}>Vehículo</div>
          <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>Historia clínica</div>
        </div>
        <button className="btn btn-ghost" style={{ background: "transparent", border: "none", padding: 8, color: "var(--text-body)" }}>
          <I.Edit size={18} />
        </button>
      </div>

      {/* Hero card */}
      <div className="fade-up" style={{
        margin: "0 16px 14px", padding: "18px",
        background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
        position: "relative", overflow: "hidden",
      }}>
        <div className="halo halo-warn" style={{ inset: "auto -40% -120% auto", width: 220, height: 220 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #334155, #1E293B)",
            border: "1px solid var(--hairline)",
            display: "grid", placeItems: "center",
          }}>
            <I.Car size={28} color="var(--metallic)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--text-heading)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
              {D.vehicle.brand} {D.vehicle.model}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
              {D.vehicle.year} · {D.vehicle.engine} · {D.vehicle.fuel}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, position: "relative" }}>
          <HeroStat label="Patente" value={D.vehicle.plate} mono />
          <HeroStat label="Km" value={D.vehicle.km.toLocaleString("es-AR")} mono />
          <HeroStat label="Estado" value="Atención" hue="warn" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div ref={segRef} className="segmented" style={{ position: "relative" }}>
          <div className="seg-pill" style={{ left: pill.left, width: pill.width }} />
          {tabs.map(t => (
            <button key={t.id} data-tab={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }} className="screen-scroll">
        {tab === "maint" && <MaintTab />}
        {tab === "obd" && <ObdTabPreview />}
        {tab === "tasks" && <TasksTab />}
        {tab === "docs" && <DocsTab />}
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function HeroStat({ label, value, mono, hue }) {
  return (
    <div style={{
      background: "var(--bg-elevated)",
      border: "1px solid var(--hairline)",
      borderRadius: 10,
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div className={mono ? "mono" : ""} style={{
        fontSize: 14, fontWeight: 600,
        color: hue ? `var(--${hue})` : "var(--text-heading)",
      }}>
        {value}
      </div>
    </div>
  );
}

function MaintTab() {
  const D = window.MOTORA_DATA;
  return (
    <div style={{ padding: "0 16px" }}>
      {D.maintenance.map((m, i) => (
        <div key={m.id} className={`fade-up fade-up-${Math.min(i+1, 5)}`} style={{ position: "relative", paddingLeft: 22, paddingBottom: 14 }}>
          {/* timeline dot + line */}
          <div style={{ position: "absolute", left: 6, top: 18, width: 8, height: 8, borderRadius: 999,
            background: "var(--brand)", boxShadow: "0 0 0 4px var(--brand-soft)" }} />
          {i < D.maintenance.length - 1 && (
            <div style={{ position: "absolute", left: 9.5, top: 28, bottom: 0, width: 1, background: "var(--hairline)" }} />
          )}
          <div style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border)",
            borderRadius: "var(--r-md)", padding: 14,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>{m.type}</div>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{m.date}</div>
            </div>
            <div style={{ color: "var(--text-body)", fontSize: 13, marginBottom: 10 }}>{m.desc}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="chip" style={{ background: "var(--bg-elevated)", color: "var(--text-body)", border: "1px solid var(--hairline)" }}>
                <span className="mono">{m.km.toLocaleString("es-AR")} km</span>
              </span>
              <span className="chip" style={{ background: "var(--bg-elevated)", color: "var(--text-body)", border: "1px solid var(--hairline)" }}>
                <I.Wallet size={11} /> <span className="mono">${m.cost.toLocaleString("es-AR")}</span>
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{m.shop}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ObdTabPreview() {
  const D = window.MOTORA_DATA;
  return (
    <div style={{ padding: "0 16px" }}>
      <div className="card" style={{ margin: 0, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <I.Activity size={16} color="var(--brand)" />
          <span style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600, flex: 1 }}>Última lectura</span>
          <span className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{D.lastDiagnostic.date} · {D.lastDiagnostic.time}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {D.lastDiagnostic.dtcs.map(d => (
            <span key={d.code} className="chip chip-warn"><span className="mono">{d.code}</span></span>
          ))}
        </div>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 4px" }}>
        Tocá "Diagnóstico" en la barra inferior para ver telemetría en vivo.
      </div>
    </div>
  );
}

function TasksTab() {
  const tasks = [
    { id: 1, title: "Cambiar líquido de frenos", due: "Próximos 90 días", done: false },
    { id: 2, title: "Rotar neumáticos", due: "En 1.500 km", done: false },
    { id: 3, title: "Revisar correa de distribución", due: "Antes de 100.000 km", done: false },
  ];
  const [items, setItems] = useS(tasks);
  return (
    <div style={{ padding: "0 16px" }}>
      {items.map(t => (
        <button key={t.id} onClick={() => setItems(items.map(x => x.id === t.id ? { ...x, done: !x.done } : x))}
          className="card card-button" style={{
            margin: "0 0 10px", display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
            opacity: t.done ? 0.55 : 1,
          }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            border: t.done ? "1px solid var(--ok)" : "1.5px solid var(--border)",
            background: t.done ? "var(--ok-soft)" : "transparent",
            display: "grid", placeItems: "center",
          }}>
            {t.done && <I.Check size={14} color="var(--ok)" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600,
              textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>{t.due}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function DocsTab() {
  const docs = [
    { id: 1, name: "Cédula verde", expires: "—",       hue: "ok" },
    { id: 2, name: "Seguro La Caja", expires: "12 días", hue: "warn" },
    { id: 3, name: "VTV provincial", expires: "47 días", hue: "ok" },
    { id: 4, name: "Patente municipal", expires: "Pago al día", hue: "ok" },
  ];
  return (
    <div style={{ padding: "0 16px" }}>
      {docs.map(d => (
        <div key={d.id} className="card" style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg-elevated)",
            display: "grid", placeItems: "center" }}>
            <I.Doc size={18} color="var(--metallic)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>{d.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>Vence en {d.expires}</div>
          </div>
          <span className={`chip chip-${d.hue}`}>{d.hue === "warn" ? "Pronto" : "OK"}</span>
        </div>
      ))}
    </div>
  );
}

// ============== OBD2 SCREEN ==============
function ObdScreen({ onAskAI }) {
  const D = window.MOTORA_DATA;
  const [conn, setConn] = useS("connected"); // disconnected | connecting | connected | scanning
  const [tele, setTele] = useS(D.telemetry);
  const tickRef = useR();

  // Live telemetry simulation
  useE(() => {
    if (conn !== "connected" && conn !== "scanning") return;
    tickRef.current = setInterval(() => {
      setTele(t => ({
        ...t,
        rpm: Math.max(700, Math.min(7800, t.rpm + (Math.random() - 0.5) * 600)),
        speed: Math.max(0, Math.min(180, t.speed + (Math.random() - 0.5) * 8)),
        coolantC: Math.max(85, Math.min(105, t.coolantC + (Math.random() - 0.5) * 1.2)),
        batteryV: Math.max(13.4, Math.min(14.6, t.batteryV + (Math.random() - 0.5) * 0.1)),
      }));
    }, 600);
    return () => clearInterval(tickRef.current);
  }, [conn]);

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="app-top">
        <div>
          <p className="greeting">Lectura en vivo</p>
          <p className="greeting-name">Diagnóstico</p>
        </div>
        <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }}>
          <I.Refresh size={14} /> Re-escanear
        </button>
      </div>

      {/* Connection state */}
      <div style={{ margin: "8px 16px 14px", padding: "12px 14px",
        background: conn === "connected" ? "var(--ok-soft)" : "var(--bg-secondary)",
        border: `1px solid ${conn === "connected" ? "var(--ok-line)" : "var(--border)"}`,
        borderRadius: "var(--r-md)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ position: "relative", display: "inline-flex", color: "var(--ok)" }}>
          <span className="dot dot-ok dot-live" />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--text-heading)", fontSize: 13, fontWeight: 600 }}>OBDLink MX+ conectado</div>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 1 }}>
            Bluetooth · {D.vehicle.brand} {D.vehicle.model} · ECU MED17.5
          </div>
        </div>
        <span className="chip chip-ok"><I.Plug size={11} /> Live</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }} className="screen-scroll">
        {/* Big arc gauges */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px" }}>
          <ArcGauge label="RPM"   value={Math.round(tele.rpm)}     max={8000} unit="rpm" warn={tele.rpm > 6500} />
          <ArcGauge label="Velocidad" value={Math.round(tele.speed)} max={200}  unit="km/h" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 16px 0" }}>
          <MiniGauge label="Refrigerante" value={tele.coolantC.toFixed(0)} max={130} unit="°C" warn={tele.coolantC > 100} />
          <MiniGauge label="Batería" value={tele.batteryV.toFixed(1)} max={15} unit="V" />
        </div>

        {/* DTC codes */}
        <div className="section-label">Códigos detectados</div>
        <div style={{ padding: "0 16px" }}>
          {D.lastDiagnostic.dtcs.map(d => (
            <div key={d.code} className="card" style={{
              margin: "0 0 10px", display: "flex", alignItems: "center", gap: 12,
              borderColor: "var(--warn-line)", background: "var(--bg-secondary)",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--warn-soft)",
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                <I.Alert size={18} color="var(--warn)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ color: "var(--warn)", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em" }}>{d.code}</div>
                <div style={{ color: "var(--text-body)", fontSize: 12, marginTop: 2, lineHeight: 1.35 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium AI button */}
        <div style={{ padding: "8px 16px 24px" }}>
          <button onClick={onAskAI} className="btn btn-premium" style={{
            width: "100%", padding: "14px 16px", fontSize: 15,
            boxShadow: "0 8px 24px -8px rgba(168, 85, 247, 0.6)",
          }}>
            <I.Sparkles size={18} />
            Interpretar con IA
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              background: "rgba(255,255,255,0.18)", padding: "3px 7px", borderRadius: 999,
              marginLeft: 6,
            }}>PREMIUM</span>
          </button>
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11, marginTop: 8 }}>
            El Negro lee tus códigos y te explica qué hacer.
          </div>
        </div>
      </div>
    </div>
  );
}

function ArcGauge({ label, value, max, unit, warn }) {
  const pct = Math.min(1, value / max);
  const r = 60;
  const c = Math.PI * r;        // half circle length
  const dash = c * pct;
  const color = warn ? "var(--warn)" : "var(--brand)";
  return (
    <div style={{
      background: "var(--bg-secondary)", border: "1px solid var(--border)",
      borderRadius: "var(--r-md)", padding: 14, position: "relative",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em",
        textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <svg width="100%" height="78" viewBox="0 0 160 90" style={{ display: "block" }}>
        <path d="M 16 80 A 60 60 0 0 1 144 80" stroke="var(--bg-elevated)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 16 80 A 60 60 0 0 1 144 80" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }} />
        <text x="80" y="68" textAnchor="middle" fontSize="22" fontWeight="700"
          fill="var(--text-heading)" fontFamily="JetBrains Mono, monospace" style={{ letterSpacing: "-0.02em" }}>
          {typeof value === "number" ? value.toLocaleString("es-AR") : value}
        </text>
        <text x="80" y="84" textAnchor="middle" fontSize="9" fill="var(--text-muted)"
          fontFamily="Inter, sans-serif" style={{ letterSpacing: "0.06em" }}>{unit}</text>
      </svg>
    </div>
  );
}

// ============== AI DIAGNOSIS SHEET ==============
function AIDiagnosisSheet({ open, onClose }) {
  const D = window.MOTORA_DATA;
  const ai = D.aiDiagnosis;
  const [shown, setShown] = useS(0);

  useE(() => {
    if (!open) { setShown(0); return; }
    const timers = ai.sections.map((_, i) =>
      setTimeout(() => setShown(s => Math.max(s, i + 1)), 350 + i * 280)
    );
    return () => timers.forEach(clearTimeout);
  }, [open]);

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Header */}
        <div style={{ padding: "0 18px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: "linear-gradient(135deg, #A855F7, #7C3AED)",
            display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 15,
            boxShadow: "0 4px 14px -2px rgba(168,85,247,0.5)",
          }}>{ai.persona.initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--text-heading)", fontSize: 14, fontWeight: 600 }}>{ai.persona.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{ai.persona.role}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 6 }}>
            <I.X size={20} />
          </button>
        </div>

        <div className="hairline" />

        {/* Scrollable content */}
        <div className="screen-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
          {/* Summary */}
          <div className="fade-up" style={{
            padding: "14px 16px",
            background: "var(--premium-soft)",
            border: "1px solid var(--premium-line)",
            borderRadius: "var(--r-md)",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <I.Sparkles size={12} color="var(--premium)" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--premium)",
                letterSpacing: "0.12em", textTransform: "uppercase" }}>Resumen IA</span>
            </div>
            <div style={{ color: "var(--text-heading)", fontSize: 14, lineHeight: 1.5, textWrap: "pretty" }}>
              {ai.summary}
            </div>
          </div>

          {/* Sections */}
          {ai.sections.slice(0, shown).map((s, i) => (
            <div key={s.kind} className="fade-up" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {s.kind === "what" && <I.AlertCircle size={15} color="var(--warn)" />}
                {s.kind === "do" && <I.Wrench size={15} color="var(--brand)" />}
                {s.kind === "urgency" && <I.Clock size={15} color="var(--warn)" />}
                <span style={{ color: "var(--text-heading)", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>
                  {s.title}
                </span>
                {s.level && <span className="chip chip-warn" style={{ marginLeft: "auto" }}>{s.level}</span>}
              </div>
              <div style={{ color: "var(--text-body)", fontSize: 14, lineHeight: 1.55, textWrap: "pretty",
                paddingLeft: 23 }}>
                {s.body}
              </div>
            </div>
          ))}

          {shown < ai.sections.length && (
            <div style={{ display: "flex", gap: 4, padding: "8px 24px" }}>
              <Dots />
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ padding: "12px 18px 0", borderTop: "1px solid var(--hairline)" }}>
          <button className="btn btn-primary" style={{ width: "100%" }}>
            <I.Pin size={15} /> Buscar talleres cerca
          </button>
        </div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-dim)", animation: "live-pulse 1.2s ease 0s infinite" }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-dim)", animation: "live-pulse 1.2s ease 0.2s infinite" }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--text-dim)", animation: "live-pulse 1.2s ease 0.4s infinite" }} />
    </>
  );
}

// ============== ADD MAINTENANCE SHEET ==============
function AddMaintenanceSheet({ open, onClose, onSave }) {
  const types = [
    { id: "oil", label: "Cambio de aceite", icon: "🛢️" },
    { id: "filter", label: "Filtros", icon: "🌬️" },
    { id: "tire", label: "Neumáticos", icon: "🛞" },
    { id: "brake", label: "Frenos", icon: "🛑" },
    { id: "service", label: "Service mayor", icon: "🔧" },
    { id: "other", label: "Otro", icon: "✨" },
  ];
  const D = window.MOTORA_DATA;
  const [type, setType] = useS("oil");
  const [km, setKm] = useS(String(D.vehicle.km));
  const [cost, setCost] = useS("");
  const [notes, setNotes] = useS("");

  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: "94%" }}>
        <div className="sheet-handle" />
        <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--text-heading)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Nuevo registro
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>Llevá el control de tu mantenimiento</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", padding: 6 }}>
            <I.X size={20} />
          </button>
        </div>
        <div className="hairline" />

        <div className="screen-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 0 8px" }}>
          {/* Type picker */}
          <div className="field">
            <span className="field-label">TIPO</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {types.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  background: type === t.id ? "var(--brand-soft)" : "var(--bg-elevated)",
                  border: `1px solid ${type === t.id ? "var(--brand-line)" : "var(--border)"}`,
                  color: type === t.id ? "var(--brand)" : "var(--text-body)",
                  borderRadius: 12, padding: "12px 8px", cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="km">KILOMETRAJE</label>
            <input id="km" className="input mono" value={km} onChange={e => setKm(e.target.value)} placeholder="87.420" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cost">COSTO (OPCIONAL)</label>
            <input id="cost" className="input mono" value={cost} onChange={e => setCost(e.target.value)} placeholder="$ 48.000" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="notes">NOTAS (OPCIONAL)</label>
            <textarea id="notes" className="input" value={notes} onChange={e => setNotes(e.target.value)}
              rows={3} placeholder="Lubricentro Avellaneda · aceite 5W30 sintético"
              style={{ resize: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ padding: "12px 16px 0", borderTop: "1px solid var(--hairline)" }}>
          <button onClick={onSave} className="btn btn-primary" style={{ width: "100%" }}>
            <I.Check size={16} /> Guardar registro
          </button>
        </div>
      </div>
    </div>
  );
}

// ============== GARAGE (Vehicles tab) ==============
function GarageScreen({ onOpen }) {
  const D = window.MOTORA_DATA;
  return (
    <div className="page">
      <div className="app-top">
        <div>
          <p className="greeting">Tu garaje</p>
          <p className="greeting-name">Vehículos</p>
        </div>
        <button className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 13 }}>
          <I.Plus size={14} /> Agregar
        </button>
      </div>
      <div style={{ padding: "12px 0 4px" }}>
        {D.vehicles.map((v, i) => (
          <div key={v.id} className={`fade-up fade-up-${i+1}`}>
            <button onClick={onOpen} className="card card-button" style={{
              width: "calc(100% - 32px)", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #475569, #1E293B)",
                border: "1px solid var(--hairline)",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <I.Car size={26} color="var(--metallic)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-heading)", fontSize: 15, fontWeight: 600 }}>
                  {v.brand} {v.model}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
                  {v.year} · <span className="mono">{v.plate}</span> · <span className="mono">{v.km.toLocaleString("es-AR")} km</span>
                </div>
              </div>
              <span className={`dot dot-${v.status === "ok" ? "ok" : "warn"}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== PROFILE ==============
function ProfileScreen({ direction, onChangeDir, statusKey, onChangeStatus, theme, onChangeTheme }) {
  const D = window.MOTORA_DATA;
  const dirs = [
    { id: "wise", label: "Wise Calm" },
    { id: "ring", label: "Health Ring" },
    { id: "editorial", label: "Editorial" },
    { id: "cockpit", label: "Cockpit" },
  ];
  return (
    <div className="page">
      <div className="app-top">
        <div>
          <p className="greeting">Cuenta</p>
          <p className="greeting-name">Perfil</p>
        </div>
        <button className="btn btn-ghost" style={{ padding: 8 }}>
          <I.Settings size={18} />
        </button>
      </div>

      {/* User card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 20 }}>{D.user.initial}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--text-heading)", fontSize: 16, fontWeight: 600 }}>{D.user.fullName}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>Plan Premium · Córdoba, AR</div>
        </div>
        <span className="chip chip-premium"><I.Sparkles size={11} /> PRO</span>
      </div>

      <div className="section-label">Apariencia</div>
      <div className="card" style={{ padding: 0 }}>
        <SettingsRow icon={I.Sparkles} label="Dirección visual" value={dirs.find(d => d.id === direction)?.label}
          onClick={() => {
            const idx = dirs.findIndex(d => d.id === direction);
            onChangeDir(dirs[(idx + 1) % dirs.length].id);
          }} />
        <div className="hairline" style={{ marginLeft: 56 }} />
        <SettingsRow icon={I.Activity} label="Tema" value={theme === "dark" ? "Oscuro" : "Claro"}
          onClick={() => onChangeTheme(theme === "dark" ? "light" : "dark")} />
        <div className="hairline" style={{ marginLeft: 56 }} />
        <SettingsRow icon={I.AlertCircle} label="Simular estado" value={STATUS_COPY[statusKey].short}
          onClick={() => {
            const order = ["ok", "warn", "err"];
            const idx = order.indexOf(statusKey);
            onChangeStatus(order[(idx + 1) % order.length]);
          }} />
      </div>

      <div className="section-label">Cuenta</div>
      <div className="card" style={{ padding: 0 }}>
        <SettingsRow icon={I.Bell} label="Notificaciones" value="Activadas" />
        <div className="hairline" style={{ marginLeft: 56 }} />
        <SettingsRow icon={I.Shield} label="Privacidad" value="" />
        <div className="hairline" style={{ marginLeft: 56 }} />
        <SettingsRow icon={I.Plug} label="Dispositivos OBD2" value="1 vinculado" />
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function SettingsRow({ icon: IconC, label, value, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "transparent", border: "none", padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--bg-elevated)",
        display: "grid", placeItems: "center", flexShrink: 0 }}>
        <IconC size={15} color="var(--text-body)" />
      </div>
      <span style={{ flex: 1, color: "var(--text-heading)", fontSize: 14, fontWeight: 500 }}>{label}</span>
      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{value}</span>
      <I.Chevron size={14} color="var(--text-dim)" />
    </button>
  );
}

Object.assign(window, {
  VehicleDetail, ObdScreen, AIDiagnosisSheet, AddMaintenanceSheet, GarageScreen, ProfileScreen,
});

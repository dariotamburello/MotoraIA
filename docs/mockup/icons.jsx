// Motora IA — Icon library (lucide-style strokes, hand-tuned)
// Tiny SVG icons. Stroke 1.6, rounded.

const Icon = ({ d, size = 20, color = "currentColor", strokeWidth = 1.6, fill = "none", children, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p}><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></Icon>,
  Car: (p) => <Icon {...p}><path d="M5 17h14M5 17v3H3v-3M19 17v3h2v-3M5 17l1.5-5.5A2 2 0 0 1 8.4 10h7.2a2 2 0 0 1 1.9 1.5L19 17M5 17h14M3 13h2M19 13h2M8 14h0M16 14h0" /></Icon>,
  Activity: (p) => <Icon {...p}><path d="M3 12h4l2.5-7 5 14L17 12h4" /></Icon>,
  User: (p) => <Icon {...p}><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0" /></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6" /></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Icon>,
  CheckCircle: (p) => <Icon {...p}><path d="M22 11.1V12a10 10 0 1 1-5.93-9.14M22 4l-10 10-3-3" /></Icon>,
  Alert: (p) => <Icon {...p}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" /></Icon>,
  AlertCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>,
  Wrench: (p) => <Icon {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-2.6 2.4-2.4z" /></Icon>,
  Scan: (p) => <Icon {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" /></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2zM5 16l.5 1.5 1.5.5-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" /></Icon>,
  Battery: (p) => <Icon {...p}><rect x="2" y="7" width="16" height="10" rx="2" /><path d="M22 11v2M6 10v4M10 10v4" /></Icon>,
  Thermo: (p) => <Icon {...p}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z" /></Icon>,
  Fuel: (p) => <Icon {...p}><path d="M3 22V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v18M3 12h11M14 8h2a2 2 0 0 1 2 2v6a2 2 0 0 0 4 0V8.83a2 2 0 0 0-.59-1.42L17 3" /></Icon>,
  Gauge: (p) => <Icon {...p}><path d="M12 14l4-4M21 12a9 9 0 1 0-18 0c0 2 .8 3.8 2 5h14a9 9 0 0 0 2-5z" /></Icon>,
  TrendUp: (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></Icon>,
  TrendDown: (p) => <Icon {...p}><path d="M3 7l6 6 4-4 8 8M14 17h7v-7" /></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0" /></Icon>,
  Plug: (p) => <Icon {...p}><path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5" /></Icon>,
  Edit: (p) => <Icon {...p}><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></Icon>,
  Shield: (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
  ClipBoard: (p) => <Icon {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></Icon>,
  Doc: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M9 13h6M9 17h6" /></Icon>,
  Map: (p) => <Icon {...p}><path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" /></Icon>,
  Pin: (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></Icon>,
  Wallet: (p) => <Icon {...p}><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7" /><circle cx="17" cy="13" r="1" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M3 21v-5h5" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>,
};

window.I = I;
window.Icon = Icon;

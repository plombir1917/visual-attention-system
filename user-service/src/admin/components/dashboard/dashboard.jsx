import { useEffect, useState, useCallback } from 'react';
import { H2, Text, Loader } from '@adminjs/design-system';

/* ── Data fetching ─────────────────────────────────────────────── */

async function fetchDashboard(sessionId) {
  const url = sessionId
    ? `/admin/api/dashboard?sessionId=${encodeURIComponent(sessionId)}`
    : '/admin/api/dashboard';
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* ── Main component ─────────────────────────────────────────────── */

export default function Dashboard() {
  const [loading, setLoading]               = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError]                   = useState('');
  const [data, setData]                     = useState(null);
  const [selectedId, setSelectedId]         = useState(null);

  useEffect(() => {
    fetchDashboard(null)
      .then((d) => { setData(d); setSelectedId(d.selectedSession?.id ?? null); setLoading(false); })
      .catch(() => { setError('Не удалось загрузить данные'); setLoading(false); });
  }, []);

  const switchSession = useCallback(async (id) => {
    setSelectedId(id);
    setSessionLoading(true);
    try {
      const d = await fetchDashboard(id);
      setData(d);
    } catch {
      setError('Не удалось загрузить сессию');
    } finally {
      setSessionLoading(false);
    }
  }, []);

  if (loading) return <LoaderBlock />;
  if (error)   return <ErrorBlock text={error} />;

  const s = data?.selectedSession;
  const list = data?.sessionsList ?? [];

  return (
    <div className="vas-page">
      <style>{PAGE_CSS}</style>

      {/* Header */}
      <div className="vas-head">
        <H2 className="vas-head-title">Панель управления</H2>
        <Text color="grey60" style={{ fontSize: 14 }}>
          Ключевые метрики и анализ выбранной сессии
        </Text>
      </div>

      {/* API-key hint — показываем, пока ключ не сгенерирован */}
      {data.hasApiKey === false && <ApiKeyHint />}

      {/* KPI Row */}
      <div className="vas-kpi-grid">
        <KpiCard label="Пользователи" value={data.totalUsers} sub="всего в системе" accent="#3b82f6" />
        <KpiCard label="Сессий" value={data.totalSessions} sub="завершено" accent="#8b5cf6" />
        {s ? (
          <>
            <KpiCard label="Фокус" value={`${s.focusRate}%`} sub="в выбранной сессии" accent={fc(s.focusRate)} />
            <KpiCard label="Кадров" value={s.totalFrames} sub={`${s.focusedFrames} сфокусировано`} accent="#0ea5e9" />
            <KpiCard label="Длительность" value={fmtDur(s.duration)} sub="выбранная сессия" accent="#f59e0b" />
          </>
        ) : (
          <KpiCard label="Фокус" value="—" sub="нет сессий" accent="#ccc" />
        )}
      </div>

      {/* Session selector */}
      {list.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SessionSelector
            sessions={list}
            selectedId={selectedId}
            loading={sessionLoading}
            onChange={switchSession}
          />
        </div>
      )}

      {sessionLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Loader />
        </div>
      ) : s ? (
        <>
          {/* Session info + donut + raster */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
            <Panel title="Выбранная сессия" style={{ flex: '0 1 280px', minWidth: 240 }}>
              <InfoRow label="Пользователь" value={s.user.name} />
              <InfoRow label="Email" value={s.user.email} />
              <InfoRow label="Начало" value={fmtTime(s.startedAt)} />
              <InfoRow label="Конец" value={fmtTime(s.endedAt)} />
              <InfoRow label="Средний θ" value={s.avgTheta.toFixed(3)} />
              <InfoRow label="Средний α" value={s.avgAlpha.toFixed(3)} />
              <InfoRow label="Расстояние" value={`${s.avgDistance.toFixed(1)} м`} />
              <InfoRow label="ID сессии" value={s.id.slice(0, 14) + '…'} mono />
            </Panel>

            <Panel title="Распределение фокуса" style={{ flex: '0 1 200px', minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <DonutChart pct={s.focusRate} color={fc(s.focusRate)} focused={s.focusedFrames} total={s.totalFrames} />
            </Panel>

            <Panel title="Фокус по кадрам" style={{ flex: '1 1 320px', minWidth: 280 }}>
              <FocusRaster attentions={s.attentions} />
            </Panel>
          </div>

          {/* Line charts */}
          <div className="vas-grid-3">
            <Panel title="θ (teta) — угол взгляда" style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LineChart data={s.attentions} vKey="teta" color="#8b5cf6" />
            </Panel>
            <Panel title="α (alpha) — угол конуса" style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LineChart data={s.attentions} vKey="alpha" color="#0ea5e9" />
            </Panel>
            <Panel title="Расстояние до экрана" style={{ flex: '1 1 260px', minWidth: 220 }}>
              <LineChart data={s.attentions} vKey="distance" color="#f59e0b" yUnit=" м" />
            </Panel>
          </div>

          {/* Table */}
          <Panel title={`Записи внимания — ${s.attentions.length} кадров`}>
            <AttentionTable attentions={s.attentions} />
          </Panel>
        </>
      ) : (
        <Panel title="">
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Text color="grey60" style={{ fontSize: 15 }}>
              Нет завершённых сессий. Запустите клиент, проведите сессию — данные появятся здесь.
            </Text>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ── Session selector ─────────────────────────────────────────── */

function SessionSelector({ sessions, selectedId, loading, onChange }) {
  const isLast = (id) => sessions[0]?.id === id;
  const dur = (s) => {
    const sec = Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000);
    if (sec < 60) return `${sec}с`;
    const m = Math.floor(sec / 60);
    const sc = sec % 60;
    return sc ? `${m}м ${sc}с` : `${m}м`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
        Сессия
      </span>

      <div style={{ position: 'relative', flex: '0 1 480px', minWidth: 240 }}>
        <select
          value={selectedId || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '9px 36px 9px 14px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 8,
            background: '#fff',
            fontSize: 13,
            color: '#1f2937',
            fontFamily: `'Segoe UI', Roboto, Arial, sans-serif`,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {isLast(s.id) ? '★  ' : ''}
              {fmtTime(s.startedAt)}
              {'  ·  '}
              {dur(s)}
            </option>
          ))}
        </select>
        {/* chevron */}
        <svg
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isLast(selectedId) && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: '#eff6ff', color: '#2563eb', border: '1px solid rgba(37,99,235,.18)', whiteSpace: 'nowrap' }}>
          последняя
        </span>
      )}

      <span style={{ fontSize: 12, color: '#9ca3af' }}>{sessions.length} сессий всего</span>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ApiKeyHint() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #3b82f6', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
      <div style={{ flex: '1 1 280px', minWidth: 240 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a8a', marginBottom: 2 }}>
          Сгенерируйте API-ключ
        </div>
        <Text style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          Чтобы подключать клиентов и собирать сессии, нужен API-ключ.
          Сгенерировать его можно на странице профиля.
        </Text>
      </div>
      <a
        href="/admin/pages/my-profile"
        style={{ flexShrink: 0, alignSelf: 'center', display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        Перейти в профиль →
      </a>
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="vas-card vas-kpi" style={{ borderTop: `4px solid ${accent}`, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: '#111', lineHeight: 1.25, margin: '8px 0 4px' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#b3b3b3' }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div className="vas-card" style={{ padding: '18px 20px', ...style }}>
      {title ? <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div> : null}
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginRight: 8 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', fontFamily: mono ? 'monospace' : undefined, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function DonutChart({ pct, color, focused, total }) {
  const R = 50; const cx = 70; const cy = 68;
  const circ = 2 * Math.PI * R;
  const filled = (pct / 100) * circ;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={140} height={136} style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth={13} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={13}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="19" fontWeight="bold" fill="#111">{pct}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">фокус</text>
      </svg>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{focused} / {total} кадров</div>
    </div>
  );
}

function FocusRaster({ attentions }) {
  if (!attentions.length) return <span style={{ color: '#9ca3af', fontSize: 13 }}>Нет данных</span>;
  const W = 600; const H = 56; const PAD_B = 16; const innerH = H - PAD_B;
  const n = attentions.length; const bw = W / n;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', borderRadius: 4, overflow: 'hidden' }}>
        {attentions.map((a, i) => (
          <rect key={i} x={i * bw} y={0} width={Math.max(1, bw)} height={innerH}
            fill={a.focus ? '#22c55e' : '#ef4444'} opacity={0.82} />
        ))}
        <text x={2} y={H - 2} fontSize="9" fill="#9ca3af">начало</text>
        <text x={W - 2} y={H - 2} fontSize="9" fill="#9ca3af" textAnchor="end">конец</text>
      </svg>
      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
        <LegendDot color="#22c55e" label="Сфокусирован" />
        <LegendDot color="#ef4444" label="Не сфокусирован" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
    </div>
  );
}

function LineChart({ data, vKey, color, yUnit }) {
  if (!data.length) return <span style={{ color: '#9ca3af', fontSize: 13 }}>Нет данных</span>;
  const W = 540; const H = 110;
  const PL = 42; const PR = 8; const PT = 8; const PB = 20;
  const iW = W - PL - PR; const iH = H - PT - PB;
  const vals = data.map((d) => d[vKey]);
  const minV = Math.min(...vals); const maxV = Math.max(...vals);
  const rng = maxV - minV || 1; const n = data.length;
  const sx = (i) => PL + (n > 1 ? (i / (n - 1)) * iW : iW / 2);
  const sy = (v) => PT + (1 - (v - minV) / rng) * iH;
  const pts = data.map((d, i) => `${sx(i).toFixed(1)},${sy(d[vKey]).toFixed(1)}`).join(' ');
  const area = `${PL.toFixed(1)},${(PT + iH).toFixed(1)} ${pts} ${sx(n - 1).toFixed(1)},${(PT + iH).toFixed(1)}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${vKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${vKey})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <line x1={PL} y1={PT} x2={PL} y2={PT + iH} stroke="#e5e7eb" />
      <line x1={PL} y1={PT + iH} x2={PL + iW} y2={PT + iH} stroke="#e5e7eb" />
      {[minV, (minV + maxV) / 2, maxV].map((v, ti) => (
        <g key={ti}>
          <line x1={PL - 3} y1={sy(v)} x2={PL} y2={sy(v)} stroke="#d1d5db" />
          <text x={PL - 5} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
            {v.toFixed(1)}{yUnit || ''}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AttentionTable({ attentions }) {
  const [page, setPage] = useState(0);
  const PAGE = 15;
  const pages = Math.ceil(attentions.length / PAGE);
  const slice = attentions.slice(page * PAGE, page * PAGE + PAGE);
  const th = { padding: '8px 10px', background: '#f9fafb', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
  const td = { padding: '6px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Фокус</th>
            <th style={th}>θ teta</th>
            <th style={th}>α alpha</th>
            <th style={th}>Расстояние</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((a) => (
            <tr key={a.i}>
              <td style={{ ...td, color: '#d1d5db' }}>{a.i + 1}</td>
              <td style={td}>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: a.focus ? '#dcfce7' : '#fee2e2', color: a.focus ? '#16a34a' : '#dc2626' }}>
                  {a.focus ? 'Да' : 'Нет'}
                </span>
              </td>
              <td style={td}>{a.teta.toFixed(4)}</td>
              <td style={td}>{a.alpha.toFixed(4)}</td>
              <td style={td}>{a.distance.toFixed(1)} м</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={btnStyle(page === 0)}>←</button>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{page + 1} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={btnStyle(page === pages - 1)}>→</button>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function LoaderBlock() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}><Loader /></div>;
}

function ErrorBlock({ text }) {
  return <div style={{ margin: 24, padding: 16, border: '1px solid #f5c2c7', background: '#f8d7da', borderRadius: 8 }}><span style={{ color: '#842029', fontWeight: 600 }}>{text}</span></div>;
}

function btnStyle(disabled) {
  return { padding: '4px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#d1d5db' : '#374151', cursor: disabled ? 'default' : 'pointer', fontSize: 13 };
}

function fc(pct) {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function fmtDur(sec) {
  if (!sec) return '0с';
  if (sec < 60) return `${sec}с`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) { const h = Math.floor(m / 60); const rm = m % 60; return rm ? `${h}ч ${rm}м` : `${h}ч`; }
  return s ? `${m}м ${s}с` : `${m}м`;
}

function fmtTime(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

/* ── Shared page styles (full-width, responsive grids, hover polish) ── */

const PAGE_CSS = `
.vas-page{width:100%;max-width:1800px;margin:0 auto;box-sizing:border-box;padding:24px 28px;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#111;}
.vas-head{margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #e5e7eb;}
.vas-head-title{font-weight:700;font-size:26px;margin:0 0 4px;letter-spacing:-.4px;}
.vas-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:20px;}
.vas-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;margin-bottom:20px;align-items:start;}
.vas-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:20px;align-items:start;}
.vas-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);box-sizing:border-box;transition:box-shadow .18s ease,transform .18s ease;}
.vas-card:hover{box-shadow:0 8px 24px rgba(15,23,42,.09);}
.vas-kpi:hover{transform:translateY(-3px);}
@media(max-width:680px){.vas-page{padding:16px 14px;}.vas-head-title{font-size:22px;}}
`;

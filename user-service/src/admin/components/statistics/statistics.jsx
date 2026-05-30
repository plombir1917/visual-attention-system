import { useEffect, useState, useCallback } from 'react';
import { H2, Text, Loader } from '@adminjs/design-system';

/* ── Period helpers ─────────────────────────────────────────────── */

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { key: '7d',    label: '7 дней',       days: 7 },
  { key: '30d',   label: '30 дней',      days: 30 },
  { key: '90d',   label: '3 месяца',     days: 90 },
  { key: 'all',   label: 'Всё время',    days: null },
  { key: 'custom', label: 'Произвольный', days: null },
];

function presetDates(preset) {
  const now = new Date();
  const end = isoDate(now);
  if (preset.key === 'all') return { startDate: '2000-01-01', endDate: end };
  if (preset.days) {
    const start = new Date(now);
    start.setDate(start.getDate() - preset.days + 1);
    return { startDate: isoDate(start), endDate: end };
  }
  return null;
}

/* ── Data computations (all client-side from sessions[]) ─────── */

function groupByDay(sessions) {
  const days = {};
  sessions.forEach((s) => {
    const day = s.startedAt.slice(0, 10);
    if (!days[day]) days[day] = { frames: 0, focused: 0, duration: 0, count: 0 };
    days[day].frames += s.frames;
    days[day].focused += s.focusedFrames;
    days[day].duration += s.duration;
    days[day].count++;
  });
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      focusRate: d.frames > 0 ? Math.round((d.focused / d.frames) * 1000) / 10 : 0,
      duration: d.duration,
      count: d.count,
    }));
}

function focusDistribution(sessions) {
  const buckets = [
    { label: '0–20%',  min: 0,  max: 20,  count: 0, color: '#ef4444' },
    { label: '20–40%', min: 20, max: 40,  count: 0, color: '#f97316' },
    { label: '40–60%', min: 40, max: 60,  count: 0, color: '#f59e0b' },
    { label: '60–80%', min: 60, max: 80,  count: 0, color: '#84cc16' },
    { label: '80–100%', min: 80, max: 101, count: 0, color: '#22c55e' },
  ];
  sessions.forEach((s) => {
    const b = buckets.find((b) => s.focusRate >= b.min && s.focusRate < b.max);
    if (b) b.count++;
  });
  return buckets;
}

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
function byWeekday(sessions) {
  const days = Array(7).fill(null).map(() => ({ frames: 0, focused: 0, count: 0 }));
  sessions.forEach((s) => {
    const wd = new Date(s.startedAt).getDay();
    days[wd].frames += s.frames;
    days[wd].focused += s.focusedFrames;
    days[wd].count++;
  });
  return days.map((d, i) => ({
    label: WEEKDAYS[i],
    focusRate: d.frames > 0 ? Math.round((d.focused / d.frames) * 1000) / 10 : 0,
    count: d.count,
  }));
}

function byHour(sessions) {
  const hours = Array(24).fill(null).map(() => ({ frames: 0, focused: 0, count: 0 }));
  sessions.forEach((s) => {
    const h = new Date(s.startedAt).getHours();
    hours[h].frames += s.frames;
    hours[h].focused += s.focusedFrames;
    hours[h].count++;
  });
  return hours.map((d, i) => ({
    label: `${i}:00`,
    focusRate: d.frames > 0 ? Math.round((d.focused / d.frames) * 1000) / 10 : 0,
    count: d.count,
  }));
}

/* ── Main component ─────────────────────────────────────────────── */

export default function Statistics() {
  const today = isoDate(new Date());
  const [preset, setPreset] = useState('30d');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return isoDate(d);
  });
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchData = useCallback(async (start, end) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ startDate: start, endDate: end });
      const res = await fetch(`/admin/api/pages/statistics?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setData(await res.json());
    } catch {
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(startDate, endDate); }, []);

  function selectPreset(p) {
    setPreset(p.key);
    if (p.key === 'custom') return;
    const dates = presetDates(p);
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
    fetchData(dates.startDate, dates.endDate);
  }

  const t = data?.totals;
  const sessions = data?.sessions || [];

  /* derived datasets */
  const daily     = sessions.length ? groupByDay(sessions) : [];
  const distrib   = sessions.length ? focusDistribution(sessions) : [];
  const byWd      = sessions.length ? byWeekday(sessions) : [];
  const byHr      = sessions.length ? byHour(sessions) : [];
  const sorted    = [...sessions].sort((a, b) => b.focusRate - a.focusRate);
  const best      = sorted.slice(0, 3);
  const worst     = sorted.slice(-3).reverse();

  return (
    <div style={page}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <H2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 4 }}>Статистика</H2>
        <Text color="grey60" style={{ fontSize: 14 }}>Аналитика по сессиям внимания за выбранный период</Text>
        <hr style={{ margin: '12px 0 0', border: 0, borderTop: '1px solid #e5e7eb' }} />
      </div>

      {/* Period selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => selectPreset(p)} style={presetBtn(preset === p.key)}>{p.label}</button>
          ))}
          {preset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, flexWrap: 'wrap' }}>
              <input type="date" value={startDate} max={endDate}
                onChange={(e) => setStartDate(e.target.value)} style={dateInput()} />
              <span style={{ fontSize: 13, color: '#9ca3af' }}>—</span>
              <input type="date" value={endDate} min={startDate} max={today}
                onChange={(e) => setEndDate(e.target.value)} style={dateInput()} />
              <button onClick={() => fetchData(startDate, endDate)} style={applyBtn()}>Применить</button>
            </div>
          )}
        </div>
        {data && !loading && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
            {fmtDateRange(data.period.startDate, data.period.endDate)}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Loader />
        </div>
      ) : error ? (
        <div style={{ padding: 16, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626', fontWeight: 600 }}>{error}</div>
      ) : (
        <>
          {/* ── KPI cards ── */}
          <div style={row(16, { marginBottom: 20 })}>
            <KpiCard label="Сессий" value={t.sessions} sub="за период" accent="#8b5cf6" />
            <KpiCard label="Ср. фокус" value={`${t.avgFocusRate}%`} sub="по сессиям" accent={fc(t.avgFocusRate)} />
            <KpiCard label="Общий фокус" value={`${t.focusRate}%`} sub="по всем кадрам" accent={fc(t.focusRate)} />
            <KpiCard label="Кадров" value={fmtNum(t.frames)} sub="обработано" accent="#0ea5e9" />
            <KpiCard label="Время" value={fmtDur(t.totalDuration)} sub={`ср. ${fmtDur(t.avgSessionDuration)}/сессия`} accent="#f59e0b" />
          </div>

          {sessions.length === 0 ? (
            <Panel title=""><div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Text color="grey60" style={{ fontSize: 15 }}>Нет сессий за выбранный период</Text>
            </div></Panel>
          ) : (
            <>
              {/* ── Daily focus trend (full width) ── */}
              <Panel title="Динамика фокуса по дням (%)" style={{ marginBottom: 20 }}>
                {daily.length < 2 ? (
                  <CenteredNote text="Недостаточно дней для графика" />
                ) : (
                  <LineChart
                    data={daily}
                    xKey="date"
                    vKey="focusRate"
                    color="#6366f1"
                    yMax={100}
                    yUnit="%"
                    xFmt={fmtDateShort}
                    refLine={t.avgFocusRate}
                    refLabel={`ср. ${t.avgFocusRate}%`}
                  />
                )}
              </Panel>

              {/* ── Focus per session + Duration per session ── */}
              <div style={row(16, { marginBottom: 20 })}>
                <Panel title="Фокус по сессиям (%)" style={{ flex: '1 1 320px', minWidth: 280 }}>
                  <SessionBars sessions={sessions} vKey="focusRate" yMax={100} yUnit="%" getColor={fc} />
                </Panel>
                <Panel title="Длительность сессий" style={{ flex: '1 1 320px', minWidth: 280 }}>
                  <SessionBars sessions={sessions} vKey="duration" color="#8b5cf6" yFmt={fmtDur} />
                </Panel>
              </div>

              {/* ── Distribution + By weekday ── */}
              <div style={row(16, { marginBottom: 20 })}>
                <Panel title="Распределение фокуса по сессиям" style={{ flex: '1 1 280px', minWidth: 240 }}>
                  <CatBars
                    data={distrib}
                    vKey="count"
                    labelKey="label"
                    getColor={(_, i) => distrib[i].color}
                    yLabel="сессий"
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 10 }}>
                    {distrib.map((b) => (
                      <LegendDot key={b.label} color={b.color} label={`${b.label}: ${b.count}`} />
                    ))}
                  </div>
                </Panel>
                <Panel title="Средний фокус по дням недели (%)" style={{ flex: '1 1 280px', minWidth: 240 }}>
                  <CatBars
                    data={byWd}
                    vKey="focusRate"
                    labelKey="label"
                    yMax={100}
                    yUnit="%"
                    getColor={(v) => fc(v)}
                    subKey="count"
                    subLabel="сессий"
                  />
                </Panel>
              </div>

              {/* ── Hour of day heatmap ── */}
              <Panel title="Средний фокус по часам суток (%)" style={{ marginBottom: 20 }}>
                <HourHeatmap data={byHr} />
              </Panel>

              {/* ── Best / worst sessions ── */}
              <div style={row(16, { marginBottom: 20 })}>
                <Panel title="Лучшие сессии" style={{ flex: '1 1 280px', minWidth: 240 }}>
                  <TopSessionsList sessions={best} variant="best" />
                </Panel>
                <Panel title="Сессии с низким фокусом" style={{ flex: '1 1 280px', minWidth: 240 }}>
                  <TopSessionsList sessions={worst} variant="worst" />
                </Panel>
                <Panel title="Кадров по дням" style={{ flex: '1 1 280px', minWidth: 240 }}>
                  <CatBars
                    data={daily}
                    vKey="count"
                    labelKey="date"
                    color="#0ea5e9"
                    labelFmt={fmtDateShort}
                    yLabel="сессий"
                  />
                </Panel>
              </div>

              {/* ── Sessions table ── */}
              <Panel title={`Все сессии — ${sessions.length} шт.`}>
                <SessionsTable sessions={sessions} />
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ── Chart: line chart (time series) ──────────────────────────── */

function LineChart({ data, xKey, vKey, color, yMax, yUnit, xFmt, refLine, refLabel }) {
  const W = 700; const H = 140;
  const PL = 42; const PR = 12; const PT = 12; const PB = 28;
  const iW = W - PL - PR; const iH = H - PT - PB;
  const n = data.length;
  const vals = data.map((d) => d[vKey]);
  const maxV = yMax != null ? yMax : Math.max(...vals, 1);

  const sx = (i) => PL + (n > 1 ? (i / (n - 1)) * iW : iW / 2);
  const sy = (v) => PT + (1 - Math.min(v, maxV) / maxV) * iH;

  const pts = data.map((d, i) => `${sx(i).toFixed(1)},${sy(d[vKey]).toFixed(1)}`).join(' ');
  const area = `${PL},${PT + iH} ${pts} ${sx(n - 1)},${PT + iH}`;
  const labelEvery = Math.ceil(n / 9);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lg-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PL} y1={sy(maxV * f)} x2={PL + iW} y2={sy(maxV * f)}
          stroke={f === 0 ? '#e5e7eb' : '#f3f4f6'} strokeDasharray={f === 0 ? undefined : '4 3'} />
      ))}
      <polygon points={area} fill="url(#lg-line)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {/* reference line */}
      {refLine != null && (
        <g>
          <line x1={PL} y1={sy(refLine)} x2={PL + iW} y2={sy(refLine)}
            stroke={color} strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />
          <text x={PL + iW - 2} y={sy(refLine) - 4} textAnchor="end" fontSize="9" fill={color}>{refLabel}</text>
        </g>
      )}
      {/* dots */}
      {data.map((d, i) => (
        <circle key={i} cx={sx(i)} cy={sy(d[vKey])} r="3" fill={color} />
      ))}
      {/* axes */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + iH} stroke="#e5e7eb" />
      <line x1={PL} y1={PT + iH} x2={PL + iW} y2={PT + iH} stroke="#e5e7eb" />
      {/* y ticks */}
      {[0, maxV / 2, maxV].map((v, ti) => (
        <text key={ti} x={PL - 5} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
          {v.toFixed(0)}{yUnit || ''}
        </text>
      ))}
      {/* x labels */}
      {data.map((d, i) => i % labelEvery === 0 && (
        <text key={i} x={sx(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
          {xFmt ? xFmt(d[xKey]) : d[xKey]}
        </text>
      ))}
    </svg>
  );
}

/* ── Chart: bars per session (ordered) ─────────────────────────── */

function SessionBars({ sessions, vKey, yMax, yUnit, color, getColor, yFmt }) {
  const W = 600; const H = 120;
  const PL = 40; const PR = 8; const PT = 8; const PB = 24;
  const iW = W - PL - PR; const iH = H - PT - PB;
  const n = sessions.length;
  const vals = sessions.map((s) => s[vKey]);
  const maxV = yMax != null ? yMax : Math.max(...vals, 1);
  const gap = iW / n;
  const bw = Math.min(28, Math.max(2, gap - 2));
  const sy = (v) => PT + (1 - Math.min(v, maxV) / maxV) * iH;
  const labelEvery = Math.ceil(n / 8);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <line x1={PL} y1={PT} x2={PL} y2={PT + iH} stroke="#e5e7eb" />
      <line x1={PL} y1={PT + iH} x2={PL + iW} y2={PT + iH} stroke="#e5e7eb" />
      {[maxV / 2, maxV].map((v, ti) => (
        <g key={ti}>
          <line x1={PL} y1={sy(v)} x2={PL + iW} y2={sy(v)} stroke="#f3f4f6" strokeDasharray="4 3" />
          <text x={PL - 5} y={sy(v) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">
            {yFmt ? yFmt(v) : `${v.toFixed(0)}${yUnit || ''}`}
          </text>
        </g>
      ))}
      {sessions.map((s, i) => {
        const v = s[vKey];
        const barH = Math.max(1, (Math.min(v, maxV) / maxV) * iH);
        const x = PL + i * gap + (gap - bw) / 2;
        const barColor = getColor ? getColor(v) : (color || '#6366f1');
        return (
          <g key={s.id}>
            <rect x={x} y={sy(v)} width={bw} height={barH} fill={barColor} opacity={0.85} rx={2} />
            {i % labelEvery === 0 && (
              <text x={x + bw / 2} y={PT + iH + 13} textAnchor="middle" fontSize="8" fill="#9ca3af"
                transform={n > 10 ? `rotate(-35,${x + bw / 2},${PT + iH + 13})` : undefined}>
                {fmtDateShort(s.startedAt)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Chart: categorical bar chart ──────────────────────────────── */

function CatBars({ data, vKey, labelKey, yMax, yUnit, color, getColor, labelFmt, subKey, subLabel, yLabel }) {
  const W = 400; const H = 110;
  const PL = 36; const PR = 8; const PT = 8; const PB = 22;
  const iW = W - PL - PR; const iH = H - PT - PB;
  const n = data.length;
  const vals = data.map((d) => d[vKey]);
  const maxV = yMax != null ? yMax : Math.max(...vals, 1);
  const gap = iW / n;
  const bw = Math.min(36, Math.max(4, gap - 4));
  const sy = (v) => PT + (1 - Math.min(v, maxV) / maxV) * iH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <line x1={PL} y1={PT} x2={PL} y2={PT + iH} stroke="#e5e7eb" />
      <line x1={PL} y1={PT + iH} x2={PL + iW} y2={PT + iH} stroke="#e5e7eb" />
      {[maxV / 2, maxV].map((v, ti) => (
        <text key={ti} x={PL - 4} y={sy(v) + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
          {v.toFixed(0)}{yUnit || ''}
        </text>
      ))}
      {data.map((d, i) => {
        const v = d[vKey];
        const barH = Math.max(v > 0 ? 1 : 0, (Math.min(v, maxV) / maxV) * iH);
        const x = PL + i * gap + (gap - bw) / 2;
        const barColor = getColor ? getColor(v, i) : (color || '#6366f1');
        const lbl = labelFmt ? labelFmt(d[labelKey]) : d[labelKey];
        return (
          <g key={i}>
            {v > 0 && <rect x={x} y={sy(v)} width={bw} height={barH} fill={barColor} opacity={0.85} rx={2} />}
            <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">{lbl}</text>
            {subKey && d[subKey] > 0 && (
              <text x={x + bw / 2} y={sy(v) - 3} textAnchor="middle" fontSize="7" fill="#9ca3af">
                {d[subKey]}{subLabel ? ' ' + subLabel : ''}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Hour heatmap (24 cells) ────────────────────────────────────── */

function HourHeatmap({ data }) {
  const W = 700; const ROW_H = 36; const CELL_W = W / 24; const LABEL_H = 18;
  const H = ROW_H + LABEL_H + 4;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const x = i * CELL_W;
          const active = d.count > 0;
          const fillColor = active ? fc(d.focusRate) : '#f3f4f6';
          const opacity = active ? 0.15 + (d.focusRate / 100) * 0.7 : 1;
          return (
            <g key={i}>
              <rect x={x + 1} y={0} width={CELL_W - 2} height={ROW_H} fill={fillColor}
                opacity={active ? opacity : 1} rx={3} />
              {active && (
                <text x={x + CELL_W / 2} y={ROW_H / 2 + 4} textAnchor="middle"
                  fontSize="10" fontWeight="600" fill={fc(d.focusRate)}>
                  {d.focusRate}%
                </text>
              )}
              <text x={x + CELL_W / 2} y={ROW_H + LABEL_H - 2} textAnchor="middle" fontSize="8" fill="#9ca3af">
                {i}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
        <LegendDot color="#ef4444" label="Низкий фокус" />
        <LegendDot color="#f59e0b" label="Средний" />
        <LegendDot color="#22c55e" label="Высокий фокус" />
        <LegendDot color="#f3f4f6" label="Нет сессий" />
      </div>
    </div>
  );
}

/* ── Top/worst sessions list ─────────────────────────────────────── */

function TopSessionsList({ sessions, variant }) {
  if (!sessions.length) return <CenteredNote text="Нет данных" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sessions.map((s, i) => {
        const color = fc(s.focusRate);
        const medal = variant === 'best' ? ['🥇', '🥈', '🥉'][i] : ['↓', '↓', '↓'][i];
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 8, border: `1px solid #e5e7eb` }}>
            <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{medal}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{fmtTime(s.startedAt)}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{fmtDur(s.duration)} · {s.frames} кадров</div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color, flexShrink: 0 }}>{s.focusRate}%</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Sessions table ──────────────────────────────────────────────── */

function SessionsTable({ sessions }) {
  const [page, setPage] = useState(0);
  const PAGE = 12;
  const pages = Math.ceil(sessions.length / PAGE);
  const slice = [...sessions].reverse().slice(page * PAGE, page * PAGE + PAGE);

  const th = { padding: '8px 10px', background: '#f9fafb', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #e5e7eb' };
  const td = { padding: '7px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#374151' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={th}>Дата и время</th>
            <th style={th}>Длительность</th>
            <th style={th}>Кадров</th>
            <th style={th}>Сфокус.</th>
            <th style={{ ...th, minWidth: 140 }}>Фокус</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((s) => (
            <tr key={s.id}>
              <td style={td}>{fmtTime(s.startedAt)}</td>
              <td style={td}>{fmtDur(s.duration)}</td>
              <td style={{ ...td, color: '#6b7280' }}>{s.frames}</td>
              <td style={{ ...td, color: '#6b7280' }}>{s.focusedFrames}</td>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                    <div style={{ width: `${s.focusRate}%`, height: '100%', background: fc(s.focusRate), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: fc(s.focusRate), minWidth: 38, textAlign: 'right' }}>{s.focusRate}%</span>
                </div>
              </td>
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

/* ── Shared atoms ──────────────────────────────────────────────── */

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ flex: '1 1 130px', minWidth: 120, background: '#fff', border: '1px solid #e5e7eb', borderTop: `4px solid ${accent}`, borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1.3, margin: '6px 0 4px' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#b3b3b3' }}>{sub}</div>
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', boxSizing: 'border-box', ...style }}>
      {title ? <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div> : null}
      {children}
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

function CenteredNote({ text }) {
  return <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>{text}</div>;
}

/* ── Styles ─────────────────────────────────────────────────────── */

const page = { padding: '24px 28px', fontFamily: `'Segoe UI', Roboto, Arial, sans-serif`, maxWidth: 1280, boxSizing: 'border-box' };

function row(gap, extra) {
  return { display: 'flex', flexWrap: 'wrap', gap, ...extra };
}

function presetBtn(active) {
  return { padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: active ? '1.5px solid #6366f1' : '1px solid #e5e7eb', background: active ? '#eef2ff' : '#fff', color: active ? '#4f46e5' : '#374151', fontWeight: active ? 600 : 400 };
}

function dateInput() {
  return { padding: '5px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, color: '#374151', background: '#fff' };
}

function applyBtn() {
  return { padding: '6px 16px', borderRadius: 6, fontSize: 13, background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 };
}

function btnStyle(disabled) {
  return { padding: '4px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#d1d5db' : '#374151', cursor: disabled ? 'default' : 'pointer', fontSize: 13 };
}

/* ── Helpers ────────────────────────────────────────────────────── */

function fc(pct) {
  if (pct >= 70) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function fmtDur(sec) {
  if (!sec) return '0с';
  if (sec < 60) return `${Math.round(sec)}с`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m >= 60) { const h = Math.floor(m / 60); const rm = m % 60; return rm ? `${h}ч ${rm}м` : `${h}ч`; }
  return s ? `${m}м ${s}с` : `${m}м`;
}

function fmtNum(n) {
  try { return new Intl.NumberFormat('ru-RU').format(n); } catch { return String(n); }
}

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
}

function fmtDateShort(iso) {
  try { return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }); } catch { return ''; }
}

function fmtDateRange(startIso, endIso) {
  const opts = { day: '2-digit', month: 'long', year: 'numeric' };
  try { return `${new Date(startIso).toLocaleDateString('ru-RU', opts)} — ${new Date(endIso).toLocaleDateString('ru-RU', opts)}`; } catch { return ''; }
}

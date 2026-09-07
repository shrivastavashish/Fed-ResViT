/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- Scrollable research tables must be keyboard-scrollable. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Interactive SVG geometry uses roles with keyboard support. */
'use client';
import { useState } from 'react';
import { data, Round, pct } from '@/lib/research';
export function LineChart({
  series,
  title,
  yLabel = 'Percentage (%)',
  selectedRound,
  onRound,
}: {
  series: {
    name: string;
    color: string;
    points: { x: number; y: number | null }[];
  }[];
  title: string;
  yLabel?: string;
  selectedRound?: number;
  onRound?: (n: number) => void;
}) {
  const [labelScale, setLabelScale] = useState(86);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    name: string;
  } | null>(null);
  const valid = series.flatMap((s) => s.points).filter((p) => p.y !== null);
  const xs = valid.map((p) => p.x);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const x = (v: number) => 58 + ((v - minX) / Math.max(maxX - minX, 1)) * 575;
  const y = (v: number) => 215 - v * 180;
  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 680 265" role="img" aria-label={title}>
        <text x="12" y="15" className="chart-label">
          {yLabel}
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line
              x1="58"
              x2="633"
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text x="44" y={y(v) + 4} textAnchor="end" className="chart-label">
              {v * 100}
            </text>
          </g>
        ))}
        {[...new Set([minX, Math.round((minX + maxX) / 2), maxX])].map((v) => (
          <text
            key={v}
            x={x(v)}
            y="236"
            textAnchor="middle"
            className="chart-label"
          >
            {v}
          </text>
        ))}
        {selectedRound && (
          <line
            x1={x(selectedRound)}
            x2={x(selectedRound)}
            y1="35"
            y2="216"
            stroke="#97aeb7"
            strokeDasharray="4 4"
          />
        )}
        {series.map((s) => (
          <g key={s.name}>
            <path
              fill="none"
              stroke={s.color}
              strokeWidth="2.6"
              strokeLinejoin="round"
              d={s.points
                .map((p, i) =>
                  p.y === null
                    ? ''
                    : `${i === 0 || s.points[i - 1].y === null ? 'M' : 'L'}${x(p.x)},${y(p.y)}`,
                )
                .join(' ')}
            />
            {s.points.map((p) =>
              p.y === null ? null : (
                <g
                  key={p.x}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.name}, round ${p.x}, ${pct(p.y)}`}
                  onFocus={() => setHover({ x: p.x, y: p.y!, name: s.name })}
                  onBlur={() => setHover(null)}
                  onMouseEnter={() =>
                    setHover({ x: p.x, y: p.y!, name: s.name })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onRound?.(p.x)}
                  onKeyDown={(e) => e.key === 'Enter' && onRound?.(p.x)}
                >
                  <circle cx={x(p.x)} cy={y(p.y)} r="8" fill="transparent" />
                  <circle
                    cx={x(p.x)}
                    cy={y(p.y)}
                    r={hover?.x === p.x ? 4 : 2}
                    fill={s.color}
                  />
                  <title>{`${s.name} · Round ${p.x} · ${pct(p.y)}`}</title>
                </g>
              ),
            )}
          </g>
        ))}
        <text x="345" y="261" textAnchor="middle" className="chart-label">
          Federated communication round
        </text>
      </svg>
      <div className="data-label-toolbar">
        <strong>Every recorded value</strong>
        <label>
          Column width <output>{labelScale}px</output>
          <input
            aria-label="Data label column width"
            type="range"
            min="68"
            max="130"
            value={labelScale}
            onChange={(e) => setLabelScale(Number(e.target.value))}
          />
        </label>
      </div>
      <div
        className="round-data-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${title}: all data labels`}
      >
        <table className="round-data">
          <thead>
            <tr>
              <th>Round</th>
              {[
                ...new Set(series.flatMap((s) => s.points.map((p) => p.x))),
              ].map((r) => (
                <th key={r} style={{ minWidth: labelScale }}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.name}>
                <th>
                  <i style={{ background: s.color }} />
                  {s.name}
                </th>
                {[
                  ...new Set(series.flatMap((v) => v.points.map((p) => p.x))),
                ].map((r) => {
                  const value = s.points.find((p) => p.x === r)?.y;
                  return (
                    <td key={r}>
                      <button
                        className={selectedRound === r ? 'selected-value' : ''}
                        onClick={() => onRound?.(r)}
                        aria-label={`${s.name}, round ${r}, ${value == null ? 'Not available' : pct(value)}`}
                      >
                        {value == null ? '—' : pct(value)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="chart-readout">
        {hover
          ? `${hover.name} · Round ${hover.x} · ${pct(hover.y)}`
          : 'Hover or focus a point to inspect measured values.'}
      </div>
    </div>
  );
}
export function Convergence({
  condition,
  seed = 'mean',
  metric = 'val_macro_f1',
  round,
  onRound,
}: {
  condition: number;
  seed?: string;
  metric?: 'val_macro_f1' | 'val_accuracy' | 'val_asr';
  round?: number;
  onRound?: (n: number) => void;
}) {
  const series = ['fedavg', 'trust'].map((agg, i) => ({
    name: agg === 'trust' ? 'Trust-aware' : 'FedAvg',
    color: i ? '#0eaaa0' : '#7592b9',
    points: Array.from({ length: 30 }, (_, j) => {
      const rows = data.rounds.filter(
        (r) =>
          r.aggregation === agg &&
          r.malicious_fraction === condition &&
          r.round === j + 1 &&
          (seed === 'mean' || r.seed === Number(seed)),
      );
      const values = rows
        .map((r) => r[metric])
        .filter((v): v is number => v !== null);
      return {
        x: j + 1,
        y: values.length
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
      };
    }),
  }));
  return (
    <>
      <LineChart
        series={series}
        selectedRound={round}
        onRound={onRound}
        title={`${metric} by federated round`}
      />
      <div className="source-caption">
        Source: notebook cell 46 · {condition * 100}% malicious ·{' '}
        {seed === 'mean' ? 'mean of seeds 42 and 43' : `seed ${seed}`} ·
        validation, not test performance
      </div>
    </>
  );
}
export function TrustScatter({
  record,
  client,
  onClient,
}: {
  record: Round;
  client: number;
  onClient: (n: number) => void;
}) {
  if (!record.clients) return <p>FedAvg does not calculate trust scores.</p>;
  const max =
    Math.max(
      ...record.clients.map((c) => c.distance),
      record.thresholds?.[1] ?? 0,
    ) * 1.13;
  const x = (d: number) => 65 + (d / max) * 535;
  const y = (v: number) => 205 - v * 160;
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 650 267"
        aria-label="Client RMS distance versus measured soft trust score"
        role="img"
      >
        <text x="16" y="16" className="chart-label">
          Soft trust φ
        </text>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1="65"
              x2="602"
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <text x="42" y={y(v) + 5} className="chart-label">
              {v}
            </text>
          </g>
        ))}
        {record.thresholds?.map((t, i) => (
          <g key={i}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1="25"
              y2="210"
              stroke={i ? '#bd6370' : '#dbad50'}
              strokeDasharray="5 4"
            />
            <text
              x={x(t)}
              y={i ? 34 : 20}
              textAnchor="middle"
              className="chart-label"
            >
              T {i ? 'high' : 'low'}
            </text>
          </g>
        ))}
        {record.clients.map((c) => (
          <g
            key={c.id}
            tabIndex={0}
            role="button"
            aria-label={`Client ${c.id + 1}, trust ${c.phi}`}
            onClick={() => onClient(c.id)}
            onKeyDown={(e) => e.key === 'Enter' && onClient(c.id)}
            className="scatter-client"
          >
            <circle
              cx={x(c.distance)}
              cy={y(c.phi)}
              r={client === c.id ? 12 : 8}
              fill={
                c.ground_truth_malicious
                  ? '#d96771'
                  : c.flagged
                    ? '#daa547'
                    : '#18ae9c'
              }
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={x(c.distance)}
              y={y(c.phi) - 17}
              textAnchor="middle"
              className="chart-label"
            >
              C{c.id + 1}
            </text>
            <title>{`Distance ${c.distance.toExponential(3)} · Trust ${c.phi} · Reputation ${c.reputation}`}</title>
          </g>
        ))}
        {[0, max / 2, max].map((v, i) => (
          <text
            key={i}
            x={x(v)}
            y="231"
            textAnchor="middle"
            className="chart-label"
          >
            {v.toExponential(1)}
          </text>
        ))}
        <text x="325" y="261" textAnchor="middle" className="chart-label">
          RMS-normalized update distance
        </text>
      </svg>
      <div className="trust-point-labels">
        {record.clients.map((c) => (
          <button
            key={c.id}
            onClick={() => onClient(c.id)}
            className={client === c.id ? 'active' : ''}
          >
            <strong>Client {c.id + 1}</strong>
            <span>D = {c.distance.toExponential(3)}</span>
            <span>φ = {c.phi.toFixed(3)}</span>
            <span>r = {c.reputation.toFixed(3)}</span>
          </button>
        ))}
      </div>
      <div className="source-caption">
        Cell 46 printed trust snapshots · round {record.round} · Click a client
        to inspect its history
      </div>
    </div>
  );
}

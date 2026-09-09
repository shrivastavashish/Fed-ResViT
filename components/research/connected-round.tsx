/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG client controls include keyboard interaction. */
'use client';
import { useId } from 'react';
export function ConnectedRound({
  step,
  progress,
  playing,
  motion,
  client,
  onClient,
  distances,
  phi,
  weights,
  round,
}: {
  step: number;
  progress: number;
  playing: boolean;
  motion: boolean;
  client: number;
  onClient: (n: number) => void;
  distances: number[];
  phi: number[];
  weights: number[];
  round: number;
}) {
  const id = useId().replaceAll(':', '');
  const currentClient = Math.min(9, Math.floor(progress / 2));
  const nodes = [
    {
      x: 480,
      y: 55,
      w: 210,
      title: 'Global hybrid model',
      detail: `Illustrative round ${round} · shared weights`,
      active: step === 0 || step === 5,
    },
    {
      x: 465,
      y: 260,
      w: 180,
      title: 'Client updates Δ',
      detail: 'Local state − global state',
      active: step === 3,
    },
    {
      x: 710,
      y: 180,
      w: 180,
      title: 'Geometric median',
      detail: 'Robust reference update',
      active: step === 4,
    },
    {
      x: 940,
      y: 180,
      w: 180,
      title: 'RMS distances',
      detail: 'Reference → adaptive thresholds',
      active: step === 4,
    },
    {
      x: 940,
      y: 360,
      w: 180,
      title: 'Trust & reputation',
      detail: 'φ → 0.85r + 0.15φ',
      active: step === 4,
    },
    {
      x: 710,
      y: 490,
      w: 180,
      title: 'Weighted aggregation',
      detail: 'Normalize r × φ contributions',
      active: step === 5,
    },
    {
      x: 465,
      y: 590,
      w: 180,
      title: 'Validation',
      detail: 'Accuracy · F1 · malignant recall',
      active: step === 6,
    },
    {
      x: 710,
      y: 665,
      w: 210,
      title: 'Recovery checkpoint',
      detail: 'Model · RNG · round · Trust state',
      active: step === 7,
    },
  ];
  function edge(path: string, active: boolean, key: string, width = 1.5) {
    return (
      <g key={key}>
        <path
          d={path}
          fill="none"
          stroke={active ? '#2fc2cf' : '#506087'}
          strokeWidth={active ? Math.max(2, width) : 1.2}
          strokeOpacity={active ? 1 : 0.5}
          markerEnd={`url(#${id}-arrow)`}
        />
        {active && playing && motion && (
          <circle r="4" fill="#ffb267">
            <animateMotion dur="1.1s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  }
  return (
    <div className="connected-round-scroll">
      <svg
        viewBox="0 0 1080 730"
        className="connected-round"
        role="group"
        aria-label={`Connected Trust federation simulation, illustrative round ${round}`}
      >
        <defs>
          <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".7" fill="#bac8ed" opacity=".13" />
          </pattern>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8195be" />
          </marker>
        </defs>
        <rect width="1080" height="730" fill={`url(#${id})`} />
        {Array.from({ length: 10 }, (_, i) => {
          const y = 145 + i * 48;
          return (
            <g key={i}>
              {edge(
                `M 375 55 C 290 55 320 ${y} 265 ${y}`,
                step === 0,
                `broadcast-${i}`,
              )}
              {edge(
                `M 265 ${y} C 320 ${y} 320 260 375 260`,
                step === 3 || step === 5,
                `update-${i}`,
                step === 5 ? weights[i] * 25 : 2,
              )}
            </g>
          );
        })}
        {edge('M 555 260 C 610 260 580 180 620 180', step === 4, 'reference')}
        {edge('M 800 180 L 850 180', step === 4, 'distance')}
        {edge('M 940 213 L 940 327', step === 4, 'trust')}
        {edge('M 940 393 C 940 490 850 490 800 490', step === 5, 'weight')}
        {edge('M 620 490 C 580 490 570 100 480 88', step === 5, 'global')}
        {edge('M 480 88 C 580 110 585 535 465 557', step === 6, 'validation')}
        {edge('M 555 590 C 620 590 570 665 605 665', step === 7, 'save')}
        {edge('M 815 665 C 1060 665 1060 55 585 55', step === 7, 'continue')}
        <text x="30" y="100" fill="#d4def5" fontSize="12">
          TEN SIMULATED CLIENTS
        </text>
        <text x="107" y="119" textAnchor="middle" fill="#a9bce0" fontSize="10">
          Two local epochs · sequential training
        </text>
        {Array.from({ length: 10 }, (_, i) => {
          const y = 145 + i * 48;
          const training = step === 2 && currentClient === i;
          const attack = i >= 8;
          const label =
            step === 0
              ? 'Receiving global model'
              : step === 1 && attack
                ? 'MEL / BCC / AKIEC → NV'
                : step === 2
                  ? i < currentClient
                    ? 'Local training complete'
                    : training
                      ? `Training · epoch ${(progress % 2) + 1} / 2`
                      : 'Awaiting local training'
                  : step === 3
                    ? 'Sending local update Δ'
                    : step === 4
                      ? `D ${distances[i].toFixed(3)} · φ ${phi[i].toFixed(2)}`
                      : step >= 5
                        ? `Contribution ${(weights[i] * 100).toFixed(1)}%`
                        : 'Labels unchanged';
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Inspect connected client ${i + 1}: ${label}`}
              aria-pressed={client === i}
              onClick={() => onClient(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClient(i);
                }
              }}
              className="connected-client"
            >
              <rect
                x="22"
                y={y - 19}
                width="243"
                height="39"
                rx="7"
                fill={training ? '#5545da' : '#242d62'}
                stroke={
                  client === i || training
                    ? '#2fc2cf'
                    : attack
                      ? '#df6949'
                      : '#52618c'
                }
                strokeWidth={client === i ? 2 : 1}
              />
              <text x="32" y={y - 3} fill="#fff" fontSize="11" fontWeight="600">
                C{i + 1}
                {attack ? ' · attacker example' : ''}
              </text>
              <text x="32" y={y + 11} fill="#d5dff5" fontSize="10">
                {label}
              </text>
              {training && <circle cx="249" cy={y} r="4" fill="#2fc2cf" />}
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.title}>
            <rect
              x={n.x - n.w / 2}
              y={n.y - 33}
              width={n.w}
              height="66"
              rx="11"
              fill={n.active ? '#5545da' : '#20264a'}
              stroke={n.active ? '#2fc2cf' : '#53618b'}
              strokeWidth={n.active ? 2 : 1}
            />
            <text
              x={n.x}
              y={n.y - 5}
              textAnchor="middle"
              fill="#fff"
              fontSize="13"
              fontWeight="600"
            >
              {n.title}
            </text>
            <text
              x={n.x}
              y={n.y + 15}
              textAnchor="middle"
              fill="#d9e2f8"
              fontSize="10"
            >
              {n.detail}
            </text>
          </g>
        ))}
        <text x="710" y="120" textAnchor="middle" fill="#a9bce0" fontSize="11">
          UPDATE EVALUATION → GLOBAL AGGREGATION
        </text>
        <text
          x="1015"
          y="550"
          textAnchor="middle"
          fill="#a9bce0"
          fontSize="10"
          transform="rotate(-90 1015 550)"
        >
          SAVE → NEXT ROUND → BROADCAST
        </text>
        <g>
          <rect
            x="26"
            y="635"
            width="294"
            height="69"
            rx="9"
            fill="#20264a"
            stroke="#53618b"
          />
          <text x="42" y="657" fill="#2fc2cf" fontSize="12">
            Selected: client {client + 1} · example values
          </text>
          <text x="42" y="678" fill="#e4e8fa" fontSize="11">
            D {distances[client].toFixed(3)} → φ {phi[client].toFixed(3)} →{' '}
            {(weights[client] * 100).toFixed(2)}% weight
          </text>
          <text x="42" y="694" fill="#a9bce0" fontSize="10">
            Illustrative inputs, not measured client telemetry
          </text>
        </g>
      </svg>
    </div>
  );
}

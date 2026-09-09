/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Interactive SVG clients have keyboard handlers. */
'use client';
import { useEffect, useId, useState } from 'react';
import {
  Network,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Panel, Badge, Note, Pick } from './common';
import { Slider } from '@/components/ui/slider';
const stages = [
  'Broadcast global model',
  'Local training · two epochs',
  'Generate model updates',
  'Geometric-median reference',
  'RMS distance & adaptive thresholds',
  'Soft trust & reputation',
  'Normalize aggregation weights',
  'Update global model',
  'Validation & recovery checkpoint',
];
export function FederationSimulation() {
  const [playing, setPlaying] = useState(false),
    [tick, setTick] = useState(0),
    [client, setClient] = useState(0),
    [fraction, setFraction] = useState('0.2'),
    [speed, setSpeed] = useState('1'),
    [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  const id = useId().replaceAll(':', '');
  const round = Math.floor(tick / stages.length) + 1,
    stage = tick % stages.length,
    malicious = Math.round(Number(fraction) * 10);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setTick((v) => {
          if (v >= 269) {
            setPlaying(false);
            return v;
          }
          return v + 1;
        }),
      1400 / Number(speed),
    );
    return () => clearInterval(t);
  }, [playing, speed]);
  const positions = Array.from({ length: 10 }, (_, i) => [
    i < 5 ? 115 : 665,
    50 + (i % 5) * 90,
  ]);
  return (
    <Panel
      title="The federation, at a glance"
      kicker="LOCAL KNOWLEDGE. SHARED INTELLIGENCE."
      dark
      action={<Badge state="DEMONSTRATION" />}
    >
      <p>
        Ten local learning environments. One shared ResNet-50 + ViT-small model.
        Explore how updates reach the Trust aggregator.
      </p>
      <div className="filter-row">
        <Pick
          label="Simulated malicious fraction"
          value={fraction}
          items={[
            ['0', '0% · clean'],
            ['0.1', '10% · 1 client'],
            ['0.2', '20% · 2 clients'],
            ['0.3', '30% · 3 clients'],
          ]}
          onChange={setFraction}
        />
        <span>Illustrative client assignment · no measured trust scores</span>
      </div>
      <div
        className={
          'topology federation-simulation ' + (playing ? 'is-playing' : '')
        }
      >
        <svg
          viewBox="0 0 780 470"
          role="img"
          aria-label="Ten simulated healthcare clients connected to the global Trust aggregator"
        >
          <defs>
            <pattern
              id={id}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r=".8" fill="#abcbd3" opacity=".25" />
            </pattern>
          </defs>
          <rect width="780" height="470" fill={`url(#${id})`} />
          {positions.map(([x, y], i) => {
            const path = `M ${x} ${y} C ${x < 300 ? 275 : 505} ${y},${x < 300 ? 290 : 490} 235,390 235`;
            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke={i >= 10 - malicious ? '#C5424F' : '#19B8C7'}
                  strokeOpacity=".55"
                  strokeDasharray={i >= 10 - malicious ? '5 5' : undefined}
                />
                {playing && !reducedMotion && (
                  <circle
                    r="3.5"
                    fill={i >= 10 - malicious ? '#FFB267' : '#2FC2CF'}
                  >
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                )}
              </g>
            );
          })}
          <circle
            cx="390"
            cy="235"
            r="86"
            fill="none"
            stroke="#8F80FF"
            opacity=".3"
          />
          <circle
            cx="390"
            cy="235"
            r="73"
            fill="#242D62"
            stroke="#2FC2CF"
            strokeWidth="2"
          />
          <ShieldCheck x={373} y={191} width={34} height={34} color="#2FC2CF" />
          <text
            x="390"
            y="247"
            textAnchor="middle"
            fill="white"
            fontSize="15"
            fontWeight="600"
          >
            Trust aggregator
          </text>
          <text
            x="390"
            y="269"
            textAnchor="middle"
            fill="#d9dcff"
            fontSize="10"
          >
            GLOBAL HYBRID MODEL
          </text>
          {positions.map(([x, y], i) => (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Inspect simulated client ${i + 1}`}
              aria-pressed={client === i}
              onClick={() => setClient(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setClient(i);
                }
              }}
              className="topo-client"
            >
              <rect
                x={x - 99}
                y={y - 34}
                width="198"
                height="70"
                rx="10"
                fill={client === i ? '#242D62' : '#111936'}
                stroke={
                  i >= 10 - malicious
                    ? '#C5424F'
                    : client === i
                      ? '#2FC2CF'
                      : '#5545DA'
                }
                strokeWidth={client === i ? 2 : 1}
              />
              <Network
                x={x - 84}
                y={y - 17}
                width={19}
                height={19}
                color="#2FC2CF"
              />
              <text
                x={x - 53}
                y={y - 3}
                fill="white"
                fontSize="14"
                fontWeight="600"
              >
                Healthcare client {i + 1}
              </text>
              <text
                x={x - 83}
                y={y + 20}
                fill={i >= 10 - malicious ? '#ffbdc5' : '#d2dcf4'}
                fontSize="11"
              >
                {i >= 10 - malicious
                  ? 'Poisoned labels · simulated'
                  : 'Honest local training · simulated'}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="round-controls">
        <button
          className="secondary-btn"
          onClick={() => {
            setTick(0);
            setPlaying(false);
          }}
          aria-label="Reset simulation"
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="primary-btn"
          onClick={() => {
            if (tick === 269) setTick(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
          {playing ? 'Pause' : 'Play'} simulation
        </button>
        <button
          className="secondary-btn"
          aria-label="Previous simulation step"
          disabled={tick === 0}
          onClick={() => {
            setPlaying(false);
            setTick((v) => v - 1);
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="secondary-btn"
          aria-label="Next simulation step"
          disabled={tick === 269}
          onClick={() => {
            setPlaying(false);
            setTick((v) => v + 1);
          }}
        >
          <ChevronRight size={16} />
        </button>
        <Pick
          label="Playback speed"
          value={speed}
          items={[
            ['0.5', '0.5×'],
            ['1', '1×'],
            ['2', '2×'],
          ]}
          onChange={setSpeed}
        />
        <strong>Illustrative round {round} / 30</strong>
        <span>
          Step {stage + 1} / {stages.length}
        </span>
      </div>
      <Slider
        aria-label="Illustrative round"
        min={1}
        max={30}
        step={1}
        value={[round]}
        onValueChange={(v) => {
          setPlaying(false);
          setTick(((Array.isArray(v) ? v[0] : v) - 1) * stages.length);
        }}
      />
      <div className="simulation-readout">
        <div>
          <small>CURRENT METHODOLOGY STEP</small>
          <h3>{stages[stage]}</h3>
        </div>
        <div>
          <small>SELECTED CLIENT</small>
          <h3>
            Client {client + 1} ·{' '}
            {client >= 10 - malicious
              ? 'simulated attacker'
              : 'simulated honest client'}
          </h3>
        </div>
      </div>
      <Note>
        Animation explains the protocol, not training progress. Client sample
        counts, distances, trust, reputation and detection outcomes await
        imported artifacts. Malicious labels are MEL / BCC / AKIEC → NV; an
        assigned attacker is not automatically a detected client.
      </Note>
    </Panel>
  );
}
export function Architecture() {
  return (
    <>
      <Panel
        title="Two complementary views of the same image"
        kicker="IMPLEMENTED HYBRID ARCHITECTURE"
      >
        <div className="architecture-flow">
          <div className="architecture-input">
            <Activity />
            <strong>224 × 224 RGB</strong>
            <span>Dermoscopic image</span>
          </div>
          <ArrowRight />
          <div className="architecture-branches">
            <div>
              <strong>ResNet-50</strong>
              <span>2,048-dimensional pooled features</span>
              <small>Fine-tune layers 3–4 · Frozen BatchNorm</small>
            </div>
            <div>
              <strong>ViT-Small / patch16</strong>
              <span>384-dimensional representation</span>
              <small>Fine-tune last 4 blocks + final norm</small>
            </div>
          </div>
          <ArrowRight />
          <div className="architecture-input">
            <strong>Feature fusion</strong>
            <span>2,432 → 768 → 7 logits</span>
            <small>ReLU · Dropout 0.20 · Softmax at evaluation</small>
          </div>
        </div>
        <Note>
          Both branches process the same image independently. Their feature
          vectors are concatenated before classification. This is not an
          attention-map explanation.
        </Note>
      </Panel>
      <div className="metric-grid">
        <div className="metric">
          <span>Feature fusion</span>
          <strong>768</strong>
          <small>Hidden dimensions · seven output logits</small>
        </div>
        <div className="metric">
          <span>Optimization</span>
          <strong>AdamW</strong>
          <small>Head LR 2e−4 · backbone multiplier 0.08</small>
        </div>
        <div className="metric">
          <span>Learning rate</span>
          <strong>Cosine</strong>
          <small>3-round warmup · minimum multiplier 0.05</small>
        </div>
        <div className="metric">
          <span>Evaluation</span>
          <strong>Flip TTA</strong>
          <small>Mean of original and horizontal-flip probabilities</small>
        </div>
      </div>
    </>
  );
}

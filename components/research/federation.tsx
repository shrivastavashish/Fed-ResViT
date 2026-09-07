/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG nodes require ARIA roles; keyboard handlers are provided. */
'use client';
import { useState } from 'react';
import {
  Network,
  ShieldCheck,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { data, Round, pct, classes } from '@/lib/research';
import { Panel, Pick, Note, Badge, TabBar, EvidenceButton } from './common';
import { Convergence, TrustScatter, LineChart } from './charts';
export const stages = [
  'Receive global model',
  'Local training',
  'Generate client updates',
  'Introduce poisoned update',
  'Geometric-median reference',
  'Calculate RMS distances',
  'Assign soft trust scores',
  'Update reputation',
  'Calculate effective weights',
  'Aggregate global model',
  'Evaluate validation set',
  'Advance to next round',
];
export function Topology({
  record,
  client,
  onClient,
  playing = false,
  stage = 10,
}: {
  record: Round;
  client: number;
  onClient: (n: number) => void;
  playing?: boolean;
  stage?: number;
}) {
  const positions = [
    [112, 62],
    [112, 160],
    [112, 258],
    [640, 62],
    [640, 258],
  ];
  return (
    <div className={'topology ' + (playing ? 'is-playing' : '')}>
      <svg
        viewBox="0 0 755 326"
        role="img"
        aria-label={`Five simulated clients connect to ${record.aggregation} global model, round ${record.round}`}
      >
        <defs>
          <pattern
            id="topodots"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".8" fill="#abcbd3" opacity=".25" />
          </pattern>
        </defs>
        <rect width="755" height="326" fill="url(#topodots)" />
        {positions.map(([x, y], i) => (
          <g key={i}>
            <path
              d={`M ${x} ${y + 22} C ${x < 300 ? 260 : 510} ${y + 22},${x < 300 ? 270 : 490} 160,377 160`}
              fill="none"
              stroke={
                record.malicious_fraction > 0 && i === 3 ? '#C5424F' : '#7fb9b8'
              }
              strokeOpacity=".5"
              strokeWidth="1.5"
              strokeDasharray={
                i === 3 && record.malicious_fraction > 0 ? '5 5' : undefined
              }
            />
            {playing && (
              <circle
                r="3"
                fill={
                  i === 3 && record.malicious_fraction > 0
                    ? '#ef94a0'
                    : '#2FC2CF'
                }
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M ${x} ${y + 22} C ${x < 300 ? 260 : 510} ${y + 22},${x < 300 ? 270 : 490} 160,377 160`}
                />
              </circle>
            )}
          </g>
        ))}
        <circle
          cx="377"
          cy="160"
          r="72"
          fill="none"
          stroke="#5ebbb5"
          strokeOpacity=".16"
        />
        <circle
          cx="377"
          cy="160"
          r="60"
          fill="#242D62"
          stroke="#2FC2CF"
          strokeWidth="1.5"
        />
        <ShieldCheck x={359} y={126} width={36} height={36} color="#2FC2CF" />
        <text
          x="377"
          y="182"
          textAnchor="middle"
          fill="#efffff"
          fontSize="14"
          fontWeight="600"
        >
          {record.aggregation === 'trust' ? 'Trust aggregator' : 'FedAvg'}
        </text>
        <text x="377" y="202" textAnchor="middle" fill="#9dbfca" fontSize="10">
          GLOBAL MODEL
        </text>
        <text x="377" y="281" textAnchor="middle" fill="#9ebfc9" fontSize="11">
          ResNet-50 + ViT-Small
        </text>
        {positions.map(([x, y], i) => {
          const c = record.clients?.[i];
          const malicious = record.malicious_fraction > 0 && i === 3;
          const status = malicious
            ? 'Malicious · ground truth'
            : c?.flagged
              ? 'Flagged · honest client'
              : 'Honest client';
          return (
            <g
              role="button"
              tabIndex={0}
              aria-label={`Client ${i + 1}, ${status}`}
              key={i}
              onClick={() => onClient(i)}
              onKeyDown={(e) => e.key === 'Enter' && onClient(i)}
              className="topo-client"
            >
              <rect
                x={x - 85}
                y={y - 25}
                width="170"
                height="83"
                rx="10"
                fill={client === i ? '#242D62' : '#111936'}
                stroke={
                  malicious ? '#C5424F' : client === i ? '#2FC2CF' : '#5545DA'
                }
                strokeWidth={client === i ? 1.5 : 1}
              />
              <Network
                x={x - 67}
                y={y - 9}
                width="20"
                height="20"
                color={malicious ? '#e39aa4' : '#2FC2CF'}
              />
              <text
                x={x - 37}
                y={y + 4}
                fill="#ecf8fc"
                fontSize="13"
                fontWeight="600"
              >
                Client {i + 1}
                <tspan fill="#7196a8" fontSize="10">
                  {' '}
                  / ID {i}
                </tspan>
              </text>
              <text
                x={x - 67}
                y={y + 24}
                fill={
                  malicious ? '#e49fa6' : c?.flagged ? '#FFB267' : '#a2c2cb'
                }
                fontSize="10"
              >
                {status}
              </text>
              <text x={x - 67} y={y + 44} fill="#a2c2cb" fontSize="10">
                {data.clients[i].samples.toLocaleString()} samples ·{' '}
                {c ? `φ ${c.phi.toFixed(3)}` : 'Sample-weighted'}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="topology-caption">
        <span>
          <i className="legend-dot green" />
          Honest
        </span>
        <span>
          <i className="legend-dot amber" />
          Flagged
        </span>
        <span>
          <i className="legend-dot red" />
          Malicious ground truth
        </span>
        {playing && <span>Stage {stage + 1} / 12</span>}
      </div>
    </div>
  );
}
export type ReplayProps = {
  record: Round;
  client: number;
  setClient: (v: number) => void;
  round: number;
  setRound: (n: number) => void;
  playing: boolean;
  setPlaying: (b: boolean) => void;
  stage: number;
  setStage: (n: number) => void;
  speed: string;
  setSpeed: (s: string) => void;
  seed: string;
  setSeed: (s: string) => void;
  agg: string;
  setAgg: (s: string) => void;
  condition: number;
  setCondition: (n: number) => void;
  inspect: (cell: number, title: string, detail?: string) => void;
};
export function RoundControls(p: ReplayProps) {
  return (
    <div className="round-controls">
      <div className="playback-buttons">
        <button
          aria-label="Restart replay"
          onClick={() => {
            p.setPlaying(false);
            p.setRound(1);
            p.setStage(0);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <button
          aria-label="Previous stage"
          onClick={() => {
            p.setPlaying(false);
            if (p.stage > 0) p.setStage(p.stage - 1);
            else if (p.round > 1) {
              p.setRound(p.round - 1);
              p.setStage(11);
            }
          }}
        >
          <SkipBack size={16} />
        </button>
        <button
          className="play"
          aria-label={p.playing ? 'Pause replay' : 'Play replay'}
          onClick={() => p.setPlaying(!p.playing)}
        >
          {p.playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          aria-label="Next stage"
          onClick={() => {
            p.setPlaying(false);
            if (p.stage < 11) p.setStage(p.stage + 1);
            else if (p.round < 30) {
              p.setRound(p.round + 1);
              p.setStage(0);
            }
          }}
        >
          <SkipForward size={16} />
        </button>
      </div>
      <strong>
        Round {String(p.round).padStart(2, '0')} <small>/ 30</small>
      </strong>
      <Slider
        aria-label="Federated round"
        min={1}
        max={30}
        step={1}
        value={[p.round]}
        onValueChange={(v) => {
          p.setPlaying(false);
          p.setRound(Array.isArray(v) ? v[0] : (v as number));
        }}
      />
      <Pick
        label="Replay speed"
        value={p.speed}
        items={['0.5×', '1×', '2×', '4×']}
        onChange={p.setSpeed}
      />
    </div>
  );
}
export function Federation(p: ReplayProps & { initialTab?: string }) {
  const [tab, setTab] = useState(p.initialTab ?? 'Federation');
  const c = p.record.clients?.[p.client];
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Federation',
          'Client intelligence',
          'Experiment replay',
          'Hybrid architecture',
        ]}
        onChange={setTab}
      />
      <div className="filter-row">
        <Pick
          label="Aggregator"
          value={p.agg}
          items={['trust', 'fedavg']}
          onChange={p.setAgg}
        />
        <Pick
          label="Condition"
          value={String(p.condition)}
          items={[
            ['0', 'Clean · 0%'],
            ['0.2', 'Attack · 20%'],
          ]}
          onChange={(v) => p.setCondition(Number(v))}
        />
        <Pick
          label="Seed"
          value={p.seed}
          items={['42', '43']}
          onChange={p.setSeed}
        />
        <Badge />
        <span className="small-muted">All clients participate every round</span>
      </div>
      {tab === 'Hybrid architecture' ? (
        <Architecture />
      ) : (
        <>
          <div className="split-wide">
            <Panel
              title={
                tab === 'Experiment replay'
                  ? 'Federated experiment replay'
                  : 'A federation built on local knowledge'
              }
              kicker="5 SIMULATED HEALTHCARE INSTITUTIONS"
              dark
              action={
                <Badge state={p.playing ? 'DEMONSTRATION' : 'EXECUTED'} />
              }
            >
              <Topology
                record={p.record}
                client={p.client}
                onClient={p.setClient}
                playing={p.playing}
                stage={p.stage}
              />
              <RoundControls {...p} />
            </Panel>
            <Panel
              title={`Client ${p.client + 1}`}
              kicker={`NOTEBOOK CLIENT ID ${p.client}`}
            >
              <div className="client-status">
                <Network size={25} />
                <Badge
                  state={
                    p.condition > 0.0 && p.client === 3
                      ? 'MALICIOUS'
                      : c?.flagged
                        ? 'FLAGGED'
                        : 'HONEST'
                  }
                />
              </div>
              <dl className="detail-list">
                <div>
                  <dt>Training images</dt>
                  <dd>{data.clients[p.client].samples.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Local training</dt>
                  <dd>2 epochs · complete</dd>
                </div>
                <div>
                  <dt>Soft trust φ</dt>
                  <dd>{c?.phi.toFixed(3) ?? 'Not calculated'}</dd>
                </div>
                <div>
                  <dt>Reputation r</dt>
                  <dd>{c?.reputation.toFixed(3) ?? 'Not calculated'}</dd>
                </div>
                <div>
                  <dt>Contribution</dt>
                  <dd>
                    {c
                      ? pct(c.contribution)
                      : pct(data.clients[p.client].samples / 7153)}
                  </dd>
                </div>
                <div>
                  <dt>Flagged in last 5 rounds</dt>
                  <dd>{c ? (c.flagged ? 'Yes' : 'No') : 'No detector'}</dd>
                </div>
              </dl>
              <p className="small-muted">
                {c
                  ? 'Contribution reconstructed from rounded φ × reputation.'
                  : 'FedAvg uses each client’s sample count.'}
              </p>
              <EvidenceButton
                onClick={() =>
                  p.inspect(
                    46,
                    `Client ${p.client + 1} · round ${p.round}`,
                    JSON.stringify(
                      c ?? {
                        aggregation: 'fedavg',
                        samples: data.clients[p.client].samples,
                      },
                      null,
                      2,
                    ),
                  )
                }
              />
            </Panel>
          </div>
          {tab === 'Experiment replay' && (
            <Panel
              title={`${String(p.stage + 1).padStart(2, '0')} / ${stages[p.stage]}`}
              action={<Badge state="DEMONSTRATION" />}
            >
              <p>
                The process animation explains the algorithm. Values come from
                this round’s completed notebook record, not live training or
                sub-stage telemetry.
              </p>
              <div className="stage-grid">
                {stages.map((s, i) => (
                  <button
                    key={s}
                    className={i === p.stage ? 'active' : ''}
                    onClick={() => {
                      p.setStage(i);
                      p.setPlaying(false);
                    }}
                  >
                    <span>{i + 1}</span>
                    {p.agg === 'fedavg' && i >= 4 && i <= 8
                      ? `${s} · Trust only`
                      : p.condition === 0 && i === 3
                        ? 'No attack · clean condition'
                        : s}
                  </button>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'Client intelligence' ? (
            <Panel title={`Class distribution · Client ${p.client + 1}`}>
              <div className="class-bars">
                {data.clients[p.client].distribution.map((n, i) => (
                  <div key={i}>
                    <span>{classes[i]}</span>
                    <div>
                      <i
                        style={{
                          width:
                            (n / data.clients[p.client].samples) * 100 + '%',
                        }}
                      />
                    </div>
                    <strong>{n}</strong>
                  </div>
                ))}
              </div>
              <Note>
                Each class is distributed across all clients. This controlled,
                near-IID split does not test strong institutional heterogeneity.
                Individual model-update tensors were not saved in the notebook.
              </Note>
            </Panel>
          ) : (
            <Panel
              title="Learning across communication rounds"
              action={
                <EvidenceButton
                  onClick={() => p.inspect(46, 'Validation convergence')}
                />
              }
            >
              <Convergence
                condition={p.condition}
                seed={p.seed}
                round={p.round}
                onRound={p.setRound}
              />
            </Panel>
          )}
        </>
      )}
    </>
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
          <span>Model size</span>
          <strong>47.05M</strong>
          <small>Total parameters, notebook model check</small>
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
export function TrustWorkspace(p: ReplayProps & { initialTab?: string }) {
  const [tab, setTab] = useState(p.initialTab ?? 'Trust intelligence');
  const [formula, setFormula] = useState(0);
  const c = p.record.clients?.[p.client];
  const formulas = [
    [
      'RMS distance',
      'Dᵢ = ‖Δᵢ − wᵣₑ𝒻‖₂ / √N',
      'Distance uses all floating state entries, including frozen parameters and floating buffers. The geometric median is approximated with three Weiszfeld iterations.',
    ],
    [
      'Adaptive thresholds',
      'Tₗ = median(D) + 0.5s; Tₕ = median(D) + 3s',
      's = 1.4826 × MAD. When MAD collapses, the implementation falls back to the maximum of IQR, standard deviation and a small positive floor.',
    ],
    [
      'Soft trust',
      'φᵢ = clip((Tₕ − Dᵢ) / (Tₕ − Tₗ), 0, 1)',
      'Clients below the lower threshold receive 1; clients above the upper threshold receive 0. Printed distances are rounded, so a recalculation may differ from logged φ.',
    ],
    [
      'Reputation',
      'rᵢ(t+1) = 0.85 rᵢ(t) + 0.15 φᵢ(t)',
      'Reputation starts at 1 and accumulates trust across rounds. A flag is a separate indicator: φ below 0.5 at any point in the last five rounds.',
    ],
    [
      'Aggregation',
      'aᵢ = rᵢ φᵢ;  Δglobal = Σ aᵢ Δᵢ / Σ aᵢ',
      'Trust weights do not include sample counts. If every weight is zero, code falls back to sample-weighted FedAvg. No such fallback appears in these saved runs.',
    ],
  ];
  return (
    <>
      <TabBar
        value={tab}
        items={['Trust intelligence', 'Poisoning laboratory']}
        onChange={setTab}
      />
      {tab === 'Poisoning laboratory' ? (
        <PoisonLab p={p} />
      ) : (
        <>
          <div className="filter-row">
            <Pick
              label="Condition"
              value={String(p.condition)}
              items={[
                ['0', 'Clean · 0%'],
                ['0.2', 'Attack · 20%'],
              ]}
              onChange={(v) => p.setCondition(Number(v))}
            />
            <Pick
              label="Seed"
              value={p.seed}
              items={['42', '43']}
              onChange={p.setSeed}
            />
            <span className="small-muted">
              Trust aggregation · recovered round telemetry
            </span>
          </div>
          {p.agg !== 'trust' ? (
            <Note>
              Choose Trust to inspect measured defense telemetry.{' '}
              <button className="text-btn" onClick={() => p.setAgg('trust')}>
                Load Trust run
              </button>
            </Note>
          ) : (
            <>
              <div className="split-wide">
                <Panel
                  title="Distance becomes trust"
                  kicker={`ROUND ${p.round} · CLIENT UPDATE GEOMETRY`}
                  action={<Badge />}
                >
                  <TrustScatter
                    record={p.record}
                    client={p.client}
                    onClient={p.setClient}
                  />
                  <RoundControls {...p} />
                </Panel>
                <Panel
                  title={`Client ${p.client + 1} · Trust profile`}
                  action={
                    <Badge
                      state={
                        c?.ground_truth_malicious
                          ? 'MALICIOUS'
                          : c?.flagged
                            ? 'FLAGGED'
                            : 'HONEST'
                      }
                    />
                  }
                >
                  <div className="trust-big">
                    {c?.phi.toFixed(3)}
                    <span>soft trust φ</span>
                  </div>
                  <dl className="detail-list">
                    <div>
                      <dt>RMS distance</dt>
                      <dd>{c?.distance.toExponential(3)}</dd>
                    </div>
                    <div>
                      <dt>Lower threshold</dt>
                      <dd>{p.record.thresholds?.[0].toExponential(3)}</dd>
                    </div>
                    <div>
                      <dt>Upper threshold</dt>
                      <dd>{p.record.thresholds?.[1].toExponential(3)}</dd>
                    </div>
                    <div>
                      <dt>Reputation</dt>
                      <dd>{c?.reputation.toFixed(3)}</dd>
                    </div>
                    <div>
                      <dt>Effective weight · derived</dt>
                      <dd>{c?.effective_weight.toFixed(4)}</dd>
                    </div>
                    <div>
                      <dt>Normalized contribution</dt>
                      <dd>{pct(c?.contribution)}</dd>
                    </div>
                  </dl>
                  <EvidenceButton
                    onClick={() =>
                      p.inspect(
                        39,
                        'Trust-aware aggregation',
                        JSON.stringify(p.record, null, 2),
                      )
                    }
                  />
                </Panel>
              </div>
              <Panel
                title="The mathematics of a trusted update"
                kicker="INTERACTIVE METHOD EXPLORER"
              >
                <div className="formula-nav">
                  {formulas.map((f, i) => (
                    <button
                      key={f[0]}
                      className={formula === i ? 'active' : ''}
                      onClick={() => setFormula(i)}
                    >
                      {i + 1}. {f[0]}
                      {i < 4 && <ChevronRight size={14} />}
                    </button>
                  ))}
                </div>
                <div className="formula">
                  <code>{formulas[formula][1]}</code>
                  <p>{formulas[formula][2]}</p>
                </div>
              </Panel>
              <Panel
                title={`Client ${p.client + 1} · trust and reputation over 30 rounds`}
              >
                <LineChart
                  title="Soft trust and reputation across rounds"
                  showPointLabels
                  yLabel="Score × 100 (%)"
                  selectedRound={p.round}
                  onRound={p.setRound}
                  series={['phi', 'reputation'].map((k, i) => ({
                    name: i ? 'Reputation' : 'Soft trust φ',
                    color: i ? '#7d8bbb' : '#19B8C7',
                    points: data.rounds
                      .filter(
                        (r) =>
                          r.aggregation === 'trust' &&
                          r.seed === Number(p.seed) &&
                          r.malicious_fraction === p.condition,
                      )
                      .map((r) => ({
                        x: r.round,
                        y:
                          r.clients?.[p.client][k as 'phi' | 'reputation'] ??
                          null,
                      })),
                  }))}
                />
                <Note>
                  Flags may persist for five rounds after a low-trust event.
                  Malicious ground truth comes from the attack configuration; it
                  is not inferred from the flag alone.
                </Note>
              </Panel>
            </>
          )}
        </>
      )}
    </>
  );
}
function PoisonLab({ p }: { p: ReplayProps }) {
  const [fraction, setFraction] = useState('0.2');
  const [flip, setFlip] = useState([1]);
  const [target, setTarget] = useState('NV');
  const [count, setCount] = useState('5');
  const [sources, setSources] = useState(['MEL', 'BCC', 'AKIEC']);
  const executed =
    fraction === '0.2' &&
    flip[0] === 1 &&
    target === 'NV' &&
    count === '5' &&
    sources.length === 3 &&
    ['MEL', 'BCC', 'AKIEC'].every((x) => sources.includes(x));
  return (
    <>
      <div className="split-wide">
        <Panel
          title="Targeted label flipping"
          kicker="TRAINING-DATA POISONING"
          action={<Badge state={executed ? 'EXECUTED' : 'SUPPORTED'} />}
        >
          <p>
            On the malicious client, selected source-class labels are
            deliberately changed to the target. Images themselves remain
            unchanged.
          </p>
          <div className="attack-flow">
            <div>
              {sources.map((s) => (
                <span key={s}>
                  {s}
                  <ArrowRight size={18} />
                </span>
              ))}
            </div>
            <div className="attack-converge" />
            <div className="attack-target">
              <strong>{target}</strong>
              <small>Poisoned target label</small>
            </div>
          </div>
          <Note tone="warning">
            One of five clients is malicious in the executed attack condition.
            20% refers to clients, not to the fraction of all images that are
            relabeled.
          </Note>
          <div className="attack-outcomes">
            <div>
              <span>FedAvg ASR</span>
              <strong>36.96%</strong>
            </div>
            <ArrowRight />
            <div>
              <span>Trust ASR</span>
              <strong>23.93%</strong>
            </div>
          </div>
          <p className="source-caption">
            Stored 20% condition only · mean of seeds 42 and 43. Changing the
            configuration does not change these measured values.
          </p>
        </Panel>
        <Panel title="Attack configuration">
          <Pick
            label="Malicious fraction"
            value={fraction}
            items={['0', '0.1', '0.2', '0.3']}
            onChange={setFraction}
          />
          <Pick
            label="Number of clients"
            value={count}
            items={['3', '5']}
            onChange={setCount}
          />
          <Pick
            label="Target class"
            value={target}
            items={classes}
            onChange={setTarget}
          />
          <label className="field-label">
            Flip probability · {flip[0].toFixed(2)}
          </label>
          <Slider
            aria-label="Flip probability"
            min={0}
            max={1}
            step={0.05}
            value={flip}
            onValueChange={(v) => setFlip(Array.isArray(v) ? v : [v as number])}
          />
          <div className="field-label">Source classes</div>
          <div className="class-select">
            {classes.map((s) => (
              <button
                key={s}
                aria-pressed={sources.includes(s)}
                className={sources.includes(s) ? 'active' : ''}
                onClick={() =>
                  setSources(
                    sources.includes(s)
                      ? sources.filter((x) => x !== s)
                      : [...sources, s],
                  )
                }
              >
                {s}
              </button>
            ))}
          </div>
          <p className="small-muted">
            {executed
              ? 'Matches the executed attack setup.'
              : 'Not executed. Configuration only; no training backend is connected.'}
          </p>
          <button
            className="primary-btn"
            onClick={() => {
              p.setCondition(0.2);
              p.setAgg('trust');
              p.setClient(3);
              p.setRound(1);
              p.setStage(0);
              p.setPlaying(true);
            }}
          >
            Replay executed attack <Play size={15} />
          </button>
        </Panel>
      </div>
      <Panel title="Attack scope">
        <div className="capabilities">
          <div>
            <Badge />
            <strong>Targeted label flipping</strong>
            <p>MEL, BCC, AKIEC → NV · flip probability 1.0</p>
          </div>
          <div>
            <Badge state="SUPPORTED" />
            <strong>Alternative label-flip configurations</strong>
            <p>
              Parameters supported in notebook code; no new outcomes are
              calculated here.
            </p>
          </div>
          <div>
            <Badge state="PLANNED" />
            <strong>Backdoors & model poisoning</strong>
            <p>Future research extensions. No executed attack evidence.</p>
          </div>
        </div>
      </Panel>
    </>
  );
}

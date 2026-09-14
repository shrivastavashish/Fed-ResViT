'use client';
import { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Panel, Badge, Note } from './common';
import { ConnectedRound } from './connected-round';
import { Slider } from '@/components/ui/slider';
const phases = [
  ['Global model broadcast', 'All ten clients receive the same ResNet-50 + ViT-small global state.'],
  [
    'Poisoning configuration',
    'Under attack conditions, designated clients flip MEL, BCC and AKIEC labels to NV with the configured probability.',
  ],
  [
    'Local optimization',
    'Each client trains the partially fine-tuned hybrid model for two local epochs with AdamW and mixed precision.',
  ],
  [
    'Client update extraction',
    'The notebook converts each floating model state into a local delta relative to the broadcast global state.',
  ],
  [
    'Adaptive update blending',
    'For the adaptive attack, poisoned deltas are blended toward the honest-update geometric median using the largest admissible retention scale.',
  ],
  [
    'Robust reference',
    'Trust computes a geometric-median reference from client updates; robust baselines evaluate the same update set.',
  ],
  [
    'Trust and reputation',
    'RMS-normalized distances, median/MAD thresholds and the reputation EMA produce each client’s effective Trust weight.',
  ],
  [
    'Global aggregation',
    'FedAvg, Krum, Trimmed Mean, coordinate Median or Trust combines the client updates into the next global model.',
  ],
  [
    'Validation and model selection',
    'The validation set is evaluated and the best eligible accuracy checkpoint is retained from round five onward.',
  ],
  [
    'Recovery and next round',
    'Alternating checksummed recovery generations preserve model, optimizer-independent round state, RNG and Trust history.',
  ],
];
export function RoundMethodology() {
  const [step, setStep] = useState(0),
    [play, setPlay] = useState(false),
    [client, setClient] = useState(8),
    [distance, setDistance] = useState(0.075);
  const [motion, setMotion] = useState(false);
  const [round, setRound] = useState(1),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!play) return;
    const timer = setTimeout(() => {
      if (progress + 1 < (step === 2 ? 20 : 10)) {
        setProgress(progress + 1);
        return;
      }
      setProgress(0);
      if (step < phases.length - 1) setStep(step + 1);
      else if (round < 30) {
        setRound(round + 1);
        setStep(0);
      } else setPlay(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [play, progress, step, round]);

  const distances = [
    0.018,
    0.025,
    0.029,
    0.021,
    0.034,
    0.027,
    0.041,
    0.036,
    distance,
    0.087,
  ];
  const low = 0.03,
    high = 0.08,
    prior = 0.85;
  const phi = distances.map((d) =>
    Math.max(0, Math.min(1, (high - d) / (high - low))),
  );
  const reputation = phi.map((v) => 0.85 * prior + 0.15 * v),
    effective = phi.map((v, i) => v * reputation[i]),
    sum = effective.reduce((a, b) => a + b, 0),
    weights = effective.map((v) => v / sum);
  return (
    <>
      <Panel
        title="Fed-ResViT federated round simulation"
        action={<Badge state="ILLUSTRATIVE DATA" />}
      >
        <p>
          Follow the latest notebook method as one connected ten-stage process,
          from global-model broadcast and local hybrid training to adaptive
          poisoning, Trust scoring, robust aggregation, validation and resumable
          round-boundary recovery.
        </p>
        <div className="round-visual-controls">
          <button
            className="secondary-btn"
            aria-label="Reset round walkthrough"
            onClick={() => {
              setStep(0);
              setProgress(0);
              setRound(1);
              setPlay(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              if (step === phases.length - 1 && round === 30) {
                setStep(0);
                setRound(1);
                setProgress(0);
              }
              setPlay(!play);
            }}
          >
            {play ? <Pause size={16} /> : <Play size={16} />}{' '}
            {play ? 'Pause' : 'Play'} full simulation
          </button>
          <button
            className="secondary-btn"
            disabled={step === 0}
            aria-label="Previous round stage"
            onClick={() => {
              setPlay(false);
              setProgress(0);
              setStep((s) => s - 1);
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="secondary-btn"
            disabled={step === phases.length - 1}
            aria-label="Next round stage"
            onClick={() => {
              setPlay(false);
              setProgress(0);
              setStep((s) => s + 1);
            }}
          >
            <ChevronRight size={16} />
          </button>
          <strong>
            Round {round} / 30 · stage {step + 1} / {phases.length}
          </strong>
        </div>
        <div className="round-stage-nav">
          {phases.map(([name], i) => (
            <button
              key={name}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => {
                setStep(i);
                setProgress(0);
                setPlay(false);
              }}
            >
              <span>{i + 1}</span>
              {name}
            </button>
          ))}
        </div>
        <div className="round-stage-scene">
          <div className="round-scene-heading">
            <span>{String(step + 1).padStart(2, '0')}</span>
            <div>
              <h3>{phases[step][0]}</h3>
              <p>{phases[step][1]}</p>
            </div>
          </div>
          <ConnectedRound
            step={step}
            progress={progress}
            playing={play}
            motion={motion}
            client={client}
            onClient={setClient}
            distances={distances}
            phi={phi}
            weights={weights}
            round={round}
          />
          <div className="connected-stage-progress">
            <span
              style={{
                width: `${Math.min(100, (progress / (step === 2 ? 20 : 10)) * 100)}%`,
              }}
            />
          </div>
          <p className="connected-scene-note">
            The highlighted route shows the active operation. Clients 9 and 10
            represent the 20% malicious-client condition. Numerical distances,
            scores and weights are illustrative; the method sequence follows the
            current notebook.
          </p>
        </div>
      </Panel>
      <details className="connected-inspector">
        <summary>
          Inspect the example distances, trust equations and contribution graphs
        </summary>
        <Panel
          title="How distance changes a client’s contribution"
          action={<Badge state="ILLUSTRATIVE DATA" />}
        >
          <p>
            These illustrative distances make the active Trust equations
            explorable. Select a client in either graph to inspect the same
            contribution in both. Client 7 represents an honest non-IID outlier.
          </p>
          <div className="round-graph-grid">
            <div>
              <h3>RMS distance to reference</h3>
              <p className="round-chart-caption">
                Example thresholds: lower 0.030 · upper 0.080
              </p>
              <div className="round-bar-chart">
                {distances.map((d, i) => (
                  <button
                    key={i}
                    aria-label={`Inspect client ${i + 1} distance ${d.toFixed(3)}`}
                    onClick={() => setClient(i)}
                    className={client === i ? 'selected' : ''}
                  >
                    <span>C{i + 1}</span>
                    <div>
                      <i
                        style={{
                          width: `${d * 1000}%`,
                          background: i >= 8 ? '#df6949' : '#6b5cf6',
                        }}
                      />
                      <b style={{ left: '30%' }} />
                      <b style={{ left: '80%' }} />
                    </div>
                    <output>{d.toFixed(3)}</output>
                  </button>
                ))}
              </div>
              <small>
                Axis: 0.000 to 0.100 RMS distance · dashed lines = thresholds
              </small>
            </div>
            <div>
              <h3>Normalized aggregation weight</h3>
              <p className="round-chart-caption">
                Reputation × trust, divided by total effective weight
              </p>
              <div className="round-bar-chart">
                {weights.map((w, i) => (
                  <button
                    key={i}
                    aria-label={`Inspect client ${i + 1} weight ${(w * 100).toFixed(1)} percent`}
                    onClick={() => setClient(i)}
                    className={client === i ? 'selected' : ''}
                  >
                    <span>C{i + 1}</span>
                    <div>
                      <i
                        style={{
                          width: `${(w / 0.2) * 100}%`,
                          background: '#19b8c7',
                        }}
                      />
                    </div>
                    <output>{(w * 100).toFixed(1)}%</output>
                  </button>
                ))}
              </div>
              <small>
                Axis: 0% to 20% contribution · all weights sum to 100%
              </small>
            </div>
          </div>
          <div className="revision-range">
            <div>
              <label htmlFor="example-distance">
                Adjust client 9’s example RMS distance
              </label>
              <output>{distance.toFixed(3)}</output>
            </div>
            <Slider
              id="example-distance"
              aria-label="Client 9 example RMS distance"
              min={0.01}
              max={0.1}
              step={0.001}
              value={[distance]}
              onValueChange={(v) => {
                setDistance(Array.isArray(v) ? v[0] : v);
                setClient(8);
              }}
            />
          </div>
          <div className="round-equation-readout">
            <h3>Client {client + 1}</h3>
            <div>
              <span>Distance</span>
              <strong>{distances[client].toFixed(3)}</strong>
            </div>
            <div>
              <span>Soft trust φ</span>
              <strong>{phi[client].toFixed(3)}</strong>
            </div>
            <div>
              <span>Reputation</span>
              <strong>{reputation[client].toFixed(3)}</strong>
            </div>
            <div>
              <span>Contribution</span>
              <strong>{(weights[client] * 100).toFixed(2)}%</strong>
            </div>
          </div>
          <Note>
            Illustrative inputs: prior reputation = 0.85 for every client; fixed
            display thresholds = 0.030 / 0.080. The notebook derives thresholds
            from median and robust spread. Reputation updates as 0.85r + 0.15φ.
            The values explain the calculation and remain separate from trained
            model measurements.
          </Note>
        </Panel>
      </details>
    </>
  );
}

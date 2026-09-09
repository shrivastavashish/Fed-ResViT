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
  ['Broadcast', 'Clients receive the same global model.'],
  [
    'Prepare local labels',
    'On designated clients, MEL / BCC / AKIEC labels are flipped to NV before local training.',
  ],
  [
    'Local training',
    'Ten clients train sequentially, each for two local epochs.',
  ],
  [
    'Collect updates',
    'Local floating-state differences become client updates. An adaptive attack can blend poisoned deltas at this point.',
  ],
  [
    'Evaluate trust',
    'Compare RMS distances to the geometric-median reference, apply thresholds, then update reputation.',
  ],
  [
    'Aggregate',
    'Normalize reputation × trust to combine client updates into the next global model.',
  ],
  [
    'Validate',
    'Evaluate the validation set and retain the best eligible accuracy checkpoint.',
  ],
  [
    'Save & continue',
    'Save checksummed recovery state and continue at the next round.',
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
      if (step < 7) setStep(step + 1);
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
        title="What happens in a federated round?"
        action={<Badge state="DEMONSTRATION" />}
      >
        <p>
          One connected simulation follows the model through all eight stages
          and automatically continues into the next illustrative round. Watch
          the highlighted route and moving updates; click any client to inspect
          its example contribution.
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
              if (step === 7 && round === 30) {
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
            disabled={step === 7}
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
            Illustrative round {round} / 30 · stage {step + 1} / 8
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
            Paths highlight the current operation. Clients 9 and 10 are
            designated attackers in this example; designation is not detection.
            Each illustrative round reuses the same teaching values, rather than
            simulating learning or accumulating measured reputation.
          </p>
        </div>
      </Panel>
      <details className="connected-inspector">
        <summary>
          Inspect the example distances, trust equations and contribution graphs
        </summary>
        <Panel
          title="How distance changes a client’s contribution"
          action={<Badge state="DEMONSTRATION" />}
        >
          <p>
            These synthetic distances demonstrate the Trust equations, not
            attack effectiveness. Select a client in either graph to inspect the
            same contribution in both. Client 7 is an honest outlier in this
            example.
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
            Teaching inputs: prior reputation = 0.85 for every client; fixed
            example thresholds = 0.030 / 0.080. The notebook derives thresholds
            from median and robust spread. Reputation updates as 0.85r + 0.15φ.
            This one-step example does not reproduce the rolling detector or
            claim to detect an attacker. No convergence, validation score or
            trained model update is fabricated.
          </Note>
        </Panel>
      </details>
    </>
  );
}

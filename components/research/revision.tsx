'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Network,
  ShieldCheck,
  FileCode2,
  Database,
  Layers,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Panel, Badge, Note, Pick, TabBar } from './common';
import { Architecture, FederationSimulation } from './simulation';
import {
  protocol,
  methods,
  methodNames,
  seeds,
  studyPlan,
  uniqueStudyCount,
  sensitivities,
  revisedLimitations,
  metricDefinitions,
} from '@/lib/protocol';
import { download, classes } from '@/lib/project';

type Props = {
  page: string;
  navigate: (page: string, tab?: string) => void;
};
const pending = 'AWAITING ARTIFACTS';
function SourceLink() {
  return (
    <a className="text-btn" href="/evidence/revision/protocol.json" download>
      Notebook protocol & provenance <FileCode2 size={15} />
    </a>
  );
}
function EmptyEvidence({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="revision-empty">
      <Database size={28} />
      <h3>{title}</h3>
      <Badge state={pending} />
      <p>
        {children ??
          'Training is external to this app. Measurements will appear after the completed artifacts are ingested and verified.'}
      </p>
    </div>
  );
}
export function RevisionWorkspace(p: Props) {
  switch (p.page) {
    case 'overview':
      return <RevisionOverview {...p} />;
    case 'federation':
      return <RevisionFederation />;
    case 'security':
      return <RevisionSecurity />;
    case 'research':
      return <RevisionObservatory />;
    case 'studio':
      return <RevisionStudio />;
    case 'reproducibility':
      return <RevisionReproducibility />;
    default:
      return null;
  }
}
export function RevisionOverview({ navigate }: Props) {
  return (
    <>
      <section className="finding">
        <div>
          <span className="eyebrow">RESEARCH PROTOCOL</span>
          <h2>
            Test the defense.
            <br />
            <em>Challenge its limits.</em>
          </h2>
          <p>
            Trust-aware hybrid skin lesion classification across ten simulated
            clients. Compare established robust baselines, heterogeneous data
            and an attacker that attempts to evade the defense.
          </p>
          <button className="finding-link" onClick={() => navigate('studio')}>
            Explore the experiment plan <ArrowUpRight size={16} />
          </button>
          <span className="finding-note">
            Implementation verified from the notebook · Results ingestion
            pending
          </span>
        </div>
        <div className="finding-number">
          <span>STUDY DESIGN</span>
          <strong>
            10<small> clients</small>
          </strong>
          <p>5 seeds · 30 rounds · 7 classes</p>
          <small>ResNet-50 + ViT-small · HAM10000</small>
        </div>
      </section>
      <div className="metric-grid">
        {[
          [
            'Main comparisons',
            '200',
            '5 methods × 5 seeds × 4 fractions × 2 partitions',
          ],
          [
            'Adaptive attack',
            '25',
            '5 methods × 5 seeds · Dirichlet · 20% malicious',
          ],
          [
            'Sensitivity variants',
            '40',
            'Additional runs; 5 defaults reused from main',
          ],
          ['Research metrics', 'Pending', 'No new experiment values ingested'],
        ].map(([name, value, detail]) => (
          <div className="metric" key={name}>
            <span>{name}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <FederationSimulation />
      <div className="chart-grid">
        <Panel
          title="What does the study investigate?"
          kicker="IMPLEMENTED METHODS"
        >
          <ul className="revision-list">
            <li>
              FedAvg, Krum, Trimmed Mean, coordinate-wise Median and Trust;
              optional Multi-Krum.
            </li>
            <li>
              Balanced and Dirichlet alpha 0.5 partitions; 0%, 10%, 20% and 30%
              malicious clients.
            </li>
            <li>
              Adaptive update blending; threshold, reputation and flag-window
              sensitivity.
            </li>
            <li>
              Malignant recall, full class reports, raw detector counts and
              paired seed analysis.
            </li>
          </ul>
          <SourceLink />
        </Panel>
        <Panel title="What can we conclude today?" kicker="EVIDENCE BOUNDARY">
          <Badge state={pending} />
          <p>
            The main study is being trained externally, as reported by the
            researcher. This application has no live connection to that session
            and does not infer completed runs from the plan.
          </p>
        </Panel>
      </div>
      <Panel title="Research questions to resolve">
        <div className="revision-questions">
          {[
            [
              '01',
              'Clinical performance',
              'Does the model recognize malignant and minority classes, beyond majority-class accuracy?',
              'research',
            ],
            [
              '02',
              'Robust baselines',
              'Does Trust improve security relative to Krum, Median and Trimmed Mean?',
              'security',
            ],
            [
              '03',
              'Honest heterogeneity',
              'Are non-IID honest updates incorrectly flagged as malicious?',
              'federation',
            ],
            [
              '04',
              'Adaptive resistance',
              'Can a concealed poisoned update retain attack impact while passing Trust?',
              'security',
            ],
          ].map(([n, t, d, route]) => (
            <button key={n} onClick={() => navigate(route)}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </Panel>
      <Note>
        Research use only. Overall accuracy, binary malignant recall and the
        derived 1−ASR value answer different questions. None establishes
        clinical safety.
      </Note>
    </>
  );
}
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="revision-range">
      <div>
        <span>{label}</span>
        <output>{value}</output>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
const roundStages = [
  'Broadcast global model',
  'Local training · two epochs',
  'Generate client updates',
  'Apply attack, when configured',
  'Aggregate using selected method',
  'Evaluate validation set',
  'Save current & best state',
];
function RevisionFederation() {
  const [tab, setTab] = useState('Ten-client protocol');
  const [client, setClient] = useState(0);
  const [step, setStep] = useState(0);
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Ten-client protocol',
          'Round methodology',
          'Hybrid architecture',
        ]}
        onChange={setTab}
      />
      {tab === 'Hybrid architecture' ? (
        <>
          <Architecture />
          <Note>
            The hybrid model uses partial backbone fine-tuning, fusion dimension
            768, dropout 0.2, AdamW and backbone LR multiplier 0.08. A new
            checkpoint is required before inference can produce model
            predictions.
          </Note>
        </>
      ) : tab === 'Ten-client protocol' ? (
        <>
          <FederationSimulation />
          <Panel
            title="Ten simulated healthcare clients"
            kicker="PROTOCOL TOPOLOGY · NOT LIVE TELEMETRY"
            dark
          >
            <div className="revision-topology">
              <div className="revision-clients">
                {Array.from({ length: 10 }, (_, i) => (
                  <button
                    key={i}
                    aria-pressed={client === i}
                    onClick={() => setClient(i)}
                    className={client === i ? 'active' : ''}
                  >
                    <Network size={21} />
                    <strong>Client {i + 1}</strong>
                    <small>Notebook ID {i}</small>
                  </button>
                ))}
              </div>
              <div className="revision-global">
                <Layers size={28} />
                <h3>Global model</h3>
                <p>Local deltas → selected aggregator → shared weights</p>
                <Badge state="SUPPORTED" />
              </div>
            </div>
          </Panel>
          <div className="chart-grid">
            <Panel title={`Client ${client + 1} · data pending`}>
              <dl className="detail-list">
                {[
                  ['Client ID', String(client)],
                  ['Training samples', 'Awaiting client manifest'],
                  ['Class distribution', 'Awaiting client manifest'],
                  [
                    'Malicious designation',
                    'Seed- and condition-specific; not assigned here',
                  ],
                  ['Trust / reputation / weight', 'Awaiting round artifacts'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Two partition conditions">
              <p>
                <strong>Stratified-balanced:</strong> controlled, near-IID class
                allocation across clients.
              </p>
              <p>
                <strong>Dirichlet α = 0.5:</strong> per-class allocation with
                bounded rejection until every client has at least 16 samples.
                Honest outliers can resemble malicious updates.
              </p>
              <p>
                Record actual class counts and sample sizes. Ten clients does
                not imply ten equal partitions.
              </p>
              <SourceLink />
            </Panel>
          </div>
        </>
      ) : (
        <Panel
          title="What happens in a federated round?"
          kicker="METHODOLOGY WALKTHROUGH"
        >
          <Badge state="DEMONSTRATION" />
          <p>
            This step selector explains the implementation. It does not replay
            measured rounds or indicate training progress.
          </p>
          <Range
            label="Methodology step"
            value={step + 1}
            min={1}
            max={7}
            onChange={(v) => setStep(v - 1)}
          />
          <div className="revision-step">
            <span>{String(step + 1).padStart(2, '0')}</span>
            <h3>{roundStages[step]}</h3>
            <p>
              {
                [
                  'All clients start from the same current global state.',
                  'Each client trains sequentially on its partition. Local optimizers and AMP scalers are recreated for each invocation.',
                  'Floating state differences become updates; integer buffers retain the base-state handling.',
                  'Static label flipping happens in local data. The adaptive variant then blends malicious deltas toward a reference.',
                  'FedAvg uses sample weights. Robust baselines use their own rules; Trust uses geometric-median distance, soft trust and reputation.',
                  'The best eligible validation-accuracy checkpoint is retained. Full validation/test evaluation has no batch cap in main runs.',
                  'Alternating checksummed recovery files preserve round, model, best checkpoint, Trust history and RNG state. Resume begins at the next completed-round boundary.',
                ][step]
              }
            </p>
          </div>
          <Note>
            The notebook runs 30 rounds per full experiment. Revised round
            histories and replay controls will be populated after ingestion; no
            synthetic convergence curve is shown.
          </Note>
        </Panel>
      )}
    </>
  );
}
function RevisionSecurity() {
  const [tab, setTab] = useState('Robust baselines');
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Robust baselines',
          'Adaptive attacker',
          'Trust sensitivity',
          'Trust calculation',
        ]}
        onChange={setTab}
      />
      {tab === 'Robust baselines' && (
        <>
          <Panel
            title="Compare against defenses, not only FedAvg"
            kicker="IMPLEMENTED BASELINES"
          >
            <div className="revision-baselines">
              {[
                [
                  'fedavg',
                  'Sample-weighted mean',
                  'Reference baseline without a Byzantine defense.',
                ],
                [
                  'krum',
                  'Nearest-neighbor update selection',
                  'Scores each update against n−f−2 nearest others. Excludes only the diagonal; identical updates retain zero distances. Requires n > 2f+2.',
                ],
                [
                  'trimmed_mean',
                  'Coordinate-wise trimming',
                  'Removes f values from each tail per coordinate, then averages. Requires 2f < n.',
                ],
                [
                  'coordinate_median',
                  'Coordinate-wise median',
                  'For even client counts, averages the two middle values per coordinate. Distinct from geometric median.',
                ],
                [
                  'trust',
                  'Distance, trust and reputation',
                  'RMS distance to geometric median; adaptive thresholds; soft trust × reputation. Falls back to sample-weighted averaging if all weights vanish.',
                ],
                [
                  'multi_krum',
                  'Optional baseline',
                  'Averages the m lowest Krum-score updates; default m=n−f−2. Optional sixth method.',
                ],
              ].map(([id, t, d]) => (
                <article key={id}>
                  <ShieldCheck size={20} />
                  <h3>{methodNames[id]}</h3>
                  <strong>{t}</strong>
                  <p>{d}</p>
                  <Badge state="SUPPORTED" />
                </article>
              ))}
            </div>
            <Note>
              Krum and Trimmed Mean receive the known malicious-client count as
              an oracle bound. At 10 clients, the main sweep uses f=0,1,2,3.
              Their original robustness guarantees are not asserted for these
              non-IID local-training deltas. Baselines other than Trust do not
              output a detector; detection/FPR are unavailable, not zero.
            </Note>
          </Panel>
          <EmptyEvidence title="Baseline performance comparison pending" />
        </>
      )}
      {tab === 'Adaptive attacker' && <AdaptiveAttack />}
      {tab === 'Trust sensitivity' && (
        <>
          <Panel
            title="Which settings drive detection and false flags?"
            kicker="ONE FACTOR AT A TIME"
          >
            <p>
              Dirichlet α=0.5 · 20% malicious · Trust · five paired seeds. Nine
              settings produce 45 configured runs; the five default runs reuse
              main-study results.
            </p>
            <div className="revision-sensitivity">
              {sensitivities.map((s) => (
                <article key={s.id}>
                  <h3>{s.label}</h3>
                  <code>
                    {Object.keys(s.values).length
                      ? Object.entries(s.values)
                          .map(([k, v]) => `${k} = ${v}`)
                          .join('\n')
                      : 'MAD 0.5 / 3.0 · EMA 0.85\nFlag cutoff 0.5 · window 5'}
                  </code>
                  <Badge state={pending} />
                </article>
              ))}
            </div>
            <Note>
              Adaptive thresholds are active. The sweep changes MAD multipliers;
              changing the fixed T_LOW/T_HIGH values alone would not test the
              active threshold mechanism. No sensitivity curves or optimal
              setting are claimed yet.
            </Note>
          </Panel>
        </>
      )}
      {tab === 'Trust calculation' && <TrustCalculator />}
    </>
  );
}
function AdaptiveAttack() {
  const [retention, setRetention] = useState(0.5);
  return (
    <>
      <Panel
        title="A poisoned update that attempts to blend in"
        kicker="IMPLEMENTED · OMNISCIENT UPDATE ATTACK"
      >
        <div className="chart-grid">
          <div>
            <Badge state="SUPPORTED" />
            <p>
              First, malicious clients train on labels flipped from MEL, BCC and
              AKIEC to NV. The adaptive attacker then observes same-round honest
              updates and computes their geometric median.
            </p>
            <p>
              It tests retention scales{' '}
              <strong>1, 0.75, 0.5, 0.25, 0.1, 0</strong> against cloned Trust
              state, selecting the largest scale meeting the current score
              threshold. Other aggregators are attacked using an evolving
              surrogate Trust state.
            </p>
            <Note>
              Assumes access to all honest updates; no validation/test-label
              access. This is one bounded, defense-aware attack, not a universal
              or optimal adversary.
            </Note>
          </div>
          <div className="revision-equation">
            <Badge state="DEMONSTRATION" />
            <h3>Update blending</h3>
            <code>Δ′ = reference + λ(Δpoison − reference)</code>
            <Range
              label="Illustrative poison retention λ"
              value={retention}
              min={0}
              max={1}
              step={0.05}
              onChange={setRetention}
            />
            <div className="revision-blend">
              <span style={{ width: `${retention * 100}%` }} />
            </div>
            <p>
              {(retention * 100).toFixed(0)}% poisoned-update component ·{' '}
              {((1 - retention) * 100).toFixed(0)}% reference component
            </p>
            <small>
              This slider illustrates the equation; it does not evaluate an
              update or predict evasion.
            </small>
          </div>
        </div>
      </Panel>
      <Note>
        Passing a current soft-score threshold does not clear earlier flags from
        the history window. At λ=0, attack influence can disappear. Report
        retained attack success and evasion together; neither has been imported
        here.
      </Note>
      <EmptyEvidence title="Adaptive attack measurements pending" />
    </>
  );
}
function TrustCalculator() {
  const [distance, setDistance] = useState(0.00004);
  const [low, setLow] = useState(0.00003);
  const [high, setHigh] = useState(0.00006);
  const [rep, setRep] = useState(0.8);
  const [ema, setEma] = useState(0.85);
  const phi =
    distance <= low
      ? 1
      : distance >= high
        ? 0
        : (high - distance) / (high - low);
  const next = ema * rep + (1 - ema) * phi;
  return (
    <Panel
      title="Inspect the Trust equations"
      kicker="ILLUSTRATIVE INPUTS · NOT MEASURED CLIENT VALUES"
    >
      <Badge state="DEMONSTRATION" />
      <p>
        RMS distance: ‖Δᵢ − reference‖₂ / √N, over floating state entries. The
        active implementation estimates reference with{' '}
        {protocol.config.TRUST_GEOM_MEDIAN_ITERS} geometric-median iterations.
      </p>
      <div className="chart-grid">
        <div>
          <Range
            label="RMS distance D"
            value={distance}
            min={0}
            max={0.0001}
            step={0.000001}
            onChange={setDistance}
          />
          <Range
            label="Lower threshold"
            value={low}
            min={0}
            max={0.00009}
            step={0.000001}
            onChange={(v) => {
              setLow(v);
              if (v >= high) setHigh(v + 0.000001);
            }}
          />
          <Range
            label="Upper threshold"
            value={high}
            min={low + 0.000001}
            max={0.0001}
            step={0.000001}
            onChange={setHigh}
          />
          <Range
            label="Previous reputation"
            value={rep}
            min={0}
            max={1}
            step={0.01}
            onChange={setRep}
          />
          <Range
            label="EMA momentum"
            value={ema}
            min={0}
            max={0.99}
            step={0.01}
            onChange={setEma}
          />
        </div>
        <div className="revision-equation">
          <h3>Distance → score → contribution</h3>
          <p>
            φ = 1 below Tlow; 0 above Thigh; otherwise (Thigh − D) / (Thigh −
            Tlow).
          </p>
          <strong>φ = {phi.toFixed(4)}</strong>
          <p>
            r′ = {ema.toFixed(2)}r + {(1 - ema).toFixed(2)}φ
          </p>
          <strong>r′ = {next.toFixed(4)}</strong>
          <p>Effective weight a = r′φ</p>
          <strong>a = {(next * phi).toFixed(4)}</strong>
          <small>
            Normalized contribution requires every client’s effective weight and
            is not inferred here.
          </small>
        </div>
      </div>
      <Note>
        Thresholds in real runs use median + multiplier × robust spread (1.4826
        × MAD, with IQR/standard-deviation fallback). Default multipliers are
        0.5 and 3.0. The default detector flags any φ &lt; 0.5 within the last
        five rounds; the single illustrative score above is not a detection
        history.
      </Note>
    </Panel>
  );
}
export function RevisionObservatory({
  initialTab = 'Performance',
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [partition, setPartition] = useState('dirichlet');
  const [fraction, setFraction] = useState('0.2');
  const [seed, setSeed] = useState('paired');
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Performance',
          'Robustness',
          'Confusion & classes',
          'Statistics',
          'Definitions & limitations',
        ]}
        onChange={setTab}
      />
      <div className="filter-row">
        <Pick
          label="Partition"
          value={partition}
          items={[
            ['stratified_balanced', 'Stratified-balanced'],
            ['dirichlet', 'Dirichlet · non-IID'],
          ]}
          onChange={setPartition}
        />
        <Pick
          label="Malicious fraction"
          value={fraction}
          items={[
            ['0', '0% · clean'],
            ['0.1', '10%'],
            ['0.2', '20%'],
            ['0.3', '30%'],
          ]}
          onChange={setFraction}
        />
        <Pick
          label="Seed scope"
          value={seed}
          items={['paired', ...seeds.map(String)]}
          onChange={setSeed}
        />
        <Badge state={pending} />
      </div>
      {tab === 'Performance' && (
        <Panel
          title="Classification and security, side by side"
          kicker="REVISED STUDY · RESULTS NOT INGESTED"
        >
          <p>
            Selection: {partition} · {Number(fraction) * 100}% malicious ·{' '}
            {seed === 'paired' ? 'five configured seeds' : `seed ${seed}`}.
            Missing values remain unavailable; no seed means are calculated from
            partial notebook logs.
          </p>
          <div className="revision-table-wrap">
            <table className="revision-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {methods.map((a) => (
                    <th key={a}>{methodNames[a]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'Accuracy',
                  'Macro precision',
                  'Macro recall',
                  'Macro-F1',
                  'Specificity',
                  'Binary malignant recall',
                  'MEL / BCC / AKIEC recall',
                  'ASR',
                  'Target avoidance · derived',
                  'Detection / FPR',
                ].map((m) => (
                  <tr key={m}>
                    <th>{m}</th>
                    {methods.map((a) => (
                      <td key={a}>
                        {m === 'Detection / FPR' && a !== 'trust'
                          ? 'No detector'
                          : (m === 'ASR' ||
                                m === 'Target avoidance · derived') &&
                              fraction === '0'
                            ? 'Not defined'
                            : 'Pending'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>
            Security improvement must be evaluated alongside recall, precision
            and class-level errors. A high accuracy on HAM10000 can conceal poor
            minority-class performance.
          </Note>
        </Panel>
      )}
      {tab === 'Robustness' && (
        <div className="chart-grid">
          {[
            'ASR versus malicious fraction',
            'Accuracy under attack',
            'Detection with TP / FN counts',
            'False positives with FP / TN counts',
          ].map((t) => (
            <Panel key={t} title={t}>
              <EmptyEvidence title="Measured endpoints pending">
                The 0%, 10%, 20% and 30% conditions are configured in both
                partitions. No synthetic trend, interpolated endpoint or live
                training curve is displayed.
              </EmptyEvidence>
            </Panel>
          ))}
        </div>
      )}
      {tab === 'Confusion & classes' && (
        <>
          <Panel title="Seven-class evidence will remain visible">
            <div className="revision-class-list">
              {classes.map((c) => (
                <div key={c}>
                  <strong>{c}</strong>
                  <span>Precision / recall / F1 / support</span>
                  <Badge state={pending} />
                </div>
              ))}
            </div>
            <Note>
              Inspect malignant→NV errors and errors into other benign classes.
              Report VASC and DF as well as MEL, BCC and AKIEC. Each confusion
              matrix must identify one run, split, seed and checkpoint; a single
              run must not be presented as a five-seed mean.
            </Note>
          </Panel>
          <EmptyEvidence title="Confusion matrix awaiting verified predictions" />
        </>
      )}
      {tab === 'Statistics' && (
        <Panel
          title="Paired evidence, with uncertainty"
          kicker="FIVE SEEDS CONFIGURED · NO P-VALUES IMPORTED"
        >
          <div className="metric-grid">
            {[
              ['Planned pairs', '5'],
              ['Imported paired seeds', '0'],
              ['Paired t-test', 'Pending'],
              ['Wilcoxon test', 'Pending'],
            ].map(([k, v]) => (
              <div className="metric" key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <ol className="revision-list">
            <li>
              Pair Trust and each baseline on matching seed, partition,
              fraction, attack and setting.
            </li>
            <li>
              Report seed-level differences, mean difference, sample SD and the
              number of complete pairs.
            </li>
            <li>
              The notebook computes tests only for at least five complete pairs;
              Holm correction is applied across each exported test family.
            </li>
            <li>
              Seeds randomize training and partitioning on a fixed split. They
              are not independent clinical cohorts. Five pairs still provide
              limited inferential evidence.
            </li>
          </ol>
          <Note>
            Pair only matched configurations and completed seeds. No statistical
            significance, completed checklist or detection rate is claimed from
            the configured plan.
          </Note>
        </Panel>
      )}
      {tab === 'Definitions & limitations' && (
        <>
          <MetricGuide />
          <Panel title="Research limitations">
            <ul className="revision-list">
              {revisedLimitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </>
  );
}
function MetricGuide() {
  return (
    <Panel title="What each metric means">
      <dl className="revision-definitions">
        {metricDefinitions.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
export function RevisionStudio({
  initialTab = 'Experiment builder',
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [stage, setStage] = useState('main');
  const [multi, setMulti] = useState(false);
  const [page, setPage] = useState(0);
  const [seedFilter, setSeedFilter] = useState('all');
  const [message, setMessage] = useState('');
  const jobs = studyPlan(stage, multi);
  const filtered = jobs.filter(
    (j) => seedFilter === 'all' || j.seed === Number(seedFilter),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 15));
  const safePage = Math.min(page, pages - 1);
  function exportPlan() {
    download(`fed-resvit-${stage}-plan.json`, {
      protocol_id: protocol.protocol_id,
      source_sha256: protocol.source_sha256,
      kind: 'configuration_only',
      results_ingested: false,
      execution_backend_connected: false,
      notebook_stage: stage,
      include_multi_krum: multi,
      config: protocol.config,
      jobs,
    });
    setMessage(
      'Plan exported. No job was launched and no results were created.',
    );
  }
  return (
    <>
      <TabBar
        value={tab}
        items={['Experiment builder', 'Study plan', 'Run registry']}
        onChange={setTab}
      />
      {tab === 'Experiment builder' && <ExperimentBuilder />}
      {tab === 'Study plan' && (
        <>
          <Panel
            title="The complete study, before results"
            kicker="CONFIGURATION INVENTORY"
          >
            <div className="filter-row">
              <Pick
                label="Notebook stage"
                value={stage}
                items={['main', 'adaptive', 'sensitivity']}
                onChange={(v) => {
                  setStage(v);
                  setPage(0);
                }}
              />
              <Pick
                label="Seed filter"
                value={seedFilter}
                items={['all', ...seeds.map(String)]}
                onChange={(v) => {
                  setSeedFilter(v);
                  setPage(0);
                }}
              />
              <label className="revision-toggle" htmlFor="include-multikrum">
                <Switch
                  id="include-multikrum"
                  checked={multi}
                  onCheckedChange={(v) => {
                    setMulti(v);
                    setPage(0);
                  }}
                  aria-label="Include optional Multi-Krum"
                />{' '}
                Include Multi-Krum
              </label>
              <button className="primary-btn" onClick={exportPlan}>
                <Download size={16} /> Export stage plan
              </button>
            </div>
            <div className="secondary-metrics">
              <span>{jobs.length} configured in this stage</span>
              <span>{uniqueStudyCount(multi)} distinct full-study runs</span>
              <span>0 artifacts ingested</span>
            </div>
            <Note>
              The current notebook selects one stage at a time. This app lists
              and exports those plans; it does not implement a combined
              execution queue or control Colab. Sensitivity contains five
              default runs that can reuse matching main-study artifacts.
              Optional Multi-Krum increases the full distinct count from 265 to
              310.
            </Note>
            <div className="revision-table-wrap">
              <table className="revision-table">
                <thead>
                  <tr>
                    <th>Stage row</th>
                    <th>Method</th>
                    <th>Seed</th>
                    <th>Partition</th>
                    <th>Malicious</th>
                    <th>Attack / setting</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice(safePage * 15, safePage * 15 + 15)
                    .map((j) => (
                      <tr key={JSON.stringify(j)}>
                        <td>{jobs.indexOf(j)}</td>
                        <td>{methodNames[j.aggregation]}</td>
                        <td>{j.seed}</td>
                        <td>{j.partition}</td>
                        <td>{j.malicious_fraction * 100}%</td>
                        <td>
                          {j.attack}
                          <br />
                          {j.setting}
                        </td>
                        <td>Awaiting artifacts</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="revision-pagination">
              <button
                className="secondary-btn"
                disabled={safePage === 0}
                onClick={() => setPage(safePage - 1)}
              >
                Previous
              </button>
              <span>
                Page {safePage + 1} of {pages} · {filtered.length}{' '}
                configurations
              </span>
              <button
                className="secondary-btn"
                disabled={safePage === pages - 1}
                onClick={() => setPage(safePage + 1)}
              >
                Next
              </button>
            </div>
            {message && <output>{message}</output>}
          </Panel>
        </>
      )}
      {tab === 'Run registry' && (
        <>
          <Panel title="Execution registry">
            <EmptyEvidence title="Verified run artifacts have not been imported">
              The researcher has reported external training progress. No live
              session connection, completion count or run-level metric is
              inferred from that report.
            </EmptyEvidence>
          </Panel>
          <IngestionContract />
        </>
      )}
    </>
  );
}
function ExperimentBuilder() {
  const [aggregation, setAggregation] = useState('trust');
  const [clients, setClients] = useState('10');
  const [fraction, setFraction] = useState('0.2');
  const [partition, setPartition] = useState('dirichlet');
  const [attack, setAttack] = useState('targeted_label_flipping');
  const [alpha, setAlpha] = useState(0.5);
  const [flip, setFlip] = useState(1);
  const [setting, setSetting] = useState('default');
  const [message, setMessage] = useState('');
  const n = Number(clients),
    f = Math.round(n * Number(fraction));
  const invalid =
    (['krum', 'multi_krum'].includes(aggregation) && n <= 2 * f + 2) ||
    (aggregation === 'trimmed_mean' && 2 * f >= n);
  const selectedSetting = sensitivities.find((s) => s.id === setting)!;
  function exportConfig() {
    const config = {
      ...protocol.config,
      NUM_CLIENTS: n,
      PARTITION_METHOD: partition,
      DIRICHLET_ALPHA: alpha,
      FLIP_PROB: flip,
      ATTACK_MODE: Number(fraction) === 0 ? 'none' : attack,
      SETTING: setting,
      ...selectedSetting.values,
    };
    download('fed-resvit-config-draft.json', {
      protocol_id: protocol.protocol_id,
      state: 'SUPPORTED',
      execution_backend_connected: false,
      results_ingested: false,
      source_sha256: protocol.source_sha256,
      config,
      experiment: { aggregation, malicious_fraction: Number(fraction), seeds },
      adversary_bound_policy: 'oracle_count',
      configured_malicious_clients: f,
    });
    setMessage(
      'Draft exported for review in the notebook. It does not launch training or establish an executed result.',
    );
  }
  return (
    <>
      <div className="studio-toolbar">
        <Badge state="SUPPORTED" />
        <span>Notebook parameters · configuration draft only</span>
      </div>
      <div className="studio-grid">
        <Panel title="Dataset & federation" kicker="01">
          <p>HAM10000 · seven classes · lesion-disjoint split</p>
          <div className="form-grid">
            <Pick
              label="Clients"
              value={clients}
              items={['5', '10']}
              onChange={setClients}
            />
            <Pick
              label="Partition"
              value={partition}
              items={[
                ['stratified_balanced', 'Stratified-balanced'],
                ['dirichlet', 'Dirichlet · non-IID'],
              ]}
              onChange={setPartition}
            />
          </div>
          {partition === 'dirichlet' && (
            <Range
              label="Dirichlet alpha"
              value={alpha}
              min={0.1}
              max={2}
              step={0.1}
              onChange={setAlpha}
            />
          )}
          <dl className="detail-list">
            <div>
              <dt>Full rounds / local epochs</dt>
              <dd>30 / 2</dd>
            </div>
            <div>
              <dt>Batch size</dt>
              <dd>16</dd>
            </div>
            <div>
              <dt>Seeds</dt>
              <dd>42, 43, 44, 45, 46</dd>
            </div>
            <div>
              <dt>Minimum client samples</dt>
              <dd>16</dd>
            </div>
          </dl>
          <p>
            Only alpha 0.5 and ten clients are in the default main plan. Other
            supported values create a different protocol.
          </p>
        </Panel>
        <Panel title="Model & aggregation" kicker="02">
          <p>
            <strong>ResNet-50 + ViT-small</strong>
            <br />
            Fusion 768 · dropout 0.2 · partial fine-tuning
          </p>
          <Pick
            label="Aggregation method"
            value={aggregation}
            items={[...methods, 'multi_krum'].map((a) => [a, methodNames[a]])}
            onChange={setAggregation}
          />
          <p>
            AdamW · learning rate 0.0002 · weight decay 0.0001 · cosine schedule
            · three warmup rounds · backbone LR multiplier 0.08.
          </p>
          <p>
            TTA: original + horizontal flip. Best validation accuracy from round
            5 onward. Main evaluation uses complete validation/test sets.
          </p>
          <Note>
            Standalone ResNet/ViT ablations remain planned; they are not
            implemented by this builder.
          </Note>
        </Panel>
        <Panel title="Attack & threat model" kicker="03">
          <Pick
            label="Attack variant"
            value={attack}
            items={['targeted_label_flipping', 'adaptive_omniscient_blend']}
            onChange={setAttack}
          />
          <Pick
            label="Malicious fraction"
            value={fraction}
            items={[
              ['0', '0% · clean'],
              ['0.1', '10%'],
              ['0.2', '20%'],
              ['0.3', '30%'],
            ]}
            onChange={setFraction}
          />
          <Range
            label="Label-flip probability"
            value={flip}
            min={0}
            max={1}
            step={0.05}
            onChange={setFlip}
          />
          <p>
            <strong>
              {f} of {n}
            </strong>{' '}
            designated malicious clients ({((100 * f) / n).toFixed(0)}%
            realized). Zero fraction creates a clean run.
          </p>
          <p>
            MEL / BCC / AKIEC → NV. Adaptive blending uses the notebook’s fixed
            candidate grid; it assumes visibility into honest updates.
          </p>
          {invalid && (
            <Note tone="warning">
              Invalid baseline bound: Krum requires n &gt; 2f+2; Trimmed Mean
              requires 2f &lt; n. Choose a valid client/fraction combination.
            </Note>
          )}
        </Panel>
        <Panel title="Trust & export" kicker="04">
          <Pick
            label="Sensitivity setting"
            value={setting}
            items={sensitivities.map((s) => [s.id, s.label])}
            onChange={setSetting}
          />
          <p>
            Default: RMS distance · adaptive MAD 0.5/3.0 · reputation EMA 0.85 ·
            flag cutoff 0.5 · rolling window 5.
          </p>
          <p>
            Geometric-median iterations:{' '}
            {protocol.config.TRUST_GEOM_MEDIAN_ITERS}. Sensitivity changes do
            not imply improved results.
          </p>
          <button
            className="primary-btn wide"
            disabled={invalid}
            onClick={exportConfig}
          >
            <Download size={16} />
            Export configuration draft
          </button>
          {message && <output>{message}</output>}
          <Note>
            Configuration changes do not run experiments in this app. Restore
            identical software and execution settings before notebook checkpoint
            recovery.
          </Note>
        </Panel>
      </div>
    </>
  );
}
function IngestionContract() {
  return (
    <Panel
      title="What the next evidence import needs"
      kicker="ARTIFACT CONTRACT · INGESTION PENDING"
    >
      <div className="revision-artifacts">
        {[
          [
            'manifest.json',
            'Run identity, exact configuration, code/data hashes and environment.',
          ],
          [
            'split_manifest.json + clients.json',
            'Lesion/image membership, image hashes, partition sizes and class distributions.',
          ],
          [
            'completed.json',
            'Final metric record and hashes of the required completed artifacts.',
          ],
          [
            'round_history.json / CSV',
            'Validation history, trust thresholds, client scores, reputation, weights, flags and adaptive search trace.',
          ],
          [
            'Predictions NPZ + classification report',
            'y_true, y_pred and seven-class probabilities, with supports and per-class metrics.',
          ],
          [
            'confusion_matrix.csv',
            'Counts validated against prediction labels and per-class support.',
          ],
          [
            'Model checkpoint',
            'Required for real image inference; never needed to invent missing predictions.',
          ],
        ].map(([n, d]) => (
          <article key={n}>
            <FileCode2 size={19} />
            <h3>{n}</h3>
            <p>{d}</p>
            <Badge state={pending} />
          </article>
        ))}
      </div>
      <ol className="revision-list">
        <li>Keep short validation pilots separate from full research runs.</li>
        <li>
          Validate completion, checksums, class order, model recipe, partition,
          attack, seed and selected checkpoint before displaying metrics.
        </li>
        <li>
          Pair only matching scientific configurations; preserve missing values,
          detector denominators and sample SD.
        </li>
      </ol>
      <Note>
        This is the import specification, not a claim that an upload pipeline or
        checkpoint inference service is connected. No artifact upload or
        ingestion is performed in this update.
      </Note>
    </Panel>
  );
}
export function RevisionReproducibility({
  initialTab = 'Active protocol',
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <TabBar
        value={tab}
        items={['Active protocol', 'Recovery & execution', 'Evidence handoff']}
        onChange={setTab}
      />
      {tab === 'Active protocol' && (
        <>
          <Panel title="Notebook protocol" action={<SourceLink />}>
            <p>
              The active model and experiment settings are shown below. This is
              a configuration snapshot, not a completion record.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Notebook supplied</dt>
                <dd>{protocol.source_notebook}</dd>
              </div>
              <div>
                <dt>Evidence state</dt>
                <dd>Implementation inspected · results not ingested</dd>
              </div>
              <div>
                <dt>Notebook SHA-256</dt>
                <dd className="hash">{protocol.source_sha256}</dd>
              </div>
            </dl>
            <details>
              <summary>Inspect complete main-stage configuration</summary>
              <pre className="revision-code">
                {JSON.stringify(protocol.config, null, 2)}
              </pre>
            </details>
          </Panel>
          <Panel title="Source implementation">
            <p>
              Read-only source extracts from the supplied notebook. Cell indices
              are zero-based; execution outputs and runtime credentials are
              excluded. Source changes produce new experiment identities in the
              notebook.
            </p>
            <div className="source-links">
              {Object.entries(protocol.sources).map(([name, s]) => (
                <a
                  className="secondary-btn"
                  key={name}
                  href={'/evidence/revision/' + name}
                  download
                >
                  <FileCode2 size={16} />
                  <span>
                    Cell {s.cell}
                    <small>{s.definitions.slice(0, 3).join(', ')}</small>
                  </span>
                  <Download size={15} />
                </a>
              ))}
            </div>
          </Panel>
        </>
      )}
      {tab === 'Recovery & execution' && (
        <>
          <Panel
            title="Continue the experiment, preserve the evidence"
            kicker="ROUND-BOUNDARY RECOVERY"
          >
            <ol className="about-workflow">
              {[
                [
                  'Apply settings first',
                  'The corrected runner sets the seed and execution flags before recording or comparing the environment.',
                ],
                [
                  'Verify identity',
                  'Configuration, data and code identify the run. Restore recorded package versions and hardware before continuation.',
                ],
                [
                  'Load a valid generation',
                  'Two alternating recovery files use checksums. If the latest is invalid, recover the earlier valid round rather than silently starting over.',
                ],
                [
                  'Restore scientific state',
                  'Current global weights, best weights/round/score, Trust reputation/history, adaptive surrogate state and Python/NumPy/Torch/CUDA RNG state.',
                ],
                [
                  'Resume at the next round',
                  'A committed round 20 resumes at 21. An interruption inside round 21 replays that unfinished round.',
                ],
                [
                  'Mark completion last',
                  'Final model, predictions, reports and histories must exist before the completion marker is written. Matching completed runs can be skipped.',
                ],
              ].map(([t, d], i) => (
                <li key={t}>
                  <span>{i + 1}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Note>
              Local optimizers and AMP scalers are recreated for each client
              invocation; no optimizer state persists across round boundaries in
              this implementation. GPU determinism remains best-effort. Drive
              writes and session lifetimes are not guaranteed by the app.
            </Note>
          </Panel>
          <Panel title="Execution remains outside the web application">
            <p>
              The notebook runs one selected stage at a time: main, adaptive or
              sensitivity. A session budget checks before the next round; it
              does not guarantee the round finishes before the provider
              disconnects. Queue settings are not live-connected here.
            </p>
            <p>
              Start/stop slices are execution controls. This interface
              inventories the scientific plan; the run manifest and verified
              completion records will establish which configurations actually
              finished.
            </p>
          </Panel>
        </>
      )}
      {tab === 'Evidence handoff' && <IngestionContract />}
    </>
  );
}

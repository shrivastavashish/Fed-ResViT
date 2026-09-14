'use client';
import { useState } from 'react';
import {
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
import { RoundMethodology } from './round-methodology';
import { DemoResults } from './demo-results';
import { StudyCoverage } from './scientific-atlas';
import { EvaluatorDashboard } from './evaluator-dashboard';
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
import { download } from '@/lib/project';

type Props = {
  page: string;
  navigate: (page: string, tab?: string) => void;
};
const illustrative = 'ILLUSTRATIVE DATA';
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
      <Badge state={illustrative} />
      <p>
        {children ??
          'Illustrative values are used to present the analytical workflow and remain distinct from measured notebook results.'}
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
  return <EvaluatorDashboard navigate={navigate} />;
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
function RevisionFederation() {
  const [tab, setTab] = useState('Federation topology');
  const [client, setClient] = useState(0);
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Federation topology',
          'Federated round simulation',
          'Hybrid CNN–Transformer',
        ]}
        onChange={setTab}
      />
      {tab === 'Hybrid CNN–Transformer' ? (
        <>
          <Architecture />
          <Note>
            The hybrid model uses partial backbone fine-tuning, fusion dimension
            768, dropout 0.2, AdamW and backbone LR multiplier 0.08. A new
            the seven-class classifier follows the same ImageNet-normalized
            224 × 224 input pipeline shown in Clinical AI.
          </Note>
        </>
      ) : tab === 'Federation topology' ? (
        <>
          <FederationSimulation />
          <Panel
            title="Ten-client federated learning topology"
            kicker="BALANCED AND DIRICHLET α = 0.5 PARTITIONS"
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
                <Badge state="TRUST-AWARE AGGREGATION" />
              </div>
            </div>
          </Panel>
          <div className="chart-grid">
            <Panel title={`Client ${client + 1} · research profile`}>
              <dl className="detail-list">
                {[
                  ['Client ID', String(client)],
                  ['Training samples', `${692 + client * 17} illustrative images`],
                  ['Class distribution', 'Seven-class non-IID example profile'],
                  [
                    'Malicious designation',
                    'Seed- and condition-specific; not assigned here',
                  ],
                  ['Trust / reputation / weight', `${(0.93 - client * 0.025).toFixed(2)} / ${(0.96 - client * 0.012).toFixed(2)} / ${(11.8 - client * 0.48).toFixed(1)}% · illustrative`],
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
        <RoundMethodology />
      )}
    </>
  );
}
function RevisionSecurity() {
  const [tab, setTab] = useState('Robust aggregation');
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Robust aggregation',
          'Adaptive poisoning',
          'Trust parameter analysis',
          'Trust score explorer',
        ]}
        onChange={setTab}
      />
      {tab === 'Robust aggregation' && (
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
                  <Badge state="IMPLEMENTED METHOD" />
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
          <DemoResults tab="Performance" />
        </>
      )}
      {tab === 'Adaptive poisoning' && <AdaptiveAttack />}
      {tab === 'Trust parameter analysis' && (
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
                  <Badge state="CONFIGURED SETTING" />
                </article>
              ))}
            </div>
            <Note>
              Adaptive thresholds are active. The sweep changes MAD multipliers;
              changing the fixed T_LOW/T_HIGH values alone would not test the
              active threshold mechanism. No sensitivity curves or optimal
              setting are determined by the completed experiment comparison.
            </Note>
          </Panel>
        </>
      )}
      {tab === 'Trust score explorer' && <TrustCalculator />}
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
            <Badge state="IMPLEMENTED ATTACK" />
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
            <Badge state="ILLUSTRATIVE DATA" />
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
      <EmptyEvidence title="Adaptive attack result explorer" />
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
      <Badge state={illustrative} />
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
  initialTab = 'Model performance',
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <div className="demo-mode-banner">
        <Badge state="ILLUSTRATIVE DATA" />
        <p>
          Presentation dataset for exploring the final analytics interface.
          Values are illustrative and are not trained-model measurements.
        </p>
      </div>
      <TabBar
        value={tab}
        items={[
          'Model performance',
          'Poisoning robustness',
          'Confusion matrix & classes',
          'Statistical analysis',
          'Metrics & limitations',
        ]}
        onChange={setTab}
      />
      {tab === 'Metrics & limitations' ? (
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
      ) : (
        <DemoResults tab={tab} />
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
  initialTab = 'Experiment configuration',
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
        items={[
          'Experiment configuration',
          'Research coverage',
          'Experiment matrix',
          'Execution registry',
        ]}
        onChange={setTab}
      />
      {tab === 'Experiment configuration' && <ExperimentBuilder />}
      {tab === 'Research coverage' && <StudyCoverage />}
      {tab === 'Experiment matrix' && (
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
              <span>10 simulated clients</span>
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
                    <th>Configuration state</th>
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
                        <td>Configured</td>
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
      {tab === 'Execution registry' && (
        <>
          <Panel title="Federated experiment execution registry" action={<Badge state="ILLUSTRATIVE DATA" />}>
            <p>
              Representative records show how completed runs are compared by
              method, partition, seed and malicious-client fraction.
            </p>
            <div className="revision-table-wrap">
              <table className="revision-table">
                <thead><tr><th>Run</th><th>Method</th><th>Partition</th><th>Seed</th><th>Malicious</th><th>Status</th></tr></thead>
                <tbody>
                  {methods.map((method, index) => (
                    <tr key={method}>
                      <td>FRV-{String(index + 1).padStart(3, '0')}</td>
                      <td>{methodNames[method]}</td>
                      <td>{index % 2 ? 'Dirichlet α=0.5' : 'Stratified-balanced'}</td>
                      <td>{seeds[index]}</td>
                      <td>{[0, 10, 20, 30, 20][index]}%</td>
                      <td>Completed · illustrative</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <Badge state="NOTEBOOK CONFIGURATION" />
        <span>Interactive Fed-ResViT experiment design</span>
      </div>
      <div className="studio-grid">
        <Panel title="Dataset & federation" kicker="01">
          <p>HAM10000 · seven classes · lesion-disjoint split</p>
          <div className="form-grid">
            <Pick
              label="Clients"
              value={clients}
              items={['10']}
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
            Standalone ResNet/ViT ablations are research extensions outside this
            comparative study.
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
      title="Research artifact traceability"
      kicker="REPRODUCIBILITY EVIDENCE STRUCTURE"
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
            <Badge state="ARTIFACT TYPE" />
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
        These artifacts connect each displayed metric to its experiment,
        configuration, seed, notebook implementation and model checkpoint.
      </Note>
    </Panel>
  );
}
export function RevisionReproducibility({
  initialTab = 'Model configuration',
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <TabBar
        value={tab}
        items={['Model configuration', 'Resumable training', 'Artifact traceability']}
        onChange={setTab}
      />
      {tab === 'Model configuration' && (
        <>
          <Panel title="Notebook model and experiment configuration" action={<SourceLink />}>
            <p>
              The active model and experiment settings from the latest notebook
              are shown below.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Notebook supplied</dt>
                <dd>{protocol.source_notebook}</dd>
              </div>
              <div>
                <dt>Research design</dt>
                <dd>200 main · 25 adaptive · 45 sensitivity runs</dd>
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
      {tab === 'Resumable training' && (
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
      {tab === 'Artifact traceability' && <IngestionContract />}
    </>
  );
}

'use client';
import { useState } from 'react';
import {
  Download,
  RotateCcw,
  Check,
  FileCode2,
  FileArchive,
  Play,
  ArrowUpRight,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { data, download, classes } from '@/lib/research';
import { Panel, Note, Pick, Badge, TabBar, ExportLink } from './common';
const initial = {
  dataset: 'HAM10000',
  clients: '5',
  rounds: '30',
  local_epochs: '2',
  batch_size: '16',
  partition: 'stratified_balanced',
  model: 'Fed-ResViT hybrid',
  aggregation: 'trust',
  attack: 'targeted_label_flipping',
  malicious_fraction: '0.2',
  flip_probability: '1',
  target: 'NV',
  source_classes: ['MEL', 'BCC', 'AKIEC'],
  lr: '0.0002',
  weight_decay: '0.0001',
  warmup: '3',
  scheduler: 'cosine',
  tta: true,
  best_validation: true,
  seeds: [42, 43],
};
export function Studio({
  onReplay,
  initialTab = 'Experiment builder',
}: {
  onReplay: () => void;
  initialTab?: string;
}) {
  const [config, setConfig] = useState(initial);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState(initialTab);
  const change = (k: string, v: unknown) => {
    setConfig((c) => ({ ...c, [k]: v }));
    setMessage('');
  };
  const planned = config.model !== 'Fed-ResViT hybrid';
  const fixed = Object.entries(initial).every(
    ([k, v]) =>
      ['aggregation', 'attack', 'malicious_fraction'].includes(k) ||
      JSON.stringify(config[k as keyof typeof initial]) === JSON.stringify(v),
  );
  const executed =
    fixed &&
    ((config.malicious_fraction === '0.2' &&
      config.attack === 'targeted_label_flipping') ||
      (config.malicious_fraction === '0' && config.attack === 'none'));
  const state = planned ? 'PLANNED' : executed ? 'EXECUTED' : 'SUPPORTED';
  function exportConfig() {
    const parsed = {
      ...config,
      state,
      execution_backend_connected: false,
      ...Object.fromEntries(
        [
          'clients',
          'rounds',
          'local_epochs',
          'batch_size',
          'malicious_fraction',
          'flip_probability',
          'lr',
          'weight_decay',
          'warmup',
        ].map((k) => [k, Number(config[k as keyof typeof initial])]),
      ),
    };
    if (
      Object.values(parsed).some(
        (v) => typeof v === 'number' && !Number.isFinite(v),
      ) ||
      Number(config.lr) <= 0 ||
      Number(config.flip_probability) < 0 ||
      Number(config.flip_probability) > 1
    ) {
      setMessage(
        'Enter valid numerical values. Learning rate must be positive and flip probability between 0 and 1.',
      );
      return;
    }
    download('fed-resvit-experiment-draft.json', parsed);
    setMessage(
      'Configuration exported. No experiment was submitted and no new results were generated.',
    );
  }
  return (
    <>
      <TabBar
        value={tab}
        items={['Experiment builder', 'Executed run registry']}
        onChange={setTab}
      />
      {tab === 'Executed run registry' ? (
        <Panel
          title="Eight completed runs"
          action={<ExportLink href="/evidence/recovered-results.csv" />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Seed</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Best checkpoint</TableHead>
                <TableHead>Execution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.aggregation}</TableCell>
                  <TableCell>{r.seed}</TableCell>
                  <TableCell>{r.malicious_fraction * 100}% malicious</TableCell>
                  <TableCell>Round {r.best_val_round}</TableCell>
                  <TableCell>
                    <Badge />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p>
            All runs used five clients, 30 rounds and two local epochs. This
            registry records completed notebook experiments, not new jobs.
          </p>
        </Panel>
      ) : (
        <>
          <div className="studio-toolbar">
            <div>
              <Badge state={state} />
              <span>
                {executed
                  ? 'Matches an executed configuration'
                  : planned
                    ? 'Standalone backbone experiment requires a model-builder extension'
                    : 'Not executed · supported notebook parameters'}
              </span>
            </div>
            <button
              className="secondary-btn"
              onClick={() => {
                setConfig(initial);
                setMessage('Restored the executed baseline.');
              }}
            >
              <RotateCcw size={15} />
              Reset baseline
            </button>
          </div>
          <div className="studio-grid">
            <Panel title="Dataset & federation" kicker="01">
              <Pick
                label="Dataset"
                value={config.dataset}
                items={['HAM10000']}
                onChange={(v) => change('dataset', v)}
              />
              <div className="form-grid">
                <Pick
                  label="Clients"
                  value={config.clients}
                  items={['3', '5']}
                  onChange={(v) => change('clients', v)}
                />
                <Pick
                  label="Rounds"
                  value={config.rounds}
                  items={['5', '10', '20', '30']}
                  onChange={(v) => change('rounds', v)}
                />
                <Pick
                  label="Local epochs"
                  value={config.local_epochs}
                  items={['1', '2']}
                  onChange={(v) => change('local_epochs', v)}
                />
                <Pick
                  label="Batch size"
                  value={config.batch_size}
                  items={['8', '16', '32']}
                  onChange={(v) => change('batch_size', v)}
                />
              </div>
              <Pick
                label="Client partition"
                value={config.partition}
                items={[
                  ['stratified_balanced', 'Stratified-balanced · executed'],
                  ['dirichlet', 'Dirichlet · supported, not executed'],
                ]}
                onChange={(v) => change('partition', v)}
              />
              <p className="small-muted">
                Seeds fixed at 42, 43. Controls stay within the existing client
                and round budget.
              </p>
            </Panel>
            <Panel title="Model & optimization" kicker="02">
              <Pick
                label="Architecture"
                value={config.model}
                items={[
                  'Fed-ResViT hybrid',
                  ['ResNet-50', 'ResNet-50 alone · planned ablation'],
                  ['ViT-small', 'ViT-Small alone · planned ablation'],
                ]}
                onChange={(v) => change('model', v)}
              />
              <Pick
                label="Aggregation"
                value={config.aggregation}
                items={['fedavg', 'trust']}
                onChange={(v) => change('aggregation', v)}
              />
              <div className="form-grid">
                {[
                  ['lr', 'Learning rate'],
                  ['weight_decay', 'Weight decay'],
                  ['warmup', 'Warmup rounds'],
                ].map(([k, l]) => (
                  <label className="number-field" key={k}>
                    {l}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={String(config[k as keyof typeof initial])}
                      onChange={(e) => change(k, e.target.value)}
                    />
                  </label>
                ))}
                <Pick
                  label="Scheduler"
                  value={config.scheduler}
                  items={['cosine', 'constant']}
                  onChange={(v) => change('scheduler', v)}
                />
              </div>
              <p className="small-muted">
                AdamW · partial fine-tuning · backbone LR multiplier 0.08
              </p>
            </Panel>
            <Panel title="Attack specification" kicker="03">
              <Pick
                label="Attack"
                value={config.attack}
                items={[
                  ['none', 'None · clean'],
                  ['targeted_label_flipping', 'Targeted label flipping'],
                ]}
                onChange={(v) => {
                  change('attack', v);
                  change('malicious_fraction', v === 'none' ? '0' : '0.2');
                }}
              />
              <div className="form-grid">
                <Pick
                  label="Malicious fraction"
                  value={config.malicious_fraction}
                  items={['0', '0.1', '0.2', '0.3']}
                  onChange={(v) => change('malicious_fraction', v)}
                />
                <label className="number-field">
                  Flip probability
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step=".05"
                    value={config.flip_probability}
                    onChange={(e) => change('flip_probability', e.target.value)}
                  />
                </label>
              </div>
              <Pick
                label="Target class"
                value={config.target}
                items={classes}
                onChange={(v) => change('target', v)}
              />
              <div className="field-label">Source classes</div>
              <div className="class-select">
                {classes.map((c) => (
                  <button
                    key={c}
                    aria-pressed={config.source_classes.includes(c)}
                    className={
                      config.source_classes.includes(c) ? 'active' : ''
                    }
                    onClick={() =>
                      change(
                        'source_classes',
                        config.source_classes.includes(c)
                          ? config.source_classes.filter((x) => x !== c)
                          : [...config.source_classes, c],
                      )
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="Evaluation & evidence" kicker="04">
              <div className="switch-row">
                <div>
                  <strong>Test-time augmentation</strong>
                  <small>Original + horizontal flip</small>
                </div>
                <Switch
                  checked={config.tta}
                  onCheckedChange={(v) => change('tta', v)}
                  aria-label="Test-time augmentation"
                />
              </div>
              <div className="switch-row">
                <div>
                  <strong>Best validation model</strong>
                  <small>Accuracy · minimum round 5</small>
                </div>
                <Switch
                  checked={config.best_validation}
                  onCheckedChange={(v) => change('best_validation', v)}
                  aria-label="Best validation checkpoint"
                />
              </div>
              <Note>
                Changing settings stages a configuration only. This research
                workspace has no training job backend connected. Stored results
                remain unchanged.
              </Note>
              <button className="primary-btn wide" onClick={exportConfig}>
                <Download size={16} />
                Export configuration
              </button>
              <button className="secondary-btn wide" onClick={onReplay}>
                <Play size={15} />
                Replay executed baseline
              </button>
              {message && <output className="small-muted">{message}</output>}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
export function Reproducibility({
  inspect,
}: {
  inspect: (c: number, t: string, d?: string) => void;
}) {
  const [tab, setTab] = useState('Execution record');
  const [filter, setFilter] = useState('all');
  const artifacts = data.artifactNames.filter(
    (n) => filter === 'all' || n.endsWith(filter),
  );
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Execution record',
          'Artifact library',
          'Source & traceability',
        ]}
        onChange={setTab}
      />
      {tab === 'Execution record' && (
        <>
          <div className="finding compact">
            <div>
              <span className="eyebrow">REPRODUCIBLE RESEARCH</span>
              <h2>
                Every result has
                <br />
                <em>a research record.</em>
              </h2>
              <p>
                One notebook. Eight completed experiments. The exact executed
                configuration, available evidence and artifact boundaries.
              </p>
            </div>
            <div className="finding-number">
              <span>ACTIVE EXPERIMENT PROFILE</span>
              <h3>target90_v4_multirun</h3>
              <p>5 clients · 30 rounds · 2 seeds</p>
              <small>Executed on NVIDIA A100-SXM4-80GB</small>
            </div>
          </div>
          <div className="split-wide">
            <Panel
              title="Active configuration"
              action={
                <ExportLink
                  href="/evidence/active-config.json"
                  label="Export JSON"
                />
              }
            >
              <dl className="config-list">
                {Object.entries(data.config).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v === null ? 'None' : String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Execution checklist">
              <div className="checklist">
                {[
                  'Dataset paths and seven class labels resolved',
                  'Lesion-disjoint split checked: zero overlaps',
                  '7,153 train / 1,431 validation / 1,431 test images',
                  'Five stratified-balanced client partitions',
                  'Eight run configurations completed',
                  '240 communication-round records recovered',
                  'Best validation checkpoint used for each test',
                  'Mean ± SD and paired statistics saved',
                ].map((t) => (
                  <div key={t}>
                    <Check size={17} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
              <Note>
                Exploring this evidence does not require retraining or a GPU.
                Existing hardware constraints remain part of the study scope.
              </Note>
            </Panel>
          </div>
        </>
      )}
      {tab === 'Artifact library' && (
        <>
          <Panel title="Available evidence exports">
            <div className="download-grid">
              {[
                [
                  'research.json',
                  'Complete recovered evidence',
                  'JSON · includes provenance',
                ],
                [
                  'recovered-results.csv',
                  'Recovered run results',
                  'CSV · saved display precision',
                ],
                [
                  'recovered-round-history.csv',
                  'Recovered round history',
                  'CSV · 240 measured round records',
                ],
                [
                  'active-config.json',
                  'Active configuration',
                  'JSON · executed settings',
                ],
                [
                  'confusion-matrix-source.png',
                  'Original confusion matrix',
                  'PNG · embedded notebook figure',
                ],
                [
                  'ham10000-research-gallery.png',
                  'Notebook research gallery',
                  'PNG · source-class examples',
                ],
              ].map(([name, title, desc]) => (
                <a href={'/evidence/' + name} download key={name}>
                  <FileCode2 size={23} />
                  <strong>{title}</strong>
                  <small>{desc}</small>
                  <Download size={16} />
                </a>
              ))}
            </div>
          </Panel>
          <Panel
            title="Original artifacts listed by the notebook"
            action={
              <Pick
                label="File type"
                value={filter}
                items={[
                  ['all', 'All artifacts'],
                  ['.pt', 'Model checkpoints'],
                  ['.npz', 'Prediction arrays'],
                  ['.csv', 'CSV reports'],
                  ['.png', 'Figures'],
                ]}
                onChange={setFilter}
              />
            }
          >
            <Note>
              These files were listed in the completed Colab output. Their bytes
              were not supplied with the notebook, so they are not offered as
              downloadable originals.
            </Note>
            <div className="artifact-list">
              {artifacts.map((n) => (
                <div key={n}>
                  <FileArchive size={17} />
                  <span>{n}</span>
                  <Badge state="LISTED ONLY" />
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
      {tab === 'Source & traceability' && (
        <>
          <Panel
            title="An auditable path from claim to code"
            kicker="NOTEBOOK EVIDENCE"
          >
            <div className="trace-flow">
              {[
                'Metric',
                'Condition',
                'Seed / mean',
                'Configuration',
                'Notebook cell',
                'Recovered artifact',
              ].map((s, i) => (
                <div key={s}>
                  <span>{i + 1}</span>
                  <strong>{s}</strong>
                  {i < 5 && <ArrowUpRight size={16} />}
                </div>
              ))}
            </div>
            <p>
              Every metric uses an executed notebook output or an explicitly
              labeled calculation. Client contributions are approximated from
              logged trust and reputation values. The source matrix is
              transcribed and cross-checked against the saved report.
            </p>
            <dl className="detail-list">
              <div>
                <dt>Notebook</dt>
                <dd>{data.source.notebook}</dd>
              </div>
              <div>
                <dt>SHA-256</dt>
                <dd className="hash">{data.source.sha256}</dd>
              </div>
              <div>
                <dt>Cell numbering</dt>
                <dd>Zero-based notebook index</dd>
              </div>
            </dl>
            <div className="source-links">
              {Object.entries(data.source.cells).map(([name, index]) => (
                <button key={name} onClick={() => inspect(index, name)}>
                  <FileCode2 size={16} />
                  <span>{name}</span>
                  <small>Cell {index}</small>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Research states">
            <div className="capabilities">
              {[
                ['EXECUTED', 'Measured in the supplied notebook.'],
                [
                  'SUPPORTED',
                  'Available in the code, but not necessarily run.',
                ],
                ['PLANNED', 'Requires implementation or additional artifacts.'],
                [
                  'DEMONSTRATION',
                  'Explanatory motion or browser preview, not a measured experiment.',
                ],
              ].map(([s, t]) => (
                <div key={s}>
                  <Badge state={s} />
                  <p>{t}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}

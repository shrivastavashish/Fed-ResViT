'use client';
import { useState } from 'react';
import { ArrowRight, Download, FileCode2, Check, Layers } from 'lucide-react';
import { Panel, Pick, Badge, Note } from './common';
import {
  studyPlan,
  methodNames,
  protocol,
  seeds,
  methods,
} from '@/lib/protocol';
import { download } from '@/lib/project';
export function StudyCoverage() {
  const [stage, setStage] = useState('main'),
    [partition, setPartition] = useState('dirichlet'),
    [selection, setSelection] = useState<string | null>(null),
    [notice, setNotice] = useState('');
  const jobs = studyPlan(stage).filter((j) => j.partition === partition);
  const rows = stage === 'sensitivity' ? ['trust'] : [...methods];
  const fractions = [0, 0.1, 0.2, 0.3];
  const selected = jobs.filter(
    (j) => `${j.aggregation}:${j.malicious_fraction}` === selection,
  );
  const chosen = selected[0];
  function change(set: (v: string) => void, v: string) {
    set(v);
    setSelection(null);
    setNotice('');
  }
  return (
    <Panel
      title="Experiment coverage"
      action={<Badge state="CONFIGURED · NOT RESULTS" />}
    >
      <div className="atlas-intro">
        <p>
          Inspect which aggregation methods and attack fractions the notebook
          will compare. Every cell counts configured jobs, never completed runs.
        </p>
        <div className="atlas-count">
          <strong>{jobs.length}</strong>
          <span>jobs in this view</span>
        </div>
      </div>
      <div className="filter-row">
        <Pick
          label="Study stage"
          value={stage}
          items={[
            ['main', 'Main comparison'],
            ['adaptive', 'Adaptive attacker'],
            ['sensitivity', 'Trust sensitivity'],
          ]}
          onChange={(v) => change(setStage, v)}
        />
        <Pick
          label="Client partition"
          value={partition}
          items={[
            ['dirichlet', 'Dirichlet · α 0.5'],
            ['stratified_balanced', 'Stratified-balanced'],
          ]}
          onChange={(v) => change(setPartition, v)}
        />
        <span className="atlas-legend">
          <i />
          Configured <span>— Outside stage plan</span>
        </span>
      </div>
      <div className="atlas-matrix-scroll">
        <table className="atlas-matrix">
          <caption>
            Configured jobs by method and malicious-client fraction
          </caption>
          <thead>
            <tr>
              <th scope="col">Aggregation method</th>
              {fractions.map((f) => (
                <th scope="col" key={f}>
                  {f * 100}%<small>{Math.round(f * 10)} of 10 clients</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((method) => (
              <tr key={method}>
                <th scope="row">{methodNames[method]}</th>
                {fractions.map((f) => {
                  const count = jobs.filter(
                    (j) =>
                      j.aggregation === method && j.malicious_fraction === f,
                  ).length;
                  const key = `${method}:${f}`;
                  return (
                    <td key={f}>
                      {count ? (
                        <button
                          aria-pressed={selection === key}
                          aria-label={`Inspect ${methodNames[method]}, ${f * 100}% malicious, ${count} configured jobs`}
                          onClick={() => {
                            setSelection(key);
                            setNotice('');
                          }}
                        >
                          <strong>{count}</strong>
                          <span>configured</span>
                          {selection === key && <Check size={14} />}
                        </button>
                      ) : (
                        <span
                          className="atlas-absent"
                          aria-label="Outside this stage plan"
                        >
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!jobs.length && (
        <Note>
          This stage has no jobs for stratified-balanced partitioning. Select
          Dirichlet to inspect its configured comparisons.
        </Note>
      )}
      <section
        className="atlas-selection"
        aria-label="Selected experiment cell"
      >
        <div className="atlas-selection-title">
          <Layers size={20} />
          <h3>
            {chosen
              ? `${methodNames[chosen.aggregation]} · ${chosen.malicious_fraction * 100}% malicious`
              : 'Select a configured cell'}
          </h3>
          {chosen && (
            <button
              className="text-btn"
              onClick={() => {
                setSelection(null);
                setNotice('');
              }}
            >
              Clear selection
            </button>
          )}
        </div>
        {chosen ? (
          <>
            <p>
              {selected.length} jobs ·{' '}
              {chosen.partition === 'dirichlet'
                ? 'Dirichlet α 0.5'
                : 'Stratified-balanced'}{' '}
              ·{' '}
              {chosen.attack === 'none'
                ? 'No attack'
                : chosen.attack === 'targeted_label_flipping'
                  ? 'Targeted label flipping'
                  : 'Adaptive omniscient update blending'}
            </p>
            <div className="atlas-seeds">
              {seeds.map((seed) => (
                <div key={seed}>
                  <span>Seed {seed}</span>
                  <strong>
                    {selected.filter((j) => j.seed === seed).length}{' '}
                    {stage === 'sensitivity' ? 'settings' : 'job'}
                  </strong>
                  <small>Artifacts pending</small>
                </div>
              ))}
            </div>
            <button
              className="secondary-btn"
              onClick={() => {
                download('fed-resvit-selected-plan.json', {
                  kind: 'configuration_only',
                  protocol_id: protocol.protocol_id,
                  source_sha256: protocol.source_sha256,
                  results_ingested: false,
                  jobs: selected,
                });
                setNotice(
                  `${selected.length} configured jobs exported. No training was launched.`,
                );
              }}
            >
              <Download size={15} />
              Export selected jobs
            </button>
            <output className="atlas-export-status">{notice}</output>
          </>
        ) : (
          <p>
            Click a number to inspect its exact seed coverage and export the
            matching configuration.
          </p>
        )}
      </section>
      <Note>
        Main: 200 jobs. Adaptive: 25 jobs. Sensitivity: 45 jobs, including five
        matching defaults reusable from main. The default study therefore has
        265 distinct runs; optional Multi-Krum is available in Study plan. This
        map shows the five default methods.
      </Note>
    </Panel>
  );
}
const questions = [
  {
    title: 'Does Trust withstand poisoning?',
    hypothesis:
      'Compare attack impact against FedAvg and established robust baselines under matched conditions.',
    design:
      'Five methods × four malicious fractions × two partitions × five seeds.',
    signals: [
      'ASR',
      'Binary malignant recall',
      'Accuracy & Macro-F1',
      'Macro precision & recall',
    ],
    files: [
      'completed.json',
      '*_predictions.npz',
      '*_classification_report.csv',
      'confusion_matrix.csv',
    ],
    caution:
      'Report both improvements and regressions. ASR includes baseline errors; 1 − ASR is target avoidance, not clinical safety.',
    page: 'studio',
  },
  {
    title: 'Are honest outliers penalized?',
    hypothesis:
      'Inspect how heterogeneous client data interacts with distance-based trust.',
    design:
      'Compare balanced versus Dirichlet α 0.5 allocations; inspect client-level decisions across rounds.',
    signals: [
      'TP / FP / TN / FN',
      'Detection & FPR',
      'Client class counts',
      'Trust & reputation',
    ],
    files: ['client manifest', 'round_history.csv', 'completed.json'],
    caution:
      'A large distance does not establish malicious intent. Keep client ground truth separate from detector flags.',
    page: 'security',
  },
  {
    title: 'Can a concealed attack evade Trust?',
    hypothesis:
      'Evaluate whether adaptive update blending preserves attack impact while passing the soft-trust score.',
    design:
      'Five methods × five seeds at 20% malicious clients under Dirichlet partitioning.',
    signals: [
      'Adaptive ASR',
      'Malignant recall',
      'Accepted blend coefficient',
      'Trust score',
    ],
    files: ['manifest.json', 'round_history.csv', 'completed.json'],
    caution:
      'This attacker assumes access to honest updates. One strategy cannot establish universal robustness.',
    page: 'security',
  },
  {
    title: 'How stable is the defense?',
    hypothesis:
      'Compare one-factor changes in thresholds, reputation, flag cutoff and history window.',
    design:
      'Nine Trust settings × five seeds, at 20% malicious clients under Dirichlet partitioning.',
    signals: [
      'ASR & Macro-F1',
      'Detection & FPR',
      'Paired differences',
      'Sample count',
    ],
    files: ['manifest.json', 'results CSV', 'paired statistics CSV'],
    caution:
      'Sensitivity does not exhaust all parameter interactions. Five seeds share a fixed dataset split.',
    page: 'research',
  },
];
export function EvidenceAtlas({ navigate }: { navigate: (p: string) => void }) {
  const [selected, setSelected] = useState(0);
  const q = questions[selected];
  return (
    <Panel
      title="From research question to evidence"
      action={
        <a
          className="text-btn"
          href="/evidence/revision/protocol.json"
          download
        >
          Notebook provenance
          <FileCode2 size={15} />
        </a>
      }
    >
      <p>
        Follow the scientific reasoning behind each comparison. Select a
        question to see its experimental design, required measurements and
        interpretation limits.
      </p>
      <div className="evidence-atlas">
        <nav aria-label="Research questions">
          {questions.map((q, i) => (
            <button
              key={q.title}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>{q.title}</span>
              <ArrowRight size={16} />
            </button>
          ))}
        </nav>
        <div className="atlas-reasoning">
          <h3>{q.title}</h3>
          <p>{q.hypothesis}</p>
          <div className="atlas-chain">
            <section>
              <span>Experiment design</span>
              <p>{q.design}</p>
            </section>
            <ArrowRight />
            <section>
              <span>Measurements</span>
              <ul>
                {q.signals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <ArrowRight />
            <section>
              <span>Required evidence</span>
              <ul>
                {q.files.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>
          <Note>{q.caution}</Note>
          <div className="atlas-evidence-action">
            <Badge state="AWAITING ARTIFACTS" />
            <button className="secondary-btn" onClick={() => navigate(q.page)}>
              Explore this workspace
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Measured plots use accessible SVG rather than raster images. */
'use client';
import { useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  data,
  classes,
  metrics,
  pct,
  numeric,
  limitations,
  download,
} from '@/lib/research';
import { Panel, Pick, Note, Badge, TabBar, EvidenceButton } from './common';
import { Convergence } from './charts';
type Props = {
  inspect: (c: number, t: string, d?: string) => void;
  condition: number;
  setCondition: (n: number) => void;
  initialTab?: string;
};
export default function Observatory({
  inspect,
  condition,
  setCondition,
  initialTab,
}: Props) {
  const [tab, setTab] = useState(initialTab ?? 'Performance');
  const [seed, setSeed] = useState('mean');
  const [agg, setAgg] = useState('all');
  const [sort, setSort] = useState('test_accuracy');
  const [ascending, setAscending] = useState(false);
  const [metric, setMetric] = useState('val_macro_f1');
  const available = condition === 0 || condition === 0.2;
  const selectedRows = (
    seed === 'mean'
      ? data.summary
      : data.results.filter((r) => r.seed === Number(seed))
  ).filter(
    (r) =>
      r.malicious_fraction === condition &&
      (agg === 'all' || r.aggregation === agg),
  );
  const rows = [...selectedRows].sort(
    (a, b) =>
      ((numeric(a[sort]) ?? -1) - (numeric(b[sort]) ?? -1)) *
      (ascending ? 1 : -1),
  );
  function exportRows() {
    const keys = [
      'aggregation',
      'malicious_fraction',
      ...(seed === 'mean' ? [] : ['seed']),
      ...metrics.map((m) => m[0]),
    ];
    download(
      'fed-resvit-filtered-results.csv',
      [
        keys.join(','),
        ...rows.map((r) =>
          keys
            .map((k) =>
              typeof r[k] === 'number' || typeof r[k] === 'string'
                ? String(r[k])
                : '',
            )
            .join(','),
        ),
      ].join('\n'),
      'text/csv',
    );
  }
  return (
    <>
      <TabBar
        value={tab}
        items={[
          'Performance',
          'Model comparison',
          'Robustness',
          'Confusion matrix',
          'Per-class analysis',
          'Statistics',
          'Limitations',
        ]}
        onChange={setTab}
      />
      {![
        'Statistics',
        'Limitations',
        'Confusion matrix',
        'Per-class analysis',
      ].includes(tab) && (
        <div className="filter-row">
          <Pick
            label="Malicious-client condition"
            value={String(condition)}
            items={[
              ['0', 'Clean · 0%'],
              ['0.1', '10% · not executed'],
              ['0.2', 'Attack · 20%'],
              ['0.3', '30% · not executed'],
            ]}
            onChange={(v) => setCondition(Number(v))}
          />
          <Pick
            label="Seed"
            value={seed}
            items={[
              ['mean', 'Mean ± SD · n=2'],
              ['42', 'Seed 42'],
              ['43', 'Seed 43'],
            ]}
            onChange={setSeed}
          />
          <Pick
            label="Aggregation"
            value={agg}
            items={[
              ['all', 'FedAvg + Trust'],
              ['fedavg', 'FedAvg'],
              ['trust', 'Trust-aware'],
            ]}
            onChange={setAgg}
          />
          <button
            className="secondary-btn"
            onClick={exportRows}
            disabled={!rows.length}
          >
            <Download size={15} />
            Export selected results
          </button>
        </div>
      )}
      {!available &&
      ![
        'Statistics',
        'Limitations',
        'Confusion matrix',
        'Per-class analysis',
      ].includes(tab) ? (
        <Panel
          title="This condition has not been executed"
          action={<Badge state="SUPPORTED" />}
        >
          <p>
            The notebook supports other malicious fractions, but measured
            results exist only for 0% and 20%. No interpolation or estimated
            curve is presented.
          </p>
          <button className="primary-btn" onClick={() => setCondition(0.2)}>
            Return to executed 20% condition
          </button>
        </Panel>
      ) : (
        <>
          {tab === 'Performance' && (
            <>
              <div className="metric-grid">
                {metrics.slice(0, 4).map(([k, l]) => {
                  const r =
                    rows.find((r) => r.aggregation === 'trust') ?? rows[0];
                  return (
                    <button
                      className="metric"
                      key={k}
                      onClick={() =>
                        inspect(
                          seed === 'mean' ? 48 : 46,
                          l,
                          JSON.stringify(r, null, 2),
                        )
                      }
                    >
                      <span>
                        {l}
                        <ArrowUpRight size={14} />
                      </span>
                      <strong>{pct(r?.[k])}</strong>
                      <small>
                        {r?.aggregation === 'trust' ? 'Trust-aware' : 'FedAvg'}{' '}
                        · {seed === 'mean' ? 'mean of 2 seeds' : `seed ${seed}`}
                      </small>
                    </button>
                  );
                })}
              </div>
              <Panel
                title="Classification performance"
                action={
                  <Pick
                    label="Convergence metric"
                    value={metric}
                    items={[
                      ['val_macro_f1', 'Macro-F1'],
                      ['val_accuracy', 'Accuracy'],
                      ['val_asr', 'ASR'],
                    ]}
                    onChange={setMetric}
                  />
                }
              >
                <Convergence
                  condition={condition}
                  seed={seed}
                  metric={metric as 'val_macro_f1' | 'val_accuracy' | 'val_asr'}
                />
              </Panel>
              <Panel title="Measured test results" action={<Badge />}>
                <p className="small-muted">
                  Click a metric heading to sort. Click a value for its evidence
                  trail.{' '}
                  {seed === 'mean'
                    ? 'Values are mean ± sample standard deviation.'
                    : 'Some seed-level Macro-F1 values were truncated in the saved notebook table and remain unavailable.'}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aggregation</TableHead>
                      {metrics.slice(0, 5).map(([k, l]) => (
                        <TableHead key={k}>
                          <button
                            className="sort-btn"
                            onClick={() => {
                              setSort(k);
                              setAscending(sort === k ? !ascending : false);
                            }}
                          >
                            {l}
                            {sort === k ? (ascending ? ' ↑' : ' ↓') : ''}
                          </button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.aggregation}>
                        <TableCell>
                          <b>
                            {r.aggregation === 'trust'
                              ? 'Trust-aware'
                              : 'FedAvg'}
                          </b>
                        </TableCell>
                        {metrics.slice(0, 5).map(([k]) => (
                          <TableCell key={k}>
                            <button
                              className="table-value"
                              onClick={() =>
                                inspect(
                                  seed === 'mean' ? 48 : 46,
                                  k,
                                  JSON.stringify(r, null, 2),
                                )
                              }
                            >
                              {pct(r[k])}
                              {seed === 'mean' &&
                                'std' in r &&
                                typeof r.std === 'object' &&
                                r.std !== null && (
                                  <small>
                                    ±{' '}
                                    {pct((r.std as Record<string, number>)[k])}
                                  </small>
                                )}
                            </button>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Note>
                  Overall accuracy is dominated by the common NV class. Review
                  macro-F1 and minority-class recall alongside it.
                </Note>
              </Panel>
            </>
          )}
          {tab === 'Model comparison' && (
            <>
              <Panel
                title="Security improvement, measured alongside classification"
                kicker={`${condition * 100}% MALICIOUS CLIENTS`}
                action={<Badge />}
              >
                <Comparison
                  condition={condition}
                  seed={seed}
                  inspect={inspect}
                />
                <Note>
                  Detection and FPR are final-round client-window statistics,
                  not test-set metrics. Classification and ASR use each run’s
                  best validation checkpoint.
                </Note>
              </Panel>
              {condition === 0.2 && (
                <div className="finding compact">
                  <div>
                    <span className="eyebrow">TWO-SEED RESEARCH FINDING</span>
                    <h2>
                      13.03 percentage points
                      <br />
                      <em>less targeted attack success.</em>
                    </h2>
                    <p>
                      Trust ASR is lower than FedAvg in both stored seeds. This
                      result applies to the executed controlled partition and
                      targeted label-flip attack.
                    </p>
                  </div>
                  <div className="finding-number">
                    <span>MEAN ATTACK SUCCESS RATE</span>
                    <strong>
                      23.93<small>%</small>
                    </strong>
                    <p>FedAvg baseline: 36.96%</p>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === 'Robustness' && (
            <>
              <div className="chart-grid">
                {[
                  ['test_asr', 'Targeted attack success'],
                  ['test_accuracy', 'Accuracy under attack'],
                  ['test_detection_rate', 'Malicious-client detection'],
                  ['test_false_positive_rate', 'Honest-client false positives'],
                ].map(([k, l]) => (
                  <Panel
                    key={k}
                    title={l}
                    action={
                      <EvidenceButton
                        onClick={() => inspect(seed === 'mean' ? 48 : 46, l)}
                      />
                    }
                  >
                    <EndpointChart metric={k} seed={seed} agg={agg} />
                  </Panel>
                ))}
              </div>
              <Note>
                Only measured 0% and 20% endpoints are shown. ASR is undefined
                in the notebook’s clean condition. FedAvg has no client
                detector. 10% and 30% have not been executed.
              </Note>
              <Note tone="warning">
                At the final attack window, Trust flags the one malicious client
                and one of four honest clients: 100% detection with 25% FPR.
                These are small-denominator results.
              </Note>
            </>
          )}
          {tab === 'Confusion matrix' && <Confusion inspect={inspect} />}
          {tab === 'Per-class analysis' && <PerClass inspect={inspect} />}
          {tab === 'Statistics' && (
            <>
              <Panel
                title="Preliminary statistical comparison"
                kicker="N = 2 PAIRED SEEDS"
                action={<Badge />}
              >
                <Note tone="warning">
                  Two paired seeds provide very limited evidence about sampling
                  variability. The t-test and Wilcoxon test give different
                  conclusions; no definitive significance claim is made.
                </Note>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Condition</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>
                        Mean difference
                        <br />
                        (Trust − FedAvg)
                      </TableHead>
                      <TableHead>Paired t-test p</TableHead>
                      <TableHead>Wilcoxon p</TableHead>
                      <TableHead>Pairs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.statistics.map((s) => (
                      <TableRow key={s.condition + s.metric}>
                        <TableCell>
                          {s.condition === 0 ? 'Clean' : '20% malicious'}
                        </TableCell>
                        <TableCell>
                          {s.metric === 'asr' ? 'ASR' : 'Macro-F1'}
                        </TableCell>
                        <TableCell>{s.difference.toFixed(6)}</TableCell>
                        <TableCell>{s.t.toFixed(6)}</TableCell>
                        <TableCell>{s.wilcoxon}</TableCell>
                        <TableCell>2</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <EvidenceButton
                  onClick={() =>
                    inspect(
                      56,
                      'Paired statistical comparisons',
                      JSON.stringify(data.statistics, null, 2),
                    )
                  }
                />
              </Panel>
              <Panel title="Seed-level evidence">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seed</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>FedAvg accuracy</TableHead>
                      <TableHead>Trust accuracy</TableHead>
                      <TableHead>Paired accuracy Δ</TableHead>
                      <TableHead>Paired ASR Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[42, 43].flatMap((s) =>
                      [0, 0.2].map((c) => {
                        const f = data.results.find(
                          (r) =>
                            r.seed === s &&
                            r.malicious_fraction === c &&
                            r.aggregation === 'fedavg',
                        )!;
                        const t = data.results.find(
                          (r) =>
                            r.seed === s &&
                            r.malicious_fraction === c &&
                            r.aggregation === 'trust',
                        )!;
                        return (
                          <TableRow key={s + '-' + c}>
                            <TableCell>{s}</TableCell>
                            <TableCell>{c * 100}%</TableCell>
                            <TableCell>{pct(f.test_accuracy)}</TableCell>
                            <TableCell>{pct(t.test_accuracy)}</TableCell>
                            <TableCell>
                              {(
                                (Number(t.test_accuracy) -
                                  Number(f.test_accuracy)) *
                                100
                              ).toFixed(3)}{' '}
                              pp
                            </TableCell>
                            <TableCell>
                              {c
                                ? (
                                    (Number(t.test_asr) - Number(f.test_asr)) *
                                    100
                                  ).toFixed(3) + ' pp'
                                : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      }),
                    )}
                  </TableBody>
                </Table>
                <p className="source-caption">
                  Paired accuracy and ASR differences calculated from displayed
                  seed results. Most seed-level test Macro-F1 values were not
                  recoverable; their stored aggregate statistical comparison is
                  shown above.
                </p>
              </Panel>
            </>
          )}
          {tab === 'Limitations' && (
            <Panel
              title="The boundaries of the evidence"
              kicker="TRANSPARENT BY DESIGN"
            >
              <div className="limitations-list">
                {limitations.map((l, i) => (
                  <div key={l}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <p>{l}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </>
  );
}
export function Comparison({
  condition,
  seed = 'mean',
  inspect,
}: {
  condition: number;
  seed?: string;
  inspect: (c: number, t: string, d?: string) => void;
}) {
  const source =
    seed === 'mean'
      ? data.summary
      : data.results.filter((r) => r.seed === Number(seed));
  const f = source.find(
    (r) => r.aggregation === 'fedavg' && r.malicious_fraction === condition,
  );
  const t = source.find(
    (r) => r.aggregation === 'trust' && r.malicious_fraction === condition,
  );
  return (
    <>
      <div
        className="comparison-terraces"
        aria-label="Labeled comparison charts on a shared zero to 100 percent scale"
      >
        {metrics
          .filter(([k]) =>
            [
              'test_accuracy',
              'test_macro_f1',
              'test_asr',
              'test_malignant_safety',
            ].includes(k),
          )
          .map(([k, l]) => (
            <div className="comparison-terrace" key={k}>
              <h3>{l}</h3>
              {(
                [
                  [f, 'FedAvg'],
                  [t, 'Trust-aware'],
                ] as const
              ).map(([row, name]) => {
                const r = row as typeof f;
                const v = numeric(r?.[k]);
                return (
                  <button
                    key={String(name)}
                    className="terrace-row"
                    onClick={() =>
                      inspect(
                        seed === 'mean' ? 48 : 46,
                        l,
                        JSON.stringify(
                          { condition, seed, aggregation: name, value: v },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    <span>{String(name)}</span>
                    <div className="terrace-track">
                      {v !== null && (
                        <i
                          className={name === 'Trust-aware' ? 'trust' : ''}
                          style={{ width: `${v * 100}%` }}
                        />
                      )}
                    </div>
                    <strong>{v === null ? 'Unavailable' : pct(v)}</strong>
                  </button>
                );
              })}
              <div className="terrace-axis">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Research metric</TableHead>
            <TableHead>FedAvg</TableHead>
            <TableHead className="trust-column">Trust-aware</TableHead>
            <TableHead>Δ percentage points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map(([k, l]) => {
            const a = numeric(f?.[k]),
              b = numeric(t?.[k]);
            const delta = a !== null && b !== null ? (b - a) * 100 : null;
            const improved =
              delta !== null &&
              (k === 'test_asr' || k === 'test_false_positive_rate'
                ? delta < 0
                : delta > 0);
            return (
              <TableRow key={k}>
                <TableCell>
                  <button
                    className="table-value"
                    onClick={() =>
                      inspect(
                        seed === 'mean' ? 48 : 46,
                        l,
                        JSON.stringify(
                          { condition, seed, fedavg: f?.[k], trust: t?.[k] },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    {l}
                    <ArrowUpRight size={12} />
                  </button>
                </TableCell>
                <TableCell>
                  {pct(a)}
                  {seed === 'mean' && f && 'std' in f && a !== null && (
                    <small>± {pct((f.std as Record<string, number>)[k])}</small>
                  )}
                </TableCell>
                <TableCell className="trust-column">
                  {pct(b)}
                  {seed === 'mean' && t && 'std' in t && b !== null && (
                    <small>± {pct((t.std as Record<string, number>)[k])}</small>
                  )}
                </TableCell>
                <TableCell
                  className={
                    delta === null
                      ? ''
                      : improved
                        ? 'improvement'
                        : 'degradation'
                  }
                >
                  {delta === null
                    ? 'Not comparable'
                    : `${delta > 0 ? '+' : ''}${delta.toFixed(2)} pp`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
function EndpointChart({
  metric,
  seed,
  agg,
}: {
  metric: string;
  seed: string;
  agg: string;
}) {
  const source =
    seed === 'mean'
      ? data.summary
      : data.results.filter((r) => r.seed === Number(seed));
  return (
    <div className="endpoint-chart">
      <div className="chart-legend">
        <span>
          <i style={{ background: '#6B5CF6' }} />
          FedAvg
        </span>
        <span>
          <i style={{ background: '#19B8C7' }} />
          Trust-aware
        </span>
      </div>
      <svg
        viewBox="0 0 420 235"
        role="img"
        aria-label={`${metric}, measured malicious-client fraction endpoints`}
      >
        <text x="12" y="16" className="chart-label">
          Percentage (%)
        </text>
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1="50"
              x2="375"
              y1={185 - v * 145}
              y2={185 - v * 145}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <text
              x="37"
              y={189 - v * 145}
              textAnchor="end"
              className="chart-label"
            >
              {v * 100}
            </text>
          </g>
        ))}
        {[0, 0.1, 0.2, 0.3].map((c, i) => (
          <text
            key={c}
            x={65 + i * 96}
            y="205"
            textAnchor="middle"
            className="chart-label"
          >
            {c * 100}%
          </text>
        ))}
        {source
          .filter((r) => agg === 'all' || r.aggregation === agg)
          .map((r) => {
            const v = numeric(r[metric]);
            if (v === null) return null;
            const x =
              65 +
              (r.malicious_fraction / 0.1) * 96 +
              (r.aggregation === 'trust' ? 5 : -5);
            return (
              <g key={r.malicious_fraction + r.aggregation}>
                <text
                  x={x + (r.aggregation === 'trust' ? 10 : -10)}
                  y={185 - v * 145 + (r.aggregation === 'trust' ? -12 : 19)}
                  textAnchor={r.aggregation === 'trust' ? 'start' : 'end'}
                  className="plot-value"
                >
                  {pct(v)}
                </text>
                <circle
                  cx={x}
                  cy={185 - v * 145}
                  r="6"
                  fill={r.aggregation === 'trust' ? '#19B8C7' : '#6B5CF6'}
                >
                  <title>{`${r.aggregation} · ${r.malicious_fraction * 100}% malicious · ${pct(v)}`}</title>
                </circle>
              </g>
            );
          })}
        <text x="211" y="230" textAnchor="middle" className="chart-label">
          Malicious-client fraction (%)
        </text>
      </svg>
      <div className="endpoint-values">
        {source
          .filter((r) => agg === 'all' || r.aggregation === agg)
          .map((r) => (
            <span key={r.aggregation + r.malicious_fraction}>
              {r.aggregation} · {r.malicious_fraction * 100}%:{' '}
              <b>{pct(r[metric])}</b>
            </span>
          ))}
      </div>
      <p className="source-caption">
        Source: cells 46/48 ·{' '}
        {seed === 'mean' ? 'mean across 2 seeds' : `seed ${seed}`} · no
        interpolated values
      </p>
    </div>
  );
}
function Confusion({ inspect }: { inspect: Props['inspect'] }) {
  const [run, setRun] = useState(data.confusion.run);
  const [cell, setCell] = useState([1, 0]);
  const [normalized, setNormalized] = useState('Count');
  const cm = data.confusion.matrix;
  const count = cm[cell[0]][cell[1]];
  const support = cm[cell[0]].reduce((a, b) => a + b, 0);
  const targetError = [1, 3, 4].includes(cell[0]) && cell[1] === 0;
  return (
    <>
      <div className="filter-row">
        <Pick
          label="Run"
          value={run}
          items={data.results.map((r) => [
            r.id,
            `${r.aggregation} · ${r.malicious_fraction * 100}% · seed ${r.seed}${r.id === data.confusion.run ? '' : ' · matrix not supplied'}`,
          ])}
          onChange={setRun}
        />
        <Pick
          label="Cell values"
          value={normalized}
          items={['Count', 'Row percentage']}
          onChange={setNormalized}
        />
      </div>
      {run !== data.confusion.run ? (
        <Panel title="Matrix artifact not supplied">
          <p>
            This run was executed, but its prediction file or matrix is not
            embedded in the supplied notebook. No matrix has been reconstructed
            from aggregate metrics.
          </p>
          <button
            className="primary-btn"
            onClick={() => setRun(data.confusion.run)}
          >
            Open available Trust / seed 43 matrix
          </button>
        </Panel>
      ) : (
        <div className="split-wide">
          <Panel
            title="Where does the model confuse classes?"
            kicker="TRUST · 20% MALICIOUS · SEED 43"
            action={<Badge />}
          >
            <div className="matrix-axis">Predicted class →</div>
            <div className="confusion-grid">
              <div className="matrix-corner">True ↓</div>
              {classes.map((c) => (
                <b key={c}>{c}</b>
              ))}
              {cm.map((row, i) => (
                <div className="contents" key={i}>
                  <b>{classes[i]}</b>
                  {row.map((n, j) => {
                    const ratio = n / row.reduce((a, b) => a + b, 0);
                    return (
                      <button
                        key={j}
                        className={
                          (cell[0] === i && cell[1] === j ? 'selected ' : '') +
                          ([1, 3, 4].includes(i) && j === 0
                            ? 'target-error'
                            : '')
                        }
                        style={{
                          background:
                            i === j
                              ? `rgba(13,146,135,${0.18 + ratio * 0.65})`
                              : `rgba(91,124,157,${0.07 + ratio * 0.7})`,
                          color: i === j && ratio > 0.65 ? 'white' : '#20264A',
                        }}
                        onClick={() => setCell([i, j])}
                        aria-label={`${classes[i]} predicted as ${classes[j]}: ${n}, ${(ratio * 100).toFixed(2)} percent`}
                      >
                        {normalized === 'Count'
                          ? n
                          : (ratio * 100).toFixed(1) + '%'}
                        <small className="matrix-secondary">
                          {normalized === 'Count'
                            ? (ratio * 100).toFixed(1) + '%'
                            : `${n} images`}
                        </small>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="source-caption">
              1,431 test images · Values transcribed from cell 52’s saved figure
              and checked against its classification report. Outlined cells mark
              source → NV errors.
            </p>
            <EvidenceButton
              onClick={() =>
                inspect(
                  52,
                  'Confusion matrix',
                  JSON.stringify(data.confusion, null, 2),
                )
              }
            />
          </Panel>
          <Panel
            title={`${classes[cell[0]]} → ${classes[cell[1]]}`}
            kicker="SELECTED MATRIX CELL"
          >
            <div className="trust-big">
              {count}
              <span>test images</span>
            </div>
            <dl className="detail-list">
              <div>
                <dt>True class</dt>
                <dd>{classes[cell[0]]}</dd>
              </div>
              <div>
                <dt>Predicted class</dt>
                <dd>{classes[cell[1]]}</dd>
              </div>
              <div>
                <dt>Class support</dt>
                <dd>{support}</dd>
              </div>
              <div>
                <dt>Row percentage</dt>
                <dd>{((count / support) * 100).toFixed(2)}%</dd>
              </div>
            </dl>
            <Note tone={targetError ? 'warning' : ''}>
              {cell[0] === cell[1]
                ? 'Correct class predictions in this test run.'
                : targetError
                  ? 'This error matches the attack’s source-to-NV objective. It contributes to ASR, but does not establish that poisoning caused this individual error.'
                  : 'Class confusion in the test set. It does not match the defined source-to-NV attack-success event.'}
            </Note>
            <div className="asr-proof">
              <b>Trace the reported ASR</b>
              <p>49 MEL + 7 BCC + 4 AKIEC → NV</p>
              <strong>60 / 280 = 21.43%</strong>
              <small>Seed 43 value · Two-seed mean is 23.93%</small>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
function PerClass({ inspect }: { inspect: Props['inspect'] }) {
  return (
    <>
      <Panel
        title="Every class deserves scrutiny"
        kicker="TRUST · 20% MALICIOUS · SEED 43"
        action={
          <EvidenceButton
            onClick={() => inspect(52, 'Per-class classification report')}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lesion class</TableHead>
              <TableHead>Precision</TableHead>
              <TableHead>Recall</TableHead>
              <TableHead>F1-score</TableHead>
              <TableHead>Support</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.confusion.perclass.map((c, i) => (
              <TableRow key={c.name}>
                <TableCell>
                  <span className="class-code">{classes[i]}</span>
                  {c.name}
                </TableCell>
                <TableCell>{pct(c.precision)}</TableCell>
                <TableCell>
                  <div className="inline-bar">
                    <span style={{ width: c.recall * 100 + '%' }} />
                  </div>
                  {pct(c.recall)}
                </TableCell>
                <TableCell>{pct(c['f1-score'])}</TableCell>
                <TableCell>{c.support}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <div className="chart-grid">
        <Panel title="Imbalance shapes the headline">
          <p>
            NV accounts for 958 of 1,431 test images (66.95%). Its recall is
            94.78%. Overall accuracy therefore needs to be read alongside macro
            metrics and the smaller classes.
          </p>
          <div className="imbalance-bar">
            <i style={{ width: '66.95%' }} />
            <span>NV · 66.95%</span>
          </div>
        </Panel>
        <Panel title="Minority-class performance remains uneven">
          <p>
            AKIEC recall is 29.79% (14 / 47), DF recall is 50% (8 / 16), VASC
            recall is 80% (16 / 20), and BCC recall is 70.27% (52 / 74).
          </p>
          <Note tone="warning">
            Small class supports mean that a few predictions can substantially
            change the reported percentages.
          </Note>
        </Panel>
      </div>
    </>
  );
}

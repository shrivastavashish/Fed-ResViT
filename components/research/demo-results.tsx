'use client';
import { useState } from 'react';
import { Panel, Badge, Pick, Note } from './common';
const classes = ['NV', 'MEL', 'BKL', 'BCC', 'AKIEC', 'VASC', 'DF'];
const support = [80, 22, 30, 16, 10, 8, 6];
export function DemoResults({ tab }: { tab: string }) {
  const [method, setMethod] = useState('trust'),
    [cell, setCell] = useState<[number, number]>([1, 0]);
  const rates =
    method === 'trust'
      ? [0.9, 0.59, 0.7, 0.69, 0.5, 0.75, 0.67]
      : [0.88, 0.5, 0.67, 0.63, 0.4, 0.63, 0.5];
  const matrix = support.map((n, i) =>
    classes.map((_, j) =>
      j === i
        ? Math.round(n * rates[i])
        : j === (i === 0 ? 2 : 0)
          ? n - Math.round(n * rates[i])
          : 0,
    ),
  );
  const total = support.reduce((a, b) => a + b, 0);
  const correct = matrix.reduce((a, row, i) => a + row[i], 0);
  const counts = matrix.map((_, j) => matrix.reduce((n, row) => n + row[j], 0));
  const f1 = matrix.map((row, i) => (2 * row[i]) / (support[i] + counts[i]));
  const source = [1, 3, 4],
    malignant = source.reduce((n, i) => n + support[i], 0),
    asr = source.reduce((n, i) => n + matrix[i][0], 0) / malignant;
  return (
    <Panel
      title="Synthetic research preview"
      action={<Badge state="DEMONSTRATION · DUMMY DATA" />}
    >
      <Note>
        Invented teaching data for interface demonstration only. These are not
        notebook results, validation evidence, measured comparisons or
        statistical findings. Switching the method changes the toy example; it
        does not establish superiority.
      </Note>
      <div className="filter-row">
        <Pick
          label="Synthetic scenario"
          value={method}
          items={[
            ['trust', 'Trust · toy example'],
            ['fedavg', 'FedAvg · toy example'],
          ]}
          onChange={setMethod}
        />
        <span>{total} synthetic examples · no patient records</span>
      </div>
      <div className="metric-grid">
        {[
          ['Accuracy', correct / total],
          ['Macro-F1', f1.reduce((a, b) => a + b, 0) / 7],
          ['Malignant-to-NV rate', asr],
          ['Target avoidance · 1 − ASR', 1 - asr],
        ].map(([n, v]) => (
          <div className="metric" key={String(n)}>
            <span>{n}</span>
            <strong>{(Number(v) * 100).toFixed(1)}%</strong>
            <small>Synthetic · demonstration only</small>
          </div>
        ))}
      </div>
      {tab === 'Statistics' ? (
        <Note>
          No p-values are generated for dummy data. Genuine paired statistical
          comparisons require completed matched seeds. Use the measured-evidence
          view to inspect the statistical protocol.
        </Note>
      ) : (
        <>
          <div className="round-graph-grid">
            <div>
              <h3>Per-class recall · synthetic</h3>
              <div className="round-bar-chart">
                {classes.map((c, i) => (
                  <button key={c} onClick={() => setCell([i, i])}>
                    <span>{c}</span>
                    <div>
                      <i
                        style={{
                          width: `${(matrix[i][i] / support[i]) * 100}%`,
                          background: '#6b5cf6',
                        }}
                      />
                    </div>
                    <output>
                      {((matrix[i][i] / support[i]) * 100).toFixed(1)}%
                    </output>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3>Class support · synthetic</h3>
              <div className="round-bar-chart">
                {classes.map((c, i) => (
                  <button key={c} onClick={() => setCell([i, 0])}>
                    <span>{c}</span>
                    <div>
                      <i
                        style={{
                          width: `${(support[i] / 80) * 100}%`,
                          background: '#19b8c7',
                        }}
                      />
                    </div>
                    <output>{support[i]}</output>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="revision-table-wrap">
            <table className="demo-confusion">
              <caption>
                Synthetic confusion matrix · rows true, columns predicted
              </caption>
              <thead>
                <tr>
                  <th>True / predicted</th>
                  {classes.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <th>{classes[i]}</th>
                    {row.map((v, j) => (
                      <td key={j}>
                        <button
                          aria-label={`Synthetic ${classes[i]} predicted ${classes[j]}: ${v}`}
                          aria-pressed={cell[0] === i && cell[1] === j}
                          onClick={() => setCell([i, j])}
                          style={{
                            background:
                              i === j
                                ? '#e7faf2'
                                : source.includes(i) && j === 0
                                  ? '#fff4ec'
                                  : '#f8f9fd',
                          }}
                        >
                          {v}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="demo-cell-detail">
            True {classes[cell[0]]} → predicted {classes[cell[1]]}:{' '}
            <strong>{matrix[cell[0]][cell[1]]}</strong> / {support[cell[0]]}{' '}
            examples (
            {((matrix[cell[0]][cell[1]] / support[cell[0]]) * 100).toFixed(1)}%
            of this synthetic true class).{' '}
            {source.includes(cell[0]) && cell[1] === 0
              ? 'This illustrates a malignant-source → NV error.'
              : ''}
          </p>
        </>
      )}
      <Note>
        The toy confusion matrix is the source of every displayed metric and
        class count, so the demonstration remains internally consistent. It is
        excluded from evidence downloads and experiment completion counts.
      </Note>
    </Panel>
  );
}

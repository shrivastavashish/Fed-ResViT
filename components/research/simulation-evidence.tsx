'use client';

import { useState } from 'react';
import { Badge, Note, Pick } from './common';
import study from '@/lib/final-study-results.json';

type Condition = 'balanced-20' | 'dirichlet-10' | 'dirichlet-20' | 'dirichlet-30' | 'adaptive-20';
const conditions: [Condition, string][] = [
  ['balanced-20', 'Balanced · 20% static'],
  ['dirichlet-10', 'Dirichlet · 10% static'],
  ['dirichlet-20', 'Dirichlet · 20% static'],
  ['dirichlet-30', 'Dirichlet · 30% static'],
  ['adaptive-20', 'Dirichlet · 20% adaptive'],
];
const methods = [
  ['fedavg', 'FedAvg'],
  ['krum', 'Krum'],
  ['trimmed_mean', 'Trimmed Mean'],
  ['coordinate_median', 'Coordinate Median'],
  ['trust', 'Trust'],
] as const;

function measured(condition: Condition) {
  const adaptive = condition === 'adaptive-20';
  const balanced = condition === 'balanced-20';
  const fraction = condition === 'dirichlet-10' ? .1 : condition === 'dirichlet-30' ? .3 : .2;
  return methods.map(([id, label]) => ({
    id, label,
    record: study.records.find(r => r.stage === (adaptive ? 'adaptive' : 'main') && r.partition === (balanced ? 'stratified_balanced' : 'dirichlet') && r.fraction === fraction && r.method === id && r.setting === 'default'),
  }));
}

export function SimulationEvidence({ initial = 'dirichlet-20', title = 'Measured outcome for a matched condition' }: { initial?: Condition; title?: string }) {
  const [condition, setCondition] = useState<Condition>(initial);
  const rows = measured(condition);
  const trust = rows.find(r => r.id === 'trust')?.record;
  const percentage = (value: number | null) => value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`;
  return <section className="simulation-evidence" aria-label={title}>
    <div className="simulation-evidence-head"><div><Badge state="EXECUTED · FIVE SEEDS"/><h3>{title}</h3><p>Test-set means from the completed notebook. Select one experiment condition; the animation above remains a methodology demonstration.</p></div><Pick label="Measured condition" value={condition} items={conditions} onChange={v => setCondition(v as Condition)}/></div>
    <div className="simulation-evidence-bars" aria-label="Measured attack success rate by aggregation method">
      {rows.map(({id,label,record}) => <div key={id} className={id === 'trust' ? 'trust' : ''}><span>{label}</span><div><i style={{width: `${(record?.asr[0] ?? 0) * 100}%`}}/></div><strong>{record ? percentage(record.asr[0]) : 'N/A'}</strong></div>)}
    </div>
    <div className="simulation-evidence-metrics">
      <div><span>Trust macro-F1</span><strong>{trust ? percentage(trust.macro_f1[0]) : 'N/A'}</strong></div>
      <div><span>Trust malignant recall</span><strong>{trust ? percentage(trust.malignant_recall[0]) : 'N/A'}</strong></div>
      <div><span>Attacker detection</span><strong>{trust ? percentage(trust.detection_rate[0]) : 'N/A'}</strong></div>
      <div><span>Honest-client false positives</span><strong>{trust ? percentage(trust.false_positive_rate[0]) : 'N/A'}</strong></div>
    </div>
    <Note>ASR measures malignant-source test images classified as NV; malignant safety is 1 − ASR and does not measure overall clinical sensitivity. Detection and false-positive rates are Trust-only. These aggregate results do not supply per-client distances or a measured round-by-round replay. Source: final notebook §21, stage-separated summary.</Note>
  </section>;
}

import snapshot from './protocol.json';
export const protocol = snapshot;
export const methods = [
  'fedavg',
  'krum',
  'trimmed_mean',
  'coordinate_median',
  'trust',
] as const;
export const methodNames: Record<string, string> = {
  fedavg: 'FedAvg',
  krum: 'Krum',
  multi_krum: 'Multi-Krum',
  trimmed_mean: 'Trimmed Mean',
  coordinate_median: 'Coordinate-wise Median',
  trust: 'Trust-aware',
};
export const seeds = [42, 43, 44, 45, 46];
export const sensitivities = [
  { id: 'default', label: 'Default', values: {} },
  {
    id: 'mad_narrow',
    label: 'Narrow thresholds',
    values: { TRUST_MAD_LOW_MULT: 0.25, TRUST_MAD_HIGH_MULT: 2 },
  },
  {
    id: 'mad_wide',
    label: 'Wide thresholds',
    values: { TRUST_MAD_LOW_MULT: 1, TRUST_MAD_HIGH_MULT: 4 },
  },
  {
    id: 'ema_fast',
    label: 'Faster reputation',
    values: { TRUST_MOMENTUM: 0.7 },
  },
  {
    id: 'ema_slow',
    label: 'Slower reputation',
    values: { TRUST_MOMENTUM: 0.95 },
  },
  {
    id: 'flag_low',
    label: 'Flag cutoff 0.25',
    values: { TRUST_FLAG_PHI_THRESHOLD: 0.25 },
  },
  {
    id: 'flag_high',
    label: 'Flag cutoff 0.75',
    values: { TRUST_FLAG_PHI_THRESHOLD: 0.75 },
  },
  {
    id: 'window_1',
    label: 'One-round flag window',
    values: { TRUST_FLAG_ROUNDS: 1 },
  },
  {
    id: 'window_10',
    label: 'Ten-round flag window',
    values: { TRUST_FLAG_ROUNDS: 10 },
  },
];
export type Job = {
  stage: string;
  partition: string;
  malicious_fraction: number;
  aggregation: string;
  seed: number;
  attack: string;
  setting: string;
  overrides: Record<string, number>;
};
export function studyPlan(stage: string, multi = false): Job[] {
  const aggs: string[] = [...methods];
  if (multi) aggs.splice(2, 0, 'multi_krum');
  const rows: Job[] = [];
  function add(
    partition: string,
    fraction: number,
    aggregation: string,
    seed: number,
    attack = 'targeted_label_flipping',
    setting = 'default',
    overrides: Record<string, number> = {},
  ) {
    rows.push({
      stage,
      partition,
      malicious_fraction: fraction,
      aggregation,
      seed,
      attack: fraction === 0 ? 'none' : attack,
      setting,
      overrides,
    });
  }
  if (stage === 'main')
    for (const p of ['stratified_balanced', 'dirichlet'])
      for (const s of seeds)
        for (const f of [0, 0.1, 0.2, 0.3])
          for (const a of aggs) add(p, f, a, s);
  else if (stage === 'adaptive')
    for (const s of seeds)
      for (const a of aggs)
        add('dirichlet', 0.2, a, s, 'adaptive_omniscient_blend');
  else if (stage === 'sensitivity')
    for (const s of seeds)
      for (const v of sensitivities)
        add(
          'dirichlet',
          0.2,
          'trust',
          s,
          'targeted_label_flipping',
          v.id,
          v.values as Record<string, number>,
        );
  return rows;
}
export function uniqueStudyCount(multi = false) {
  return (
    studyPlan('main', multi).length +
    studyPlan('adaptive', multi).length +
    studyPlan('sensitivity', multi).filter((j) => j.setting !== 'default')
      .length
  );
}
export const revisedLimitations = [
  'Five paired seeds are configured, not five independent patient cohorts. Inferential results remain pending; a small p-value alone will not establish robust generalization.',
  'Ten simulated institutions; no real hospital deployment. One fixed lesion-disjoint dataset split; lesion ID is not a verified patient identifier.',
  'Balanced and Dirichlet alpha 0.5 partitions are separate conditions. A minimum of 16 samples per client conditions the Dirichlet allocation.',
  'Targeted label flipping and one omniscient adaptive update-blending strategy. No universal or worst-case poisoning-robustness claim.',
  'Krum and Trimmed Mean receive the oracle malicious-client count. This is a favorable baseline assumption that must be disclosed.',
  'Sensitivity varies one factor at a time at 20% malicious clients under Dirichlet partitioning. It does not exhaustively cover all interactions.',
  'Binary malignant recall, subtype recall and malignant-to-NV errors must be reported alongside accuracy. The derived 1−ASR value is not clinical safety.',
  'No differential privacy, cryptographic secure aggregation, external clinical validation, regulatory approval or standalone diagnosis.',
  'Classification uses the best validation checkpoint. Trust detection uses the final training round’s rolling flag window; these may refer to different rounds.',
  'Training takes place outside this application. Checkpoints, prediction files and verified results have not been ingested. No live progress or new measurements are implied.',
];
export const metricDefinitions = [
  ['Accuracy', 'Correct seven-class predictions / all evaluated images.'],
  [
    'Macro-F1',
    'Mean class F1; each of the seven classes receives equal weight.',
  ],
  [
    'Macro precision & recall',
    'Report both to expose precision–recall trade-offs, including degradation.',
  ],
  [
    'Binary malignant recall',
    'True MEL/BCC/AKIEC images predicted as any of MEL/BCC/AKIEC, divided by all true malignant-source images.',
  ],
  [
    'Exact malignant recall',
    'True malignant-source images predicted as the correct subtype / all true malignant-source images.',
  ],
  [
    'Malignant macro-recall',
    'Unweighted mean of MEL, BCC and AKIEC subtype recalls.',
  ],
  [
    'Malignant-to-NV rate / ASR',
    'Malignant-source images predicted as NV. Available as a baseline error rate in clean runs; called ASR under attack. Includes baseline errors, not only errors caused by poisoning.',
  ],
  [
    'Target avoidance · 1 − ASR',
    'Derived complement of ASR. A malignant-to-BKL error still counts as target avoidance; this is not clinical safety or an independent outcome.',
  ],
  [
    'Detection / false positive rate',
    'TP / malicious clients and FP / honest clients. Always report TP, FP, TN, FN and the flag-window scope. Only Trust defines a detector here.',
  ],
];

import source from './research.json';
export type Run = {
  id: string;
  seed: number;
  aggregation: string;
  malicious_fraction: number;
  best_val_round: number;
  [key: string]: unknown;
};
export type Summary = {
  aggregation: string;
  malicious_fraction: number;
  std: Record<string, number>;
  [key: string]: unknown;
};
export type ClientState = {
  id: number;
  distance: number;
  phi: number;
  reputation: number;
  flagged: boolean;
  effective_weight: number;
  contribution: number;
  ground_truth_malicious: boolean;
};
export type Round = {
  aggregation: string;
  seed: number;
  malicious_fraction: number;
  round: number;
  loss: number;
  lr: number;
  val_accuracy: number;
  val_macro_f1: number;
  val_asr: number | null;
  clients: ClientState[] | null;
  thresholds?: number[];
};
export const data = source as unknown as Omit<
  typeof source,
  'results' | 'summary' | 'rounds'
> & { results: Run[]; summary: Summary[]; rounds: Round[] };
export const classes = ['NV', 'MEL', 'BKL', 'BCC', 'AKIEC', 'VASC', 'DF'];
export const classNames = [
  'Melanocytic nevi',
  'Melanoma',
  'Benign keratosis-like lesions',
  'Basal cell carcinoma',
  'Actinic keratoses',
  'Vascular lesions',
  'Dermatofibroma',
];
export const metrics = [
  ['test_accuracy', 'Accuracy'],
  ['test_macro_precision', 'Macro precision'],
  ['test_macro_recall', 'Macro recall'],
  ['test_macro_f1', 'Macro-F1'],
  ['test_macro_specificity', 'Specificity'],
  ['test_asr', 'Attack Success Rate'],
  ['test_malignant_safety', 'Malignant safety · 1 − ASR'],
  ['test_detection_rate', 'Detection rate'],
  ['test_false_positive_rate', 'False positive rate'],
] as const;
export function pct(n: unknown, d = 2) {
  return typeof n === 'number' ? (n * 100).toFixed(d) + '%' : '—';
}
export function numeric(n: unknown) {
  return typeof n === 'number' ? n : null;
}
export function download(
  name: string,
  value: unknown,
  type = 'application/json',
) {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const limitations = [
  'Two seeds (42, 43) on a fixed lesion-disjoint train/validation/test split. Statistical comparisons are preliminary.',
  'Five simulated clients. These are dataset partitions, not real hospitals.',
  'Only 0% and 20% malicious-client conditions were executed. Both attack runs selected notebook client ID 3.',
  'Controlled stratified-balanced partitioning is near-IID. Dirichlet non-IID partitioning exists in the implementation but was not active.',
  'Targeted label flipping only: MEL, BCC and AKIEC labels changed to NV on one client. No universal poisoning robustness claim.',
  'No differential privacy, cryptographic secure aggregation, regulatory approval or clinical deployment.',
  'Classification uses the best validation checkpoint; reported detection and FPR use the final round’s five-round flag window.',
  '“Malignant safety” is 1 − ASR: avoidance of the NV target on source-class images, not a measure of clinical safety. AKIEC is the dataset source category used by the attack.',
  'Round evidence has saved display precision. Raw model updates, all per-image probabilities and most seed-level F1 values are not embedded in this notebook.',
  'These limitations describe the original imported study. The revised ten-client/five-seed protocol is available separately, with new result ingestion pending.',
];

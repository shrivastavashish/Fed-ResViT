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

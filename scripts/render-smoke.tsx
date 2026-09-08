import { renderToString } from 'react-dom/server';
import Home from '../app/page';
import {
  RevisionWorkspace,
  RevisionStudio,
  RevisionObservatory,
  RevisionReproducibility,
} from '../components/research/revision';
import { studyPlan, uniqueStudyCount } from '../lib/protocol';
import Clinical from '../components/research/clinical';
import Observatory from '../components/research/observatory';
import {
  Federation,
  TrustWorkspace,
  ReplayProps,
} from '../components/research/federation';
import { Studio, Reproducibility } from '../components/research/studio';
import { data } from '../lib/research';
const noop = () => {};
const p: ReplayProps = {
  record: data.rounds.find(
    (r) =>
      r.aggregation === 'trust' &&
      r.seed === 43 &&
      r.round === 30 &&
      r.malicious_fraction === 0.2,
  )!,
  client: 3,
  setClient: noop,
  round: 30,
  setRound: noop,
  playing: false,
  setPlaying: noop,
  stage: 10,
  setStage: noop,
  speed: '1×',
  setSpeed: noop,
  seed: '43',
  setSeed: noop,
  agg: 'trust',
  setAgg: noop,
  condition: 0.2,
  setCondition: noop,
  inspect: noop,
};
if (
  studyPlan('main').length !== 200 ||
  studyPlan('adaptive').length !== 25 ||
  studyPlan('sensitivity').length !== 45 ||
  uniqueStudyCount() !== 265 ||
  uniqueStudyCount(true) !== 310
)
  throw Error('Revised study count mismatch');
const defaults = studyPlan('sensitivity').filter(
  (j) => j.setting === 'default',
);
const canonical = (j: ReturnType<typeof studyPlan>[number]) =>
  JSON.stringify({ ...j, stage: undefined });
if (
  !defaults.every((d) =>
    studyPlan('main').some((j) => canonical(j) === canonical(d)),
  )
)
  throw Error('Sensitivity defaults must match main jobs');
const views = [
  ...[
    'overview',
    'federation',
    'security',
    'research',
    'studio',
    'reproducibility',
  ].map((page) => (
    <RevisionWorkspace page={page} navigate={noop} showOriginal={noop} />
  )),
  ...['Study plan', 'Run registry'].map((tab) => (
    <RevisionStudio initialTab={tab} />
  )),
  ...[
    'Robustness',
    'Confusion & classes',
    'Statistics',
    'Definitions & limitations',
  ].map((tab) => <RevisionObservatory initialTab={tab} showOriginal={noop} />),
  ...['Recovery & execution', 'Evidence handoff'].map((tab) => (
    <RevisionReproducibility initialTab={tab} />
  )),
  <Home />,
  <Studio onReplay={noop} />,
  <Studio onReplay={noop} initialTab="Executed run registry" />,
  <Reproducibility inspect={noop} />,
  ...['Lesion analysis', 'Research samples', 'Explainable AI'].map((t) => (
    <Clinical initialTab={t} inspect={noop} />
  )),
  ...[
    'Performance',
    'Model comparison',
    'Robustness',
    'Confusion matrix',
    'Per-class analysis',
    'Statistics',
    'Limitations',
  ].map((t) => (
    <Observatory
      initialTab={t}
      inspect={noop}
      condition={0.2}
      setCondition={noop}
    />
  )),
  ...[
    'Federation',
    'Client intelligence',
    'Experiment replay',
    'Hybrid architecture',
  ].map((t) => <Federation {...p} initialTab={t} />),
  ...['Trust intelligence', 'Poisoning laboratory'].map((t) => (
    <TrustWorkspace {...p} initialTab={t} />
  )),
  <Observatory inspect={noop} condition={0.1} setCondition={noop} />,
];
for (const [i, view] of views.entries()) {
  const html = renderToString(view);
  if (
    />\s*NaN\s*</.test(html) ||
    /(?:cx|cy|d|width|height)="[^"]*NaN/.test(html) ||
    html.includes('[object Object]')
  )
    throw Error(
      `Invalid research rendering in view ${i}: ${html.slice(Math.max(0, html.search(/NaN|\[object Object\]/) - 120), html.search(/NaN|\[object Object\]/) + 180)}`,
    );
  if (
    html.includes('INTERACTIVE 3D / METHODOLOGY') ||
    html.includes('Diagram rotation')
  )
    throw Error('Removed design controls must not appear');
  if (html.length < 200) throw Error(`Empty view ${i}`);
}
console.log(
  `Server-render smoke checks passed for ${views.length} workspace states.`,
);

const revised = renderToString(
  <RevisionWorkspace page="overview" navigate={noop} showOriginal={noop} />,
);
if (revised.includes('36.96') || revised.includes('0.834254'))
  throw Error('Legacy or new metrics leaked into revised overview');
if (!revised.includes('Results ingestion pending'))
  throw Error('Pending evidence label missing');

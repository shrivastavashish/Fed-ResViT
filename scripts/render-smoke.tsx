import {
  StudyCoverage,
  EvidenceAtlas,
} from '../components/research/scientific-atlas';
import { renderToString } from 'react-dom/server';
import Home from '../app/page';
import { About } from '../components/research/about';
import Clinical from '../components/research/clinical';
import {
  RevisionWorkspace,
  RevisionStudio,
  RevisionObservatory,
  RevisionReproducibility,
} from '../components/research/revision';
import { FederationSimulation } from '../components/research/simulation';
import { studyPlan, uniqueStudyCount } from '../lib/protocol';
const noop = () => {};
const views = [
  <StudyCoverage />,
  <EvidenceAtlas navigate={noop} />,
  <Home />,
  <About navigate={noop} />,
  <Clinical inspect={noop} />,
  <FederationSimulation />,
  ...[
    'overview',
    'federation',
    'security',
    'research',
    'studio',
    'reproducibility',
  ].map((page) => <RevisionWorkspace page={page} navigate={noop} />),
  ...['Builder', 'Study plan', 'Run registry'].map((initialTab) => (
    <RevisionStudio initialTab={initialTab} />
  )),
  ...[
    'Performance',
    'Robustness',
    'Confusion & classes',
    'Statistics',
    'Definitions & limitations',
  ].map((initialTab) => <RevisionObservatory initialTab={initialTab} />),
  ...['Active protocol', 'Recovery & execution', 'Evidence handoff'].map(
    (initialTab) => <RevisionReproducibility initialTab={initialTab} />,
  ),
];
for (const view of views) {
  const html = renderToString(view);
  if (
    /Original study|Revised protocol|36\.96%|23\.93%|\bNaN\b|\[object Object\]/i.test(
      html,
    )
  )
    throw Error(
      'Obsolete or invalid content: ' +
        html.match(
          /Original study|Revised protocol|36\.96%|23\.93%|\bNaN\b|\[object Object\]/i,
        )?.[0],
    );
}
const simulation = renderToString(<FederationSimulation />);
if (
  !simulation.includes('Inspect simulated client 10') ||
  !simulation.includes('DEMONSTRATION')
)
  throw Error('Simulation scope missing');
if (studyPlan('main').length !== 200 || uniqueStudyCount(false) !== 265)
  throw Error('Plan changed');
console.log(
  `${views.length} standalone views passed; ten-client simulation and 265-run plan verified.`,
);

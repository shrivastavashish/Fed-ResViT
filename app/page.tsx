'use client';
import { About } from '@/components/research/about';
import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Activity,
  ArrowUpRight,
  Dna,
  FlaskConical,
  ShieldCheck,
  Network,
  Stethoscope,
  BookOpen,
  ChartNoAxesCombined,
  Play,
  ChevronRight,
  ChevronLeft,
  X,
  FileCode2,
  Download,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { data, pct } from '@/lib/research';
import {
  Panel,
  Badge,
  TabBar,
  EvidenceButton,
  Note,
} from '@/components/research/common';
import { Convergence } from '@/components/research/charts';
import {
  Topology,
  Federation,
  TrustWorkspace,
  ReplayProps,
} from '@/components/research/federation';
import { Studio, Reproducibility } from '@/components/research/studio';
const Clinical = lazy(() => import('@/components/research/clinical'));
const Observatory = lazy(() => import('@/components/research/observatory'));
const nav = [
  [
    'about',
    'About',
    BookOpen,
    'The purpose, progress and evidence behind Fed-ResViT.',
  ],
  [
    'overview',
    'Intelligence Overview',
    Activity,
    'A connected view of the model, the federation and the evidence.',
  ],
  [
    'clinical',
    'Clinical AI',
    Stethoscope,
    'Explore dermoscopic imagery and the model’s analysis workflow.',
  ],
  [
    'federation',
    'Federated Learning',
    Network,
    'Follow local knowledge as it becomes a shared global model.',
  ],
  [
    'security',
    'Security & Trust',
    ShieldCheck,
    'See the attack. Inspect the defense. Understand every contribution.',
  ],
  [
    'research',
    'Research Observatory',
    ChartNoAxesCombined,
    'Examine the measured results, including their uncertainty and limits.',
  ],
  [
    'studio',
    'Experiment Studio',
    FlaskConical,
    'Configure research questions. Compare and replay executed experiments.',
  ],
  [
    'reproducibility',
    'Reproducibility',
    BookOpen,
    'Trace the research from configuration to source evidence.',
  ],
] as const;
const demo = [
  [
    'overview',
    'The research question',
    'Introduce the five-client federation and the measured attack-success reduction.',
  ],
  [
    'clinical',
    'Clinical image workflow',
    'Upload a local image to demonstrate viewing and preprocessing. Inference requires a checkpoint.',
  ],
  [
    'clinical',
    'Seven-class model output',
    'Explain the seven classes and the distinction between probability, diagnosis and explanation. No prediction is fabricated.',
  ],
  [
    'federation',
    'Five local perspectives',
    'Inspect client distributions and move through the 30 recorded rounds.',
  ],
  [
    'security',
    'A targeted attack',
    'The Poisoning laboratory tab shows source labels being changed to NV.',
  ],
  [
    'security',
    'Malicious client',
    'Client 4 (notebook ID 3) is designated malicious in both attack seeds. Inspect its trust history.',
  ],
  [
    'security',
    'How trust is calculated',
    'Inspect RMS distance, adaptive thresholds, soft trust, reputation and effective weight.',
  ],
  [
    'research',
    'Compare the aggregators',
    'Open Model comparison for classification and security metrics side by side.',
  ],
  [
    'overview',
    'The central finding',
    'ASR falls from 36.96% to 23.93%. Target avoidance rises from 63.04% to 76.07%.',
  ],
  [
    'research',
    'Look beyond the headline',
    'Inspect confusion errors, minority-class recall, n=2 statistics and study limitations.',
  ],
  [
    'federation',
    'Replay the experiment',
    'Open Experiment replay. The animation explains stages; telemetry is from completed rounds.',
  ],
  [
    'reproducibility',
    'Close with the evidence',
    'Review the active configuration, downloadable recovered evidence and listed-only original artifacts.',
  ],
];
export default function Home() {
  return (
    <SidebarProvider>
      <Platform />
    </SidebarProvider>
  );
}
function Platform() {
  const [page, setPage] = useState('overview');
  const [condition, setCondition] = useState(0.2);
  const [seed, setSeed] = useState('43');
  const [agg, setAgg] = useState('trust');
  const [round, setRound] = useState(30);
  const [client, setClient] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [stage, setStage] = useState(10);
  const [speed, setSpeed] = useState('1×');
  const [tour, setTour] = useState<number | null>(null);
  const [researchTab, setResearchTab] = useState('Performance');
  const [federationTab, setFederationTab] = useState('Federation');
  const [securityTab, setSecurityTab] = useState('Trust intelligence');
  const [evidence, setEvidence] = useState<{
    cell: number;
    title: string;
    detail?: string;
  } | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const { setOpenMobile } = useSidebar();
  function navigate(id: string, tab?: string) {
    setPlaying(false);
    if (id === 'research') setResearchTab(tab ?? 'Performance');
    if (id === 'federation') setFederationTab(tab ?? 'Federation');
    if (id === 'security') setSecurityTab(tab ?? 'Trust intelligence');
    if (
      ['overview', 'federation', 'security'].includes(id) &&
      ![0, 0.2].includes(condition)
    )
      setCondition(0.2);
    if (id === 'security') setAgg('trust');
    setPage(id);
    setOpenMobile(false);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (nav.some((n) => n[0] === hash)) setPage(hash);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => {
        if (stage < 11) setStage((s) => s + 1);
        else if (round < 30) {
          setRound((r) => r + 1);
          setStage(0);
        } else setPlaying(false);
      },
      1100 / parseFloat(speed),
    );
    return () => clearInterval(timer);
  }, [playing, round, stage, speed]);
  useEffect(() => {
    if (!evidence) return;
    const ac = new AbortController();
    fetch(`/evidence/cell-${evidence.cell}.py`, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw Error('Source unavailable');
        return r.text();
      })
      .then(setCode)
      .catch((e) => {
        if (e.name !== 'AbortError')
          setCodeError(
            'Unable to load the source. Download recovered evidence below or try again.',
          );
      });
    return () => ac.abort();
  }, [evidence]);
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => Promise<unknown>;
    };
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (t: Tool, o: { signal: AbortSignal }) => void;
        };
      }
    ).modelContext;
    if (!context) return;
    const ac = new AbortController();
    try {
      context.registerTool(
        {
          name: 'inspect_federated_round',
          description:
            'Navigate to a measured federated round. Does not run training.',
          inputSchema: {
            type: 'object',
            properties: {
              seed: { type: 'integer', enum: [42, 43] },
              round: { type: 'integer', minimum: 1, maximum: 30 },
              aggregation: { type: 'string', enum: ['fedavg', 'trust'] },
              malicious_fraction: { type: 'number', enum: [0, 0.2] },
            },
            required: ['seed', 'round', 'aggregation', 'malicious_fraction'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          async execute(input) {
            const i = input as {
              seed: number;
              round: number;
              aggregation: string;
              malicious_fraction: number;
            };
            const r = data.rounds.find(
              (r) =>
                r.seed === i.seed &&
                r.round === i.round &&
                r.aggregation === i.aggregation &&
                r.malicious_fraction === i.malicious_fraction,
            );
            if (!r)
              throw Error('No executed round matches this configuration.');
            setSeed(String(i.seed));
            setRound(i.round);
            setAgg(i.aggregation);
            setCondition(i.malicious_fraction);
            setPlaying(false);
            setPage('federation');
            window.location.hash = 'federation';
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
            return {
              state: 'EXECUTED',
              round: r.round,
              validation_accuracy: r.val_accuracy,
              validation_macro_f1: r.val_macro_f1,
              source_cell: 46,
            };
          },
        },
        { signal: ac.signal },
      );
    } catch {}
    return () => ac.abort();
  }, []);
  const inspect = (cell: number, title: string, detail?: string) => {
    setCode('');
    setCodeError('');
    setEvidence({ cell, title, detail });
  };
  const record = data.rounds.find(
    (r) =>
      r.seed === Number(seed) &&
      r.malicious_fraction ===
        ([0, 0.2].includes(condition) ? condition : 0.2) &&
      r.aggregation === agg &&
      r.round === round,
  )!;
  const p: ReplayProps = {
    record,
    client,
    setClient,
    round,
    setRound,
    playing,
    setPlaying,
    stage,
    setStage,
    speed,
    setSpeed,
    seed,
    setSeed,
    agg,
    setAgg,
    condition:
      page === 'research'
        ? condition
        : [0, 0.2].includes(condition)
          ? condition
          : 0.2,
    setCondition,
    inspect,
  };
  const active = nav.find((n) => n[0] === page) ?? nav[0];
  function tourStep(n: number) {
    setTour(n);
    navigate(demo[n][0]);
    if (demo[n][0] === 'security') {
      setCondition(0.2);
      setAgg('trust');
      setClient(3);
    }
    if (n === 4) setSecurityTab('Poisoning laboratory');
    if (n === 10) setFederationTab('Experiment replay');
    if (n === 7) setResearchTab('Model comparison');
    if (n === 9) setResearchTab('Confusion matrix');
  }
  return (
    <>
      <Sidebar className="research-sidebar">
        <SidebarHeader>
          <button
            className="brand"
            onClick={() => navigate('overview')}
            aria-label="Fed-ResViT home"
          >
            <Dna size={32} />
            <div>
              Fed-ResViT<small>RESEARCH INTELLIGENCE</small>
            </div>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">WORKSPACES</div>
          <SidebarMenu>
            {nav.map(([id, name, Icon]) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  className="nav-item"
                  isActive={page === id}
                  onClick={() => navigate(id)}
                >
                  <Icon />
                  <span>{name}</span>
                  {page === id && <span className="nav-active-dot" />}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-guide">
            <FlaskConical size={21} />
            <h3>
              A research story,
              <br />
              ready to explore.
            </h3>
            <p>
              Walk through the science
              <br />
              in a guided presentation.
            </p>
            <button onClick={() => tourStep(0)}>
              Start guided demo
              <ArrowUpRight size={14} />
            </button>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="side-study">
            <span className="live-dot" /> Executed research
            <small>HAM10000 · 5 simulated institutions</small>
          </div>
          <div className="researcher">
            <span className="avatar">FS</span>
            <span>Federated Skin Cancer Detection System</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div>
            <SidebarTrigger />
            <span>
              Research & Clinical Intelligence{' '}
              <span className="breadcrumb-sep">/</span> <b>{active[1]}</b>
            </span>
          </div>
          <div>
            <span className="status-chip">
              <span className="live-dot" />
              RESEARCH EDITION
            </span>
            <button
              className="avatar top-avatar"
              title="Research profile"
              onClick={() => navigate('reproducibility')}
            >
              AS
            </button>
          </div>
        </header>
        <main className="workspace">
          <div className="eyebrow">
            FEDERATED AI /{' '}
            {page === 'clinical'
              ? 'CLINICAL RESEARCH'
              : page === 'overview'
                ? 'SYSTEM INTELLIGENCE'
                : 'RESEARCH WORKSPACE'}
          </div>
          <div className="page-title">
            <div>
              <h1>{active[1]}</h1>
              <p>{active[3]}</p>
            </div>
            {page === 'overview' ? (
              <button
                className="primary-btn"
                onClick={() => navigate('clinical')}
              >
                <Stethoscope size={16} />
                Analyze a lesion
                <ArrowUpRight size={15} />
              </button>
            ) : (
              <Badge
                state={
                  page === 'clinical'
                    ? 'RESEARCH USE'
                    : page === 'about'
                      ? 'PROJECT SUMMARY'
                      : 'EXECUTED EVIDENCE'
                }
              />
            )}
          </div>
          {tour !== null && (
            <div className="tour-banner">
              <div>
                <span className="eyebrow">
                  GUIDED DEMONSTRATION · {tour + 1} / 12 · APPROX. 10 MIN
                </span>
                <h3>{demo[tour][1]}</h3>
                <p>{demo[tour][2]}</p>
              </div>
              <div>
                <button
                  aria-label="Previous demo step"
                  disabled={tour === 0}
                  onClick={() => tourStep(tour - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="primary-btn"
                  onClick={() =>
                    tour === 11 ? setTour(null) : tourStep(tour + 1)
                  }
                >
                  {tour === 11 ? 'Finish' : 'Next'}
                  <ChevronRight size={16} />
                </button>
                <button
                  aria-label="Close demonstration"
                  onClick={() => setTour(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
          <Suspense
            fallback={
              <div aria-label="Loading research workspace">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="mt-4 h-96 w-full" />
              </div>
            }
          >
            {page === 'about' && (
              <About navigate={navigate} inspect={inspect} />
            )}
            {page === 'overview' && <Overview p={p} navigate={navigate} />}
            {page === 'clinical' && <Clinical inspect={inspect} />}
            {page === 'federation' && (
              <Federation
                key={federationTab}
                initialTab={federationTab}
                {...p}
              />
            )}
            {page === 'security' && (
              <TrustWorkspace
                key={securityTab}
                initialTab={securityTab}
                {...p}
              />
            )}
            {page === 'research' && (
              <Observatory
                key={researchTab}
                initialTab={researchTab}
                inspect={inspect}
                condition={condition}
                setCondition={setCondition}
              />
            )}
            {page === 'studio' && (
              <Studio
                onReplay={() => {
                  setCondition(0.2);
                  setAgg('trust');
                  setRound(1);
                  setStage(0);
                  navigate('federation');
                }}
              />
            )}
            {page === 'reproducibility' && (
              <Reproducibility inspect={inspect} />
            )}
          </Suspense>
          <footer>
            <ShieldCheck size={13} />
            Research / Educational Demonstration — Not a standalone diagnostic
            system<span>Fed-ResViT · Evidence edition</span>
          </footer>
        </main>
      </SidebarInset>
      <Sheet
        open={evidence !== null}
        onOpenChange={(v) => !v && setEvidence(null)}
      >
        <SheetContent className="evidence-sheet">
          <SheetHeader>
            <div className="eyebrow">RESEARCH EVIDENCE / TRACEABILITY</div>
            <SheetTitle>{evidence?.title}</SheetTitle>
            <SheetDescription>
              Source notebook, executed configuration and code. No generated
              research values.
            </SheetDescription>
          </SheetHeader>
          <div className="evidence-body">
            <Badge />
            <dl className="detail-list">
              <div>
                <dt>Source</dt>
                <dd>{data.source.notebook}</dd>
              </div>
              <div>
                <dt>Profile</dt>
                <dd>{data.source.profile}</dd>
              </div>
              <div>
                <dt>Notebook cell</dt>
                <dd>{evidence?.cell} · zero-based index</dd>
              </div>
              <div>
                <dt>Execution scope</dt>
                <dd>5 clients · 30 rounds · seeds 42, 43</dd>
              </div>
              <div>
                <dt>Partition</dt>
                <dd>Controlled stratified-balanced</dd>
              </div>
            </dl>
            {evidence?.detail && (
              <>
                <h3>Selected result / context</h3>
                <pre>{evidence.detail}</pre>
              </>
            )}
            <Note>
              {data.source.precision} Original checkpoints and NPZ predictions
              are listed, not attached.
            </Note>
            <h3>Source implementation</h3>
            {codeError ? (
              <p role="alert">{codeError}</p>
            ) : code ? (
              <pre className="source-code">{code}</pre>
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
            <div className="filter-row">
              <a
                className="secondary-btn"
                href={`/evidence/cell-${evidence?.cell}.py`}
                download
              >
                <FileCode2 size={16} />
                Source cell
              </a>
              <a
                className="primary-btn"
                href="/evidence/research.json"
                download
              >
                <Download size={16} />
                Evidence JSON
              </a>
            </div>
            <p className="hash">Notebook SHA-256: {data.source.sha256}</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
function Overview({
  p,
  navigate,
}: {
  p: ReplayProps;
  navigate: (s: string, t?: string) => void;
}) {
  const summary = data.summary.find(
    (r) => r.aggregation === 'trust' && r.malicious_fraction === p.condition,
  )!;
  const summaryMetrics = [
    ['test_accuracy', 'Classification accuracy', 'Overall test accuracy'],
    ['test_macro_f1', 'Macro-F1', 'Equal weight for all 7 classes'],
    ['test_malignant_safety', 'Malignant safety', '1 − ASR · target avoidance'],
    ['test_asr', 'Attack Success Rate', 'Source classes predicted as NV'],
  ];
  return (
    <>
      <section className="finding">
        <div>
          <span className="eyebrow">THE RESEARCH FINDING</span>
          <h2>
            A stronger defense.
            <br />
            <em>A more trusted model.</em>
          </h2>
          <p>
            Trust-aware aggregation reduces targeted poisoning attack success
            while preserving overall classification performance.
          </p>
          <button
            className="finding-link"
            onClick={() => navigate('research', 'Model comparison')}
          >
            Explore the comparison
            <ArrowUpRight size={15} />
          </button>
          <span className="finding-note">
            Executed · 20% malicious clients · 2 seeds · Controlled partition
          </span>
        </div>
        <button
          className="finding-number"
          onClick={() =>
            p.inspect(
              48,
              'Relative ASR reduction',
              'FedAvg mean ASR = 0.3696\nTrust mean ASR = 0.2393\nAbsolute reduction = 13.03 percentage points\nRelative reduction = (0.3696 − 0.2393) / 0.3696 ≈ 35.3%\nDerived from displayed two-seed means, not a universal robustness estimate.',
            )
          }
        >
          <span>
            RELATIVE ATTACK SUCCESS REDUCTION <ArrowUpRight size={13} />
          </span>
          <strong>
            35.3<small>%</small>
          </strong>
          <p>
            36.96% FedAvg <span>→</span> 23.93% Trust
          </p>
          <small>13.03 percentage points · Two-seed mean</small>
        </button>
      </section>
      <div className="overview-context">
        <div>
          <h3>Research performance</h3>
          <span>Trust-aware aggregation · test results · mean ± SD</span>
        </div>
        <TabBar
          value={p.condition === 0 ? 'Clean condition' : '20% malicious'}
          items={['Clean condition', '20% malicious']}
          onChange={(v) => p.setCondition(v === 'Clean condition' ? 0 : 0.2)}
        />
      </div>
      <div className="metric-grid">
        {summaryMetrics.map(([k, l, desc], i) => (
          <button
            className={'metric ' + (i === 2 ? 'accent-metric' : '')}
            key={k}
            onClick={() =>
              p.inspect(
                48,
                l,
                JSON.stringify(
                  {
                    condition: p.condition,
                    aggregator: 'trust',
                    seeds: [42, 43],
                    value: summary[k],
                    sd: summary.std[k],
                    meaning: desc,
                    artifact: 'recovered research.json / summary',
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <span>
              {l}
              <ArrowUpRight size={14} />
            </span>
            <strong>{pct(summary[k])}</strong>
            <small>
              {summary[k] === null
                ? 'Not defined for clean condition'
                : `± ${pct(summary.std[k])} SD`}
              <span>{desc}</span>
            </small>
          </button>
        ))}
      </div>
      <div className="secondary-metrics">
        {[
          ['test_macro_specificity', 'Specificity'],
          ['test_detection_rate', 'Detection rate'],
          ['test_false_positive_rate', 'False positive rate'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() =>
              p.inspect(
                48,
                l,
                JSON.stringify(
                  {
                    mean: summary[k],
                    sd: summary.std[k],
                    scope:
                      k === 'test_macro_specificity'
                        ? 'Best-validation checkpoint, test set'
                        : 'Final-round five-round client flag window',
                  },
                  null,
                  2,
                ),
              )
            }
          >
            <span>{l}</span>
            <strong>{pct(summary[k])}</strong>
            <ArrowUpRight size={13} />
          </button>
        ))}
        <span>Detection & FPR: final-round client window</span>
      </div>
      <div className="overview-columns">
        <Panel
          title="The federation, at a glance"
          kicker="LOCAL KNOWLEDGE. SHARED INTELLIGENCE."
          dark
          action={
            <button className="text-btn" onClick={() => navigate('federation')}>
              Explore
              <ArrowUpRight size={14} />
            </button>
          }
        >
          <Topology
            record={{
              ...p.record,
              ...data.rounds.find(
                (r) =>
                  r.aggregation === 'trust' &&
                  r.malicious_fraction === p.condition &&
                  r.seed === Number(p.seed) &&
                  r.round === 30,
              )!,
            }}
            client={p.client}
            onClient={(n) => {
              p.setClient(n);
              p.setAgg('trust');
              p.setRound(30);
              navigate('federation');
            }}
          />
          <div className="network-footer">
            <span>
              <span className="live-dot" />
              30 rounds completed
            </span>
            <span>Seed {p.seed} · Trust</span>
            <Badge />
          </div>
        </Panel>
        <Panel
          title="Experiment snapshot"
          action={
            <EvidenceButton
              label=""
              onClick={() => navigate('reproducibility')}
            />
          }
        >
          <div className="snapshot-model">
            <Dna size={26} />
            <div>
              <strong>Fed-ResViT</strong>
              <span>ResNet-50 + ViT-Small</span>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Dataset</dt>
              <dd>HAM10000</dd>
            </div>
            <div>
              <dt>Lesion classes</dt>
              <dd>7</dd>
            </div>
            <div>
              <dt>Simulated institutions</dt>
              <dd>5</dd>
            </div>
            <div>
              <dt>Aggregation</dt>
              <dd>Trust-aware</dd>
            </div>
            <div>
              <dt>Current condition</dt>
              <dd>{p.condition === 0 ? 'Clean' : '20% malicious'}</dd>
            </div>
            <div>
              <dt>Security ground truth</dt>
              <dd>
                {p.condition === 0
                  ? 'No malicious clients'
                  : '1 malicious client'}
              </dd>
            </div>
          </dl>
          <div className="progress-label">
            <span>Recorded training complete</span>
            <b>30 / 30</b>
          </div>
          <Progress
            value={100}
            aria-label="30 of 30 training rounds completed"
          />
          <p className="source-caption">
            target90_v4_multirun
            <br />
            Two seeds · eight executed runs
          </p>
        </Panel>
      </div>
      <div className="overview-bottom">
        <Panel
          title="Convergence, measured"
          kicker="VALIDATION MACRO-F1"
          action={
            <EvidenceButton
              label="Open observatory"
              onClick={() => navigate('research')}
            />
          }
        >
          <Convergence condition={p.condition} />
        </Panel>
        <Panel title="Move through the science" kicker="EXPLORE FED-RESVIT">
          <div className="quick-actions">
            {[
              ['clinical', 'Analyze lesion', Stethoscope],
              ['federation', 'Explore federation', Network],
              ['security', 'Configure poisoning', FlaskConical],
              ['security', 'Inspect trust', ShieldCheck],
              ['research', 'Compare models', ChartNoAxesCombined],
              ['research', 'Explore robustness', Activity],
              ['federation', 'Replay experiment', Play],
            ].map(([id, label, Icon], i) => {
              const I = Icon as typeof Activity;
              return (
                <button
                  key={String(label)}
                  onClick={() => {
                    if (i === 6) {
                      p.setRound(1);
                      p.setStage(0);
                    }
                    navigate(
                      String(id),
                      i === 2
                        ? 'Poisoning laboratory'
                        : i === 6
                          ? 'Experiment replay'
                          : i === 4
                            ? 'Model comparison'
                            : i === 5
                              ? 'Robustness'
                              : undefined,
                    );
                  }}
                >
                  <I size={17} />
                  <span>{String(label)}</span>
                  <ArrowUpRight size={14} />
                </button>
              );
            })}
          </div>
        </Panel>
      </div>
      <Note>
        Controlled five-client experiment, two seeds. “Malignant safety” means
        avoidance of the NV attack target, not clinical safety. Review
        minority-class performance and study limitations before interpreting the
        headline.
      </Note>
    </>
  );
}

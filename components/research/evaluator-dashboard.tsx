/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG research nodes support keyboard activation. */
'use client';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Database,
  FlaskConical,
  Network,
  Pause,
  Play,
  ShieldCheck,
  Stethoscope,
  Target,
} from 'lucide-react';
import { Badge, Panel } from './common';
import { ProjectStorySimulation } from './project-story-simulation';
import { OverviewHybridSimulation } from './overview-hybrid-simulation';
import { methodNames, methods } from '@/lib/protocol';
import finalStudy from '@/lib/final-study-results.json';

type Navigate = (page: string, tab?: string) => void;

export function StudyStatusStrip({ compact = false }: { compact?: boolean }) {
  const stages = [
    ['Main comparison', 200, 'Completed · five methods · five seeds · two partitions'],
    ['Adaptive attack', 25, 'Completed · defense-aware update blending'],
    ['Trust sensitivity', 40, 'Completed · eight variants · default reused from main'],
  ] as const;
  return (
    <section className={'study-status-strip ' + (compact ? 'compact' : '')} aria-label="Fed-ResViT experiment design">
      <div className="study-status-label">
        <span className="status-beacon" />
        <div>
          <strong>Research design</strong>
          <small>265 distinct runs completed across three stages</small>
        </div>
      </div>
      <div className="study-status-stages">
        {stages.map(([label, count, note]) => (
          <div key={label} className="study-stage-meter">
            <div><span>{label}</span><strong>{count} runs</strong></div>
            <div className="study-stage-track" aria-label={`${label}: ${count} completed runs`}>
              <span style={{ width: `${Math.max(14, (count / 200) * 100)}%` }} />
            </div>
            {!compact && <small>{note}</small>}
          </div>
        ))}
      </div>
      <Badge state="265 DISTINCT RUNS" />
    </section>
  );
}

export function EvaluatorDashboard({ navigate }: { navigate: Navigate }) {
  const mainTrust = finalStudy.records.find(r => r.stage === 'main' && r.partition === 'dirichlet' && r.fraction === .2 && r.method === 'trust');
  const adaptiveTrust = finalStudy.records.find(r => r.stage === 'adaptive' && r.method === 'trust');
  if (!mainTrust || !adaptiveTrust) throw new Error('Final-study Trust evidence is missing');
  const required = (value: number | null) => { if (value === null) throw new Error('Required study metric is missing'); return value; };
  const asPercent = (value: number | null) => value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`;
  return (
    <div className="evaluator-dashboard">
      <ProjectStorySimulation />
      <section className="evaluator-hero">
        <div className="evaluator-hero-copy">
          <div className="hero-state-row">
            <Badge state="TRUST-AWARE FEDERATED AI" />
            <span>HAM10000 · 10 simulated clients · 5 paired seeds</span>
          </div>
          <h1>The complete Fed-ResViT research system, at a glance.</h1>
          <p>
            Fed-ResViT fuses ResNet-50 and ViT-small representations, coordinates
            learning across ten simulated institutions, and limits poisoned client
            influence through distance-based trust and reputation-aware aggregation.
          </p>
          <div className="hero-evidence-boundary">
            <span>360°</span>
            <p><strong>One connected research view.</strong> Explore the clinical model, federated training, poisoning threat, Trust defense, comparative evaluation and reproducibility chain.</p>
          </div>
        </div>
        <ResearchOrbit navigate={navigate} />
      </section>

      <StudyStatusStrip />

      <section className="evaluator-lenses" aria-label="Six evaluator lenses">
        {[
          ['clinical', Stethoscope, 'Clinical lens', 'Seven HAM10000 classes', 'Dermoscopic image workflow, preprocessing and seven-class probability analysis.'],
          ['federation', Network, 'Federation lens', '10 clients · 30 rounds', 'Two local epochs per round across balanced and Dirichlet α=0.5 partitions.'],
          ['security', Target, 'Threat lens', 'MEL · BCC · AKIEC → NV', 'Static label flipping plus a defense-aware adaptive update blend.'],
          ['security', ShieldCheck, 'Defense lens', '5 comparison methods', 'FedAvg, Krum, Trimmed Mean, coordinate Median and Trust.'],
          ['results', Activity, 'Results lens', 'Notebook-aligned analytics', 'Convergence, robustness, class behavior, Trust dynamics and statistics.'],
          ['reproducibility', Database, 'Evidence lens', 'Reproducible experiment design', 'Configuration, manifests, round histories, predictions, reports and checkpoints.'],
        ].map(([page, Icon, label, value, detail]) => (
          <button key={label as string} onClick={() => navigate(page as string)}>
            <Icon size={21} />
            <span>{label as string}</span>
            <strong>{value as string}</strong>
            <small>{detail as string}</small>
            <ArrowRight size={15} />
          </button>
        ))}
      </section>

      <div className="evaluator-grid evaluator-grid-model">
        <Panel title="Hybrid intelligence, one dermoscopic image" className="evaluator-model-panel">
          <OverviewHybridSimulation />
        </Panel>
        <Panel title="The experiment, in one frame" className="evaluator-protocol-panel">
          <dl className="protocol-ledger">
            {[
              ['Dataset', 'HAM10000'], ['Split', 'Lesion-disjoint ≈ 70:15:15'],
              ['Seeds', '42 · 43 · 44 · 45 · 46'], ['Rounds', '30 × 2 local epochs'],
              ['Fractions', '0% · 10% · 20% · 30%'], ['Batch', '16 · TTA enabled'],
              ['Main', '200 completed'], ['Adaptive', '25 completed'], ['Sensitivity', '40 completed'],
            ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <button className="text-btn" onClick={() => navigate('studio')}>Open experiment matrix <ArrowRight size={15} /></button>
        </Panel>
      </div>

      <section className="research-storyline" aria-label="Fed-ResViT research workflow">
        <div className="storyline-heading">
          <div><h2>From lesion image to research evidence</h2><p>The complete scientific path from local data to comparative evaluation.</p></div>
          <Badge state="FED-RESVIT WORKFLOW" />
        </div>
        <div className="storyline-flow">
          {[
            ['01', 'HAM10000', 'Seven lesion classes'],
            ['02', 'Local learning', 'Ten client partitions'],
            ['03', 'Poisoning', 'Malignant labels → NV'],
            ['04', 'Update defense', 'Robust aggregation + Trust'],
            ['05', 'Evaluation', 'Performance + security'],
              ['06', 'Evidence', 'Required verification chain'],
          ].map(([n, title, sub], i) => (
            <div key={n} className="storyline-step">
              <span>{n}</span><strong>{title}</strong><small>{sub}</small>
              {i < 5 && <ArrowRight size={17} />}
            </div>
          ))}
        </div>
      </section>

      <div className="evaluator-grid evaluator-grid-evidence">
        <Panel title="Five aggregators under the same protocol">
          <div className="method-spectrum">
            {methods.map((method, i) => (
              <button key={method} onClick={() => navigate('security')}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{methodNames[method]}</strong>
                <small>{method === 'trust' ? 'Proposed trust-aware defense' : method === 'fedavg' ? 'Non-robust reference' : 'Robust baseline'}</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Main-study results · Dirichlet, 20% malicious" className="demo-lab-panel">
          <div className="demo-lab-heading"><Badge state="EXECUTED · n=5" /><span>Mean test metrics across seeds 42–46</span></div>
          <div className="demo-bars">
            {[
              ['Accuracy', required(mainTrust.accuracy[0]) * 100, '#5545DA'], ['Macro-F1', required(mainTrust.macro_f1[0]) * 100, '#19B8C7'],
              ['Malignant recall', required(mainTrust.malignant_recall[0]) * 100, '#148664'], ['ASR', required(mainTrust.asr[0]) * 100, '#DF6949'],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <span>{label as string}</span><div><i style={{ width: `${value}%`, background: color as string }} /></div><strong>{Number(value).toFixed(2)}%</strong>
              </div>
            ))}
          </div>
          <p>Trust-aware aggregation under Dirichlet α=0.5 at 20% malicious clients. Main-study result, five completed seeds. The adaptive and sensitivity results are available as separate comparisons.</p>
          <p>Under the adaptive attack, Trust ASR reaches {asPercent(adaptiveTrust.asr[0])} and its final-window malicious-client detection is {asPercent(adaptiveTrust.detection_rate[0])}. Inspect that stage before judging robustness.</p>
          <button className="text-btn" onClick={() => navigate('results')}>Explore the results workspace <ArrowRight size={15} /></button>
        </Panel>
      </div>

      <section className="evaluator-close">
        <div>
          <FlaskConical size={26} />
          <h2>A complete scientific narrative</h2>
          <p>Inspect the model recipe, experimental matrix, threat assumptions, Trust equations, comparative analysis, recovery design and research evidence structure from one connected application.</p>
        </div>
        <div className="evaluator-close-actions">
          <button className="primary-btn" onClick={() => navigate('reproducibility')}>Trace the methodology <ArrowRight size={16} /></button>
          <button className="hero-secondary" onClick={() => navigate('research')}>Review limitations</button>
        </div>
      </section>
    </div>
  );
}

function ResearchOrbit({ navigate }: { navigate: Navigate }) {
  const nodes = [
    { x: 245, y: 52, label: 'CLINICAL', page: 'clinical', value: '7 classes', detail: 'Inspect dermoscopic inputs, preprocessing and seven-class model probabilities.', facts: ['Image workflow','Class probabilities','Research disclaimer'] },
    { x: 405, y: 128, label: 'FEDERATION', page: 'federation', value: '10 clients', detail: 'Follow local training, model updates and thirty global communication rounds.', facts: ['10 clients','30 rounds','2 partitions'] },
    { x: 405, y: 300, label: 'SECURITY', page: 'security', value: '2 attacks', detail: 'Challenge the system with targeted label flipping and adaptive update blending.', facts: ['MEL/BCC/AKIEC → NV','Trust scores','Client flags'] },
    { x: 245, y: 378, label: 'EVIDENCE', page: 'reproducibility', value: 'traceable', detail: 'Trace every result to its configuration, seed, round history and saved artifact.', facts: ['Manifests','Checkpoints','Prediction files'] },
    { x: 85, y: 300, label: 'RESULTS', page: 'results', value: '5 methods', detail: 'Compare convergence, robustness, class behavior and paired-seed statistics.', facts: ['Convergence','Robustness','Statistics'] },
    { x: 85, y: 128, label: 'EXPERIMENTS', page: 'studio', value: '265 runs', detail: 'Explore the completed main, adaptive-attack and Trust-sensitivity experiment matrices.', facts: ['200 main','25 adaptive','40 sensitivity'] },
  ];
  const [selected, setSelected] = useState(1);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSelected((value) => (value + 1) % nodes.length), 2400);
    return () => window.clearInterval(timer);
  }, [running, nodes.length]);
  const focus = nodes[selected];
  return (
    <div className={`research-orbit ${running ? 'running' : ''}`}>
      <svg viewBox="0 0 490 430" role="group" aria-label="Interactive 360-degree Fed-ResViT research map">
        <defs>
          <linearGradient id="orbitSweep" x1="0" x2="1"><stop stopColor="#8F80FF"/><stop offset="1" stopColor="#2FC2CF"/></linearGradient>
          <filter id="orbitGlow"><feGaussianBlur stdDeviation="5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="245" cy="215" r="153" className="orbit-ring" />
        <circle cx="245" cy="215" r="102" className="orbit-ring inner" />
        <circle cx="245" cy="215" r="128" className="orbit-energy" pathLength="100" />
        {nodes.map((node, index) => (
          <g key={node.label} role="button" tabIndex={0} aria-label={`Inspect ${node.label.toLowerCase()} research lens`} aria-pressed={selected === index} onClick={() => setSelected(index)} onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(index); }
          }} className={`orbit-node ${selected === index ? 'selected' : ''}`}>
            <line x1="245" y1="215" x2={node.x} y2={node.y} />
            <circle cx={node.x} cy={node.y} r="41" />
            <text x={node.x} y={node.y - 3} textAnchor="middle">{node.label}</text>
            <text x={node.x} y={node.y + 14} textAnchor="middle" className="orbit-value">{node.value}</text>
            {selected === index && <circle cx={node.x} cy={node.y} r="49" className="orbit-selection" filter="url(#orbitGlow)" />}
          </g>
        ))}
        <g className="orbit-core">
          <circle cx="245" cy="215" r="73" />
          <circle cx="245" cy="215" r="62" className="orbit-core-ring" />
          <text x="245" y="197" textAnchor="middle">Fed-ResViT</text>
          <text x="245" y="220" textAnchor="middle" className="orbit-core-sub">{focus.label}</text>
          <text x="245" y="240" textAnchor="middle" className="orbit-core-meta">{focus.value.toUpperCase()}</text>
        </g>
      </svg>
      <div className="orbit-inspector">
        <div><span>ACTIVE RESEARCH LENS · {selected + 1} / 6</span><strong>{focus.label}</strong><p>{focus.detail}</p><div className="orbit-facts">{focus.facts.map((fact)=><i key={fact}>{fact}</i>)}</div></div>
        <div className="orbit-actions"><button className="orbit-play" onClick={()=>setRunning((value)=>!value)}>{running?<Pause size={14}/>:<Play size={14}/>} {running?'Pause':'Auto explore'}</button><button onClick={() => navigate(focus.page)}>Open workspace <ArrowRight size={14}/></button></div>
      </div>
    </div>
  );
}

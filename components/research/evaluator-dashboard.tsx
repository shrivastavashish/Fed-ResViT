/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG research nodes support keyboard activation. */
'use client';
import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Database,
  FlaskConical,
  Network,
  ScanSearch,
  ShieldCheck,
  Stethoscope,
  Target,
} from 'lucide-react';
import { Badge, Note, Panel } from './common';
import { ProjectStorySimulation } from './project-story-simulation';
import { methodNames, methods } from '@/lib/protocol';
import { classes } from '@/lib/project';

type Navigate = (page: string, tab?: string) => void;

export function StudyStatusStrip({ compact = false }: { compact?: boolean }) {
  const stages = [
    ['Main comparison', 200, 'Five methods · five seeds · two partitions'],
    ['Adaptive attack', 25, 'Five methods · five seeds · Dirichlet'],
    ['Trust sensitivity', 45, 'Nine settings · five paired seeds'],
  ] as const;
  return (
    <section className={'study-status-strip ' + (compact ? 'compact' : '')} aria-label="Fed-ResViT experiment design">
      <div className="study-status-label">
        <span className="status-beacon" />
        <div>
          <strong>Research design</strong>
          <small>Complete notebook experiment matrix</small>
        </div>
      </div>
      <div className="study-status-stages">
        {stages.map(([label, count, note]) => (
          <div key={label} className="study-stage-meter">
            <div><span>{label}</span><strong>{count} runs</strong></div>
            <div className="study-stage-track" aria-label={`${label}: ${count} configured runs`}>
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
          <div className="mini-architecture" aria-label="ResNet-50 and ViT-small hybrid architecture">
            <div className="mini-input"><ScanSearch size={24} /><span>224 × 224 RGB</span></div>
            <div className="mini-branch cnn"><strong>ResNet-50</strong><span>2,048 pooled features</span></div>
            <div className="mini-branch vit"><strong>ViT-small / patch16</strong><span>384-dimensional representation</span></div>
            <div className="mini-fusion"><BrainCircuit size={25} /><strong>2,432 → 768</strong><span>fusion + ReLU + dropout 0.20</span></div>
            <div className="mini-output"><strong>7 logits</strong><span>softmax probabilities</span></div>
          </div>
          <div className="class-ribbon">
            {classes.map((name) => <span key={name}>{name}</span>)}
          </div>
          <Note>The classification panel uses clearly marked illustrative probabilities. The architecture and preprocessing follow the latest notebook configuration.</Note>
        </Panel>
        <Panel title="The experiment, in one frame" className="evaluator-protocol-panel">
          <dl className="protocol-ledger">
            {[
              ['Dataset', 'HAM10000'], ['Split', 'Lesion-disjoint ≈ 70:15:15'],
              ['Seeds', '42 · 43 · 44 · 45 · 46'], ['Rounds', '30 × 2 local epochs'],
              ['Fractions', '0% · 10% · 20% · 30%'], ['Batch', '16 · TTA enabled'],
              ['Main', '200 configured'], ['Full design', '265 distinct runs'],
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
        <Panel title="Research results explorer" className="demo-lab-panel">
          <div className="demo-lab-heading"><Badge state="ILLUSTRATIVE DATA" /><span>Presentation dataset</span></div>
          <div className="demo-bars">
            {[
              ['Accuracy', 84, '#5545DA'], ['Macro-F1', 69, '#19B8C7'],
              ['Malignant recall', 61, '#148664'], ['ASR', 28, '#DF6949'],
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <span>{label as string}</span><div><i style={{ width: `${value}%`, background: color as string }} /></div><strong>{value}%</strong>
              </div>
            ))}
          </div>
          <p>Illustrative values demonstrate the final analytical experience and are clearly separated from experimental measurements.</p>
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
    { x: 245, y: 52, label: 'CLINICAL', page: 'clinical', value: '7 classes', detail: 'Inspect dermoscopic inputs, preprocessing and seven-class model probabilities.' },
    { x: 405, y: 128, label: 'FEDERATION', page: 'federation', value: '10 clients', detail: 'Follow local training, model updates and thirty global communication rounds.' },
    { x: 405, y: 300, label: 'SECURITY', page: 'security', value: '2 attacks', detail: 'Challenge the system with targeted label flipping and adaptive update blending.' },
    { x: 245, y: 378, label: 'EVIDENCE', page: 'reproducibility', value: 'traceable', detail: 'Trace every result to its configuration, seed, round history and saved artifact.' },
    { x: 85, y: 300, label: 'RESULTS', page: 'results', value: '5 methods', detail: 'Compare convergence, robustness, class behavior and paired-seed statistics.' },
    { x: 85, y: 128, label: 'EXPERIMENTS', page: 'studio', value: '265 runs', detail: 'Explore the main, adaptive-attack and Trust-sensitivity experiment matrices.' },
  ];
  const [selected, setSelected] = useState(1);
  const focus = nodes[selected];
  return (
    <div className="research-orbit">
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
        <div><span>ACTIVE RESEARCH LENS</span><strong>{focus.label}</strong><p>{focus.detail}</p></div>
        <button onClick={() => navigate(focus.page)}>Open workspace <ArrowRight size={14}/></button>
      </div>
    </div>
  );
}

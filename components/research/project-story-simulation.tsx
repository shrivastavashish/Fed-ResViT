/* oxlint-disable jsx-a11y/prefer-tag-over-role -- interactive SVG nodes require SVG semantics. */
'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Badge } from './common';

const stages = [
  ['Dermoscopic image', 'A lesion image enters the same 224 × 224 research pipeline used by every client.'],
  ['Hybrid representation', 'ResNet-50 learns local morphology while ViT-small models wider spatial context.'],
  ['Private local learning', 'Ten simulated institutions train locally; images never move to the server.'],
  ['Targeted poisoning', 'Selected clients flip MEL, BCC and AKIEC labels toward benign NV.'],
  ['Update comparison', 'The server compares client deltas around a geometric-median reference.'],
  ['Trust intelligence', 'RMS distance, MAD thresholds and reputation determine effective influence.'],
  ['Robust global model', 'Trust-aware aggregation limits suspicious influence and updates the shared model.'],
  ['Scientific evidence', 'Performance, malignant recall, ASR and detector quality are compared across methods.'],
] as const;

export function ProjectStorySimulation() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % stages.length), 1800);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <section className="project-story" aria-label="Interactive Fed-ResViT project explanation">
      <div className="project-story-head">
        <div>
          <Badge state="INTERACTIVE RESEARCH STORY" />
          <h1>How Fed-ResViT protects collaborative skin-lesion learning</h1>
          <p>Follow one connected path from dermoscopic evidence to a defended global model and auditable research results.</p>
        </div>
        <div className="story-controls">
          <button onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => { setStep(0); setPlaying(false); }}><RotateCcw size={16} /> Reset</button>
        </div>
      </div>

      <div className="project-story-stage">
        <svg viewBox="0 0 1160 410" role="img" aria-label={`${stages[step][0]}: ${stages[step][1]}`}>
          <defs>
            <linearGradient id="storyFlow" x1="0" x2="1"><stop stopColor="#8F80FF"/><stop offset="1" stopColor="#2FC2CF"/></linearGradient>
            <filter id="storyGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <path className="story-rail" d="M88 210 H1072" />
          <path className="story-progress" d="M88 210 H1072" pathLength="7" style={{ strokeDasharray: `${step} 7` }} />
          {stages.map(([title], index) => {
            const x = 88 + index * 140.6;
            const active = index === step;
            const passed = index < step;
            return <g key={title} className={`story-node ${active ? 'active' : ''} ${passed ? 'passed' : ''}`} onClick={() => { setStep(index); setPlaying(false); }} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { setStep(index); setPlaying(false); } }}>
              <circle cx={x} cy="210" r={active ? 41 : 31} />
              <text x={x} y="215" textAnchor="middle">{String(index + 1).padStart(2, '0')}</text>
              <text x={x} y={index % 2 ? 285 : 132} textAnchor="middle" className="story-node-label">{title}</text>
              {active && <circle cx={x} cy="210" r="52" className="story-pulse" />}
            </g>;
          })}
          <g className="story-packet" style={{ transform: `translateX(${step * 140.6}px)` }} filter="url(#storyGlow)"><circle cx="88" cy="210" r="7" /></g>
        </svg>
        <div className="story-readout">
          <span>STEP {String(step + 1).padStart(2, '0')} / 08</span>
          <strong>{stages[step][0]}</strong>
          <p>{stages[step][1]}</p>
          <div className="story-readout-tags">
            {step === 1 && <><i>ResNet-50</i><i>ViT-small</i><i>Fusion 768</i></>}
            {step === 2 && <><i>10 clients</i><i>30 rounds</i><i>2 local epochs</i></>}
            {step === 3 && <><i>MEL → NV</i><i>BCC → NV</i><i>AKIEC → NV</i></>}
            {step === 5 && <><i>Geometric median</i><i>RMS distance</i><i>Reputation EMA</i></>}
            {![1,2,3,5].includes(step) && <><i>Fed-ResViT</i><i>Research workflow</i></>}
          </div>
        </div>
      </div>
      <div className="story-stepper" role="tablist" aria-label="Project simulation steps">
        {stages.map(([title], index) => <button role="tab" aria-selected={step === index} key={title} onClick={() => { setStep(index); setPlaying(false); }}><span>{index + 1}</span>{title}</button>)}
      </div>
    </section>
  );
}

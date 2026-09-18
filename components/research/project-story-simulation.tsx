/* oxlint-disable jsx-a11y/prefer-tag-over-role -- interactive SVG nodes require SVG semantics. */
'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Badge } from './common';
import { SimulationEvidence } from './simulation-evidence';

const stages = [
  { short: 'Lesion data', title: 'Lesion-disjoint evidence preparation', detail: 'HAM10000 is split by lesion identity before the seven-class image pipeline, preventing images of the same lesion from crossing train, validation and test sets.', formula: 'HAM10000 → lesion-aware 70:15:15 → 224 × 224 RGB', facts: ['7 lesion classes', 'ImageNet normalization', 'Strong augmentation'] },
  { short: 'Hybrid model', title: 'Local morphology meets global context', detail: 'ResNet-50 extracts local texture and border structure while ViT-small models long-range spatial relationships. Their representations are fused before seven-class prediction.', formula: '[2,048 CNN features ∥ 384 ViT features] → 768 → 7 logits', facts: ['ResNet-50', 'ViT-small / patch16', 'Partial fine-tuning'] },
  { short: 'Local learning', title: 'Ten clients learn without pooling images', detail: 'Each simulated institution receives the global weights, trains the same hybrid architecture locally for two epochs, and returns a model update rather than dermoscopic data.', formula: 'wᵢᵗ⁺¹ = LocalTrain(wᵗ, Dᵢ)  ·  Δᵢ = wᵢᵗ⁺¹ − wᵗ', facts: ['10 clients', '30 rounds', 'Balanced + Dirichlet α=0.5'] },
  { short: 'Poisoning', title: 'Malignant labels are redirected toward NV', detail: 'Under the targeted attack, malicious clients change MEL, BCC and AKIEC training labels to the benign NV target before creating their local updates.', formula: '{ MEL, BCC, AKIEC } → NV  ·  flip probability = 1.0', facts: ['0–30% malicious', 'Targeted label flipping', 'Adaptive blend study'] },
  { short: 'Robust reference', title: 'Updates are compared around a geometric median', detail: 'The server estimates a robust reference from the client updates and measures each floating-state delta with RMS-normalized distance.', formula: 'Dᵢ = ‖Δᵢ − wref‖₂ / √Nparams', facts: ['Geometric median', 'RMS distance', '3 reference iterations'] },
  { short: 'Trust defense', title: 'Distance becomes trust, memory and influence', detail: 'Median/MAD thresholds create a soft trust score. Reputation carries client history, and their product determines the update’s effective aggregation weight.', formula: 'φᵢ(Dᵢ)  ·  rᵢᵗ⁺¹ = 0.85rᵢᵗ + 0.15φᵢᵗ  ·  aᵢ = rᵢφᵢ', facts: ['Adaptive MAD thresholds', 'Soft trust φ', 'Five-round flag history'] },
  { short: 'Global evidence', title: 'The defended model is evaluated under matched conditions', detail: 'The updated global model is compared with FedAvg, Krum, Trimmed Mean and coordinate Median across paired seeds, partitions and attack fractions. The adaptive stage tests whether a defense-aware attacker can evade detection.', formula: 'Performance + malignant recall + ASR + detector quality', facts: ['265 distinct runs', '5 paired seeds', '3 study stages'] },
] as const;

const clientPositions = [[430,122],[480,100],[535,116],[566,160],[561,213],[526,250],[472,256],[426,230],[405,185],[410,148]] as const;
const stageFlow = [
  ['HAM10000 images + lesion IDs', 'Group-aware split and image preparation', 'Leakage-controlled train / validation / test sets'],
  ['224 × 224 dermoscopic image', 'Parallel CNN and Transformer encoding', 'Fused 768-dimensional representation'],
  ['Global weights + private client data', 'Two local epochs on ten clients', 'Ten model updates; no image transfer'],
  ['Malignant-source training labels', 'MEL, BCC and AKIEC relabelled as NV', 'Poisoned local model update'],
  ['Ten same-round model updates', 'Geometric median + RMS distance', 'Robust reference and client distances'],
  ['Distance + previous reputation', 'MAD thresholds and reputation EMA', 'Trust-weighted client contribution'],
  ['Updated global classifier', 'Matched evaluation across methods and seeds', 'Performance, safety, security and evidence'],
] as const;

export function ProjectStorySimulation() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % stages.length), 2200);
    return () => window.clearInterval(timer);
  }, [playing]);
  const active = (index: number) => `science-module ${step === index ? 'active' : ''} ${step > index ? 'complete' : ''}`;
  const select = (index: number) => { setStep(index); setPlaying(false); };

  return <section className={`project-story ${playing ? 'simulating' : ''}`} aria-label="Interactive Fed-ResViT scientific system simulation">
    <div className="project-story-head">
      <div><Badge state="FED-RESVIT SCIENTIFIC SYSTEM"/><h1>Trust-aware federated learning for robust skin lesion classification</h1><p>Explore how hybrid visual intelligence, image-local collaboration and update-level Trust respond to targeted data poisoning across three completed study stages.</p></div>
      <div className="story-controls"><button onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause scientific simulation' : 'Play scientific simulation'}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'Pause' : 'Run simulation'}</button><button onClick={() => { setStep(0); setPlaying(false); }}><RotateCcw size={16}/> Reset</button></div>
    </div>
    <div className="science-console">
      <div className="science-canvas">
        <div className="science-canvas-label"><span>END-TO-END SYSTEM MAP</span><b>Selected stage · {String(step + 1).padStart(2,'0')}</b></div>
        <svg viewBox="0 0 930 520" role="img" aria-label={`${stages[step].title}: ${stages[step].detail}`}>
          <defs><marker id="scienceArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#6f7eaa"/></marker><filter id="scienceGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <g className="science-links"><path d="M126 180 H188"/><path d="M280 144 H326"/><path d="M280 234 H326"/><path d="M394 182 H405"/><path d="M574 180 H628"/><path d="M700 180 H750"/><path d="M813 248 V345"/><path d="M487 342 V270" className="attack-link"/></g>
          <g className="science-data-stream"><circle cx="151" cy="180" r="3"/><circle cx="303" cy="144" r="3"/><circle cx="608" cy="180" r="3"/><circle cx="726" cy="180" r="3"/><circle cx="813" cy="294" r="3"/></g>
          <g className={active(0)} onClick={() => select(0)} role="button" tabIndex={0}><rect x="28" y="118" width="98" height="126" rx="14"/><circle cx="77" cy="166" r="26" className="lesion-ring"/><circle cx="77" cy="166" r="15" className="lesion-core"/><text x="77" y="214" textAnchor="middle">HAM10000</text><text x="77" y="230" textAnchor="middle" className="science-sub">lesion-disjoint split</text></g>
          <g className={active(1)} onClick={() => select(1)} role="button" tabIndex={0}><rect x="188" y="108" width="92" height="72" rx="12"/><text x="234" y="139" textAnchor="middle">ResNet-50</text><text x="234" y="158" textAnchor="middle" className="science-sub">local morphology</text><rect x="188" y="198" width="92" height="72" rx="12"/><text x="234" y="229" textAnchor="middle">ViT-small</text><text x="234" y="248" textAnchor="middle" className="science-sub">global context</text><rect x="326" y="138" width="68" height="88" rx="16"/><text x="360" y="178" textAnchor="middle">Fusion</text><text x="360" y="198" textAnchor="middle" className="science-sub">768</text></g>
          <g className={active(2)} onClick={() => select(2)} role="button" tabIndex={0}><circle cx="486" cy="180" r="88" className="federation-field"/><circle cx="486" cy="180" r="32" className="global-seed"/><text x="486" y="176" textAnchor="middle">Global</text><text x="486" y="193" textAnchor="middle" className="science-sub">round t</text>{clientPositions.map(([x,y],index)=><g key={index} className={`science-client ${index===6||index===8?'threat':''}`}><circle cx={x} cy={y} r="14"/><text x={x} y={y+3} textAnchor="middle">{index+1}</text></g>)}<text x="486" y="292" textAnchor="middle" className="science-label">10 PRIVATE CLIENT UPDATES</text></g>
          <g className={active(3)} onClick={() => select(3)} role="button" tabIndex={0}><rect x="407" y="342" width="160" height="82" rx="13" className="attack-box"/><text x="487" y="371" textAnchor="middle">Targeted poisoning</text><text x="487" y="393" textAnchor="middle" className="attack-text">MEL · BCC · AKIEC → NV</text><text x="487" y="411" textAnchor="middle" className="science-sub">malicious local data only</text></g>
          <g className={active(4)} onClick={() => select(4)} role="button" tabIndex={0}><rect x="628" y="112" width="72" height="136" rx="15"/><circle cx="664" cy="158" r="21" className="median-core"/><text x="664" y="199" textAnchor="middle">Geometric</text><text x="664" y="217" textAnchor="middle">median</text><text x="664" y="236" textAnchor="middle" className="science-sub">RMS distance</text></g>
          <g className={active(5)} onClick={() => select(5)} role="button" tabIndex={0}><rect x="750" y="112" width="126" height="136" rx="15"/><text x="813" y="141" textAnchor="middle">Trust intelligence</text><line x1="772" x2="854" y1="171" y2="171" className="trust-scale"/><circle cx="790" cy="171" r="6" className="safe-dot"/><circle cx="841" cy="171" r="6" className="risk-dot"/><text x="813" y="202" textAnchor="middle" className="science-sub">φ score + reputation</text><text x="813" y="224" textAnchor="middle" className="science-sub">effective weight aᵢ</text></g>
          <g className={active(6)} onClick={() => select(6)} role="button" tabIndex={0}><rect x="744" y="345" width="138" height="94" rx="15"/><text x="813" y="374" textAnchor="middle">Global evaluation</text><text x="813" y="398" textAnchor="middle" className="science-sub">Accuracy · Macro-F1</text><text x="813" y="416" textAnchor="middle" className="science-sub">Recall · ASR · detection</text></g>
          <circle className="science-packet" cx={[126,394,574,487,700,876,813][step]} cy={[180,182,180,330,180,180,330][step]} r="7" filter="url(#scienceGlow)"/>
        </svg>
        <div className="science-legend"><span><i className="honest"/>Honest update</span><span><i className="malicious"/>Malicious update · illustrative 20% assignment</span><span><i className="defense"/>Trust defense</span><span>Method flow · no per-client measured replay</span></div>
      </div>
      <aside className="science-readout" aria-live="polite"><div className="science-readout-index"><span>{String(step+1).padStart(2,'0')}</span><small>OF {String(stages.length).padStart(2,'0')}</small></div><h2>{stages[step].title}</h2><p>{stages[step].detail}</p><code>{stages[step].formula}</code><div className="science-facts">{stages[step].facts.map((fact)=><span key={fact}>{fact}</span>)}</div><div className="science-status"><i/><span>{playing?'Simulation running at 1×':'Select a stage or run the simulation'}</span></div></aside>
    </div>
    <div className="science-explainer" aria-label="Current stage input process and output">
      {['Input','Scientific operation','Output / evidence'].map((label,index)=><div key={label}><span>{label}</span><strong>{stageFlow[step][index]}</strong>{index<2&&<b>→</b>}</div>)}
    </div>
    <div className="story-stepper" role="tablist" aria-label="Fed-ResViT scientific stages">{stages.map((stage,index)=><button role="tab" aria-selected={step===index} key={stage.short} onClick={()=>select(index)}><span>{String(index+1).padStart(2,'0')}</span>{stage.short}</button>)}</div>
    <SimulationEvidence title="What the completed experiments measured" />
  </section>;
}

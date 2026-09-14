/* oxlint-disable jsx-a11y/prefer-tag-over-role -- scientific SVG uses a descriptive image role. */
'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { Badge, Note } from './common';

const phases = [
  ['Poison labels', 'MEL, BCC and AKIEC labels are changed to NV on two illustrative malicious clients.'],
  ['Train locally', 'All ten clients create local model updates; raw dermoscopic images remain local.'],
  ['Find reference', 'The server estimates a geometric median from the same-round client updates.'],
  ['Measure distance', 'RMS-normalized distance reveals how far each update lies from the robust reference.'],
  ['Score trust', 'Median/MAD thresholds convert distance into soft trust φ; reputation carries history.'],
  ['Limit influence', 'Effective weight a = reputation × trust reduces suspicious contributions before aggregation.'],
] as const;
const distances = [.28,.34,.31,.37,.33,.3,.83,.29,.76,.35];

export function SecuritySimulation() {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [client, setClient] = useState(6);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setPhase((value) => (value + 1) % phases.length), 1900);
    return () => clearInterval(timer);
  }, [playing]);
  const malicious = client === 6 || client === 8;
  const score = malicious ? (client === 6 ? .18 : .31) : .96;
  return <section className="security-story">
    <div className="security-story-head">
      <div><Badge state="ATTACK-TO-DEFENSE SIMULATION"/><h2>See how a poisoned client loses influence</h2><p>A connected demonstration of the latest notebook’s targeted attack and Trust pipeline.</p></div>
      <div className="story-controls"><button onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'Pause' : 'Play'}</button><button onClick={() => {setPhase(0);setPlaying(false);}}><RotateCcw size={16}/> Reset</button></div>
    </div>
    <div className="security-sim-grid">
      <div className="security-network">
        <svg viewBox="0 0 760 390" role="img" aria-label={phases[phase][1]}>
          <defs><linearGradient id="safeFlow" x1="0" x2="1"><stop stopColor="#6B5CF6"/><stop offset="1" stopColor="#19B8C7"/></linearGradient></defs>
          <path d="M76 92 C250 92 260 195 382 195 C520 195 540 92 686 92" className="security-path"/>
          <path d="M76 300 C250 300 260 195 382 195 C520 195 540 300 686 300" className="security-path"/>
          <g className={phase === 0 ? 'security-focus' : ''}><rect x="32" y="54" width="130" height="76" rx="14"/><text x="97" y="82" textAnchor="middle">MEL · BCC · AKIEC</text><text x="97" y="105" textAnchor="middle" className="security-sub">labels → NV</text></g>
          <g className={phase === 1 ? 'security-focus' : ''}><rect x="32" y="262" width="130" height="76" rx="14"/><text x="97" y="290" textAnchor="middle">10 clients</text><text x="97" y="313" textAnchor="middle" className="security-sub">local updates Δᵢ</text></g>
          <g className={phase === 2 ? 'security-focus' : ''}><circle cx="382" cy="195" r="58"/><text x="382" y="190" textAnchor="middle">Geometric</text><text x="382" y="211" textAnchor="middle">median</text></g>
          <g className={phase >= 3 && phase <= 4 ? 'security-focus' : ''}><rect x="514" y="54" width="164" height="76" rx="14"/><text x="596" y="82" textAnchor="middle">Distance + MAD</text><text x="596" y="105" textAnchor="middle" className="security-sub">Dᵢ → φᵢ → rᵢ</text></g>
          <g className={phase === 5 ? 'security-focus' : ''}><rect x="514" y="262" width="164" height="76" rx="14"/><text x="596" y="290" textAnchor="middle">Global model</text><text x="596" y="313" textAnchor="middle" className="security-sub">Σ normalized aᵢΔᵢ</text></g>
          <circle className="security-packet" cx={[76,190,382,502,596,686][phase]} cy={phase % 2 ? 300 : 92} r="8"/>
        </svg>
        <div className="security-phase"><span>PHASE {phase + 1} / 6</span><strong>{phases[phase][0]}</strong><p>{phases[phase][1]}</p></div>
      </div>
      <div className="security-clients">
        <div className="security-client-head"><span>CLIENT UPDATE DISTANCE</span><Badge state="ILLUSTRATIVE DATA"/></div>
        {distances.map((distance,index) => <button key={index} className={`${client===index?'active':''} ${(index===6||index===8)?'malicious':''}`} onClick={() => setClient(index)}><span>C{index+1}</span><div><i style={{width:`${distance*100}%`}}/><b style={{left:'58%'}}/></div><output>{distance.toFixed(2)}</output></button>)}
        <div className="security-client-detail"><ShieldCheck size={20}/><div><strong>Client {client+1} · {malicious ? 'suspicious update' : 'trusted update'}</strong><span>φ {score.toFixed(2)} · reputation {malicious ? '.62' : '.94'} · effective weight {malicious ? '.11' : '.90'}</span></div></div>
      </div>
    </div>
    <div className="security-phase-tabs">{phases.map(([title],index)=><button key={title} aria-pressed={phase===index} onClick={()=>{setPhase(index);setPlaying(false)}}><span>{index+1}</span>{title}</button>)}</div>
    <Note>Values in this simulation explain the mechanism and are illustrative. Measured distances, scores, flags and contributions will be loaded from each run’s round history.</Note>
  </section>;
}

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- scientific SVG plots have descriptive image semantics. */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge, Note, Panel, Pick, TabBar } from './common';
import { methodNames, methods } from '@/lib/protocol';
import study from '@/lib/main-study-results.json';

type Measure = [number | null, number | null, number];
type Row = (typeof study.records)[number];
type Metric = 'accuracy' | 'macro_precision' | 'macro_recall' | 'macro_f1' | 'malignant_recall' | 'asr' | 'detection_rate' | 'false_positive_rate';
const tabs = ['Method comparison', 'Robustness sweep', 'Round convergence', 'Detection', 'Confusion matrix', 'Class performance', 'Statistics & evidence'];
const palette: Record<string,string> = { fedavg:'#DF6949', krum:'#8F80FF', trimmed_mean:'#19B8C7', coordinate_median:'#148664', trust:'#5545DA' };
const classCodes = ['NV','MEL','BKL','BCC','AKIEC','VASC','DF'];
const fractions = [0,0.1,0.2,0.3];
const labels: Record<Metric,string> = {accuracy:'Accuracy',macro_precision:'Macro precision',macro_recall:'Macro recall',macro_f1:'Macro-F1',malignant_recall:'Malignant binary recall',asr:'Attack success rate',detection_rate:'Detection rate',false_positive_rate:'False-positive rate'};
const pct = (v:number|null|undefined) => v == null ? '—' : `${(v*100).toFixed(2)}%`;
const measure = (r:Row,m:Metric) => r[m] as Measure;
const mean = (r:Row,m:Metric) => measure(r,m)[0];
const fmt = (r:Row,m:Metric) => {const [v,sd,n]=measure(r,m);return v == null ? '—' : `${pct(v)} ± ${pct(sd)} · n=${n}`};
const row = (p:string,f:number,m:string) => study.records.find(r=>r.partition===p&&r.fraction===f&&r.method===m)!;

function EvidenceNote({cells}: {cells:string}) {
  return <div className="main-evidence-note"><Badge state="EXECUTED · MAIN STUDY"/><span>Source: FedResViT (2).ipynb · {cells} · 200 completed runs · fixed lesion-disjoint test split</span></div>;
}
function Bars({partition,fraction,metric}:{partition:string;fraction:number;metric:Metric}) {
  const data=methods.map(m=>({method:m,value:mean(row(partition,fraction,m),metric)}));
  return <div className="main-bar-list">{data.map(({method,value})=><div key={method} className="main-bar-row"><strong>{methodNames[method]}</strong><div className="main-bar-track"><i style={{width:`${Math.max(0,(value??0)*100)}%`,background:palette[method]}}/></div><output>{pct(value)}</output></div>)}</div>;
}
function Comparison({partition,fraction}:{partition:string;fraction:number}) {
  const base=row(partition,fraction,'fedavg'),trust=row(partition,fraction,'trust');
  const asrDifference=fraction ? ((mean(base,'asr')??0)-(mean(trust,'asr')??0))*100 : null;
  return <div className="main-results-stack">
    <div className="main-feature-grid">
      <Panel title="Measured comparison · Trust vs FedAvg" action={<Badge state="5 PAIRED SEEDS"/>}>
        <div className="main-key-figures">
          <div><span>Trust Macro-F1</span><strong>{pct(mean(trust,'macro_f1'))}</strong><small>FedAvg {pct(mean(base,'macro_f1'))}</small></div>
          <div><span>Trust malignant recall</span><strong>{pct(mean(trust,'malignant_recall'))}</strong><small>FedAvg {pct(mean(base,'malignant_recall'))}</small></div>
          <div><span>{fraction ? 'ASR reduction vs FedAvg' : 'Clean accuracy · Trust'}</span><strong>{asrDifference==null?pct(mean(trust,'accuracy')):`${asrDifference.toFixed(2)} pp`}</strong><small>{fraction ? `${pct(mean(base,'asr'))} → ${pct(mean(trust,'asr'))}` : `FedAvg ${pct(mean(base,'accuracy'))}`}</small></div>
        </div>
        <Note>These are test-set means across five seeds. The two partitions are separate conditions; the same fixed test split is reused. Malignant recall is a classification measure. Target avoidance is 1 − ASR and is not clinical safety.</Note>
      </Panel>
      <Panel title="Read the trade-off">
        <div className="main-interpretation"><strong>{partition==='dirichlet'&&fraction===0.3?'Trust weakens at the highest non-IID attack level.':'The defense must beat robust baselines, not only FedAvg.'}</strong>
          <p>{partition==='dirichlet'&&fraction===0.3?'With 30% malicious clients, Trust ASR is 53.68% and detection is 6.67%. Coordinate-wise Median and Trimmed Mean have lower ASR in this condition.':'Compare all five methods below. Lower ASR can come with changes in accuracy, F1, malignant recall and false-positive flags.'}</p>
        </div>
        <Bars partition={partition} fraction={fraction} metric={fraction?'asr':'macro_f1'}/>
      </Panel>
    </div>
    <Panel title="Five-method endpoint results" action={<Badge state="MEAN ± SD · n=5"/>}>
      <div className="revision-table-wrap"><table className="revision-table main-results-table"><caption>{partition==='dirichlet'?'Dirichlet α=0.5':'Stratified-balanced'} · {Math.round(fraction*100)}% malicious clients · test evaluation</caption><thead><tr><th>Method</th>{(['accuracy','macro_precision','macro_recall','macro_f1','malignant_recall','asr','detection_rate','false_positive_rate'] as Metric[]).map(m=><th key={m}>{labels[m]}</th>)}</tr></thead><tbody>{methods.map(m=>{const r=row(partition,fraction,m);return <tr key={m}><th><span className="main-method-dot" style={{background:palette[m]}}/>{methodNames[m]}</th>{(['accuracy','macro_precision','macro_recall','macro_f1','malignant_recall','asr','detection_rate','false_positive_rate'] as Metric[]).map(k=><td key={k}>{fmt(r,k)}</td>)}</tr>})}</tbody></table></div>
      <p className="main-table-caption">Detection and false-positive rates are recorded for Trust only. ASR is undefined in the clean condition. “—” means the notebook did not report that measure for this method and condition.</p>
      <EvidenceNote cells="§21 summary and §34 consolidated results"/>
    </Panel>
  </div>;
}
function Robustness({partition}:{partition:string}) {
  const [metric,setMetric]=useState<Metric>('asr');
  const [focus,setFocus]=useState<string>('trust');
  const available:Metric[]=['asr','accuracy','macro_f1','malignant_recall'];
  const W=760,H=290,left=54,right=38,top=28,bottom=54;
  const x=(i:number)=>left+i*(W-left-right)/3,y=(v:number)=>top+(1-v)*(H-top-bottom);
  return <Panel title="Robustness across the completed malicious-client sweep" action={<Badge state="MEASURED ENDPOINTS"/>}>
    <div className="main-metric-switch" role="tablist" aria-label="Robustness metric">{available.map(m=><button key={m} role="tab" aria-selected={metric===m} onClick={()=>setMetric(m)}>{labels[m]}</button>)}</div>
    <div className="main-plot-scroll"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${labels[metric]} for five methods across completed malicious-client conditions`}>
      {[0,.25,.5,.75,1].map(v=><g key={v}><line x1={left} x2={W-right} y1={y(v)} y2={y(v)} stroke="#e4e8f1"/><text x={left-9} y={y(v)+4} textAnchor="end" fill="#66718d" fontSize="10">{Math.round(v*100)}%</text></g>)}
      {fractions.map((f,i)=><text key={f} x={x(i)} y={H-18} textAnchor="middle" fill="#465477" fontSize="11">{Math.round(f*100)}% malicious</text>)}
      {methods.map(m=>{const vals=fractions.map(f=>mean(row(partition,f,m),metric));const points=vals.flatMap((v,i)=>v==null?[]:[`${x(i)},${y(v)}`]);return <g key={m} opacity={m===focus?1:.34}>{points.length>1&&<polyline points={points.join(' ')} fill="none" stroke={palette[m]} strokeWidth={m===focus?4:2}/>} {vals.map((v,i)=>v==null?null:<g key={i}><circle cx={x(i)} cy={y(v)} r={m===focus?6:4} fill={palette[m]}/><title>{methodNames[m]} · {Math.round(fractions[i]*100)}% · {pct(v)}</title>{m===focus&&<text x={x(i)} y={y(v)-15} textAnchor="middle" fill={palette[m]} fontSize="11" fontWeight="750">{pct(v)}</text>}</g>)}</g>})}
    </svg></div>
    <div className="main-method-selector" aria-label="Highlight aggregation method">{methods.map(m=><button key={m} aria-pressed={focus===m} onClick={()=>setFocus(m)}><i style={{background:palette[m]}}/>{methodNames[m]}</button>)}</div>
    <div className="revision-table-wrap"><table className="revision-table main-sweep-table"><caption>Exact plotted endpoints · mean ± SD across five seeds</caption><thead><tr><th>Method</th>{fractions.map(f=><th key={f}>{Math.round(f*100)}% malicious</th>)}</tr></thead><tbody>{methods.map(m=><tr key={m}><th>{methodNames[m]}</th>{fractions.map(f=><td key={f}>{fmt(row(partition,f,m),metric)}</td>)}</tr>)}</tbody></table></div>
    <Note>Each plotted endpoint is the mean of five completed runs. No point is interpolated. Clean ASR is undefined because there is no attack. The Dirichlet and balanced conditions must be interpreted separately.</Note>
    <EvidenceNote cells="§24 robustness and §34 consolidated results"/>
  </Panel>;
}
function Convergence({fraction}:{fraction:number}) {
  const [metric,setMetric]=useState<'macro-f1'|'malignant-recall'>('macro-f1');
  return <Panel title="Round-by-round validation trajectory" action={<Badge state="NOTEBOOK FIGURE"/>}>
    <div className="main-metric-switch" role="tablist" aria-label="Convergence metric"><button role="tab" aria-selected={metric==='macro-f1'} onClick={()=>setMetric('macro-f1')}>Validation Macro-F1</button><button role="tab" aria-selected={metric==='malignant-recall'} onClick={()=>setMetric('malignant-recall')}>Validation malignant recall</button></div>
    <Image className="main-notebook-figure" src={`/evidence/main-study/${metric}-${Math.round(fraction*100)}.png`} width={1200} height={600} alt={`Executed main-study ${metric} trajectory over 30 rounds at ${Math.round(fraction*100)}% malicious clients`}/>
    <Note>This is the notebook’s aggregate convergence figure for the selected malicious fraction. It combines the two partition conditions in each method trajectory, so use the partition-specific endpoint tables for partition comparisons. The underlying per-round CSV has not been imported into this site.</Note>
    <EvidenceNote cells="§22 aggregate convergence"/>
  </Panel>;
}
function Detection({partition}:{partition:string}) {
  return <div className="main-feature-grid"><Panel title="Trust detector response" action={<Badge state="EXECUTED · TRUST ONLY"/>}>
    <div className="main-detection-grid">{fractions.map(f=>{const r=row(partition,f,'trust');return <div key={f}><strong>{Math.round(f*100)}%</strong><span>malicious clients</span><dl><dt>Detection</dt><dd>{pct(mean(r,'detection_rate'))}</dd><dt>False-positive rate</dt><dd>{pct(mean(r,'false_positive_rate'))}</dd></dl></div>})}</div>
    <EvidenceNote cells="§21 summary"/>
  </Panel><Panel title="Detector interpretation"><p>Detection counts malicious clients flagged by the final round’s rolling Trust window. False-positive rate counts honest clients flagged by that same rule. These rates are averaged across five seeds; they are not per-image diagnostic sensitivity and specificity.</p><Note>At 0% malicious clients, detection is undefined. Trust can still falsely flag honest updates, especially under heterogeneous client data. At Dirichlet 30%, the mean detection rate falls sharply.</Note></Panel></div>;
}
function Confusion() {
  const [cell,setCell]=useState<[number,number]>([1,0]);const matrix=study.aggregate_confusion;const total=matrix.flat().reduce((a,b)=>a+b,0);const [i,j]=cell;const support=matrix[i].reduce((a,b)=>a+b,0);
  return <Panel title="Aggregate seven-class confusion across the main study" action={<Badge state="200 EVALUATIONS"/>}><div className="revision-table-wrap"><table className="demo-confusion"><caption>All 200 model evaluations pooled · rows true, columns predicted · {total.toLocaleString()} prediction events</caption><thead><tr><th>True / predicted</th>{classCodes.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{matrix.map((r,k)=><tr key={k}><th>{classCodes[k]}</th>{r.map((v,l)=><td key={l}><button aria-pressed={i===k&&j===l} aria-label={`True ${classCodes[k]}, predicted ${classCodes[l]}: ${v.toLocaleString()} pooled predictions`} onClick={()=>setCell([k,l])} style={{background:k===l?'#e7faf2':([1,3,4].includes(k)&&l===0?'#fff4ec':'#f8f9fd')}}>{v.toLocaleString()}</button></td>)}</tr>)}</tbody></table></div><div className="demo-cell-detail">True <strong>{classCodes[i]}</strong> → predicted <strong>{classCodes[j]}</strong>: <strong>{matrix[i][j].toLocaleString()}</strong> / {support.toLocaleString()} pooled true-class predictions ({(matrix[i][j]/support*100).toFixed(2)}%). {j===0&&[1,3,4].includes(i)?'This is a malignant-source → NV error.':''}</div><Note>The same fixed 1,448-image test split is evaluated by 200 trained models. These are 289,600 repeated prediction events, not independent patients or a single model’s matrix. Use method-specific metrics above to judge an aggregator.</Note><EvidenceNote cells="§23 aggregate confusion matrix"/></Panel>;
}
function ClassPerformance() {
  const matrix=study.aggregate_confusion;const metrics=matrix.map((r,i)=>{const tp=r[i],support=r.reduce((a,b)=>a+b,0),pred=matrix.reduce((a,b)=>a+b[i],0);const precision=pred?tp/pred:0,recall=support?tp/support:0;return {name:classCodes[i],support,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0}});
  return <div className="main-feature-grid"><Panel title="Per-class behavior across all 200 evaluations" action={<Badge state="POOLED PREDICTIONS"/>}><div className="class-metric-chart">{metrics.map(c=><div key={c.name}><strong>{c.name}<small>n={c.support.toLocaleString()}</small></strong>{(['precision','recall','f1'] as const).map((m,k)=><span key={m}><i style={{width:`${c[m]*100}%`,background:['#8F80FF','#19B8C7','#5545DA'][k]}}/><b>{m.toUpperCase()} {pct(c[m])}</b></span>)}</div>)}</div><EvidenceNote cells="§23 aggregate confusion matrix; derived class metrics"/></Panel><Panel title="Interpret class imbalance"><p>The displayed support is repeated across trained models. The original test split contains 1,004 NV images, but only 48 AKIEC, 19 VASC and 21 DF images. Pooling makes a visual summary; it does not create more independent cases.</p><Note>For clinical interpretation, prioritize malignant binary recall and the individual MEL, BCC and AKIEC recalls. These pooled class rates combine different methods and attack levels and do not describe one deployed classifier.</Note></Panel></div>;
}
function Statistics() {
  const dir=row('dirichlet',.2,'trust'),balanced=row('stratified_balanced',.2,'trust');
  return <div className="main-feature-grid"><Panel title="What the five-seed evidence supports" action={<Badge state="DESCRIPTIVE · n=5"/>}><dl className="main-stats-ledger"><div><dt>Dirichlet · 20% attack</dt><dd>Trust Macro-F1 {fmt(dir,'macro_f1')}<br/>Trust ASR {fmt(dir,'asr')}</dd></div><div><dt>Balanced · 20% attack</dt><dd>Trust Macro-F1 {fmt(balanced,'macro_f1')}<br/>Trust ASR {fmt(balanced,'asr')}</dd></div><div><dt>Pairing</dt><dd>Seeds 42–46 compare methods on the same fixed lesion-disjoint split.</dd></div></dl></Panel><Panel title="Inference boundary"><p>The notebook computes paired tests with Holm correction, but its displayed statistical output is truncated. The complete paired-test export and seed-level records are not embedded in the supplied notebook. This site therefore reports measured mean ± SD and does not invent p-values or confidence intervals.</p><Note>Five seeds improve the comparison over the earlier two-seed pilot, but they are training and partition randomizations, not five independent patient cohorts. Adaptive-attack and sensitivity-stage results remain outside this completed main-study dataset.</Note></Panel><Panel title="Evidence registry"><dl className="artifact-ledger">{[['Main summary','Notebook §21 · summary.csv'],['Convergence','Notebook §22 · round_history.csv'],['Confusion and class behavior','Notebook §23 · aggregate 200-run matrix'],['ASR and malignant recall','Notebook §§26–27'],['Consolidated results','Notebook §34 · final_consolidated_results.csv'],['Source integrity',`SHA-256 ${study.sha256.slice(0,20)}…`]].map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Panel></div>;
}
export function ResultsExplorer(){
  const [tab,setTab]=useState(tabs[0]),[partition,setPartition]=useState('dirichlet'),[fraction,setFraction]=useState(.2);
  return <div className="results-explorer">
    <div className="results-hero"><div><Badge state="EXECUTED · MAIN STUDY"/><h2>Main study results</h2><p>Two partition conditions, five aggregation methods, four attack fractions and five matched seeds: 200 completed federated experiments.</p></div><div className="main-study-seal"><strong>200/200</strong><span>main runs complete</span></div></div>
    <div className="main-stage-strip"><div className="active"><strong>Main study</strong><span>200 completed · measured results</span></div><div><strong>Adaptive attack</strong><span>Separate study · no results imported</span></div><div><strong>Trust sensitivity</strong><span>Separate study · no sweep results imported</span></div></div>
    <div className="results-filter"><Pick label="Client partition" value={partition} items={[["dirichlet","Dirichlet α=0.5"],["stratified_balanced","Stratified-balanced"]]} onChange={setPartition}/><Pick label="Malicious clients" value={String(fraction)} items={fractions.map(f=>[String(f),`${Math.round(f*100)}%`])} onChange={v=>setFraction(Number(v))}/><span>Test metrics · mean ± sample SD · five seeds (42–46)</span></div>
    <TabBar value={tab} items={tabs} onChange={setTab}/>
    {tab===tabs[0]&&<Comparison partition={partition} fraction={fraction}/>}
    {tab===tabs[1]&&<Robustness partition={partition}/>}
    {tab===tabs[2]&&<Convergence fraction={fraction}/>}
    {tab===tabs[3]&&<Detection partition={partition}/>}
    {tab===tabs[4]&&<Confusion/>}
    {tab===tabs[5]&&<ClassPerformance/>}
    {tab===tabs[6]&&<Statistics/>}
  </div>;
}

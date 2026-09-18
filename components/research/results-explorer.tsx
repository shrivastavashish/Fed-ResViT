/* oxlint-disable jsx-a11y/prefer-tag-over-role -- scientific SVG plots have descriptive image semantics. */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge, Note, Panel, Pick, TabBar } from './common';
import { methodNames, methods } from '@/lib/protocol';
import study from '@/lib/final-study-results.json';

type Measure = [number | null, number | null, number];
type Row = (typeof study.records)[number];
type Metric = 'accuracy' | 'macro_precision' | 'macro_recall' | 'macro_f1' | 'malignant_recall' | 'asr' | 'detection_rate' | 'false_positive_rate';
const tabs = ['Main comparison', 'Robustness sweep', 'Adaptive attacker', 'Trust sensitivity', 'Round convergence', 'Detection', 'Confusion matrix', 'Class performance', 'Statistics & evidence', 'Research figures'];
const palette: Record<string,string> = { fedavg:'#DF6949', krum:'#8F80FF', trimmed_mean:'#19B8C7', coordinate_median:'#148664', trust:'#5545DA' };
const classCodes = ['NV','MEL','BKL','BCC','AKIEC','VASC','DF'];
const fractions = [0,0.1,0.2,0.3];
const labels: Record<Metric,string> = {accuracy:'Accuracy',macro_precision:'Macro precision',macro_recall:'Macro recall',macro_f1:'Macro-F1',malignant_recall:'Malignant binary recall',asr:'Attack success rate',detection_rate:'Detection rate',false_positive_rate:'False-positive rate'};
const pct = (v:number|null|undefined) => v == null ? '—' : `${(v*100).toFixed(2)}%`;
const measure = (r:Row,m:Metric) => r[m] as Measure;
const mean = (r:Row,m:Metric) => measure(r,m)[0];
const fmt = (r:Row,m:Metric) => {const [v,sd,n]=measure(r,m);return v == null ? '—' : `${pct(v)}${sd==null?'':` ± ${pct(sd)}`} · n=${n}`};
const row = (p:string,f:number,m:string) => study.records.find(r=>r.stage==='main'&&r.partition===p&&r.fraction===f&&r.method===m)!;
const adaptiveRow = (m:string) => study.records.find(r=>r.stage==='adaptive'&&r.method===m)!;
const sensitivityRows = study.records.filter(r=>r.stage==='sensitivity');

function EvidenceNote({cells}: {cells:string}) {
  return <div className="main-evidence-note"><Badge state="EXECUTED · FINAL STUDY"/><span>Source: FedResViT (4).ipynb · {cells} · fixed lesion-disjoint test split</span></div>;
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
      <EvidenceNote cells="§21 stage-separated summary; main stage only"/>
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
    <EvidenceNote cells="§21 stage-separated main summary"/>
  </Panel>;
}
function Convergence() {
  return <Panel title="Round-by-round main-study dynamics" action={<Badge state="NOTEBOOK FIGURE"/>}>
    <Image className="main-notebook-figure" src="/evidence/final-study/main-convergence.png" width={1965} height={559} alt="Measured validation accuracy, attack success rate, and local training loss across 30 rounds for the Dirichlet 20% main-study condition"/>
    <Note>This figure is restricted to the Dirichlet 20% main-study condition. Curves summarize the five matched seeds; shaded bands show variation. It is not an adaptive-attack or sensitivity-stage trajectory.</Note>
    <EvidenceNote cells="Defense suite Figure 7, main-stage filter"/>
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
  return <Panel title="Aggregate seven-class confusion across all stages" action={<Badge state="265 EVALUATIONS"/>}><div className="revision-table-wrap"><table className="demo-confusion"><caption>All 265 model evaluations pooled · rows true, columns predicted · {total.toLocaleString()} prediction events</caption><thead><tr><th>True / predicted</th>{classCodes.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{matrix.map((r,k)=><tr key={k}><th>{classCodes[k]}</th>{r.map((v,l)=><td key={l}><button aria-pressed={i===k&&j===l} aria-label={`True ${classCodes[k]}, predicted ${classCodes[l]}: ${v.toLocaleString()} pooled predictions`} onClick={()=>setCell([k,l])} style={{background:k===l?'#e7faf2':([1,3,4].includes(k)&&l===0?'#fff4ec':'#f8f9fd')}}>{v.toLocaleString()}</button></td>)}</tr>)}</tbody></table></div><div className="demo-cell-detail">True <strong>{classCodes[i]}</strong> → predicted <strong>{classCodes[j]}</strong>: <strong>{matrix[i][j].toLocaleString()}</strong> / {support.toLocaleString()} pooled true-class predictions ({(matrix[i][j]/support*100).toFixed(2)}%). {j===0&&[1,3,4].includes(i)?'This is a malignant-source → NV error.':''}</div><Note>The same fixed 1,448-image test split is evaluated by 265 trained models. These are {total.toLocaleString()} repeated prediction events, not independent patients or a single model’s matrix. The aggregate mixes stages and methods; use stage-specific endpoint tables for comparisons.</Note><EvidenceNote cells="§23 aggregate confusion matrix across 265 evaluations"/></Panel>;
}
function ClassPerformance() {
  const matrix=study.aggregate_confusion;const metrics=matrix.map((r,i)=>{const tp=r[i],support=r.reduce((a,b)=>a+b,0),pred=matrix.reduce((a,b)=>a+b[i],0);const precision=pred?tp/pred:0,recall=support?tp/support:0;return {name:classCodes[i],support,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0}});
  return <div className="main-feature-grid"><Panel title="Per-class behavior across all 265 evaluations" action={<Badge state="POOLED PREDICTIONS"/>}><div className="class-metric-chart">{metrics.map(c=><div key={c.name}><strong>{c.name}<small>n={c.support.toLocaleString()}</small></strong>{(['precision','recall','f1'] as const).map((m,k)=><span key={m}><i style={{width:`${c[m]*100}%`,background:['#8F80FF','#19B8C7','#5545DA'][k]}}/><b>{m.toUpperCase()} {pct(c[m])}</b></span>)}</div>)}</div><EvidenceNote cells="§23 aggregate confusion matrix; derived class metrics"/></Panel><Panel title="Interpret class imbalance"><p>The displayed support is repeated across trained models. The original test split contains 1,004 NV images, but only 48 AKIEC, 19 VASC and 21 DF images. Pooling makes a visual summary; it does not create more independent cases.</p><Note>For clinical interpretation, prioritize malignant binary recall and the individual MEL, BCC and AKIEC recalls. These pooled class rates combine stages, methods and attack levels; they do not describe one deployed classifier.</Note></Panel></div>;
}
function Adaptive() {
  const staticTrust=row('dirichlet',.2,'trust'),adaptiveTrust=adaptiveRow('trust');
  return <div className="main-results-stack">
    <div className="main-feature-grid"><Panel title="Defense-aware attack · Dirichlet, 20%" action={<Badge state="25 EXECUTED RUNS"/>}>
      <div className="main-key-figures"><div><span>Trust ASR · adaptive</span><strong>{pct(mean(adaptiveTrust,'asr'))}</strong><small>Static flip: {pct(mean(staticTrust,'asr'))}</small></div><div><span>Trust detection</span><strong>{pct(mean(adaptiveTrust,'detection_rate'))}</strong><small>Static flip: {pct(mean(staticTrust,'detection_rate'))}</small></div><div><span>Trust malignant recall</span><strong>{pct(mean(adaptiveTrust,'malignant_recall'))}</strong><small>Static flip: {pct(mean(staticTrust,'malignant_recall'))}</small></div></div>
      <Note>Five seeds were run for each of five aggregators. The adaptive omniscient update-blending attack is a distinct threat model; its outcomes must not be pooled with static label flipping.</Note>
    </Panel><Panel title="What the attack changes"><p>The adversary blends a malicious update towards the geometric-median reference to evade distance-based Trust scoring. Against this adaptive condition, Trust ASR is {pct(mean(adaptiveTrust,'asr'))}, compared with {pct(mean(adaptiveRow('coordinate_median'),'asr'))} for coordinate-wise Median and {pct(mean(adaptiveRow('fedavg'),'asr'))} for FedAvg.</p><Note>The final-window Trust detector flags no malicious clients on average across these five adaptive runs, while its false-positive rate is {pct(mean(adaptiveTrust,'false_positive_rate'))}. Trust’s ASR is close to coordinate-wise Median. This is a substantial limit of the defense under this specific omniscient attacker.</Note></Panel></div>
    <Panel title="Adaptive attack · five-method measured endpoints" action={<Badge state="MEAN ± SD · n=5"/>}><div className="revision-table-wrap"><table className="revision-table main-results-table"><caption>Adaptive omniscient blend · Dirichlet α=0.5 · 20% malicious clients</caption><thead><tr><th>Method</th>{(['accuracy','macro_precision','macro_recall','macro_f1','malignant_recall','asr','detection_rate','false_positive_rate'] as Metric[]).map(m=><th key={m}>{labels[m]}</th>)}</tr></thead><tbody>{methods.map(m=><tr key={m}><th>{methodNames[m]}</th>{(['accuracy','macro_precision','macro_recall','macro_f1','malignant_recall','asr','detection_rate','false_positive_rate'] as Metric[]).map(k=><td key={k}>{fmt(adaptiveRow(m),k)}</td>)}</tr>)}</tbody></table></div><EvidenceNote cells="§21 stage-separated summary and §31 adaptive analysis"/></Panel>
    <Panel title="Adaptive threat response · notebook figure"><Image className="main-notebook-figure" src="/evidence/final-study/adaptive.png" width={1569} height={603} alt="Measured Macro-F1 and attack success under static label flipping versus adaptive update blending for five aggregators"/><Note>Static values in this figure refer only to the matched Dirichlet 20% main-study runs.</Note></Panel>
  </div>;
}
function Sensitivity() {
  const reference=row('dirichlet',.2,'trust');
  const nice:Record<string,string>={ema_fast:'Faster reputation EMA',ema_slow:'Slower reputation EMA',flag_high:'Higher flag threshold',flag_low:'Lower flag threshold',mad_narrow:'Narrow MAD thresholds',mad_wide:'Wide MAD thresholds',window_1:'One-round flag window',window_10:'Ten-round flag window'};
  return <div className="main-results-stack"><div className="main-feature-grid"><Panel title="Trust settings under attack" action={<Badge state="40 EXECUTED RUNS"/>}><p>Eight one-factor-at-a-time settings were each tested with five seeds under Dirichlet α=0.5 and 20% malicious clients. The default reference reuses the five Trust runs from the main study; it is not five additional runs.</p><div className="main-key-figures"><div><span>Default ASR</span><strong>{pct(mean(reference,'asr'))}</strong><small>Static label flipping</small></div><div><span>Narrow MAD ASR</span><strong>{pct(mean(sensitivityRows.find(r=>r.setting==='mad_narrow')!,'asr'))}</strong><small>Detector sensitivity changes</small></div><div><span>Wide MAD ASR</span><strong>{pct(mean(sensitivityRows.find(r=>r.setting==='mad_wide')!,'asr'))}</strong><small>Different security trade-off</small></div></div></Panel><Panel title="Interpret the sweep"><p>Narrowing the distance thresholds lowers ASR in this setting, but increases the false-positive rate. A higher flag cutoff also changes detection without changing classification predictions in this comparison.</p><Note>The figure and table are descriptive; they do not establish a universally optimal Trust configuration. Macro-F1 and ASR variant means are reported to four decimals in the notebook figure, without a displayed standard deviation.</Note></Panel></div><Panel title="Eight measured Trust variants" action={<Badge state="5 SEEDS PER SETTING"/>}><div className="revision-table-wrap"><table className="revision-table main-results-table"><caption>Dirichlet · 20% static label flipping · default main-study Trust reference shown separately</caption><thead><tr><th>Setting</th><th>Accuracy</th><th>Macro-F1</th><th>ASR</th><th>Detection</th><th>False-positive rate</th></tr></thead><tbody><tr><th>Default · main reference</th>{(['accuracy','macro_f1','asr','detection_rate','false_positive_rate'] as Metric[]).map(m=><td key={m}>{fmt(reference,m)}</td>)}</tr>{sensitivityRows.map(r=><tr key={r.setting}><th>{nice[r.setting]}</th>{(['accuracy','macro_f1','asr','detection_rate','false_positive_rate'] as Metric[]).map(m=><td key={m}>{fmt(r,m)}</td>)}</tr>)}</tbody></table></div><EvidenceNote cells="§21 stage-separated summary; defense suite Figure 11"/></Panel><Panel title="Sensitivity profile · notebook figure"><Image className="main-notebook-figure" src="/evidence/final-study/sensitivity.png" width={2009} height={609} alt="Measured Macro-F1, attack success, detection and false-positive response across eight Trust parameter variants"/><Note>Each setting changes one Trust parameter family while keeping the Dirichlet 20% static-attack condition fixed.</Note></Panel></div>;
}
function Statistics({partition,fraction}:{partition:string;fraction:number}) {
  const tests=study.main_macro_f1_tests.filter(t=>t.partition===partition&&t.fraction===fraction);
  return <div className="main-results-stack"><Panel title="Paired main-study Macro-F1 tests" action={<Badge state="EXPLORATORY · n=5"/>}><div className="revision-table-wrap"><table className="revision-table main-results-table"><caption>Trust minus baseline · {partition==='dirichlet'?'Dirichlet α=0.5':'Stratified-balanced'} · {Math.round(fraction*100)}% malicious</caption><thead><tr><th>Baseline</th><th>Mean Δ</th><th>Paired t p</th><th>Wilcoxon p</th><th>Holm-adjusted t p</th></tr></thead><tbody>{tests.map(t=><tr key={t.baseline}><th>{methodNames[t.baseline]}</th><td>{(t.macro_f1_difference*100).toFixed(2)} pp</td><td>{t.paired_t_p.toFixed(5)}</td><td>{t.wilcoxon_p.toFixed(4)}</td><td>{t.holm_t_p.toFixed(5)}</td></tr>)}</tbody></table></div><Note>The notebook’s displayed Holm adjustment is across 32 main-study Macro-F1 comparisons. Five paired training seeds share one fixed test split, so these p-values remain exploratory. The separate adaptive and sensitivity stages are not added to this comparison family.</Note><EvidenceNote cells="Defense suite Table 2 · main stage only"/></Panel><div className="main-feature-grid"><Panel title="Evidence registry"><dl className="artifact-ledger">{[['Stage-specific endpoints','Notebook §21 · 53 condition groups'],['Main convergence','Defense suite Figure 7 · main filter'],['Adaptive attack','Notebook §31 · 25 runs'],['Trust sensitivity','Defense suite Figure 11 · 40 variant runs'],['Pooled confusion','Notebook §23 · 265 model evaluations'],['Source integrity',`SHA-256 ${study.sha256.slice(0,20)}…`]].map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></Panel><Panel title="Report scope"><p>The notebook contains repeated views of the same 265 runs. Its §34 consolidated table groups by partition, malicious fraction and aggregator only, so the Dirichlet 20% row blends main, adaptive and sensitivity results. This application uses the §21 summary with attack and setting retained, and counts each completed run once.</p><Note>All stages use the same lesion-disjoint test split. Results are experimental research evidence, not prospective clinical validation.</Note></Panel></div></div>;
}
function ResearchFigures() {
  const figures=[['Frontier · Dirichlet','frontier-dirichlet.png','Main-stage accuracy, Macro-F1, malignant recall and ASR across observed malicious fractions.'],['Frontier · balanced','frontier-balanced.png','The same measured comparison under controlled balanced partitioning.'],['Malignant ROC / PR','roc-pr.png','Main-study Dirichlet 20% · five seeds pooled for each method.'],['Per-class recall','per-class-recall.png','Main-stage subtype recall; inspect minority classes.'],['Trust detector','trust-diagnostics.png','Final-window Trust scores and detection diagnostics from the main study.'],['Partition heterogeneity','partition-heterogeneity.png','Measured client class entropy under both partition strategies.'],['Confusion differential','confusion-differential.png','FedAvg versus Trust under matched main-study attack settings.'],['Compute cost','compute.png','Measured round time by aggregation method.']];
  const dimensions:Record<string,[number,number]>={'frontier-dirichlet.png':[1415,1003],'frontier-balanced.png':[1415,1003],'roc-pr.png':[1525,657],'per-class-recall.png':[1451,583],'trust-diagnostics.png':[1855,581],'partition-heterogeneity.png':[1617,609],'confusion-differential.png':[1842,627],'compute.png':[975,579]};
  return <div className="main-results-stack"><div className="main-feature-grid">{figures.map(([title,file,description])=><Panel key={file} title={title} action={<Badge state="NOTEBOOK FIGURE"/>}><a href={`/evidence/final-study/${file}`} target="_blank" rel="noreferrer" aria-label={`Open full-size ${title} figure`}><Image className="main-notebook-figure" src={`/evidence/final-study/${file}`} width={dimensions[file][0]} height={dimensions[file][1]} alt={description}/></a><p>{description}</p></Panel>)}</div><Panel title="Malignant-vs-benign ranking quality" action={<Badge state="DIRICHLET · 20% · MAIN"/>}><div className="revision-table-wrap"><table className="revision-table"><caption>Five seeds pooled per method · same fixed test split</caption><thead><tr><th>Method</th><th>ROC AUC</th><th>Average precision</th></tr></thead><tbody>{study.roc_pr_main_dirichlet_20.map(r=><tr key={r.method}><th>{methodNames[r.method]}</th><td>{r.roc_auc.toFixed(4)}</td><td>{r.average_precision.toFixed(4)}</td></tr>)}</tbody></table></div><Note>These ranking metrics pool repeated predictions across five trained models; they are not an external clinical validation cohort.</Note></Panel><Panel title="Training cost"><div className="main-key-figures"><div><span>Total completed study</span><strong>{study.compute.gpu_hours} h</strong><small>GPU time recorded in notebook</small></div><div><span>Federated rounds</span><strong>{study.compute.rounds.toLocaleString()}</strong><small>265 runs × 30 rounds</small></div></div></Panel><Note>Open a figure to inspect its full-size data labels. The adaptive and sensitivity figures appear in their dedicated tabs; stage-separated tables remain the source for numerical comparisons.</Note><EvidenceNote cells="Defense suite figures; §30 ROC/PR; compute cost"/></div>;
}
export function ResultsExplorer(){
  const [tab,setTab]=useState(tabs[0]),[partition,setPartition]=useState('dirichlet'),[fraction,setFraction]=useState(.2);
  return <div className="results-explorer">
    <div className="results-hero"><div><Badge state="EXECUTED · THREE STAGES"/><h2>Federated study results</h2><p>One fixed lesion-disjoint test split; five matched seeds; 200 main, 25 adaptive-attack and 40 Trust sensitivity runs. Each condition is reported within its own stage.</p></div><div className="main-study-seal"><strong>265/265</strong><span>distinct runs complete</span></div></div>
    <div className="main-stage-strip"><div className="active"><strong>Main study</strong><span>200 completed · five methods</span></div><div className="active"><strong>Adaptive attack</strong><span>25 completed · defense-aware</span></div><div className="active"><strong>Trust sensitivity</strong><span>40 completed · eight variants</span></div></div>
    <div className="results-filter"><Pick label="Client partition" value={partition} items={[["dirichlet","Dirichlet α=0.5"],["stratified_balanced","Stratified-balanced"]]} onChange={setPartition}/><Pick label="Malicious clients" value={String(fraction)} items={fractions.map(f=>[String(f),`${Math.round(f*100)}%`])} onChange={v=>setFraction(Number(v))}/><span>Test metrics · mean ± sample SD · five seeds (42–46)</span></div>
    <TabBar value={tab} items={tabs} onChange={setTab}/>
    {tab===tabs[0]&&<Comparison partition={partition} fraction={fraction}/>}
    {tab===tabs[1]&&<Robustness partition={partition}/>}
    {tab===tabs[2]&&<Adaptive/>}
    {tab===tabs[3]&&<Sensitivity/>}
    {tab===tabs[4]&&<Convergence/>}
    {tab===tabs[5]&&<Detection partition={partition}/>}
    {tab===tabs[6]&&<Confusion/>}
    {tab===tabs[7]&&<ClassPerformance/>}
    {tab===tabs[8]&&<Statistics partition={partition} fraction={fraction}/>}
    {tab===tabs[9]&&<ResearchFigures/>}
  </div>;
}

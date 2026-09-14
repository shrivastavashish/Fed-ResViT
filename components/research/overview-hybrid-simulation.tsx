/* oxlint-disable jsx-a11y/prefer-tag-over-role -- cropped research sample uses image semantics. */
'use client';

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Badge, Note } from './common';

const steps = [
  { title: 'Prepare image', detail: 'Resize to 224 × 224 RGB and apply the notebook’s ImageNet normalization pipeline.', signal: 'Input tensor · 3 × 224 × 224' },
  { title: 'Encode local morphology', detail: 'ResNet-50 follows texture, borders and local lesion structure through convolutional receptive fields.', signal: 'Global average pool · 2,048 features' },
  { title: 'Encode global context', detail: 'ViT-small divides the same image into 16 × 16 patches and models relationships across the complete lesion.', signal: 'CLS representation · 384 features' },
  { title: 'Fuse representations', detail: 'The complementary vectors are concatenated and projected through the shared fusion head.', signal: '2,432 → 768 · ReLU · dropout 0.20' },
  { title: 'Classify seven lesion types', detail: 'The final head produces seven logits. Softmax probabilities below are illustrative interface data.', signal: '7 logits → probability distribution' },
] as const;
const probabilities = [['NV',38],['MEL',24],['BKL',15],['BCC',10],['AKIEC',7],['VASC',4],['DF',2]] as const;

export function OverviewHybridSimulation() {
  const [step,setStep] = useState(0);
  const [playing,setPlaying] = useState(false);
  useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setStep(value=>(value+1)%steps.length),1900);return()=>window.clearInterval(timer)},[playing]);
  const state=(index:number)=>`${step===index?'active ':''}${step>index?'complete':''}`;
  return <div className={`overview-hybrid ${playing?'is-playing':''}`}>
    <div className="overview-hybrid-toolbar">
      <div><Badge state="MODEL FLOW SIMULATION"/><span>Same dermoscopic image · two complementary encoders</span></div>
      <div><button onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'Pause':'Run'}</button><button aria-label="Reset hybrid model simulation" onClick={()=>{setStep(0);setPlaying(false)}}><RotateCcw size={14}/></button></div>
    </div>
    <div className="hybrid-lab">
      <div className={`hybrid-sample ${state(0)}`}><div className="hybrid-sample-crop" role="img" aria-label="Example HAM10000 dermoscopic image"/><strong>Dermoscopic image</strong><span>224 × 224 × 3</span></div>
      <div className="hybrid-split-lines"><i/><i/></div>
      <div className="hybrid-encoders">
        <button className={`hybrid-encoder cnn ${state(1)}`} onClick={()=>{setStep(1);setPlaying(false)}}><span>CONVOLUTIONAL PATH</span><strong>ResNet-50</strong><small>Local morphology</small><div className="cnn-signals">{Array.from({length:8},(_,i)=><i key={i}/>)}</div><output>2,048</output></button>
        <button className={`hybrid-encoder vit ${state(2)}`} onClick={()=>{setStep(2);setPlaying(false)}}><span>TRANSFORMER PATH</span><strong>ViT-small / patch16</strong><small>Global relationships</small><div className="vit-patches">{Array.from({length:16},(_,i)=><i key={i}/>)}</div><output>384</output></button>
      </div>
      <div className="hybrid-merge-lines"><i/><i/></div>
      <button className={`hybrid-fusion-node ${state(3)}`} onClick={()=>{setStep(3);setPlaying(false)}}><span>CONCATENATE</span><strong>Fusion head</strong><small>2,432 → 768</small><b>+</b></button>
      <div className="hybrid-output-line"/>
      <button className={`hybrid-classifier ${state(4)}`} onClick={()=>{setStep(4);setPlaying(false)}}><strong>Seven-class output</strong><span>softmax distribution</span>{probabilities.map(([name,value])=><div key={name}><b>{name}</b><i><em style={{width:`${value}%`}}/></i><output>{value}%</output></div>)}</button>
    </div>
    <div className="hybrid-stage-readout"><span>STAGE {step+1} / 5</span><div><strong>{steps[step].title}</strong><p>{steps[step].detail}</p></div><code>{steps[step].signal}</code></div>
    <div className="hybrid-overview-steps" role="tablist" aria-label="Hybrid model stages">{steps.map((item,index)=><button role="tab" aria-selected={step===index} key={item.title} onClick={()=>{setStep(index);setPlaying(false)}}><span>{index+1}</span>{item.title}</button>)}</div>
    <Note>The visual signals explain feature flow; they are not Grad-CAM, attention rollout or measured activations. The seven probabilities are illustrative and do not represent a model inference.</Note>
  </div>
}

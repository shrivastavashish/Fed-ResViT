'use client';
import { useState, type CSSProperties } from 'react';
import { RotateCcw, Layers3 } from 'lucide-react';

const scenes: Record<
  string,
  { title: string; subtitle: string; nodes: string[] }
> = {
  overview: {
    title: 'One framework. Three scientific lenses.',
    subtitle: 'Classification · federation · poisoning resistance',
    nodes: [
      'HAM10000|7 lesion classes',
      'Hybrid model|ResNet-50 + ViT',
      'Federation|5 simulated clients',
      'Evaluation|2 paired seeds',
    ],
  },
  clinical: {
    title: 'Inside the imaging pathway',
    subtitle:
      'Image handling is available · model inference requires a checkpoint',
    nodes: [
      'Dermoscopic image|Local image viewer',
      'Preprocessing|224 × 224 pixels',
      'Feature fusion|CNN + Transformer',
      'Classification|7 output classes',
    ],
  },
  federation: {
    title: 'A distributed learning system',
    subtitle:
      'Methodology diagram · geometry is illustrative, not a measured embedding',
    nodes: [
      'Local datasets|5 healthcare clients',
      'Local training|2 epochs per round',
      'Global update|30 stored rounds',
      'Validation|Best model selection',
    ],
  },
  security: {
    title: 'From suspicious updates to weighted trust',
    subtitle: 'Methodology diagram · targeted malignant-to-NV label flipping',
    nodes: [
      'Client updates|RMS distance',
      'Robust reference|Geometric median',
      'Adaptive trust|Median + MAD',
      'Reputation|0.85r + 0.15φ',
    ],
  },
  research: {
    title: 'Evidence in multiple dimensions',
    subtitle:
      'Executed study · controlled stratified-balanced partition · n = 2 seeds',
    nodes: [
      'Performance|7-class evaluation',
      'Attack success|36.96% → 23.93%',
      'Malignant safety|63.04% → 76.07%',
      'Traceability|Notebook + artifacts',
    ],
  },
  studio: {
    title: 'Design the experiment. Preserve the evidence.',
    subtitle: 'Configuration exploration does not execute a training job',
    nodes: [
      'Dataset|HAM10000',
      'Federation|5 clients · 30 rounds',
      'Comparison|FedAvg vs Trust',
      'Execution|Backend not connected',
    ],
  },
  reproducibility: {
    title: 'Follow every result to its source',
    subtitle: 'Measured outputs and implementation support remain distinct',
    nodes: [
      'Configuration|Seeds 42 and 43',
      'Notebook|Executed cell outputs',
      'Artifacts|Recovered research data',
      'Evidence|Source fingerprint',
    ],
  },
};
export function DimensionalScene({ page }: { page: string }) {
  const [angle, setAngle] = useState(0);
  const [depth, setDepth] = useState(32);
  const scene = scenes[page] ?? scenes.research;
  return (
    <section
      className="dimension-deck"
      aria-label="Interactive three-dimensional methodology diagram"
    >
      <div className="dimension-copy">
        <span className="eyebrow">
          <Layers3 size={14} /> INTERACTIVE 3D / METHODOLOGY
        </span>
        <h2>{scene.title}</h2>
        <p>{scene.subtitle}</p>
        <div className="dimension-controls">
          <label>
            Rotation <output>{angle}°</output>
            <input
              aria-label="Diagram rotation"
              type="range"
              min="-25"
              max="25"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>
          <label>
            Layer depth <output>{depth}</output>
            <input
              aria-label="Diagram layer depth"
              type="range"
              min="0"
              max="60"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
          </label>
          <button
            aria-label="Reset 3D diagram"
            onClick={() => {
              setAngle(0);
              setDepth(32);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="dimension-viewport">
        <div
          className="dimension-world"
          style={
            {
              '--rotation': `${angle}deg`,
              '--depth': `${depth}px`,
            } as CSSProperties
          }
        >
          <div className="dimension-grid" />
          {scene.nodes.map((node, i) => (
            <div
              key={node}
              className={`dimension-node node-${i}`}
              style={{ '--index': i } as CSSProperties}
            >
              <span className="dimension-number">0{i + 1}</span>
              <strong>{node.split('|')[0]}</strong>
              <small>{node.split('|')[1]}</small>
              <div className="node-edge" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The labeled SVG is the architecture illustration. */
'use client';
import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Badge, Note } from './common';
const steps = [
  'Prepare one RGB image',
  'Process both backbones',
  'Extract complementary features',
  'Concatenate and fuse',
  'Produce seven class logits',
];
export function HybridSimulation() {
  const [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStage((s) => (s + 1) % 5), 2200);
    return () => clearInterval(t);
  }, [playing]);
  return (
    <div className="hybrid-simulation">
      <div className="round-visual-controls">
        <button className="primary-btn" onClick={() => setPlaying((v) => !v)}>
          {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
          {playing ? 'Pause' : 'Play'} architecture
        </button>
        <button
          className="secondary-btn"
          aria-label="Reset architecture animation"
          onClick={() => {
            setStage(0);
            setPlaying(false);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <Badge state="DEMONSTRATION" />
        <strong>
          {stage + 1} / 5 · {steps[stage]}
        </strong>
      </div>
      <div className="hybrid-canvas">
        <svg
          viewBox="0 0 1040 340"
          role="img"
          aria-label={`Hybrid CNN and Vision Transformer connected feature flow: ${steps[stage]}`}
        >
          <path
            d="M 175 170 C 220 170 220 90 270 90 M 175 170 C 220 170 220 250 270 250 M 500 90 C 560 90 550 170 605 170 M 500 250 C 560 250 550 170 605 170 M 815 170 L 865 170"
            fill="none"
            stroke="#19b8c7"
            strokeWidth="3"
            strokeDasharray={playing ? '10 8' : undefined}
            className={playing ? 'hybrid-packets' : ''}
          />
          {[
            {
              x: 15,
              y: 126,
              w: 160,
              h: 88,
              title: 'Same RGB image',
              sub: '224 × 224 × 3',
              on: stage === 0,
            },
            {
              x: 270,
              y: 32,
              w: 230,
              h: 116,
              title: 'ResNet-50',
              sub: '2,048 pooled features',
              on: stage === 1 || stage === 2,
            },
            {
              x: 270,
              y: 192,
              w: 230,
              h: 116,
              title: 'ViT-small / patch16',
              sub: '384-dimensional representation',
              on: stage === 1 || stage === 2,
            },
            {
              x: 605,
              y: 116,
              w: 210,
              h: 108,
              title: 'Feature fusion',
              sub: '2,432 → 768',
              on: stage === 3,
            },
            {
              x: 865,
              y: 116,
              w: 160,
              h: 108,
              title: 'Classifier',
              sub: '7 logits → softmax',
              on: stage === 4,
            },
          ].map((n) => (
            <g key={n.title}>
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={n.h}
                rx="12"
                fill={n.on ? '#5545da' : '#242d62'}
                stroke={n.on ? '#2fc2cf' : '#53618b'}
                strokeWidth="2"
              />
              <text
                x={n.x + n.w / 2}
                y={n.y + 30}
                textAnchor="middle"
                fill="white"
                fontSize="15"
                fontWeight="600"
              >
                {n.title}
              </text>
              <text
                x={n.x + n.w / 2}
                y={n.y + 52}
                textAnchor="middle"
                fill="#d5dff5"
                fontSize="12"
              >
                {n.sub}
              </text>
            </g>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={`cnn${i}`}
              x={301 + i * 21}
              y="107"
              width="14"
              height="22"
              rx="2"
              fill={stage === 2 ? '#2fc2cf' : '#53618b'}
            />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <rect
              key={`vit${i}`}
              x={291 + i * 12}
              y="272"
              width="8"
              height="15"
              fill={stage === 2 ? '#ffb267' : '#53618b'}
            />
          ))}
          <text
            x="710"
            y="193"
            textAnchor="middle"
            fill="#d5dff5"
            fontSize="11"
          >
            ReLU · dropout 0.20
          </text>
          <text
            x="945"
            y="249"
            textAnchor="middle"
            fill="#d5dff5"
            fontSize="10"
          >
            NV · MEL · BKL · BCC
          </text>
          <text
            x="945"
            y="266"
            textAnchor="middle"
            fill="#d5dff5"
            fontSize="10"
          >
            AKIEC · VASC · DF
          </text>
        </svg>
      </div>
      <div className="hybrid-step-select">
        {steps.map((s, i) => (
          <button
            key={s}
            aria-pressed={stage === i}
            onClick={() => {
              setStage(i);
              setPlaying(false);
            }}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      <Note>
        Animated blocks represent information flow, not measured activations,
        attention maps or model predictions. Both branches receive the same
        image. Feature vectors are concatenated before fusion and seven-class
        classification.
      </Note>
    </div>
  );
}

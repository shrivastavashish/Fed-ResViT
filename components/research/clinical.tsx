/* oxlint-disable next/no-img-element -- Local blob/data URLs and unaltered scientific source figures must bypass server image optimization. */
'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  ScanLine,
  LockKeyhole,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Panel, Note, Badge, TabBar, EvidenceButton } from './common';
import { classes, classNames } from '@/lib/research';
export default function Clinical({
  inspect,
  initialTab,
}: {
  inspect: (c: number, t: string, d?: string) => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab ?? 'Lesion analysis');
  const [url, setUrl] = useState('');
  const [processed, setProcessed] = useState('');
  const [mode, setMode] = useState('Original');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [name, setName] = useState('');
  const [meta, setMeta] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState('CNN Grad-CAM');
  const file = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    },
    [url],
  );
  useEffect(() => {
    if (!url || mode === 'Original') return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 224, 224);
      if (mode === 'Normalized') {
        const pixels = ctx.getImageData(0, 0, 224, 224);
        const mean = [0.485, 0.456, 0.406],
          std = [0.229, 0.224, 0.225];
        for (let i = 0; i < pixels.data.length; i += 4)
          for (let c = 0; c < 3; c++) {
            const z = (pixels.data[i + c] / 255 - mean[c]) / std[c];
            pixels.data[i + c] = Math.max(
              0,
              Math.min(255, ((z + 3) / 6) * 255),
            );
          }
        ctx.putImageData(pixels, 0, 0);
      }
      setProcessed(canvas.toDataURL());
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, mode]);
  async function load(f: File) {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Choose a JPEG, PNG or WebP image.');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('Choose an image smaller than 15 MB.');
      return;
    }
    setBusy(true);
    const next = URL.createObjectURL(f);
    const img = new window.Image();
    img.onload = () => {
      if (!alive.current) {
        URL.revokeObjectURL(next);
        return;
      }
      setBusy(false);
      if (img.width * img.height > 40000000) {
        URL.revokeObjectURL(next);
        setError('Image exceeds the 40-megapixel viewer limit.');
        return;
      }
      setProcessed('');
      setUrl(next);
      setName(f.name);
      setMeta(
        `${img.width} × ${img.height} px · ${(f.size / 1024 / 1024).toFixed(2)} MB · Local browser only`,
      );
      setMode('Original');
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(next);
      setBusy(false);
      setError('This image could not be decoded. Try another file.');
    };
    img.src = next;
  }
  return (
    <>
      <TabBar
        value={tab}
        items={['Lesion analysis', 'Research samples', 'Explainable AI']}
        onChange={setTab}
      />
      <Note>
        Research / Educational Demonstration — Not a standalone diagnostic
        system. Model predictions do not establish a diagnosis.
      </Note>
      {tab === 'Research samples' ? (
        <Panel
          title="HAM10000 examples from the executed notebook"
          kicker="SEVEN DATASET CLASSES"
          action={<Badge />}
        >
          <p>
            This original notebook figure shows research examples selected
            before training. Ground-truth class labels are shown. No per-image
            predictions or image IDs are attached to these examples.
          </p>
          <img
            className="sample-gallery"
            src="/evidence/ham10000-research-gallery.png"
            alt="Notebook gallery showing three HAM10000 images for each of the seven lesion classes"
            loading="lazy"
          />
          <EvidenceButton
            onClick={() => inspect(21, 'Research image gallery')}
          />
        </Panel>
      ) : tab === 'Explainable AI' ? (
        <>
          <Panel
            title="Prediction, explanation and uncertainty are different"
            action={<Badge state="PLANNED" />}
          >
            <p>
              The notebook implements classification probabilities. It does not
              implement Grad-CAM, attention rollout, fusion attribution or
              calibrated uncertainty.
            </p>
            <div className="explanation-options">
              {[
                'CNN Grad-CAM',
                'ViT attention rollout',
                'Fusion attribution',
                'Calibrated uncertainty',
              ].map((s) => (
                <button
                  className={s === explanation ? 'active' : ''}
                  onClick={() => setExplanation(s)}
                  key={s}
                >
                  <Eye size={22} />
                  <strong>{s}</strong>
                  <Badge state="PLANNED" />
                </button>
              ))}
            </div>
            <Note>
              {explanation} is a planned extension. No synthetic heatmap or
              confidence value is shown. A high softmax probability alone does
              not establish calibrated certainty.
            </Note>
          </Panel>
          <EvidenceButton
            onClick={() => inspect(31, 'Implemented model architecture')}
          />
        </>
      ) : (
        <div className="clinical-layout">
          <Panel
            title="Dermoscopic image viewer"
            action={<Badge state="LOCAL PREVIEW" />}
          >
            <div className="viewer-toolbar">
              <div className="view-modes">
                {['Original', 'Preprocessed', 'Normalized'].map((m) => (
                  <button
                    key={m}
                    className={mode === m ? 'active' : ''}
                    disabled={!url}
                    onClick={() => {
                      setProcessed('');
                      setMode(m);
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div>
                <button
                  aria-label="Zoom out"
                  disabled={!url}
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut size={17} />
                </button>
                <button
                  aria-label="Zoom in"
                  disabled={!url}
                  onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                >
                  <ZoomIn size={17} />
                </button>
                <button
                  aria-label="Reset image view"
                  disabled={!url}
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  aria-label="Fullscreen image"
                  onClick={() =>
                    viewer.current
                      ?.requestFullscreen()
                      .catch(() =>
                        setError('Fullscreen is unavailable in this browser.'),
                      )
                  }
                >
                  <Maximize size={17} />
                </button>
              </div>
            </div>
            <div
              className={'image-viewer ' + (url ? 'loaded' : '')}
              ref={viewer}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) void load(e.dataTransfer.files[0]);
              }}
              onPointerDown={(e) => {
                if (!url) return;
                drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (drag.current)
                  setPan({
                    x: e.clientX - drag.current.x,
                    y: e.clientY - drag.current.y,
                  });
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              {url ? (
                <img
                  draggable={false}
                  alt={`${mode} view of ${name}`}
                  src={mode === 'Original' ? url : processed || url}
                  style={{
                    transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                  }}
                />
              ) : (
                <div>
                  <div className="upload-symbol">
                    <ScanLine size={45} />
                  </div>
                  <h3>
                    {busy ? 'Opening image…' : 'Bring an image into focus'}
                  </h3>
                  <p>
                    Drop a dermoscopic image here
                    <br />
                    or select one from your device.
                  </p>
                  <button
                    className="primary-btn"
                    onClick={() => file.current?.click()}
                  >
                    <Upload size={16} />
                    Select image
                  </button>
                  <small>JPEG, PNG or WebP · up to 15 MB</small>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={file}
              onChange={(e) => {
                if (e.target.files?.[0]) void load(e.target.files[0]);
                e.target.value = '';
              }}
            />
            {url && (
              <div className="image-meta">
                <div>
                  <strong>{name}</strong>
                  <small>{meta}</small>
                </div>
                <button
                  className="text-btn"
                  onClick={() => file.current?.click()}
                >
                  Replace image
                </button>
              </div>
            )}
            {error && (
              <div role="alert" className="note warning">
                {error}
              </div>
            )}
            {url && (
              <div className="zoom-slider">
                <span>{Math.round(zoom * 100)}%</span>
                <Slider
                  aria-label="Image zoom"
                  min={0.5}
                  max={5}
                  step={0.05}
                  value={[zoom]}
                  onValueChange={(v) =>
                    setZoom(Array.isArray(v) ? v[0] : (v as number))
                  }
                />
                <small>Drag image to pan</small>
              </div>
            )}
            <p className="source-caption">
              {mode === 'Normalized'
                ? 'Visualization of ImageNet normalization: z-scores mapped from [−3, 3] to display colors. Not a heatmap or model explanation.'
                : mode === 'Preprocessed'
                  ? '224 × 224 browser resize preview. Exact model preprocessing uses torchvision; this viewer is not an inference result.'
                  : 'Images stay in this browser. No image is uploaded to a server.'}
            </p>
          </Panel>
          <div>
            <Panel
              title="AI classification"
              action={<Badge state="AWAITING ARTIFACT" />}
            >
              <div className="inference-state">
                <LockKeyhole size={25} />
                <h3>Checkpoint required</h3>
                <p>
                  Connect a trained model to produce a seven-class prediction.
                  The notebook includes aggregate test results, but no
                  checkpoint or per-image probabilities was supplied.
                </p>
              </div>
              <button className="primary-btn wide" disabled>
                Analyze image · unavailable
              </button>
              <div className="probability-list">
                {classes.map((c, i) => (
                  <div key={c}>
                    <span>
                      <b>{c}</b>
                      {classNames[i]}
                    </span>
                    <span title="No inference result">—</span>
                  </div>
                ))}
              </div>
              <p className="small-muted">
                No prediction, probability or confidence has been generated.
              </p>
            </Panel>
            <Panel title="Research context">
              <p>
                7 lesion classes · ResNet-50 + ViT-Small · horizontal-flip TTA
              </p>
              <button
                className="text-btn"
                onClick={() => setTab('Research samples')}
              >
                <ImageIcon size={16} />
                Browse notebook image examples
              </button>
              <EvidenceButton
                onClick={() =>
                  inspect(37, 'Preprocessing and inference contract')
                }
              />
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

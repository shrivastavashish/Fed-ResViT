'use client';
import { useEffect, useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const destinations = [
  ['overview', 'Intelligence Overview', 'system model study design'],
  ['clinical', 'Clinical AI', 'image upload preprocessing explainability'],
  [
    'federation',
    'Federated Learning',
    'clients simulation replay architecture partition',
  ],
  [
    'security',
    'Security & Trust',
    'poisoning adaptive attacker baselines trust thresholds reputation',
  ],
  [
    'research',
    'Research Observatory',
    'performance robustness confusion classes statistics limitations',
  ],
  [
    'studio',
    'Experiment Studio',
    'builder configuration study plan run registry export',
  ],
  [
    'reproducibility',
    'Reproducibility',
    'artifacts evidence checkpoint recovery notebook',
  ],
  ['about', 'About the project', 'goal methodology mentor'],
];
export function WorkspaceSearch({
  navigate,
}: {
  navigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState('');
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const matches = destinations.filter((d) =>
    d.join(' ').toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <button
        className="workspace-search-trigger"
        onClick={() => {
          setQuery('');
          setOpen(true);
        }}
        aria-label="Search workspaces"
      >
        <Search size={16} />
        <span>Find a workspace</span>
        <kbd>⌘ / Ctrl K</kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="workspace-search-dialog">
          <DialogTitle>Find a workspace</DialogTitle>
          <DialogDescription>
            Search the project’s tools and research topics.
          </DialogDescription>
          <input
            aria-label="Search research topics"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try trust, artifacts or image…"
            className="workspace-search-input"
          />
          <div className="workspace-search-results">
            {matches.length ? (
              matches.map(([id, title, topics]) => (
                <button
                  key={id}
                  onClick={() => {
                    setOpen(false);
                    navigate(id);
                  }}
                >
                  <div>
                    <strong>{title}</strong>
                    <small>{topics}</small>
                  </div>
                  <ArrowUpRight size={17} />
                </button>
              ))
            ) : (
              <output>
                No workspace matches “{query}”. Try a broader research topic.
              </output>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
const steps = [
  [
    'overview',
    'Start with the research question',
    'Examine the study design: ten clients, five seeds, robust aggregation methods and two partition conditions.',
  ],
  [
    'clinical',
    'Understand the image workflow',
    'Explore local image viewing, preprocessing and seven-class classification. Predictions require a connected checkpoint.',
  ],
  [
    'federation',
    'Follow local knowledge',
    'Play the ten-client simulation. Inspect local learning, update exchange and global aggregation.',
  ],
  [
    'security',
    'Challenge the defense',
    'Explore robust baselines, adaptive update blending, Trust sensitivity and the interactive trust calculation.',
  ],
  [
    'research',
    'Define the evidence',
    'Review malignant recall, precision–recall trade-offs, security metrics and matched-seed statistics. Measurements await artifacts.',
  ],
  [
    'studio',
    'Inspect the experiment plan',
    'Explore main, adaptive and sensitivity jobs. Export a configuration draft without launching training.',
  ],
  [
    'reproducibility',
    'Trace the scientific record',
    'Inspect notebook provenance, recovery requirements and the evidence handoff contract.',
  ],
];
export function GuidedWalkthrough({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (n: number, page: string) => void;
  onClose: () => void;
}) {
  const s = steps[step];
  return (
    <aside
      className="guided-walkthrough"
      aria-label="Guided research walkthrough"
    >
      <div className="walkthrough-index">
        <BookOpen size={21} />
        <span>
          {step + 1} / {steps.length}
        </span>
      </div>
      <div className="walkthrough-copy">
        <h2>{s[1]}</h2>
        <p>{s[2]}</p>
        <div className="walkthrough-track">
          {steps.map(([page, title], i) => (
            <button
              key={page}
              aria-label={`Step ${i + 1}: ${title}`}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => onStep(i, page)}
            />
          ))}
        </div>
      </div>
      <div className="walkthrough-actions">
        <button
          className="secondary-btn"
          aria-label="Previous walkthrough step"
          disabled={step === 0}
          onClick={() => onStep(step - 1, steps[step - 1][0])}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="primary-btn"
          onClick={() =>
            step === steps.length - 1
              ? onClose()
              : onStep(step + 1, steps[step + 1][0])
          }
        >
          {step === steps.length - 1 ? 'Finish' : 'Next'}
          <ChevronRight size={16} />
        </button>
        <button
          className="text-btn"
          aria-label="Close walkthrough"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
    </aside>
  );
}

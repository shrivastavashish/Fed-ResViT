'use client';
import Image from 'next/image';
import {
  ArrowUpRight,
  Target,
  Network,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { Panel, Badge, Note, EvidenceButton } from './common';

export function About({
  navigate,
  inspect,
}: {
  navigate: (page: string, tab?: string) => void;
  inspect: (cell: number, title: string, detail?: string) => void;
}) {
  return (
    <div className="about-page">
      <Panel
        title="Fed-ResViT"
        kicker="Trust-Aware Federated Learning for Robust Skin Lesion Classification"
        dark
      >
        <p className="about-lead">
          A trust-aware federated hybrid CNN–Vision Transformer framework for
          robust skin lesion classification against data poisoning attacks.
        </p>
        <p>
          This project investigates how multiple simulated healthcare
          institutions can train a shared skin lesion classifier, and how that
          collaboration can remain more reliable when a participating client
          deliberately corrupts its training labels.
        </p>
        <div className="about-actions">
          <button className="primary-btn" onClick={() => navigate('overview')}>
            Explore Intelligence Overview <ArrowUpRight size={16} />
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate('research', 'Model comparison')}
          >
            View measured results <ArrowUpRight size={16} />
          </button>
        </div>
      </Panel>
      <div className="chart-grid">
        <Panel title="What is the goal?" kicker="RESEARCH QUESTION">
          <Target className="about-icon" size={26} />
          <p>
            Reduce targeted poisoning attack success while preserving overall
            classification performance. The revised protocol compares Trust
            against FedAvg, Krum, Trimmed Mean and coordinate-wise Median, with
            optional Multi-Krum, under balanced and Dirichlet data partitions.
          </p>
          <p>
            The attack changes labels from MEL, BCC and AKIEC to the benign
            target NV. The defense evaluates client updates and reduces the
            influence of updates that deviate from a robust reference.
          </p>
        </Panel>
        <Panel
          title="What have we built?"
          kicker="IMPLEMENTATION & IMPORTED EVIDENCE"
        >
          <Badge />
          <p>
            A ResNet-50 + ViT-small hybrid and a ten-client research protocol
            with five seeds, robust baselines, targeted label flipping, an
            omniscient adaptive attacker and Trust sensitivity sweeps. The
            earlier five-client study contributes eight imported runs; the
            expanded study’s result artifacts have not yet been ingested.
          </p>
          <p>
            The web platform brings those notebook outputs together with client
            inspection, experiment replay, model comparison, statistical
            analysis and source-linked evidence.
          </p>
        </Panel>
      </div>
      <Panel
        title="What did we achieve?"
        kicker="ORIGINAL STUDY ONLY · 20% MALICIOUS · TWO-SEED MEANS"
        action={
          <EvidenceButton
            label="Inspect result evidence"
            onClick={() =>
              inspect(
                48,
                'About · measured outcomes',
                'FedAvg versus Trust; controlled stratified-balanced partition; seeds 42 and 43; 20% malicious clients.',
              )
            }
          />
        }
      >
        <div className="metric-grid">
          <div className="metric">
            <span>Attack Success Rate</span>
            <strong>36.96% → 23.93%</strong>
            <small>FedAvg → Trust · lower is better</small>
          </div>
          <div className="metric">
            <span>ASR reduction</span>
            <strong>13.03 pp</strong>
            <small>Approximately 35.3% relative reduction</small>
          </div>
          <div className="metric">
            <span>Target avoidance · derived</span>
            <strong>63.04% → 76.07%</strong>
            <small>1 − ASR · not clinical safety</small>
          </div>
          <div className="metric">
            <span>Test accuracy under attack</span>
            <strong>81.24% → 82.60%</strong>
            <small>FedAvg → Trust · two-seed mean</small>
          </div>
        </div>
        <p>
          Under the executed attack condition, Trust reduced malignant-to-NV
          misclassification while preserving overall performance. Macro-F1
          increased from 63.77% to 65.96%, while macro-precision fell from
          74.83% to 71.78%. This is evidence for the tested setting, not a
          universal robustness or clinical safety guarantee.
        </p>
        <Note>
          Detection also has a cost: the original Trust detection rate was 100%
          (1 of 1 malicious client), with a 25% false positive rate under attack
          (1 of 4 honest clients) and a 20% false positive rate in the clean
          condition. These detection summaries use the notebook’s flagging
          window; they are distinct from checkpoint classification results.
        </Note>
      </Panel>
      <Panel
        title="How does the system work?"
        kicker="FROM LOCAL TRAINING TO TRACEABLE RESULTS"
      >
        <ol className="about-workflow">
          {[
            [
              'Prepare the data',
              'HAM10000 provides seven classes. The revised notebook retains a lesion-disjoint split (approximately 70:15:15) and compares balanced and Dirichlet alpha 0.5 allocations across ten clients. Actual split counts are artifact-specific.',
            ],
            [
              'Learn complementary features',
              'ResNet-50 extracts convolutional features and ViT-small learns transformer features. The hybrid fuses them for seven-class classification, with partial backbone fine-tuning.',
            ],
            [
              'Train across the federation',
              'Each client receives the global model and trains locally for two epochs. Full revised experiments run for 30 communication rounds with batch size 16 and seeds 42–46.',
            ],
            [
              'Introduce the controlled attack',
              'Clean, 10%, 20% and 30% malicious-client conditions are configured. The adaptive extension blends poisoned updates toward an honest-update reference to attempt Trust evasion.',
            ],
            [
              'Evaluate trust and aggregate',
              'A geometric-median reference, RMS-normalized distances and adaptive thresholds produce soft trust scores. Reputation is updated as 0.85r + 0.15φ; reputation × trust determines effective contribution before normalization.',
            ],
            [
              'Evaluate and inspect the evidence',
              'Best validation checkpoints are evaluated with test-time augmentation. Binary malignant recall, subtype recalls, precision, F1, ASR and raw detector counts form the revised evaluation. Results will be linked to verified artifacts after ingestion.',
            ],
          ].map(([title, body], i) => (
            <li key={title}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <button
          className="text-btn"
          onClick={() => navigate('federation', 'Experiment replay')}
        >
          Replay the federated process <ArrowUpRight size={16} />
        </button>
      </Panel>
      <div className="chart-grid">
        <Panel title="How does it help?" kicker="RESEARCH, EDUCATION & REVIEW">
          <div className="about-audience">
            <Stated
              icon={<Network size={20} />}
              title="AI and federated learning researchers"
            >
              Inspect how local learning, feature fusion and global aggregation
              interact.
            </Stated>
            <Stated
              icon={<ShieldCheck size={20} />}
              title="Security researchers"
            >
              Compare poisoning impact, client trust, detection and false
              positives using the executed evidence.
            </Stated>
            <Stated
              icon={<BookOpen size={20} />}
              title="Clinicians, students and academic reviewers"
            >
              Understand the classification workflow, examine class-level
              weaknesses and trace reported findings back to their source.
            </Stated>
          </div>
        </Panel>
        <Panel
          title="What can the application do today?"
          kicker="CAPABILITIES & BOUNDARIES"
        >
          <p>
            <strong>Available:</strong> notebook-derived research dashboards,
            local image viewing and preprocessing, client histories, labeled
            charts, confusion-matrix exploration, configuration export and
            methodology replay.
          </p>
          <p>
            <strong>Requires further integration:</strong> live image prediction
            needs the trained checkpoint and an inference service. Changing
            builder settings does not launch training. Replay explains the saved
            experiment; it is not a new training run.
          </p>
          <p>
            <strong>Planned:</strong> explanation maps such as Grad-CAM or
            attention rollout. The platform does not fabricate predictions or
            explanations when these services are unavailable.
          </p>
        </Panel>
      </div>
      <Panel title="Project mentor" kicker="MENTORSHIP">
        <div className="mentor-profile">
          <Image
            src="/images/shriram.webp"
            alt="Dr. Shriram Kris Vasudevan speaking at an event"
            width={480}
            height={480}
            unoptimized
            className="mentor-portrait"
          />
          <div>
            <h3 style={{ color: '#242D62', fontSize: 22, fontWeight: 650 }}>
              Dr. Shriram Kris Vasudevan, Ph.D.
            </h3>
            <p>
              <strong>Agentic AI &amp; GenAI Leader</strong>
              <br />
              Fellow - IE(I), IETE, Senior Member - IEEE
              <br />
              CSM, CSPO
            </p>
            <div className="about-actions">
              <a className="secondary-btn" href="mailto:shriramkv@gmail.com">
                Email: shriramkv@gmail.com
              </a>
              <a className="secondary-btn" href="tel:+918939918562">
                Mobile: +91 89399 18562
              </a>
              <a
                className="secondary-btn"
                href="https://www.linkedin.com/in/shriramkvasudevan"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn <ArrowUpRight size={16} />
              </a>
              <a
                className="secondary-btn"
                href="https://www.youtube.com/shriramvasudevan"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </Panel>
      <Panel title="Scope and limitations" kicker="SCIENTIFIC CONTEXT">
        <p>
          The imported original evidence uses two seeds, five clients and only
          0%/20% malicious fractions under controlled partitioning. The revised
          protocol configures five seeds, ten clients, both partition types and
          a wider attack sweep. These new settings are not evidence of completed
          evaluations.
        </p>
        <p>
          No differential privacy, secure aggregation, real hospital deployment
          or regulatory approval is claimed. One adaptive attacker and
          one-factor Trust sensitivity are now implemented, with results
          pending. External validation and broader attacker coverage remain
          future work. Five seeds still require cautious statistical
          interpretation.
        </p>
        <Note>
          Research / Educational Demonstration — Not a standalone diagnostic
          system. Model classification is not a diagnosis, and the platform
          provides no treatment recommendations.
        </Note>
        <div className="about-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate('research', 'Limitations')}
          >
            Explore research limitations <ArrowUpRight size={16} />
          </button>
          <button
            className="secondary-btn"
            onClick={() => navigate('reproducibility')}
          >
            Trace the evidence <ArrowUpRight size={16} />
          </button>
        </div>
      </Panel>
    </div>
  );
}
function Stated({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {icon}
      <section>
        <h3>{title}</h3>
        <p>{children}</p>
      </section>
    </div>
  );
}

'use client';
import {
  WorkspaceSearch,
  GuidedWalkthrough,
} from '@/components/research/navigation-tools';
import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Activity,
  ArrowUpRight,
  Dna,
  FlaskConical,
  ShieldCheck,
  Network,
  Stethoscope,
  BookOpen,
  ChartNoAxesCombined,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/research/common';
import { RevisionWorkspace } from '@/components/research/revision';
import { About } from '@/components/research/about';
const Clinical = lazy(() => import('@/components/research/clinical'));
const nav = [
  [
    'about',
    'About',
    BookOpen,
    'The purpose, progress and evidence behind Fed-ResViT.',
  ],
  [
    'overview',
    'Intelligence Overview',
    Activity,
    'A connected view of the model, the federation and the evidence.',
  ],
  [
    'clinical',
    'Clinical AI',
    Stethoscope,
    'Explore dermoscopic imagery and the model’s analysis workflow.',
  ],
  [
    'federation',
    'Federated Learning',
    Network,
    'Follow local knowledge as it becomes a shared global model.',
  ],
  [
    'security',
    'Security & Trust',
    ShieldCheck,
    'See the attack. Inspect the defense. Understand every contribution.',
  ],
  [
    'research',
    'Research Observatory',
    ChartNoAxesCombined,
    'Examine the measured results, including their uncertainty and limits.',
  ],
  [
    'studio',
    'Experiment Studio',
    FlaskConical,
    'Build configurations and inspect the planned experiment matrix.',
  ],
  [
    'reproducibility',
    'Reproducibility',
    BookOpen,
    'Trace the research from configuration to source evidence.',
  ],
] as const;
export default function Home() {
  return (
    <SidebarProvider>
      <Platform />
    </SidebarProvider>
  );
}
function Platform() {
  const [page, setPage] = useState('overview');
  const [tour, setTour] = useState<number | null>(null);
  const { setOpenMobile } = useSidebar();
  function navigate(id: string) {
    setPage(id);
    setOpenMobile(false);
    window.location.hash = id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (nav.some((n) => n[0] === hash)) setPage(hash);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const active = nav.find((n) => n[0] === page) ?? nav[1];
  useEffect(() => {
    document.title = `${active[1]} | Fed-ResViT`;
  }, [active]);
  function tourStep(n: number) {
    setTour(n);
    navigate('overview');
  }
  const inspect = () => navigate('reproducibility');
  return (
    <>
      <a
        href="#main-content"
        className="skip-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to workspace
      </a>
      <Sidebar className="research-sidebar">
        <SidebarHeader>
          <button
            className="brand"
            onClick={() => navigate('overview')}
            aria-label="Fed-ResViT home"
          >
            <Dna size={32} />
            <div>
              Fed-ResViT<small>RESEARCH INTELLIGENCE</small>
            </div>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">WORKSPACES</div>
          <SidebarMenu>
            {nav.map(([id, name, Icon]) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  className="nav-item"
                  isActive={page === id}
                  onClick={() => navigate(id)}
                >
                  <Icon />
                  <span>{name}</span>
                  {page === id && <span className="nav-active-dot" />}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="sidebar-guide">
            <FlaskConical size={21} />
            <h3>
              A research story,
              <br />
              ready to explore.
            </h3>
            <p>
              Walk through the science
              <br />
              in a guided presentation.
            </p>
            <button onClick={() => tourStep(0)}>
              Explore the science
              <ArrowUpRight size={14} />
            </button>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <div className="side-study">
            <span className="live-dot" /> Research protocol
            <small>HAM10000 · 10 simulated clients</small>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div>
            <SidebarTrigger />
            <span>
              Research & Clinical Intelligence{' '}
              <span className="breadcrumb-sep">/</span> <b>{active[1]}</b>
            </span>
          </div>
          <div>
            <WorkspaceSearch navigate={navigate} />
            <span className="status-chip">
              <span className="live-dot" />
              RESEARCH EDITION
            </span>
            <button
              className="avatar top-avatar"
              title="Research profile"
              onClick={() => navigate('reproducibility')}
            >
              AS
            </button>
          </div>
        </header>
        <main className="workspace" id="main-content" tabIndex={-1}>
          <div className="page-title">
            <div>
              <h1>{active[1]}</h1>
              <p>{active[3]}</p>
            </div>
            {page === 'overview' ? (
              <button
                className="primary-btn"
                onClick={() => navigate('clinical')}
              >
                <Stethoscope size={16} />
                Open image viewer
                <ArrowUpRight size={15} />
              </button>
            ) : (
              <Badge
                state={
                  page === 'clinical'
                    ? 'RESEARCH USE'
                    : page === 'about'
                      ? 'PROJECT SUMMARY'
                      : 'RESULTS PENDING'
                }
              />
            )}
          </div>
          {tour !== null && (
            <GuidedWalkthrough
              step={tour}
              onStep={(n, id) => {
                setTour(n);
                navigate(id);
              }}
              onClose={() => setTour(null)}
            />
          )}
          <Suspense fallback={<p>Loading research workspace…</p>}>
            {page === 'about' ? (
              <About navigate={navigate} />
            ) : page === 'clinical' ? (
              <Clinical inspect={inspect} />
            ) : (
              <RevisionWorkspace key={page} page={page} navigate={navigate} />
            )}
          </Suspense>
          <footer>
            <ShieldCheck size={13} />
            Research / Educational Demonstration — Not a standalone diagnostic
            system<span>Fed-ResViT · Research protocol & evidence</span>
          </footer>
        </main>
      </SidebarInset>
    </>
  );
}

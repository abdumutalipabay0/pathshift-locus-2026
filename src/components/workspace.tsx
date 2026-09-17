'use client';
import { useEffect, useRef, useState, useId } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Bookmark,
  GitCompareArrows,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  RotateCcw,
  UserRound,
  GraduationCap,
  Globe2,
  CalendarDays,
  Info,
  X,
  Plus,
  Search,
  Wallet,
  ExternalLink,
  MoveRight,
  FlaskConical,
  AlertCircle,
  ChevronDown,
  Download,
  LoaderCircle,
  Menu,
  Languages,
} from 'lucide-react';
import type {
  Evaluation,
  Fact,
  Profile,
  Result,
  RuleResult,
  Simulation,
  State,
  Task,
} from '@/lib/types';
import { blankProfile, demoProfile, profileSchema } from '@/lib/profile';
import ProfileWizard from './profile-wizard';
type View = 'map' | 'profile' | 'shortlist' | 'compare' | 'roadmap' | 'sources';
const labels: Record<State, string> = {
  READY_TO_APPLY: 'Ready to apply',
  WITHIN_REACH: 'Within reach',
  CONDITIONAL_PATH: 'Conditional path',
  BLOCKED: 'Blocked for this intake',
  INDETERMINATE: 'Needs verification',
};
const symbols = { PASS: '✓', FAIL: '−', UNKNOWN: '?', NOT_APPLICABLE: '↗' };
const friendly = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
const money = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
const dateLabel = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
const navItems = [
  { id: 'map', label: 'Opportunity map', icon: Compass },
  { id: 'shortlist', label: 'My shortlist', icon: Bookmark },
  { id: 'compare', label: 'Compare paths', icon: GitCompareArrows },
  { id: 'roadmap', label: 'My roadmap', icon: Route },
  { id: 'sources', label: 'Sources & evidence', icon: ShieldCheck },
] as const;
async function api<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(
    '/api/v1/' + path,
    body
      ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : undefined,
  );
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Unable to reach the decision engine.');
  return value;
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M8 25V13a6 6 0 0 1 12 0c0 6-12 4-12 12M9 22l16-13M17 9h8v8"
            stroke="currentColor"
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      pathshift<span className="brand-dot">.</span>
    </span>
  );
}
function Badge({ state }: { state: State }) {
  return (
    <span className={`badge state-${state.toLowerCase()}`}>
      <span className="status-dot" />
      {labels[state]}
    </span>
  );
}
function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${wide ? 'wide' : ''}`}>
          <div className="modal-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function FactProof({ fact }: { fact: Fact }) {
  return (
    <article className="fact-proof">
      <div className="between">
        <span className={`mini-badge ${fact.evidence === 'VERIFIED' ? 'verified' : ''}`}>
          <ShieldCheck size={13} />
          {friendly(fact.evidence)}
        </span>
        <span className="small muted">
          {fact.provenance === 'OFFICIAL_FACT' ? 'Official source' : 'Evidence gap'}
        </span>
      </div>
      <h4>{fact.statement}</h4>
      <dl className="proof-grid">
        <div>
          <dt>Scope</dt>
          <dd>{fact.scope.institution}</dd>
        </div>
        <div>
          <dt>Intake / period</dt>
          <dd>{friendly(fact.intake)}</dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>{dateLabel(fact.retrieved_at.slice(0, 10))}</dd>
        </div>
        <div>
          <dt>Source title</dt>
          <dd>{fact.page_title || 'Not recorded in original research'}</dd>
        </div>
      </dl>
      <p className="small muted">{fact.notes}</p>
      {fact.source_url ? (
        <a className="source-link" href={fact.source_url} target="_blank" rel="noreferrer">
          Open official source
          <ArrowUpRight size={15} />
        </a>
      ) : (
        <p className="small muted">A claim-specific source has not been established.</p>
      )}
    </article>
  );
}
function RuleRow({
  rule,
  onProof,
  depth = 0,
}: {
  rule: RuleResult;
  onProof: (ids: string[]) => void;
  depth?: number;
}) {
  return (
    <div className={`rule-row ${depth ? 'nested' : ''}`}>
      <div className={`rule-symbol ${rule.result.toLowerCase()}`}>{symbols[rule.result]}</div>
      <div className="rule-content">
        <div className="between">
          <strong>{rule.label}</strong>
          <span className="rule-verdict">
            {rule.conditional ? 'CONDITIONAL' : rule.result.replaceAll('_', ' ')}
          </span>
        </div>
        <p>{rule.reason}</p>
        <div className="rule-links">
          <span>
            {rule.strength === 'HARD' ? 'Required' : 'Informational'} · PathShift evaluation
          </span>
          {rule.facts.length > 0 && (
            <button onClick={() => onProof(rule.facts)}>
              <ShieldCheck size={12} />
              Source proof
            </button>
          )}
        </div>
        {rule.children.length > 0 && (
          <details>
            <summary>See {rule.children.length} conditions</summary>
            {rule.children.map((r) => (
              <RuleRow key={r.id} rule={r} onProof={onProof} depth={depth + 1} />
            ))}
          </details>
        )}
      </div>
    </div>
  );
}
function PathGraphic() {
  return (
    <div className="path-graphic" aria-hidden="true">
      <div className="path-grid" />
      <svg viewBox="0 0 400 150" fill="none">
        <path
          className="path-line base"
          d="M25 75H105C160 75 140 30 200 30H360M105 75H360M105 75C160 75 140 120 200 120H360"
        />
        <path className="path-line bright" d="M25 75H105C160 75 140 30 200 30H360" />
        <circle cx="28" cy="75" r="7" fill="#3559DB" />
        <circle cx="355" cy="30" r="6" fill="#137B69" />
        <circle cx="355" cy="75" r="6" fill="#B29CDB" />
        <circle cx="355" cy="120" r="6" fill="#A9B4C5" />
      </svg>
      <span className="diagram-label origin">You, today</span>
      <span className="diagram-label top">
        A new possibility <ArrowUpRight size={13} />
      </span>
      <span className="diagram-label middle">An alternative route</span>
      <span className="diagram-label bottom">A question to resolve</span>
      <span className="diagram-pivot">
        <SlidersHorizontal size={13} /> One change
      </span>
    </div>
  );
}
export default function Workspace() {
  const [view, setView] = useState<View>('map');
  const [profile, setProfile] = useState<Profile>(demoProfile);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(true);
  const [menu, setMenu] = useState(false);
  const [wizard, setWizard] = useState<Profile>(demoProfile);
  const [detail, setDetail] = useState<string | null>(null);
  const [proof, setProof] = useState<string[] | null>(null);
  const [diagnosis, setDiagnosis] = useState(false);
  const [comparison, setComparison] = useState<string[]>(['waterloo', 'gatech']);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [allCountries, setAllCountries] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const [scenario, setScenario] = useState({
    english: true,
    ielts: 6.5,
    reading: 6,
    writing: 6.5,
    listening: 6,
    speaking: 6.5,
    sat: false,
    satScore: 1450,
    budget: false,
    USD: 20000,
    CAD: 25000,
    GBP: 15000,
    country: 'keep',
  });
  const current = simulation?.after || evaluation;
  const compute = async (p: Profile, persist = true, demoValue = demo) => {
    const token = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const e = await api<Evaluation>('evaluate', { profile: p });
      if (token !== generation.current) return;
      setProfile(e.profile);
      setEvaluation(e);
      setSimulation(null);
      if (persist)
        try {
          localStorage.setItem(
            'pathshift-v1',
            JSON.stringify({ profile: e.profile, demo: demoValue }),
          );
        } catch {
          setNotice('Your browser could not save changes. Keep this tab open.');
        }
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const sources = await api<{ facts: Fact[] }>('programs');
        let p = structuredClone(demoProfile),
          isDemo = true;
        try {
          const saved = localStorage.getItem('pathshift-v1');
          if (saved) {
            const parsed = JSON.parse(saved);
            const valid = profileSchema.safeParse(parsed.profile);
            if (valid.success) {
              p = valid.data;
              isDemo = parsed.demo !== false;
            }
          }
        } catch {
          /* A corrupt cache never prevents a fresh demo. */
        }
        const result = await api<Evaluation>('evaluate', { profile: p });
        if (alive) {
          setFacts(sources.facts);
          setProfile(p);
          setWizard(p);
          setDemo(isDemo);
          setEvaluation(result);
          setBusy(false);
        }
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
          setBusy(false);
        }
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);
  const navigate = (v: View) => {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const reset = () => {
    setDemo(true);
    setScenario({
      english: true,
      ielts: 6.5,
      reading: 6,
      writing: 6.5,
      listening: 6,
      speaking: 6.5,
      sat: false,
      satScore: 1450,
      budget: false,
      USD: 20000,
      CAD: 25000,
      GBP: 15000,
      country: 'keep',
    });
    setComparison(['waterloo', 'gatech']);
    navigate('map');
    void compute(structuredClone(demoProfile), true, true);
    setNotice('Demo reset to Aruzhan’s starting profile.');
  };
  const edit = (fresh = false) => {
    setWizard(structuredClone(fresh ? blankProfile : profile));
    navigate('profile');
  };
  const shortlist = (id: string) => {
    const list = profile.shortlist.includes(id)
      ? profile.shortlist.filter((i) => i !== id)
      : [...profile.shortlist, id];
    void compute({ ...profile, shortlist: list });
  };
  const compare = (id: string) =>
    setComparison((ids) =>
      ids.includes(id)
        ? ids.filter((i) => i !== id)
        : ids.length < 3
          ? [...ids, id]
          : [...ids.slice(1), id],
    );
  const runScenario = async () => {
    const token = generation.current;
    setSimBusy(true);
    setSimError('');
    try {
      const mutation: Partial<Profile> = scenario.english
        ? {
            ielts: {
              ...profile.ielts,
              status: 'VALID',
              overall: scenario.ielts,
              reading: scenario.reading,
              writing: scenario.writing,
              listening: scenario.listening,
              speaking: scenario.speaking,
              date: profile.ielts.date || new Date().toISOString().slice(0, 10),
            },
          }
        : {};
      if (scenario.sat)
        mutation.sat = {
          status: 'VALID',
          score: scenario.satScore,
          date: profile.sat.date || new Date().toISOString().slice(0, 10),
        };
      if (scenario.budget)
        mutation.budgets = { USD: scenario.USD, CAD: scenario.CAD, GBP: scenario.GBP };
      if (scenario.country !== 'keep') mutation.countries = [scenario.country];
      const result = await api<Simulation>('simulate', { profile, mutation });
      if (token === generation.current) setSimulation(result);
    } catch (e) {
      setSimError((e as Error).message);
    } finally {
      setSimBusy(false);
    }
  };
  const toggleTask = async (task: Task) => {
    if (task.requires_value) {
      edit();
      setNotice('Enter the completed result or document declaration in your profile.');
      return;
    }
    setBusy(true);
    try {
      const e = await api<Evaluation>(
        `roadmap/tasks/${task.id}`,
        { profile, complete: !task.complete },
        'PATCH',
      );
      setProfile(e.profile);
      setEvaluation(e);
      setSimulation(null);
      try {
        localStorage.setItem('pathshift-v1', JSON.stringify({ profile: e.profile, demo }));
      } catch {}
      setNotice(task.complete ? 'Task reopened.' : 'Progress saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportPlan = () => {
    if (!current) return;
    const text = `PATHSHIFT · ${current.profile.name}\n${friendly(current.profile.intake)} · ${current.profile.major}\n\n${current.roadmap
      .map(
        (t, i) =>
          `${i + 1}. [${t.complete ? 'x' : ' '}] ${t.title}\n${t.description}\n${t.deadline ? 'Date: ' + t.deadline : 'Date: needs verification'}\n${t.facts
            .map((id) => facts.find((f) => f.id === id)?.source_url)
            .filter(Boolean)
            .join('\n')}`,
      )
      .join('\n\n')}\n\nCalculated ${current.evaluated_at}. Not a guarantee of admission.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pathshift-roadmap.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  const selected = current?.programs.find((r) => r.program.id === detail);
  const inScope = current?.programs.filter((r) => r.in_scope) || [];
  const counts = {
    ready: inScope.filter((r) => r.admission_state === 'READY_TO_APPLY').length,
    reach: inScope.filter(
      (r) => r.admission_state === 'WITHIN_REACH' || r.admission_state === 'CONDITIONAL_PATH',
    ).length,
    verify: inScope.filter((r) => r.admission_state === 'INDETERMINATE').length,
    blocked: inScope.filter((r) => r.admission_state === 'BLOCKED').length,
  };
  const shown = (current?.programs || []).filter(
    (r) =>
      (allCountries || r.in_scope) &&
      (view !== 'shortlist' || profile.shortlist.includes(r.program.id)) &&
      (filter === 'all' ||
        (filter === 'actionable'
          ? r.admission_state === 'WITHIN_REACH' || r.admission_state === 'CONDITIONAL_PATH'
          : r.admission_state === filter)) &&
      `${r.program.name} ${r.program.degree}`.toLowerCase().includes(search.toLowerCase()),
  );
  const navLabel = view === 'profile' ? 'Your profile' : navItems.find((n) => n.id === view)?.label;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <button
          className="brand-button"
          onClick={() => navigate('map')}
          aria-label="PathShift opportunity map"
        >
          <Brand />
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={18} />
              {label}
              {id === 'shortlist' && <span className="nav-count">{profile.shortlist.length}</span>}
              {id === 'map' && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => edit()}>
          <UserRound size={18} />
          My profile
        </button>
        <div className="sidebar-grow" />
        <div className="sidebar-card">
          <span className="mini-badge">
            <GraduationCap size={13} />
            FALL 2027
          </span>
          <h3>One step closer.</h3>
          <p>Every small change can open a different path.</p>
          <button onClick={() => navigate('roadmap')}>
            See my next step <ArrowRight size={15} />
          </button>
        </div>
        <button className="profile-button" onClick={() => edit()}>
          <span className="avatar">{profile.name.slice(0, 1) || 'A'}</span>
          <span>
            <strong>{profile.name || 'Your profile'}</strong>
            <small>{demo ? 'Demo applicant' : 'Your admission journey'}</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span className="desktop-crumb">Workspace</span>
            <ChevronRight size={13} className="desktop-crumb" />
            <strong>{navLabel}</strong>
          </div>
          <div className="top-actions">
            <span className="save-status">
              <span />
              {busy ? 'Recalculating…' : 'Saved on this device'}
            </span>
            <button className="btn small-btn secondary" onClick={reset} disabled={busy}>
              <RotateCcw size={14} />
              Reset demo
            </button>
            <button className="top-avatar" aria-label="Edit profile" onClick={() => edit()}>
              {profile.name.slice(0, 1) || 'A'}
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          {error && (
            <div className="error-box" role="alert">
              <AlertCircle size={19} />
              <div>
                <strong>We couldn’t update your paths.</strong>
                <p>{error}</p>
              </div>
              <button className="btn secondary" onClick={() => void compute(profile)}>
                Try again
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={17} />
              {notice}
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => setNotice('')}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {simulation && (
            <div className="simulation-banner">
              <FlaskConical size={19} />
              <div>
                <strong>You’re exploring a scenario</strong>
                <span>Your saved profile has not changed.</span>
              </div>
              <button className="btn ghost" onClick={() => setSimulation(null)}>
                Discard
              </button>
              <button
                className="btn primary"
                onClick={() => void compute(simulation.after.profile)}
              >
                Apply scenario
                <Check size={15} />
              </button>
            </div>
          )}
          {view === 'profile' ? (
            <ProfileWizard
              key={JSON.stringify(wizard)}
              initial={wizard}
              onCancel={() => navigate('map')}
              onSave={(p) => {
                setDemo(false);
                void compute(p, true, false);
                navigate('map');
                setDiagnosis(true);
              }}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    {view === 'map'
                      ? 'YOUR NEXT CHAPTER'
                      : view === 'roadmap'
                        ? 'FROM POSSIBILITIES TO PROGRESS'
                        : view === 'sources'
                          ? 'CLARITY YOU CAN CHECK'
                          : 'YOUR ADMISSION WORKSPACE'}
                  </div>
                  <h1>
                    {view === 'map'
                      ? 'Your opportunity map.'
                      : view === 'shortlist'
                        ? 'The paths you’re keeping close.'
                        : view === 'compare'
                          ? 'Different paths. A clearer choice.'
                          : view === 'roadmap'
                            ? 'Small steps. Real progress.'
                            : 'Every decision has a source.'}
                  </h1>
                  <p>
                    {view === 'map'
                      ? 'See where you stand — and what could change your options.'
                      : view === 'shortlist'
                        ? 'Your saved programs shape your personal roadmap.'
                        : view === 'compare'
                          ? 'Compare the requirements that matter to your profile.'
                          : view === 'roadmap'
                            ? 'A living plan, built from your shortlist and the requirements ahead.'
                            : 'Official requirements, transparent reasoning, and clearly marked gaps.'}
                  </p>
                </div>
                {view === 'roadmap' ? (
                  <button className="btn secondary" onClick={exportPlan} disabled={!current}>
                    <Download size={16} />
                    Export plan
                  </button>
                ) : (
                  <button className="btn secondary" onClick={() => edit(true)}>
                    <Plus size={16} />
                    Build my profile
                  </button>
                )}
              </div>
              {view === 'map' && (
                <>
                  <section className="journey-banner">
                    <div className="journey-copy">
                      <div className="between">
                        <span className="eyebrow">
                          {demo ? 'MEET ARUZHAN · DEMO PROFILE' : 'YOUR STARTING POINT'}
                        </span>
                        <button className="text-button" onClick={() => setDiagnosis(true)}>
                          View diagnosis
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                      <h2>
                        Your future has more
                        <br />
                        than one path.
                      </h2>
                      <p>
                        Change an input. See what opens up.
                        <br />
                        Make your next move with a reason.
                      </p>
                      <div className="profile-chips">
                        <span>
                          <GraduationCap size={14} />
                          {profile.curriculum}
                          {profile.ib_total !== null && profile.curriculum === 'IB'
                            ? ` ${profile.ib_total}/45`
                            : ''}
                        </span>
                        <span>
                          <Languages size={14} />
                          IELTS {profile.ielts.overall ?? '—'}
                        </span>
                        <span>
                          <Globe2 size={14} />
                          {profile.countries.join(' + ') || 'No country selected'}
                        </span>
                      </div>
                    </div>
                    <PathGraphic />
                  </section>
                  <div className="journey-steps">
                    <span className="complete">
                      <CheckCircle2 size={16} />
                      Your profile
                    </span>
                    <i />
                    <span className="current">
                      <Compass size={16} />
                      Explore paths
                    </span>
                    <i />
                    <button onClick={() => navigate('compare')}>
                      <GitCompareArrows size={16} />
                      Compare
                    </button>
                    <i />
                    <button onClick={() => navigate('roadmap')}>
                      <Route size={16} />
                      Take your next step
                    </button>
                  </div>
                </>
              )}
              {!current && !error ? (
                <div className="loading-state">
                  <LoaderCircle className="spin" />
                  <h2>Connecting your profile to the evidence…</h2>
                  <p>Evaluating requirements, dates and possible next steps.</p>
                </div>
              ) : (
                current && (
                  <>
                    {(view === 'map' || view === 'shortlist') && (
                      <>
                        <div className="mobile-quick-actions">
                          <a className="btn primary" href="#scenario-lab">
                            <FlaskConical size={16} />
                            Try a what-if
                          </a>
                          <button className="btn secondary" onClick={() => navigate('roadmap')}>
                            <Route size={16} />
                            My next step
                          </button>
                        </div>
                        <div className="workspace-grid">
                          <div className="board">
                            <div className="stats-grid">
                              <button
                                className={filter === 'READY_TO_APPLY' ? 'selected' : ''}
                                onClick={() =>
                                  setFilter(filter === 'READY_TO_APPLY' ? 'all' : 'READY_TO_APPLY')
                                }
                              >
                                <span className="stat-icon green">
                                  <CheckCircle2 size={17} />
                                </span>
                                <strong>{counts.ready.toString().padStart(2, '0')}</strong>
                                <span>Ready to apply</span>
                              </button>
                              <button
                                className={filter === 'actionable' ? 'selected' : ''}
                                onClick={() =>
                                  setFilter(filter === 'actionable' ? 'all' : 'actionable')
                                }
                              >
                                <span className="stat-icon purple">
                                  <Route size={17} />
                                </span>
                                <strong>{counts.reach.toString().padStart(2, '0')}</strong>
                                <span>Reachable / conditional</span>
                              </button>
                              <button
                                className={filter === 'INDETERMINATE' ? 'selected' : ''}
                                onClick={() =>
                                  setFilter(filter === 'INDETERMINATE' ? 'all' : 'INDETERMINATE')
                                }
                              >
                                <span className="stat-icon amber">
                                  <Info size={17} />
                                </span>
                                <strong>{counts.verify.toString().padStart(2, '0')}</strong>
                                <span>Need verification</span>
                              </button>
                            </div>
                            <div className="board-toolbar">
                              <div className="board-tabs">
                                <button
                                  className={filter === 'all' ? 'active' : ''}
                                  onClick={() => setFilter('all')}
                                >
                                  {view === 'shortlist' ? 'Saved paths' : 'All paths'}
                                  <span>
                                    {view === 'shortlist'
                                      ? profile.shortlist.length
                                      : inScope.length}
                                  </span>
                                </button>
                                {counts.blocked > 0 && (
                                  <button
                                    onClick={() => setFilter('BLOCKED')}
                                    className={filter === 'BLOCKED' ? 'active' : ''}
                                  >
                                    Blocked <span>{counts.blocked}</span>
                                  </button>
                                )}
                              </div>
                              <label className="search-input">
                                <Search size={15} />
                                <input
                                  aria-label="Search programs"
                                  placeholder="Find a program…"
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                              </label>
                            </div>
                            <div className="board-caption">
                              <span>
                                {current.programs.length} programs evaluated · {shown.length} shown
                              </span>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={allCountries}
                                  onChange={(e) => setAllCountries(e.target.checked)}
                                />
                                Include other countries
                              </label>
                            </div>
                            {!shown.length ? (
                              <div className="empty-state panel">
                                <Compass size={30} />
                                <h2>
                                  {view === 'shortlist'
                                    ? 'Your shortlist starts with a possibility.'
                                    : 'No exact paths under these filters.'}
                                </h2>
                                <p>
                                  Explore the full map, keep a program that interests you, or adjust
                                  your country preferences.
                                </p>
                                <button
                                  className="btn primary"
                                  onClick={() => {
                                    setFilter('all');
                                    setSearch('');
                                    setAllCountries(true);
                                    navigate('map');
                                  }}
                                >
                                  Explore all 12 programs
                                  <ArrowRight size={15} />
                                </button>
                              </div>
                            ) : (
                              <div className="program-grid">
                                {shown.map((r) => (
                                  <ProgramCard
                                    key={r.program.id}
                                    result={r}
                                    saved={profile.shortlist.includes(r.program.id)}
                                    comparing={comparison.includes(r.program.id)}
                                    changed={
                                      !!simulation?.diff.changed_rules.some(
                                        (d) => d.program === r.program.id,
                                      ) ||
                                      !!simulation?.diff.changed_states.some(
                                        (d) => d.id === r.program.id,
                                      )
                                    }
                                    onOpen={() => setDetail(r.program.id)}
                                    onSave={() => shortlist(r.program.id)}
                                    onCompare={() => compare(r.program.id)}
                                    disabled={busy || !!simulation}
                                  />
                                ))}
                              </div>
                            )}
                            <div className="map-footnote">
                              <ShieldCheck size={16} />
                              <p>
                                Ready means no detected published blocker in the evaluated rules. It
                                is not an admission guarantee. Every program includes its evidence
                                limits.
                              </p>
                            </div>
                            {comparison.length >= 2 && (
                              <div className="compare-tray">
                                <div>
                                  <GitCompareArrows size={19} />
                                  <strong>{comparison.length} paths selected</strong>
                                  <span className="muted small">
                                    See the differences side by side.
                                  </span>
                                </div>
                                <button
                                  className="btn primary small-btn"
                                  onClick={() => navigate('compare')}
                                >
                                  Compare paths
                                  <ArrowRight size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                          <aside className="scenario-rail" id="scenario-lab">
                            <section className="scenario-panel panel">
                              <div className="scenario-heading">
                                <span className="scenario-icon">
                                  <SlidersHorizontal size={20} />
                                </span>
                                <div>
                                  <h2>What if?</h2>
                                  <p>One change. New possibilities.</p>
                                </div>
                                <span className="mini-badge">LAB</span>
                              </div>
                              <div className="scenario-body">
                                <label className="toggle-label">
                                  <span>
                                    <strong>Explore an English result</strong>
                                    <small>Choose the score and bands below</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.english}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, english: e.target.checked });
                                      setSimulation(null);
                                    }}
                                  />
                                </label>
                                <fieldset
                                  className="scenario-score-fields"
                                  disabled={!scenario.english || simBusy}
                                >
                                  <div className="between">
                                    <label htmlFor="scenario-ielts">IELTS overall</label>
                                    <div className="score-pill">
                                      {profile.ielts.overall ?? '—'}
                                      <MoveRight size={14} />
                                      <strong>{scenario.ielts.toFixed(1)}</strong>
                                    </div>
                                  </div>
                                  <input
                                    id="scenario-ielts"
                                    type="range"
                                    min="4"
                                    max="9"
                                    step="0.5"
                                    value={scenario.ielts}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, ielts: Number(e.target.value) });
                                      setSimulation(null);
                                    }}
                                  />
                                  <div className="range-labels">
                                    <span>4.0</span>
                                    <span>9.0</span>
                                  </div>
                                  <details className="scenario-details" open>
                                    <summary>
                                      Component scores <ChevronDown size={14} />
                                    </summary>
                                    <div className="band-inputs">
                                      {(
                                        ['reading', 'writing', 'listening', 'speaking'] as const
                                      ).map((k) => (
                                        <label key={k}>
                                          {k.slice(0, 1).toUpperCase() + k.slice(1)}
                                          <input
                                            aria-label={`Scenario ${k}`}
                                            type="number"
                                            min="0"
                                            max="9"
                                            step="0.5"
                                            value={scenario[k]}
                                            onChange={(e) => {
                                              setScenario({
                                                ...scenario,
                                                [k]: Number(e.target.value),
                                              });
                                              setSimulation(null);
                                            }}
                                          />
                                        </label>
                                      ))}
                                    </div>
                                  </details>
                                  <p className="field-note">
                                    These are hypothetical scores. Your bands do not automatically
                                    change with your overall score.
                                  </p>
                                </fieldset>
                                <div className="scenario-divider" />
                                <label className="toggle-label">
                                  <span>
                                    <strong>Add a valid SAT</strong>
                                    <small>Test a required-score branch</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.sat}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, sat: e.target.checked });
                                      setSimulation(null);
                                    }}
                                  />
                                </label>
                                {scenario.sat && (
                                  <label className="scenario-number">
                                    Hypothetical SAT score
                                    <input
                                      type="number"
                                      min="400"
                                      max="1600"
                                      step="10"
                                      value={scenario.satScore}
                                      onChange={(e) => {
                                        setScenario({
                                          ...scenario,
                                          satScore: Number(e.target.value),
                                        });
                                        setSimulation(null);
                                      }}
                                    />
                                  </label>
                                )}
                                <label className="toggle-label">
                                  <span>
                                    <strong>Explore a different budget</strong>
                                    <small>Keep academic results separate</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.budget}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, budget: e.target.checked });
                                      setSimulation(null);
                                    }}
                                  />
                                </label>
                                {scenario.budget && (
                                  <div className="budget-inputs">
                                    {(['USD', 'CAD', 'GBP'] as const).map((c) => (
                                      <label key={c}>
                                        {c}
                                        <input
                                          type="number"
                                          min="0"
                                          step="1000"
                                          value={scenario[c]}
                                          onChange={(e) => {
                                            setScenario({
                                              ...scenario,
                                              [c]: Number(e.target.value),
                                            });
                                            setSimulation(null);
                                          }}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                )}
                                <label className="scenario-number">
                                  Country preference
                                  <select
                                    disabled={
                                      !profile.geography_flexible || !!profile.country_locks.length
                                    }
                                    value={scenario.country}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, country: e.target.value });
                                      setSimulation(null);
                                    }}
                                  >
                                    <option value="keep">Keep my countries</option>
                                    <option value="US">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="UK">United Kingdom</option>
                                  </select>
                                </label>
                                {simError && (
                                  <p className="error-text" role="alert">
                                    {simError}
                                  </p>
                                )}
                                <button
                                  className="btn primary full"
                                  onClick={() => void runScenario()}
                                  disabled={simBusy || busy}
                                >
                                  {simBusy ? (
                                    <LoaderCircle size={17} className="spin" />
                                  ) : (
                                    <FlaskConical size={17} />
                                  )}{' '}
                                  {simBusy ? 'Recalculating…' : 'Explore this scenario'}
                                  <ArrowRight size={16} />
                                </button>
                                <p className="private-note">
                                  <ShieldCheck size={12} />
                                  Try freely. Apply only when you’re ready.
                                </p>
                              </div>
                              {simulation && (
                                <div className="causal-diff" aria-live="polite">
                                  <div className="eyebrow">HERE’S WHAT CHANGED</div>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.removed_blockers.length}</strong>
                                    <span>requirement gaps removed</span>
                                  </div>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.changed_states.length}</strong>
                                    <span>program states changed</span>
                                  </div>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.changed_costs.length}</strong>
                                    <span>dated budget comparisons changed</span>
                                  </div>
                                  {simulation.diff.changed_rules.slice(0, 6).map((d) => (
                                    <div className="diff-line" key={d.rule}>
                                      <span>
                                        {
                                          current.programs.find((r) => r.program.id === d.program)
                                            ?.program.short
                                        }
                                        <small>{d.label}</small>
                                      </span>
                                      <span>
                                        {symbols[d.before]}
                                        <ArrowRight size={11} />
                                        <strong>{symbols[d.after]}</strong>
                                      </span>
                                    </div>
                                  ))}
                                  <p className="small">
                                    {simulation.diff.tasks_removed.length} roadmap tasks removed ·{' '}
                                    {simulation.diff.next_before === simulation.diff.next_after
                                      ? 'Next action stays the same'
                                      : 'Next action updated'}
                                  </p>
                                  <button
                                    className="btn primary full"
                                    onClick={() => void compute(simulation.after.profile)}
                                  >
                                    Apply scenario
                                    <Check size={16} />
                                  </button>
                                  <button
                                    className="text-button full"
                                    onClick={() => setSimulation(null)}
                                  >
                                    Discard changes
                                  </button>
                                </div>
                              )}
                            </section>
                            <section className="next-preview">
                              <span className="eyebrow">
                                <Route size={13} /> YOUR NEXT MOVE
                              </span>
                              <h3>
                                {current.next_action?.title ||
                                  'Choose a path to start your roadmap'}
                              </h3>
                              <p>
                                {current.next_action
                                  ? `Connects to ${current.next_action.programs.length} shortlisted ${current.next_action.programs.length === 1 ? 'program' : 'programs'}.`
                                  : 'Save programs that interest you. Your next steps will take shape here.'}
                              </p>
                              <button className="text-button" onClick={() => navigate('roadmap')}>
                                Open my roadmap
                                <ArrowUpRight size={15} />
                              </button>
                            </section>
                            <div className="evidence-note">
                              <ShieldCheck size={20} />
                              <div>
                                <strong>Evidence, not guesswork.</strong>
                                <p>
                                  Requirements linked to official sources. Remaining gaps shown
                                  clearly.
                                </p>
                              </div>
                            </div>
                          </aside>
                        </div>
                      </>
                    )}
                    {view === 'compare' && (
                      <>
                        <div className="compare-picker">
                          {current.programs.map((r) => (
                            <button
                              key={r.program.id}
                              className={`choice ${comparison.includes(r.program.id) ? 'selected' : ''}`}
                              onClick={() => compare(r.program.id)}
                            >
                              {comparison.includes(r.program.id) ? (
                                <Check size={14} />
                              ) : (
                                <Plus size={14} />
                              )}{' '}
                              {r.program.short}
                            </button>
                          ))}
                        </div>
                        {comparison.length < 2 ? (
                          <div className="empty-state panel">
                            <GitCompareArrows size={32} />
                            <h2>Choose at least two paths.</h2>
                            <p>Select programs above to compare their decisive differences.</p>
                          </div>
                        ) : (
                          <div
                            className="compare-grid"
                            style={{ '--compare-cols': comparison.length } as React.CSSProperties}
                          >
                            {comparison
                              .map((id) => current.programs.find((r) => r.program.id === id))
                              .filter((r): r is Result => !!r)
                              .map((r) => (
                                <article className="compare-card panel" key={r.program.id}>
                                  <div
                                    className="school-logo"
                                    style={{
                                      color: r.program.color,
                                      background: r.program.color + '12',
                                    }}
                                  >
                                    {r.program.initials}
                                  </div>
                                  <h2>{r.program.short}</h2>
                                  <p className="muted">{r.program.degree}</p>
                                  <Badge state={r.admission_state} />
                                  <div className="compare-section">
                                    <span className="eyebrow">FOR YOUR PROFILE</span>
                                    <strong>
                                      {r.passed} of {r.total} required branches satisfied
                                    </strong>
                                    <p>
                                      {r.blockers.length
                                        ? r.blockers.map((b) => b.label).join(' · ')
                                        : 'No known requirement gaps in the evaluated branches.'}
                                    </p>
                                    {r.unknowns.length > 0 && (
                                      <p className="amber-text">
                                        {r.unknowns.length} branches need verification.
                                      </p>
                                    )}
                                  </div>
                                  <div className="compare-section">
                                    <span className="eyebrow">THE ROUTE</span>
                                    <p>{r.program.structure}</p>
                                    {r.program.conditional && (
                                      <p>
                                        {r.program.conditional.name}: {r.program.conditional.note}
                                      </p>
                                    )}
                                  </div>
                                  <div className="compare-section">
                                    <span className="eyebrow">COST & TIMING</span>
                                    <CostText result={r} />
                                    <p>
                                      {r.deadline
                                        ? `${dateLabel(r.deadline.date)} · ${friendly(r.timeline_state)}`
                                        : 'Application deadline needs verification.'}
                                    </p>
                                  </div>
                                  <button
                                    className="btn secondary full"
                                    onClick={() => setDetail(r.program.id)}
                                  >
                                    Understand this path
                                    <ArrowUpRight size={16} />
                                  </button>
                                </article>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                    {view === 'roadmap' && (
                      <div className="roadmap-layout">
                        <div>
                          <section className="next-action-hero">
                            <div className="eyebrow">
                              <Route size={14} /> YOUR NEXT BEST ACTION
                            </div>
                            <h2>{current.next_action?.title || 'Save a program. Start a plan.'}</h2>
                            <p>
                              {current.next_action?.description ||
                                'Your roadmap is built from the programs in your shortlist.'}
                            </p>
                            {current.next_action && (
                              <>
                                <div className="next-reasons">
                                  <span>
                                    <Bookmark size={14} />
                                    {current.next_action.programs.length} shortlisted programs
                                  </span>
                                  <span>
                                    <ShieldCheck size={14} />
                                    Requirement-based action
                                  </span>
                                </div>
                                <button
                                  className="btn white"
                                  onClick={() => void toggleTask(current.next_action!)}
                                  disabled={!!simulation || busy}
                                >
                                  {current.next_action.requires_value
                                    ? 'Update my profile'
                                    : 'Mark this step complete'}
                                  <ArrowRight size={16} />
                                </button>
                                <p className="small next-policy">
                                  Why this action? Among steps with completed prerequisites: most
                                  shortlisted programs affected, then earliest known deadline, then
                                  a stable tie-break. Timing is not a guarantee.
                                </p>
                              </>
                            )}
                          </section>
                          <div className="between roadmap-heading">
                            <h2>Your action plan</h2>
                            <span className="muted small">
                              {current.roadmap.filter((t) => t.complete).length} of{' '}
                              {current.roadmap.length} completed
                            </span>
                          </div>
                          <div className="roadmap-progress">
                            <span
                              style={{
                                width: `${current.roadmap.length ? (100 * current.roadmap.filter((t) => t.complete).length) / current.roadmap.length : 0}%`,
                              }}
                            />
                          </div>
                          {!current.roadmap.length ? (
                            <div className="empty-state panel">
                              <Bookmark size={28} />
                              <h3>Your shortlist powers this page.</h3>
                              <p>Save a few programs to create personalized steps.</p>
                              <button className="btn primary" onClick={() => navigate('map')}>
                                Explore paths
                                <ArrowRight size={15} />
                              </button>
                            </div>
                          ) : (
                            <div className="task-list">
                              {current.roadmap.map((t, i) => (
                                <article
                                  className={`task-card ${t.complete ? 'completed' : ''}`}
                                  key={t.id}
                                >
                                  <div className="task-marker">
                                    {t.complete ? (
                                      <Check size={16} />
                                    ) : (
                                      String(i + 1).padStart(2, '0')
                                    )}
                                  </div>
                                  <div className="task-body">
                                    <div className="between">
                                      <span className="eyebrow">
                                        {t.type === 'VERIFY'
                                          ? 'CHECK & CONFIRM'
                                          : t.type === 'SCORE'
                                            ? 'TESTS & LANGUAGE'
                                            : t.type === 'BUDGET'
                                              ? 'FINANCIAL PLANNING'
                                              : 'APPLICATION MATERIALS'}
                                      </span>
                                      {t.deadline && (
                                        <span className="task-date">
                                          <CalendarDays size={12} />
                                          {dateLabel(t.deadline)}
                                        </span>
                                      )}
                                    </div>
                                    <h3>{t.title}</h3>
                                    <p>{t.description}</p>
                                    <div className="task-tags">
                                      {t.programs.map((id) => (
                                        <span key={id}>
                                          {
                                            current.programs.find((r) => r.program.id === id)
                                              ?.program.short
                                          }
                                        </span>
                                      ))}
                                    </div>
                                    {t.dependencies.length > 0 && (
                                      <p className="small muted">
                                        First:{' '}
                                        {t.dependencies
                                          .map(
                                            (id) =>
                                              current.roadmap.find((x) => x.id === id)?.title || id,
                                          )
                                          .join('; ')}
                                      </p>
                                    )}
                                    <div className="task-bottom">
                                      <button
                                        className="text-button"
                                        onClick={() => setProof(t.facts)}
                                      >
                                        View evidence
                                        <ExternalLink size={13} />
                                      </button>
                                      <button
                                        className={`btn small-btn ${t.complete ? 'secondary' : 'primary'}`}
                                        disabled={
                                          !!simulation ||
                                          busy ||
                                          t.dependencies.some(
                                            (id) =>
                                              !current.roadmap.find((x) => x.id === id)?.complete,
                                          )
                                        }
                                        onClick={() => void toggleTask(t)}
                                      >
                                        {t.complete
                                          ? 'Reopen'
                                          : t.requires_value
                                            ? 'Enter completed result'
                                            : 'Mark complete'}
                                        {t.complete ? <RotateCcw size={13} /> : <Check size={13} />}
                                      </button>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                        <aside className="roadmap-aside panel">
                          <span className="eyebrow">YOUR DESTINATION</span>
                          <h3>{profile.major}</h3>
                          <p>
                            {friendly(profile.intake)} · {profile.countries.join(' + ')}
                          </p>
                          <div className="form-divider" />
                          <h4>Built around your shortlist</h4>
                          {current.programs
                            .filter((r) => profile.shortlist.includes(r.program.id))
                            .map((r) => (
                              <button
                                className="short-school"
                                onClick={() => setDetail(r.program.id)}
                                key={r.program.id}
                              >
                                <span
                                  className="school-logo tiny"
                                  style={{
                                    color: r.program.color,
                                    background: r.program.color + '15',
                                  }}
                                >
                                  {r.program.initials}
                                </span>
                                {r.program.short}
                                <ChevronRight size={14} />
                              </button>
                            ))}
                          <div className="form-divider" />
                          <Info size={19} />
                          <p className="small muted">
                            Marking a research task complete records progress. It does not turn an
                            unknown university rule into a verified one. Test results need their
                            actual new values.
                          </p>
                          <button className="btn secondary full" onClick={exportPlan}>
                            <Download size={15} />
                            Export my plan
                          </button>
                        </aside>
                      </div>
                    )}
                    {view === 'sources' && (
                      <>
                        <section className="source-intro panel">
                          <ShieldCheck size={27} />
                          <div>
                            <h2>A clear boundary between facts and conclusions.</h2>
                            <p>
                              Official facts come from the frozen research and a new source check on
                              17 September 2026. PathShift compares those facts with your inputs. It
                              does not predict admission. Cost references keep their original year.
                            </p>
                            <div className="source-legend">
                              <span>
                                <i className="green-dot" />
                                Official fact
                              </span>
                              <span>
                                <i className="blue-dot" />
                                PathShift reasoning
                              </span>
                              <span>
                                <i className="amber-dot" />
                                Needs verification
                              </span>
                            </div>
                          </div>
                        </section>
                        <div className="source-groups">
                          {current.programs.map((r) => (
                            <details className="source-group panel" key={r.program.id}>
                              <summary>
                                <span
                                  className="school-logo tiny"
                                  style={{
                                    color: r.program.color,
                                    background: r.program.color + '12',
                                  }}
                                >
                                  {r.program.initials}
                                </span>
                                <strong>{r.program.name}</strong>
                                <span className="muted small">
                                  {facts.filter((f) => f.scope.program === r.program.id).length}{' '}
                                  evidence records
                                </span>
                                <ChevronDown size={16} />
                              </summary>
                              <div className="source-grid">
                                {facts
                                  .filter((f) => f.scope.program === r.program.id)
                                  .map((f) => (
                                    <FactProof key={f.id} fact={f} />
                                  ))}
                              </div>
                            </details>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )
              )}
            </>
          )}
          <footer className="footer">
            <Brand />
            <span>Better questions. Clearer choices.</span>
            <button onClick={() => navigate('sources')}>
              How decisions are made
              <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setDetail(null)}
        title={selected?.program.name || 'Program'}
        description={selected ? selected.program.degree + ' · ' + selected.program.city : ''}
        wide
      >
        {selected && (
          <div className="detail-content">
            <div className="detail-top">
              <Badge state={selected.admission_state} />
              <span className="mini-badge">
                <ShieldCheck size={13} />
                {friendly(selected.evidence_state)} evidence
              </span>
            </div>
            <p className="detail-structure">{selected.program.structure}</p>
            <div className="detail-dimensions">
              <div>
                <span>Requirements</span>
                <strong>
                  {selected.passed} / {selected.total} satisfied
                </strong>
              </div>
              <div>
                <span>Timeline</span>
                <strong>{friendly(selected.timeline_state)}</strong>
              </div>
              <div>
                <span>Fall 2027 total cost</span>
                <strong>Not yet verified</strong>
              </div>
            </div>
            <h3>Why this result?</h3>
            {selected.rules.map((r) => (
              <RuleRow key={r.id} rule={r} onProof={setProof} />
            ))}
            <section className="detail-section">
              <h3>What could change this path?</h3>
              {selected.recourse.length ? (
                selected.recourse.map((r, i) => (
                  <div className="recourse-card" key={i}>
                    <div className="between">
                      <strong>{r.actions.map(friendly).join(' + ')}</strong>
                      <span className="mini-badge">{friendly(r.feasibility)}</span>
                    </div>
                    <p>
                      {r.improved_rules.length} requirement{' '}
                      {r.improved_rules.length === 1 ? 'branch' : 'branches'} improved in a
                      recalculation.{' '}
                      {r.unlocks
                        ? 'Removes the remaining direct-route blockers.'
                        : 'Other conditions may remain.'}
                    </p>
                    <p className="small muted">{r.note}</p>
                  </div>
                ))
              ) : (
                <p className="muted">
                  {selected.admission_state === 'READY_TO_APPLY'
                    ? 'No additional hard requirement change is needed in the evaluated branches. Review the application checklist.'
                    : 'Review the unsatisfied and unknown conditions above. No fully verified, feasible unlock has been established yet.'}
                </p>
              )}
            </section>
            {selected.program.conditional && (
              <div className="notice">
                <Route size={18} />
                <div>
                  <strong>{selected.program.conditional.name}</strong>
                  <p>{selected.program.conditional.note}</p>
                  <button
                    className="text-button"
                    onClick={() => setProof([selected.program.conditional!.fact])}
                  >
                    Check pathway source
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            )}
            <section className="detail-section">
              <h3>Budget & deadlines</h3>
              <CostText result={selected} />
              {selected.program.cost && (
                <button
                  className="text-button"
                  onClick={() => setProof([selected.program.cost!.fact])}
                >
                  Cost source
                  <ExternalLink size={13} />
                </button>
              )}
              {selected.program.deadlines.map((d) => (
                <div className="deadline-row" key={d.type}>
                  <span>{friendly(d.type)}</span>
                  <strong>{dateLabel(d.date)}</strong>
                  <button className="text-button" onClick={() => setProof([d.fact])}>
                    Source
                    <ArrowUpRight size={12} />
                  </button>
                  <small>
                    {d.time ? `${d.time} · ${d.timezone}` : 'Time / timezone not verified'}
                  </small>
                </div>
              ))}
            </section>
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => {
                  compare(selected.program.id);
                  setDetail(null);
                  navigate('compare');
                }}
              >
                <GitCompareArrows size={16} />
                Compare this path
              </button>
              <button
                className="btn primary"
                disabled={busy || !!simulation}
                onClick={() => shortlist(selected.program.id)}
              >
                <Bookmark size={16} />
                {profile.shortlist.includes(selected.program.id)
                  ? 'Remove from shortlist'
                  : 'Save to shortlist'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={proof !== null}
        onClose={() => setProof(null)}
        title="Source proof"
        description="Official evidence behind the calculation."
      >
        {proof && (
          <div className="proof-content">
            {proof.length ? (
              proof
                .map((id) => facts.find((f) => f.id === id))
                .filter((f): f is Fact => !!f)
                .map((f) => <FactProof key={f.id} fact={f} />)
            ) : (
              <div className="empty-state">
                <Info size={25} />
                <h3>This is a planning inference.</h3>
                <p>
                  No complete claim-specific evidence is available for this step. It does not
                  establish an admission fact.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={diagnosis}
        onClose={() => setDiagnosis(false)}
        title={`${profile.name}’s starting point`}
        description={`${profile.curriculum} · ${profile.major} · ${friendly(profile.intake)}`}
      >
        <div className="diagnosis-content">
          {[
            ['Your strengths', current?.diagnosis.strengths, CheckCircle2],
            ['What needs attention', current?.diagnosis.constraints, SlidersHorizontal],
            ['Evidence to clarify', current?.diagnosis.gaps, ShieldCheck],
          ].map(([title, items, Icon]) => {
            const I = Icon as typeof CheckCircle2;
            return (
              <section key={String(title)}>
                <h3>
                  <I size={18} />
                  {String(title)}
                </h3>
                {(items as string[] | undefined)?.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </section>
            );
          })}
          <div className="notice">
            {demo
              ? 'Aruzhan is a synthetic demo applicant. Scores, dates and readiness declarations are illustrative profile inputs. The demo plans its next result / document completion for 20 November 2026.'
              : 'Your results use the values you provided. Update them as you make progress.'}
          </div>
          <button
            className="btn primary full"
            onClick={() => {
              setDiagnosis(false);
              navigate('map');
            }}
          >
            Explore my paths
            <ArrowRight size={16} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
function CostText({ result: r }: { result: Result }) {
  return (
    <div className="cost-text">
      {r.program.cost ? (
        <>
          <strong>
            {r.program.cost.currency} {money(r.program.cost.min)}
            {r.program.cost.max !== r.program.cost.min ? '–' + money(r.program.cost.max) : ''}
          </strong>
          <p>
            {r.program.cost.year} reference ·{' '}
            {r.program.cost.complete ? 'annual estimate' : 'partial cost / subtotal'}
          </p>
          <span className={r.reference_cost_state === 'OVER_BUDGET' ? 'amber-text' : 'muted'}>
            {r.reference_cost_state === 'UNKNOWN'
              ? 'Full annual affordability not established'
              : friendly(r.reference_cost_state) + ' against this reference'}
          </span>
        </>
      ) : (
        <p>Annual cost needs verification.</p>
      )}
      <small>Fall 2027 total cost is not yet verified.</small>
    </div>
  );
}
function ProgramCard({
  result: r,
  saved,
  comparing,
  changed,
  onOpen,
  onSave,
  onCompare,
  disabled,
}: {
  result: Result;
  saved: boolean;
  comparing: boolean;
  changed: boolean;
  onOpen: () => void;
  onSave: () => void;
  onCompare: () => void;
  disabled: boolean;
}) {
  const id = useId();
  return (
    <article className={`program-card ${changed ? 'changed' : ''}`} aria-labelledby={id}>
      {changed && (
        <span className="changed-label">
          <FlaskConical size={11} />
          Changed in scenario
        </span>
      )}
      <div className="card-top">
        <span
          className="school-logo"
          style={{ color: r.program.color, background: r.program.color + '12' }}
        >
          {r.program.initials}
        </span>
        <span className="card-location">
          <Globe2 size={12} />
          {r.program.city}, {r.program.country}
        </span>
        <button
          className={`icon-button bookmark ${saved ? 'saved' : ''}`}
          aria-label={`${saved ? 'Remove' : 'Save'} ${r.program.short} ${saved ? 'from' : 'to'} shortlist`}
          aria-pressed={saved}
          disabled={disabled}
          onClick={onSave}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <button className="card-title-button" onClick={onOpen}>
        <h3 id={id}>
          {r.program.short}
          <ArrowUpRight size={16} />
        </h3>
      </button>
      <p className="degree">{r.program.degree}</p>
      <Badge state={r.admission_state} />
      <div className="card-reason">
        <span className={`reason-icon ${r.blockers.length ? 'amber-text' : ''}`}>
          {r.blockers.length ? (
            <SlidersHorizontal size={16} />
          ) : r.unknowns.length ? (
            <Info size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
        </span>
        <p>
          {r.blockers[0]?.label ||
            r.unknowns[0]?.label ||
            'Published requirements satisfied in evaluated branches.'}
        </p>
      </div>
      <div
        className="branch-progress"
        role="img"
        aria-label={`${r.passed} of ${r.total} required branches satisfied`}
      >
        {Array.from({ length: r.total }, (_, i) => (
          <span className={i < r.passed ? 'passed' : ''} key={i} />
        ))}
      </div>
      <div className="branch-caption">
        <span>
          {r.passed}/{r.total} required branches satisfied
        </span>
        <button onClick={onOpen}>
          Why?
          <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="card-metadata">
        <span>
          <CalendarDays size={13} />
          {r.deadline ? dateLabel(r.deadline.date).replace(', 2027', '') : 'Date unverified'}
        </span>
        <span className={r.reference_cost_state === 'OVER_BUDGET' ? 'amber-text' : ''}>
          <Wallet size={13} />
          {r.reference_cost_state === 'OVER_BUDGET'
            ? 'Above budget · ref.'
            : r.program.cost
              ? 'Dated cost available'
              : 'Cost unverified'}
        </span>
      </div>
      <div className="card-footer">
        <label>
          <input type="checkbox" checked={comparing} onChange={onCompare} />
          Compare
        </label>
        <button onClick={onOpen}>
          Explore path
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

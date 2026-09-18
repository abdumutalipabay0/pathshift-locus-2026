'use client';
import { useLocale, LanguagePicker } from './locale-provider';
import { useEffect, useRef, useState, useId, useCallback, useMemo } from 'react';
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
  MessageCircle,
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
import { demoProfile, profileSchema } from '@/lib/profile';
import ProfileWizard from './profile-wizard';
import { calendarExport, downloadText, scenarioMutation, type SavedScenario } from '@/lib/journey';
import { JourneyExtras } from './journey-extras';
import { PersonalPlanner, ProfileImport } from './personal-tools';
import { ResearchDetails, ResearchComparison, resultCaption } from './research-details';
import FutureLab from './future-lab';
import Link from 'next/link';
import { SignOut } from './entry-header';
import Brand from './brand';
import ApplicantSummary from './applicant-summary';
import AdmissionAssistant from './admission-assistant';
import { taskProfileStep } from '@/lib/workspace-ux';
const focusPrograms = new Set(['uw', 'waterloo', 'gatech', 'purdue', 'rit', 'asu']);
type View =
  'assistant' | 'lab' | 'map' | 'profile' | 'shortlist' | 'compare' | 'roadmap' | 'sources';
const labels: Record<State, string> = {
  READY_TO_APPLY: 'Checked requirements met',
  WITHIN_REACH: 'A result needs improvement',
  CONDITIONAL_PATH: 'An alternative entry route exists',
  BLOCKED: 'Blocked for this intake',
  INDETERMINATE: 'Some requirements need clarification',
};
const symbols = { PASS: '✓', FAIL: '−', UNKNOWN: '?', NOT_APPLICABLE: '↗' };
const friendly = (s: string) =>
  s
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
const navItems = [
  { id: 'map', label: 'Universities', icon: Compass },
  { id: 'shortlist', label: 'My shortlist', icon: Bookmark },
  { id: 'compare', label: 'Compare paths', icon: GitCompareArrows },
  { id: 'roadmap', label: 'My application tasks', icon: Route },
  { id: 'assistant', label: 'AI admission assistant', icon: MessageCircle },
  { id: 'lab', label: 'What can I improve?', icon: FlaskConical },
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
function Badge({ state, label }: { state: State; label?: string }) {
  const { tr } = useLocale();

  return (
    <span className={`badge state-${state.toLowerCase()}`}>
      <span className="status-dot" />
      {tr(label || labels[state])}
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
  const { tr } = useLocale();

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
              <Dialog.Title>{tr(title)}</Dialog.Title>
              <Dialog.Description>{tr(description)}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label={tr('Close dialog')}>
              <X size={20} />
            </Dialog.Close>
          </div>
          {tr(children)}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function FactProof({ fact }: { fact: Fact }) {
  const { tr, dateLabel } = useLocale();

  return (
    <article className="fact-proof">
      <div className="between">
        <span className={`mini-badge ${fact.evidence === 'VERIFIED' ? 'verified' : ''}`}>
          <ShieldCheck size={13} />
          {tr(friendly(fact.evidence))}
        </span>
        <span className="small muted">
          {tr(fact.provenance === 'OFFICIAL_FACT' ? 'Official source' : 'Evidence gap')}
        </span>
      </div>
      <h4>{tr(fact.statement)}</h4>
      <dl className="proof-grid">
        <div>
          <dt>{tr('Scope')}</dt>
          <dd>{fact.scope.institution}</dd>
        </div>
        <div>
          <dt>{tr('Intake / period')}</dt>
          <dd>{tr(friendly(fact.intake))}</dd>
        </div>
        <div>
          <dt>{tr('Checked')}</dt>
          <dd>{tr(dateLabel(fact.retrieved_at.slice(0, 10)))}</dd>
        </div>
        <div>
          <dt>{tr('Source title')}</dt>
          <dd lang={fact.page_title ? 'en' : undefined}>
            {fact.page_title || tr('Not recorded in original research')}
          </dd>
        </div>
      </dl>
      <p className="small muted">{tr(fact.notes)}</p>
      <p className="small muted">
        {tr(
          'Source summary translated by PathShift. The official page retains its original language.',
        )}
      </p>
      {fact.source_url ? (
        <a className="source-link" href={fact.source_url} target="_blank" rel="noreferrer">
          {tr('Open official source ')}
          <ArrowUpRight size={15} />
        </a>
      ) : (
        <p className="small muted">{tr('A claim-specific source has not been established.')}</p>
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
  const { tr } = useLocale();

  return (
    <div className={`rule-row ${depth ? 'nested' : ''}`}>
      <div className={`rule-symbol ${rule.result.toLowerCase()}`}>{tr(symbols[rule.result])}</div>
      <div className="rule-content">
        <div className="between">
          <strong>{tr(rule.label)}</strong>
          <span className="rule-verdict">
            {tr(rule.conditional ? 'CONDITIONAL' : rule.result.replaceAll('_', ' '))}
          </span>
        </div>
        <p>{tr(rule.reason)}</p>
        <div className="rule-links">
          <span>
            {tr(rule.strength === 'HARD' ? 'Required' : 'Informational')}{' '}
            {tr(' · PathShift evaluation ')}
          </span>
          {rule.facts.length > 0 && (
            <button onClick={() => onProof(rule.facts)}>
              <ShieldCheck size={12} />
              {tr('Source proof ')}
            </button>
          )}
        </div>
        {rule.children.length > 0 && (
          <details>
            <summary>{tr(`Conditions: ${rule.children.length}`)}</summary>
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
  const { tr } = useLocale();

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
      <span className="diagram-label origin">{tr('You, today')}</span>
      <span className="diagram-label top">
        {tr('A new possibility ')}
        <ArrowUpRight size={13} />
      </span>
      <span className="diagram-label middle">{tr('An alternative route')}</span>
      <span className="diagram-label bottom">{tr('A question to resolve')}</span>
      <span className="diagram-pivot">
        <SlidersHorizontal size={13} /> {tr(' One change ')}
      </span>
    </div>
  );
}
export default function Workspace({
  accountId,
  initialProfile,
}: {
  accountId?: string;
  initialProfile?: Profile;
}) {
  const storage = useMemo(
    () => ({
      getItem: (key: string) =>
        localStorage.getItem(accountId ? `${key}:account:${accountId}` : key),
      setItem: (key: string, value: string) =>
        localStorage.setItem(accountId ? `${key}:account:${accountId}` : key, value),
      removeItem: (key: string) =>
        localStorage.removeItem(accountId ? `${key}:account:${accountId}` : key),
    }),
    [accountId],
  );
  const saveAccount = async (profile: Profile) => {
    if (!accountId) return;
    const response = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
    if (!response.ok) throw new Error('Your profile could not be saved. Please try again.');
  };
  const { tr, dateLabel, money, locale } = useLocale();

  const [view, setView] = useState<View>('map');
  const [profile, setProfile] = useState<Profile>(initialProfile ?? demoProfile);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(!accountId);
  const [menu, setMenu] = useState(false);
  const [wizard, setWizard] = useState<Profile>(initialProfile ?? demoProfile);
  const [detail, setDetail] = useState<string | null>(null);
  const [proof, setProof] = useState<string[] | null>(null);
  const [diagnosis, setDiagnosis] = useState(false);
  const [comparison, setComparison] = useState<string[]>(accountId ? [] : ['waterloo', 'gatech']);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [allCountries, setAllCountries] = useState(false);
  const [includeIncomplete, setIncludeIncomplete] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState('');
  const [notice, setNotice] = useState('');
  const [wizardStep, setWizardStep] = useState(0);
  const [saveState, setSaveState] = useState('Demo profile');
  const [resetOpen, setResetOpen] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [savedOpen, setSavedOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const draftChange = useCallback(
    (p: Profile, step: number) => {
      try {
        storage.setItem('pathshift-draft', JSON.stringify({ profile: p, step }));
        setSaveState('Draft saved on this device');
      } catch {
        setSaveState('Changes could not be saved');
      }
    },
    [storage],
  );
  useEffect(() => {
    const readView = () => {
      const value = new URL(window.location.href).searchParams.get('view');
      if (
        ['assistant', 'lab', 'map', 'shortlist', 'compare', 'roadmap', 'sources'].includes(
          value || '',
        )
      )
        setView(value as View);
      else setView('map');
    };
    readView();
    window.addEventListener('popstate', readView);
    return () => window.removeEventListener('popstate', readView);
  }, [accountId]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(false);
        menuRef.current?.focus();
      }
      if (event.key === 'Tab') {
        const nodes = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [],
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    sidebarRef.current?.querySelector('button')?.focus();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);
  const generation = useRef(0);
  const mutationLock = useRef(false);
  const scenarioGeneration = useRef(0);
  const [scenario, setScenario] = useState({
    english: false,
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
    testDate: '',
  });
  const clearSimulation = () => {
    scenarioGeneration.current++;
    setSimulation(null);
    setSimBusy(false);
  };
  const current = simulation?.after || evaluation;
  const compute = async (p: Profile, persist = true, demoValue = demo) => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    scenarioGeneration.current++;
    setSimBusy(false);
    const token = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const e = await api<Evaluation>('evaluate', { profile: p });
      if (token !== generation.current) return;
      if (persist) await saveAccount(e.profile);
      if (token !== generation.current) return;
      setProfile(e.profile);
      setDemo(accountId ? false : demoValue);
      setEvaluation(e);
      setSimulation(null);
      if (persist)
        try {
          storage.setItem('pathshift-v1', JSON.stringify({ profile: e.profile, demo: demoValue }));
          setSaveState(accountId ? 'Profile saved to your account' : 'Saved on this device');
        } catch {
          setNotice('Your browser could not save changes. Keep this tab open.');
          setSaveState('Changes could not be saved');
        }
      return true;
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      mutationLock.current = false;
      if (token === generation.current) setBusy(false);
    }
  };
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const sources = await api<{ facts: Fact[] }>('programs');
        let p = structuredClone(initialProfile ?? demoProfile),
          isDemo = !accountId;
        try {
          const saved = storage.getItem('pathshift-v1');
          if (saved && !accountId) {
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
        // Upgrade only the explicitly labelled synthetic demo. Real profiles keep missing
        // school fields and bonus points unanswered; never infer them from a grade.
        if (
          isDemo &&
          p.name === demoProfile.name &&
          p.ib_total === demoProfile.ib_total &&
          p.curriculum === demoProfile.curriculum
        ) {
          if (p.school === undefined) p.school = structuredClone(demoProfile.school);
          if (p.ib_core_points === undefined) p.ib_core_points = demoProfile.ib_core_points;
        }
        if (!p.documents_by_program)
          p.documents_by_program = Object.fromEntries(
            p.shortlist.map((id) => [id, p.documents_ready]),
          );
        try {
          const comparison = JSON.parse(storage.getItem('pathshift-comparison') || 'null');
          if (Array.isArray(comparison))
            setComparison(
              [...new Set(comparison)]
                .filter(
                  (id): id is string =>
                    typeof id === 'string' && sources.facts.some((f) => f.scope.program === id),
                )
                .slice(0, 3),
            );
          const saved = JSON.parse(storage.getItem('pathshift-scenarios') || '[]');
          if (Array.isArray(saved))
            setSavedScenarios(
              saved
                .filter(
                  (item) =>
                    typeof item?.id === 'string' &&
                    typeof item.name === 'string' &&
                    item.mutation &&
                    typeof item.mutation === 'object',
                )
                .slice(0, 3),
            );
        } catch {
          /* Invalid optional caches do not stop the journey. */
        }
        const result = await api<Evaluation>('evaluate', { profile: p });
        if (alive) {
          setFacts(sources.facts);
          setProfile(p);
          setWizard(p);
          setDemo(isDemo);
          setSaveState(
            accountId
              ? 'Profile saved to your account'
              : isDemo
                ? 'Demo profile'
                : 'Saved on this device',
          );
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
  }, [accountId, initialProfile, storage]);
  const navigate = (v: View) => {
    if (v === 'lab' || v === 'profile' || v === 'assistant') clearSimulation();
    setView(v);
    setFilter('all');
    setSearch('');
    const url = new URL(window.location.href);
    url.searchParams.set('view', v === 'profile' ? 'map' : v);
    url.hash = '';
    window.history.pushState({}, '', url);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const reset = async () => {
    try {
      if (!demo || !storage.getItem('pathshift-backup'))
        storage.setItem('pathshift-backup', JSON.stringify({ profile, demo }));
    } catch {
      setNotice('Changes could not be saved');
      return;
    }
    setResetOpen(false);
    if (!(await compute({ ...structuredClone(demoProfile), documents_by_program: {} }, true, true)))
      return;
    setScenario({
      english: false,
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
      testDate: '',
    });
    setComparison(['waterloo', 'gatech']);
    navigate('map');
    try {
      storage.setItem('pathshift-comparison', JSON.stringify(['waterloo', 'gatech']));
    } catch {
      /* Evaluation remains usable without storage. */
    }
    setNotice('Demo reset to Aruzhan’s starting profile.');
  };
  const edit = () => {
    let next = structuredClone(profile),
      step = 0;
    try {
      const draft = JSON.parse(storage.getItem('pathshift-draft') || 'null');
      if (
        draft &&
        typeof draft.profile?.name === 'string' &&
        draft.profile?.ielts &&
        draft.profile?.budgets &&
        Array.isArray(draft.profile?.countries) &&
        Array.isArray(draft.profile?.shortlist)
      ) {
        const restored = profileSchema.safeParse({ ...next, ...draft.profile });
        if (restored.success) {
          next = {
            ...restored.data,
            shortlist: profile.shortlist,
            completed: profile.completed,
            personal_plan: profile.personal_plan,
            documents_by_program: profile.documents_by_program,
          };
          step = Math.max(0, Math.min(3, Number(draft.step) || 0));
          setNotice('Your unfinished profile has been restored.');
        }
      }
    } catch {
      /* Recover with current profile if draft is unreadable. */
    }
    setWizardStep(step);
    setWizard(next);
    navigate('profile');
  };
  const shortlist = (id: string) => {
    if (simulation) {
      setNotice('Close the scenario before changing your actual shortlist.');
      return;
    }
    const list = profile.shortlist.includes(id)
      ? profile.shortlist.filter((i) => i !== id)
      : [...profile.shortlist, id];
    void compute({ ...profile, shortlist: list });
  };
  const compare = (id: string) => {
    if (!comparison.includes(id) && comparison.length >= 3) {
      setNotice('Three paths selected. Remove one before adding another.');
      return;
    }
    const next = comparison.includes(id)
      ? comparison.filter((item) => item !== id)
      : [...comparison, id];
    setComparison(next);
    try {
      storage.setItem('pathshift-comparison', JSON.stringify(next));
    } catch {
      setNotice('Changes could not be saved');
    }
  };
  const storeScenarios = (items: SavedScenario[]) => {
    try {
      storage.setItem('pathshift-scenarios', JSON.stringify(items));
      setSavedScenarios(items);
      return true;
    } catch {
      setNotice('Changes could not be saved');
      return false;
    }
  };
  const saveScenario = () => {
    if (!simulation) return;
    if (savedScenarios.length >= 3) {
      setSavedOpen(true);
      setNotice('Three scenarios saved. Remove one before saving another.');
      return;
    }
    const mutation = scenarioMutation(simulation.before.profile, simulation.after.profile);
    if (!Object.keys(mutation).length) {
      setNotice('Choose at least one change before saving a scenario.');
      return;
    }
    if (
      storeScenarios([
        ...savedScenarios,
        {
          id: crypto.randomUUID(),
          name: scenarioName.trim() || `${tr('Scenario')} ${savedScenarios.length + 1}`,
          mutation,
          savedAt: new Date().toISOString(),
        },
      ])
    ) {
      setSimulation(null);
      setSavedOpen(true);
      setScenarioName('');
      setNotice('Scenario saved. Your actual results are unchanged.');
    }
  };
  const previewSaved = async (item: SavedScenario) => {
    setSavedOpen(false);
    setSimBusy(true);
    const token = generation.current;
    const request = ++scenarioGeneration.current;
    try {
      const next = await api<Simulation>('simulate', { profile, mutation: item.mutation });
      if (token === generation.current && request === scenarioGeneration.current) {
        setSimulation(next);
        navigate('map');
      }
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      if (request === scenarioGeneration.current) setSimBusy(false);
    }
  };
  const runScenario = async () => {
    const token = generation.current;
    const request = ++scenarioGeneration.current;
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
              date: scenario.testDate || profile.ielts.date,
            },
          }
        : {};
      if (scenario.sat)
        mutation.sat = {
          status: 'VALID',
          score: scenario.satScore,
          date: scenario.testDate || profile.sat.date,
        };
      if (scenario.budget)
        mutation.budgets = { USD: scenario.USD, CAD: scenario.CAD, GBP: scenario.GBP };
      if (scenario.country !== 'keep') mutation.countries = [scenario.country];
      const result = await api<Simulation>('simulate', { profile, mutation });
      if (token === generation.current && request === scenarioGeneration.current)
        setSimulation(result);
    } catch (e) {
      setSimError((e as Error).message);
    } finally {
      if (request === scenarioGeneration.current) setSimBusy(false);
    }
  };
  const toggleTask = async (task: Task) => {
    if (task.requires_value) {
      edit();
      setWizardStep(taskProfileStep(task));
      setNotice('Enter the completed result or document declaration in your profile.');
      return;
    }
    if (mutationLock.current) return;
    mutationLock.current = true;
    generation.current++;
    scenarioGeneration.current++;
    setSimBusy(false);
    setBusy(true);
    try {
      const e = await api<Evaluation>(
        `roadmap/tasks/${task.id}`,
        { profile, complete: !task.complete },
        'PATCH',
      );
      await saveAccount(e.profile);
      setProfile(e.profile);
      setEvaluation(e);
      setSimulation(null);
      try {
        storage.setItem('pathshift-v1', JSON.stringify({ profile: e.profile, demo }));
      } catch {}
      setNotice(task.complete ? 'Task reopened.' : 'Progress saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  };
  const exportPlan = () => {
    if (!current) return;
    const text = [
      `PATHSHIFT · ${current.profile.name}`,
      `${tr(friendly(current.profile.intake))} · ${tr(current.profile.major)}`,
      '',
      ...current.roadmap.map((task, i) =>
        [
          `${i + 1}. [${task.complete ? 'x' : ' '}] ${tr(task.title)}`,
          tr(task.description),
          task.deadline
            ? `${tr('Date')}: ${dateLabel(task.deadline)}`
            : tr('Date: needs verification'),
          ...task.facts.map((id) => facts.find((f) => f.id === id)?.source_url).filter(Boolean),
          '',
        ].join('\n'),
      ),
      `${tr('Calculated')}: ${dateLabel(current.evaluated_at)}. ${tr('Not a guarantee of admission.')}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pathshift-roadmap.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  const selected = current?.programs.find((r) => r.program.id === detail);
  const inScope =
    current?.programs.filter((r) =>
      view === 'shortlist'
        ? profile.shortlist.includes(r.program.id)
        : (allCountries || r.in_scope) && (includeIncomplete || focusPrograms.has(r.program.id)),
    ) || [];
  const counts = {
    ready: inScope.filter((r) => r.admission_state === 'READY_TO_APPLY').length,
    reach: inScope.filter(
      (r) =>
        r.admission_state === 'WITHIN_REACH' ||
        r.admission_state === 'CONDITIONAL_PATH' ||
        (r.admission_state === 'INDETERMINATE' && r.unknowns.length === 0),
    ).length,
    verify: inScope.filter((r) => r.admission_state === 'INDETERMINATE' && r.unknowns.length > 0)
      .length,
    blocked: inScope.filter((r) => r.admission_state === 'BLOCKED').length,
  };
  const shown = (current?.programs || []).filter(
    (r) =>
      (view === 'shortlist' || allCountries || r.in_scope) &&
      (view === 'shortlist' || includeIncomplete || focusPrograms.has(r.program.id)) &&
      (view !== 'shortlist' || profile.shortlist.includes(r.program.id)) &&
      (filter === 'all' ||
        (filter === 'actionable'
          ? r.admission_state === 'WITHIN_REACH' ||
            r.admission_state === 'CONDITIONAL_PATH' ||
            (r.admission_state === 'INDETERMINATE' && r.unknowns.length === 0)
          : r.admission_state === filter &&
            (filter !== 'INDETERMINATE' || r.unknowns.length > 0))) &&
      `${r.program.name} ${r.program.short} ${r.program.degree} ${tr(r.program.degree)} ${tr(r.program.city)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const modals = (
    <>
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset to the demo?"
        description="Your current profile will be backed up. Use Undo demo reset to restore it."
      >
        <button className="btn secondary" onClick={() => setResetOpen(false)}>
          {tr('Cancel')}
        </button>{' '}
        <button className="btn primary" onClick={reset}>
          {tr('Back up and reset')}
        </button>
      </Modal>
      <Modal
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        title="Saved scenarios"
        description="Up to three alternative plans. Opening a plan recalculates it against your current profile; actual results never change."
        wide
      >
        {!savedScenarios.length && (
          <p>{tr('Explore a change in the scenario lab, then save it here.')}</p>
        )}
        <div className="saved-scenarios">
          {savedScenarios.map((item) => (
            <article className="panel" key={item.id}>
              <h3>{item.name}</h3>
              <p className="small muted">{dateLabel(item.savedAt)}</p>
              <dl>
                {Object.entries(item.mutation).map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {tr(
                        key === 'ielts'
                          ? 'IELTS overall'
                          : key === 'sat'
                            ? 'SAT score'
                            : key === 'budgets'
                              ? 'Budget'
                              : key === 'countries'
                                ? 'Country preference'
                                : key,
                      )}
                    </dt>
                    <dd>
                      {key === 'ielts'
                        ? (value as Profile['ielts']).overall
                        : key === 'sat'
                          ? (value as Profile['sat']).score
                          : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                className="btn primary"
                disabled={simBusy}
                onClick={() => void previewSaved(item)}
              >
                {tr('Compare with my current profile')}
              </button>
              <button
                className="btn ghost"
                onClick={() => storeScenarios(savedScenarios.filter((s) => s.id !== item.id))}
              >
                {tr('Remove scenario')}
              </button>
            </article>
          ))}
        </div>
      </Modal>
    </>
  );
  const navLabel = view === 'profile' ? 'Your profile' : navItems.find((n) => n.id === view)?.label;
  return (
    <div className="app-shell">
      {modals}
      <a className="skip-link" href="#main">
        {tr('Skip to main content ')}
      </a>
      {menu && (
        <button
          className="menu-backdrop"
          aria-label={tr('Close navigation')}
          onClick={() => {
            setMenu(false);
            menuRef.current?.focus();
          }}
        />
      )}
      <aside ref={sidebarRef} id="workspace-navigation" className={`sidebar ${menu ? 'open' : ''}`}>
        <button
          className="brand-button"
          onClick={() => navigate('lab')}
          aria-label={tr('PathShift opportunity map')}
        >
          <Brand />
        </button>
        <div className="workspace-label">{tr('YOUR WORKSPACE')}</div>
        <nav aria-label={tr('Main navigation')}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-view={id}
              onClick={() => navigate(id)}
              className={`nav-item ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={18} />
              {tr(label)}
              {id === 'shortlist' && <span className="nav-count">{profile.shortlist.length}</span>}
              {id === 'map' && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <button
          className={`nav-item ${view === 'profile' ? 'active' : ''}`}
          disabled={busy}
          onClick={() => edit()}
        >
          <UserRound size={18} />
          {tr('My profile ')}
        </button>
        <div className="sidebar-grow" />
        <button className="profile-button" disabled={busy} onClick={() => edit()}>
          <span className="avatar">{profile.name.slice(0, 1) || 'A'}</span>
          <span>
            <strong>{profile.name || 'Your profile'}</strong>
            <small>{tr(demo ? 'Demo applicant' : 'Your admission journey')}</small>
          </span>
          <ChevronRight size={16} />
        </button>
      </aside>
      <div className="main-shell">
        {!accountId && (
          <div className="entry-demo-banner">
            <span>{tr('Demo workspace · example data, not your personal account')}</span>
            <Link href="/auth/sign-up">{tr('Create my profile')} →</Link>
          </div>
        )}
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              ref={menuRef}
              aria-expanded={menu}
              aria-controls="workspace-navigation"
              aria-label={tr('Toggle navigation')}
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span className="desktop-crumb">{tr('Workspace')}</span>
            <ChevronRight size={13} className="desktop-crumb" />
            <strong>{tr(navLabel)}</strong>
          </div>
          <div className="top-actions">
            <LanguagePicker />
            <span className="save-status">
              <span />
              {tr(
                busy
                  ? 'Recalculating…'
                  : view === 'profile'
                    ? saveState
                    : saveState === 'Draft saved on this device'
                      ? 'Saved profile · draft available'
                      : saveState,
              )}
            </span>
            {accountId ? (
              <SignOut />
            ) : (
              <button
                className="btn small-btn secondary"
                onClick={() => setResetOpen(true)}
                disabled={busy}
                aria-label={tr('Reset demo')}
              >
                <RotateCcw size={14} />
                <span className="reset-label">{tr('Reset demo')}</span>
              </button>
            )}
            <button
              className="top-avatar"
              aria-label={tr('Edit profile')}
              disabled={busy}
              onClick={() => edit()}
            >
              {profile.name.slice(0, 1) || 'A'}
            </button>
          </div>
        </header>
        <main id="main" className="main-content">
          {tr(
            error && (
              <div className="error-box" role="alert">
                <AlertCircle size={19} />
                <div>
                  <strong>{tr('We couldn’t update your paths.')}</strong>
                  <p>{tr(error)}</p>
                </div>
                <button className="btn secondary" onClick={() => void compute(profile)}>
                  {tr('Try again ')}
                </button>
              </div>
            ),
          )}
          {tr(
            notice && (
              <div className="toast" role="status">
                <CheckCircle2 size={17} />
                {tr(notice)}
                <button
                  className="icon-button"
                  aria-label={tr('Dismiss notification')}
                  onClick={() => setNotice('')}
                >
                  <X size={15} />
                </button>
              </div>
            ),
          )}
          {evaluation && view !== 'profile' && (
            <div className="journey-toolbar">
              <button className="btn secondary small-btn" onClick={() => setSavedOpen(true)}>
                {tr('Saved scenarios')} · {savedScenarios.length}
              </button>
              <details className="profile-tools">
                <summary>{tr('Profile tools')}</summary>
                <div className="profile-tools-body">
                  <button
                    className="btn ghost small-btn"
                    onClick={() =>
                      downloadText(
                        JSON.stringify({ version: 1, profile }, null, 2),
                        'pathshift-profile.json',
                        'application/json',
                      )
                    }
                  >
                    {tr('Back up my profile')}
                  </button>
                  <ProfileImport
                    busy={busy}
                    onRestore={async (imported) => {
                      try {
                        storage.setItem('pathshift-backup', JSON.stringify({ profile, demo }));
                      } catch {
                        setNotice('Changes could not be saved');
                        return false;
                      }
                      if (await compute(imported, true, false)) {
                        try {
                          storage.removeItem('pathshift-draft');
                        } catch {}
                        setNotice(
                          'Profile imported. Your previous profile is available through Undo demo reset.',
                        );
                        navigate('map');
                        return true;
                      }
                      return false;
                    }}
                  />
                  <button
                    className="btn ghost small-btn"
                    disabled={busy}
                    onClick={async () => {
                      try {
                        const backup = JSON.parse(storage.getItem('pathshift-backup') || 'null');
                        const valid = profileSchema.safeParse(backup?.profile);
                        if (valid.success) {
                          if (await compute(valid.data, true, backup.demo === true))
                            setNotice('Previous profile restored.');
                        } else setNotice('No previous profile backup is available.');
                      } catch {
                        setNotice('No previous profile backup is available.');
                      }
                    }}
                  >
                    {tr('Undo demo reset')}
                  </button>
                </div>
              </details>
            </div>
          )}
          {evaluation && view === 'assistant' && (
            <AdmissionAssistant
              key={JSON.stringify(profile) + locale}
              evaluation={evaluation}
              onAction={(action, id, compareIds) => {
                if (action === 'compare' && compareIds && compareIds.length >= 2) {
                  setComparison(compareIds);
                  try {
                    storage.setItem('pathshift-comparison', JSON.stringify(compareIds));
                  } catch {
                    setNotice('Changes could not be saved');
                  }
                }
                if (action === 'profile') edit();
                else if (action === 'program' && id) setDetail(id);
                else if (action !== 'program') navigate(action);
              }}
            />
          )}
          {evaluation && view === 'lab' && (
            <FutureLab
              profile={profile}
              facts={facts}
              saved={savedScenarios}
              onProfile={async (p) => {
                if (!(await compute(p))) throw new Error('Unable to reach the decision engine.');
              }}
              onSave={(s) => {
                if (savedScenarios.length >= 3) {
                  setSavedOpen(true);
                  return false;
                }
                return storeScenarios([...savedScenarios, s]);
              }}
              onRoadmap={() => navigate('roadmap')}
              onEdit={() => edit()}
            />
          )}
          {simulation && (
            <div className="simulation-banner">
              <FlaskConical size={19} />
              <div>
                <strong>{tr('You’re exploring a scenario')}</strong>
                <span>{tr('Your saved profile has not changed.')}</span>
                <label className="scenario-name">
                  {tr('Scenario name')}
                  <input
                    maxLength={60}
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder={tr('e.g. IELTS target')}
                  />
                </label>
              </div>
              <button className="btn ghost" onClick={clearSimulation}>
                {tr('Discard ')}
              </button>
              <button className="btn primary" onClick={saveScenario}>
                {tr('Save scenario ')}
                <Check size={15} />
              </button>
            </div>
          )}
          {view === 'profile' ? (
            <ProfileWizard
              key={JSON.stringify(wizard)}
              initial={wizard}
              initialStep={wizardStep}
              onDraft={draftChange}
              programs={evaluation?.programs.map((r) => r.program) || []}
              onCancel={() => navigate('map')}
              onSave={async (p) => {
                if (await compute(p, true, false)) {
                  setDemo(false);
                  try {
                    storage.removeItem('pathshift-draft');
                  } catch {
                    /* Keep a recoverable draft. */
                  }
                  navigate('map');
                  setDiagnosis(true);
                }
              }}
            />
          ) : (
            <>
              {view !== 'lab' && view !== 'assistant' && (
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      {tr(
                        view === 'map'
                          ? 'YOUR NEXT CHAPTER'
                          : view === 'roadmap'
                            ? 'FROM POSSIBILITIES TO PROGRESS'
                            : view === 'sources'
                              ? 'CLARITY YOU CAN CHECK'
                              : 'YOUR ADMISSION WORKSPACE',
                      )}
                    </div>
                    <h1>
                      {tr(
                        view === 'map'
                          ? 'Choose universities to compare.'
                          : view === 'shortlist'
                            ? 'Your saved universities'
                            : view === 'compare'
                              ? 'Compare universities side by side'
                              : view === 'roadmap'
                                ? 'Your application checklist'
                                : 'Every decision has a source.',
                      )}
                    </h1>
                    <p>
                      {tr(
                        view === 'map'
                          ? 'See where you stand — and what could change your options.'
                          : view === 'shortlist'
                            ? 'Save universities here to get their application tasks. Compare selections are separate.'
                            : view === 'compare'
                              ? 'Compare the requirements that matter to your profile.'
                              : view === 'roadmap'
                                ? 'Complete these tasks for your saved universities. Enter real scores in your profile; checking a task does not change admission requirements.'
                                : 'Official requirements, transparent reasoning, and clearly marked gaps.',
                      )}
                    </p>
                  </div>
                  {view === 'roadmap' ? (
                    <button className="btn secondary" onClick={exportPlan} disabled={!current}>
                      <Download size={16} />
                      {tr('Export plan ')}
                    </button>
                  ) : (
                    <button className="btn secondary" disabled={busy} onClick={() => edit()}>
                      <UserRound size={16} />
                      {tr('Edit your details')}
                    </button>
                  )}
                </div>
              )}
              {view === 'map' && (
                <>
                  {accountId ? (
                    current && (
                      <ApplicantSummary
                        evaluation={current}
                        onEdit={edit}
                        onOpen={setDetail}
                        onSave={shortlist}
                        onPlan={() => {
                          setDiagnosis(false);
                          navigate('roadmap');
                        }}
                        busy={busy || !!simulation}
                      />
                    )
                  ) : (
                    <>
                      {' '}
                      <section className="journey-banner">
                        <div className="journey-copy">
                          <div className="between">
                            <span className="eyebrow">
                              {tr(demo ? 'MEET ARUZHAN · DEMO PROFILE' : 'YOUR STARTING POINT')}
                            </span>
                            <button className="text-button" onClick={() => setDiagnosis(true)}>
                              {tr('View diagnosis ')}
                              <ArrowUpRight size={14} />
                            </button>
                          </div>
                          <h2>{tr('See how a higher score changes the requirements you meet')}</h2>
                          <p>
                            {tr('Try a different test score in the scenario panel. ')}
                            <br />
                            {tr('Your actual results stay unchanged. ')}
                          </p>
                          <div className="profile-chips">
                            <span>
                              <GraduationCap size={14} />
                              {tr(profile.curriculum)}
                              {tr(
                                profile.ib_total !== null && profile.curriculum === 'IB'
                                  ? ` ${profile.ib_total}/45`
                                  : '',
                              )}
                            </span>
                            <span>
                              <Languages size={14} />
                              {tr('IELTS ')}
                              {profile.ielts.overall === null ? '—' : money(profile.ielts.overall)}
                            </span>
                            <span>
                              <Globe2 size={14} />
                              {tr(profile.countries.join(' + ') || 'No country selected')}
                            </span>
                          </div>
                        </div>
                        <PathGraphic />
                      </section>
                    </>
                  )}
                  <div className="journey-steps">
                    <span>
                      <UserRound size={16} />
                      {tr('Your profile ')}
                    </span>
                    <i />
                    <span className="current">
                      <Compass size={16} />
                      {tr('Explore paths ')}
                    </span>
                    <i />
                    <button onClick={() => navigate('compare')}>
                      <GitCompareArrows size={16} />
                      {tr('Compare ')}
                    </button>
                    <i />
                    <button onClick={() => navigate('roadmap')}>
                      <Route size={16} />
                      {tr('Take your next step ')}
                    </button>
                  </div>
                </>
              )}
              {!current && !error ? (
                <div className="loading-state">
                  <LoaderCircle className="spin" />
                  <h2>{tr('Connecting your profile to the evidence…')}</h2>
                  <p>{tr('Evaluating requirements, dates and possible next steps.')}</p>
                </div>
              ) : (
                current && (
                  <>
                    {(view === 'map' || view === 'shortlist') && (
                      <>
                        <div className="mobile-quick-actions">
                          <a className="btn primary" href="#scenario-lab">
                            <FlaskConical size={16} />
                            {tr('Try a what-if ')}
                          </a>
                          <button className="btn secondary" onClick={() => navigate('roadmap')}>
                            <Route size={16} />
                            {tr('My next step ')}
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
                                <strong>{tr(counts.ready.toString().padStart(2, '0'))}</strong>
                                <span>{tr('Checked requirements met')}</span>
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
                                <strong>{tr(counts.reach.toString().padStart(2, '0'))}</strong>
                                <span>{tr('Requirements to complete')}</span>
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
                                <strong>{tr(counts.verify.toString().padStart(2, '0'))}</strong>
                                <span>{tr('Details to clarify')}</span>
                              </button>
                            </div>
                            {view === 'map' && (
                              <p className="focus-note">
                                {tr(
                                  'Open a university to check requirements. Use Compare to see differences, or save it to get application tasks.',
                                )}
                              </p>
                            )}
                            {view === 'map' && (
                              <label className="research-toggle">
                                <input
                                  type="checkbox"
                                  checked={includeIncomplete}
                                  onChange={(e) => setIncludeIncomplete(e.target.checked)}
                                />
                                {tr('Include programs with unverified rules')}
                              </label>
                            )}
                            <div className="board-toolbar">
                              <div className="board-tabs">
                                <button
                                  className={filter === 'all' ? 'active' : ''}
                                  onClick={() => setFilter('all')}
                                >
                                  {tr(view === 'shortlist' ? 'Saved paths' : 'All paths')}
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
                                    {tr('Blocked ')}
                                    <span>{counts.blocked}</span>
                                  </button>
                                )}
                              </div>
                              <label className="search-input">
                                <Search size={15} />
                                <input
                                  aria-label={tr('Search programs')}
                                  placeholder={tr('Find a program…')}
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                              </label>
                            </div>
                            <div className="board-caption">
                              <span>
                                {current.programs.length} {tr(' programs evaluated · ')}
                                {shown.length} {tr(' shown ')}
                              </span>
                              {view === 'map' && (
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={allCountries}
                                    onChange={(e) => setAllCountries(e.target.checked)}
                                  />
                                  {tr('Include other countries ')}
                                </label>
                              )}
                            </div>
                            {!shown.length ? (
                              <div className="empty-state panel">
                                <Compass size={30} />
                                <h2>
                                  {tr(
                                    view === 'shortlist'
                                      ? 'Your shortlist starts with a possibility.'
                                      : 'No exact paths under these filters.',
                                  )}
                                </h2>
                                <p>
                                  {tr(
                                    'Explore the full map, keep a program that interests you, or adjust your country preferences. ',
                                  )}
                                </p>
                                <button
                                  className="btn primary"
                                  onClick={() => {
                                    setFilter('all');
                                    setSearch('');
                                    setAllCountries(true);
                                    setIncludeIncomplete(true);
                                    navigate('map');
                                  }}
                                >
                                  {tr('Explore all 12 programs ')}
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
                                {tr(
                                  'Ready means no detected published blocker in the evaluated rules. It is not an admission guarantee. Every program includes its evidence limits. ',
                                )}
                              </p>
                            </div>
                            {comparison.length >= 2 && (
                              <div className="compare-tray">
                                <div>
                                  <GitCompareArrows size={19} />
                                  <strong>
                                    {comparison.length} {tr(' paths selected')}
                                  </strong>
                                  <span className="muted small">
                                    {tr('See the differences side by side. ')}
                                  </span>
                                </div>
                                <button
                                  className="btn primary small-btn"
                                  onClick={() => navigate('compare')}
                                >
                                  {tr('Compare paths ')}
                                  <ArrowRight size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                          <aside className="scenario-rail" id="scenario-lab">
                            <details className="scenario-panel panel" open={!accountId}>
                              <summary className="scenario-disclosure">
                                {tr('Explore a different score or budget')}
                              </summary>
                              <div className="scenario-heading">
                                <span className="scenario-icon">
                                  <SlidersHorizontal size={20} />
                                </span>
                                <div>
                                  <h2>{tr('What if?')}</h2>
                                  <p>{tr('One change. New possibilities.')}</p>
                                </div>
                                <span className="mini-badge">{tr('LAB')}</span>
                              </div>
                              <fieldset className="scenario-body" disabled={simBusy || busy}>
                                <label className="toggle-label">
                                  <span>
                                    <strong>{tr('Explore an English result')}</strong>
                                    <small>{tr('Choose the score and bands below')}</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.english}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, english: e.target.checked });
                                      clearSimulation();
                                    }}
                                  />
                                </label>
                                <fieldset
                                  className="scenario-score-fields"
                                  disabled={!scenario.english || simBusy}
                                >
                                  <div className="between">
                                    <label htmlFor="scenario-ielts">{tr('IELTS overall')}</label>
                                    <div className="score-pill">
                                      {profile.ielts.overall === null
                                        ? '—'
                                        : money(profile.ielts.overall)}
                                      <MoveRight size={14} />
                                      <strong>{money(scenario.ielts)}</strong>
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
                                      setScenario({
                                        ...scenario,
                                        ielts: Number(e.target.value),
                                      });
                                      clearSimulation();
                                    }}
                                  />
                                  <div className="range-labels">
                                    <span>{money(4)}</span>
                                    <span>{money(9)}</span>
                                  </div>
                                  <details className="scenario-details" open>
                                    <summary>
                                      {tr('Component scores ')}
                                      <ChevronDown size={14} />
                                    </summary>
                                    <div className="band-inputs">
                                      {(
                                        ['reading', 'writing', 'listening', 'speaking'] as const
                                      ).map((k) => (
                                        <label key={k}>
                                          {tr(k.slice(0, 1).toUpperCase() + k.slice(1))}
                                          <input
                                            aria-label={tr(`Scenario ${k}`)}
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
                                              clearSimulation();
                                            }}
                                          />
                                        </label>
                                      ))}
                                    </div>
                                  </details>
                                  <p className="field-note">
                                    {tr(
                                      'These are hypothetical scores. Your bands do not automatically change with your overall score. ',
                                    )}
                                  </p>
                                </fieldset>
                                <div className="scenario-divider" />
                                <label className="toggle-label">
                                  <span>
                                    <strong>{tr('Add a valid SAT')}</strong>
                                    <small>{tr('Test a required-score branch')}</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.sat}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, sat: e.target.checked });
                                      clearSimulation();
                                    }}
                                  />
                                </label>
                                {scenario.sat && (
                                  <label className="scenario-number">
                                    {tr('Hypothetical SAT score ')}
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
                                        clearSimulation();
                                      }}
                                    />
                                  </label>
                                )}
                                <label className="toggle-label">
                                  <span>
                                    <strong>{tr('Explore a different budget')}</strong>
                                    <small>{tr('Keep academic results separate')}</small>
                                  </span>
                                  <input
                                    type="checkbox"
                                    role="switch"
                                    checked={scenario.budget}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, budget: e.target.checked });
                                      clearSimulation();
                                    }}
                                  />
                                </label>
                                {scenario.budget && (
                                  <div className="budget-inputs">
                                    {(['USD', 'CAD', 'GBP'] as const).map((c) => (
                                      <label key={c}>
                                        {tr(c)}
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
                                            clearSimulation();
                                          }}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                )}
                                <label className="scenario-number">
                                  {tr('Country preference ')}
                                  <select
                                    disabled={
                                      !profile.geography_flexible || !!profile.country_locks.length
                                    }
                                    value={scenario.country}
                                    onChange={(e) => {
                                      setScenario({ ...scenario, country: e.target.value });
                                      clearSimulation();
                                    }}
                                  >
                                    <option value="keep">{tr('Keep my countries')}</option>
                                    <option value="US">{tr('United States')}</option>
                                    <option value="Canada">{tr('Canada')}</option>
                                    <option value="UK">{tr('United Kingdom')}</option>
                                  </select>
                                </label>
                                {(scenario.english || scenario.sat) && (
                                  <label className="field-label">
                                    {tr('Assumed test date (optional)')}
                                    <input
                                      type="date"
                                      value={scenario.testDate}
                                      onChange={(e) => {
                                        setScenario({ ...scenario, testDate: e.target.value });
                                        clearSimulation();
                                      }}
                                    />
                                    <small>
                                      {tr(
                                        'Used only for this scenario. Leave blank to keep your recorded date; missing dates remain unknown.',
                                      )}
                                    </small>
                                  </label>
                                )}
                                {tr(
                                  simError && (
                                    <p className="error-text" role="alert">
                                      {tr(simError)}
                                    </p>
                                  ),
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
                                  )}
                                  {tr(' ')}
                                  {tr(simBusy ? 'Recalculating…' : 'Explore this scenario')}
                                  <ArrowRight size={16} />
                                </button>
                                <p className="private-note">
                                  <ShieldCheck size={12} />
                                  {tr('Your saved profile has not changed.')}
                                </p>
                              </fieldset>
                              {simulation && (
                                <div className="causal-diff" aria-live="polite">
                                  <div className="eyebrow">{tr('HERE’S WHAT CHANGED')}</div>
                                  <p className="scenario-outcome">
                                    {tr('Ready routes, current → scenario')}:{' '}
                                    <strong>
                                      {
                                        simulation.before.programs.filter(
                                          (r) =>
                                            r.in_scope && r.admission_state === 'READY_TO_APPLY',
                                        ).length
                                      }{' '}
                                      →{' '}
                                      {
                                        simulation.after.programs.filter(
                                          (r) =>
                                            r.in_scope && r.admission_state === 'READY_TO_APPLY',
                                        ).length
                                      }
                                    </strong>
                                  </p>
                                  <p className="small">
                                    {tr(
                                      'A scenario shows what would change. It is not an offer or a new test result.',
                                    )}
                                  </p>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.removed_blockers.length}</strong>
                                    <span>{tr('requirement gaps removed')}</span>
                                  </div>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.changed_states.length}</strong>
                                    <span>{tr('program states changed')}</span>
                                  </div>
                                  <div className="diff-stat">
                                    <strong>{simulation.diff.changed_costs.length}</strong>
                                    <span>{tr('dated budget comparisons changed')}</span>
                                  </div>
                                  {simulation.diff.changed_rules.slice(0, 6).map((d) => (
                                    <div className="diff-line" key={d.rule}>
                                      <span>
                                        {tr(
                                          current.programs.find((r) => r.program.id === d.program)
                                            ?.program.short,
                                        )}
                                        <small>{tr(d.label)}</small>
                                      </span>
                                      <span>
                                        {tr(symbols[d.before])}
                                        <ArrowRight size={11} />
                                        <strong>{tr(symbols[d.after])}</strong>
                                      </span>
                                    </div>
                                  ))}
                                  <p className="small">
                                    {simulation.diff.tasks_removed.length}{' '}
                                    {tr(' roadmap tasks removed ·')}
                                    {tr(' ')}
                                    {tr(
                                      simulation.diff.next_before === simulation.diff.next_after
                                        ? 'Next action stays the same'
                                        : 'Next action updated',
                                    )}
                                  </p>
                                  <button className="btn primary full" onClick={saveScenario}>
                                    {tr('Save scenario ')}
                                    <Check size={16} />
                                  </button>
                                  <button className="text-button full" onClick={clearSimulation}>
                                    {tr('Discard changes ')}
                                  </button>
                                </div>
                              )}
                            </details>
                            <section className="next-preview">
                              <span className="eyebrow">
                                <Route size={13} /> {tr(' YOUR NEXT MOVE ')}
                              </span>
                              <h3>
                                {tr(
                                  current.next_action?.title ||
                                    'Choose a path to start your roadmap',
                                )}
                              </h3>
                              <p>
                                {tr(
                                  current.next_action
                                    ? `Connects to ${current.next_action.programs.length} shortlisted ${current.next_action.programs.length === 1 ? 'program' : 'programs'}.`
                                    : 'Save programs that interest you. Your next steps will take shape here.',
                                )}
                              </p>
                              <button className="text-button" onClick={() => navigate('roadmap')}>
                                {tr('Open my roadmap ')}
                                <ArrowUpRight size={15} />
                              </button>
                            </section>
                            <div className="evidence-note">
                              <ShieldCheck size={20} />
                              <div>
                                <strong>{tr('Evidence, not guesswork.')}</strong>
                                <p>
                                  {tr(
                                    'Requirements linked to official sources. Remaining gaps shown clearly. ',
                                  )}
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
                          {current.programs
                            .filter(
                              (r) =>
                                focusPrograms.has(r.program.id) ||
                                includeIncomplete ||
                                comparison.includes(r.program.id),
                            )
                            .map((r) => (
                              <button
                                key={r.program.id}
                                className={`choice ${comparison.includes(r.program.id) ? 'selected' : ''}`}
                                onClick={() => compare(r.program.id)}
                              >
                                {comparison.includes(r.program.id) ? (
                                  <Check size={14} />
                                ) : (
                                  <Plus size={14} />
                                )}
                                {tr(' ')}
                                {tr(r.program.short)}
                              </button>
                            ))}
                        </div>
                        {comparison.length < 2 ? (
                          <div className="empty-state panel">
                            <GitCompareArrows size={32} />
                            <h2>{tr('Choose at least two paths.')}</h2>
                            <p>
                              {tr('Select programs above to compare their decisive differences.')}
                            </p>
                          </div>
                        ) : (
                          <ResearchComparison
                            results={comparison
                              .map((id) => current.programs.find((r) => r.program.id === id))
                              .filter((r): r is Result => !!r)}
                            onOpen={setDetail}
                            onProfile={() => {
                              edit();
                              setWizardStep(1);
                            }}
                          />
                        )}
                      </>
                    )}
                    {view === 'roadmap' && (
                      <>
                        {' '}
                        <details className="optional-tools">
                          <summary>{tr('Calendar, personal tasks and verification help')}</summary>
                          <JourneyExtras evaluation={current} facts={facts} onProof={setProof} />
                          <PersonalPlanner
                            profile={profile}
                            busy={busy}
                            hypothetical={!!simulation}
                            onChange={(p) => compute(p)}
                          />
                        </details>{' '}
                      </>
                    )}
                    {view === 'roadmap' && (
                      <div className="roadmap-layout">
                        <div>
                          <section className="next-action-hero">
                            <div className="eyebrow">
                              <Route size={14} /> {tr(' YOUR NEXT BEST ACTION ')}
                            </div>
                            <h2>
                              {tr(current.next_action?.title || 'Save a program. Start a plan.')}
                            </h2>
                            <p>
                              {tr(
                                current.next_action?.description ||
                                  'Your roadmap is built from the programs in your shortlist.',
                              )}
                            </p>
                            {current.next_action && (
                              <>
                                <div className="next-reasons">
                                  <span>
                                    <Bookmark size={14} />
                                    {tr(
                                      `Shortlisted programs: ${current.next_action.programs.length}`,
                                    )}
                                  </span>
                                  <span>
                                    <ShieldCheck size={14} />
                                    {tr('Requirement-based action ')}
                                  </span>
                                </div>
                                <button
                                  className="btn white"
                                  onClick={() => void toggleTask(current.next_action!)}
                                  disabled={!!simulation || busy}
                                >
                                  {tr(
                                    current.next_action.requires_value
                                      ? 'Update my profile'
                                      : 'Mark this step complete',
                                  )}
                                  <ArrowRight size={16} />
                                </button>
                                <p className="small next-policy">
                                  {tr(
                                    'Why this action? Among available steps: earliest known deadline, then most shortlisted programs affected. Timing is not a guarantee.',
                                  )}
                                </p>
                              </>
                            )}
                          </section>
                          <div className="between roadmap-heading">
                            <h2>{tr('Your action plan')}</h2>
                            <span className="muted small">
                              {current.roadmap.filter((t) => t.complete).length} {tr(' of')}
                              {tr(' ')}
                              {current.roadmap.length} {tr(' completed ')}
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
                              <h3>{tr('Your shortlist powers this page.')}</h3>
                              <p>{tr('Save a few programs to create personalized steps.')}</p>
                              <button className="btn primary" onClick={() => navigate('map')}>
                                {tr('Explore paths ')}
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
                                    {tr(
                                      t.complete ? (
                                        <Check size={16} />
                                      ) : (
                                        String(i + 1).padStart(2, '0')
                                      ),
                                    )}
                                  </div>
                                  <div className="task-body">
                                    <div className="between">
                                      <span className="eyebrow">
                                        {tr(
                                          t.type === 'STUDY'
                                            ? 'STUDY PREPARATION'
                                            : t.type === 'ACTIVITY'
                                              ? 'PERSONAL ACTIVITY'
                                              : t.type === 'VERIFY'
                                                ? 'CHECK & CONFIRM'
                                                : t.type === 'SCORE'
                                                  ? 'TESTS & LANGUAGE'
                                                  : t.type === 'BUDGET'
                                                    ? 'FINANCIAL PLANNING'
                                                    : 'APPLICATION MATERIALS',
                                        )}
                                      </span>
                                      {tr(
                                        t.deadline && (
                                          <span className="task-date">
                                            <CalendarDays size={12} />
                                            {tr(dateLabel(t.deadline))}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                    <h3>{tr(t.title)}</h3>
                                    <p>{tr(t.description)}</p>
                                    <div className="task-tags">
                                      {t.programs.map((id) => (
                                        <span key={id}>
                                          {tr(
                                            current.programs.find((r) => r.program.id === id)
                                              ?.program.short,
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                    {t.dependencies.length > 0 && (
                                      <p className="small muted">
                                        {tr('First:')}
                                        {tr(' ')}
                                        {tr(
                                          t.dependencies
                                            .map((id) =>
                                              tr(
                                                current.roadmap.find((x) => x.id === id)?.title ||
                                                  id,
                                              ),
                                            )
                                            .join('; '),
                                        )}
                                      </p>
                                    )}
                                    <div className="task-bottom">
                                      <button
                                        className="text-button"
                                        onClick={() => setProof(t.facts)}
                                      >
                                        {tr('View evidence ')}
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
                                        {tr(
                                          t.complete
                                            ? 'Reopen'
                                            : t.requires_value
                                              ? 'Enter completed result'
                                              : 'Mark complete',
                                        )}
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
                          <span className="eyebrow">{tr('YOUR DESTINATION')}</span>
                          <h3>{tr(profile.major)}</h3>
                          <p>
                            {tr(friendly(profile.intake))} · {tr(profile.countries.join(' + '))}
                          </p>
                          <div className="form-divider" />
                          <h4>{tr('Built around your shortlist')}</h4>
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
                                  {tr(r.program.initials)}
                                </span>
                                {tr(r.program.short)}
                                <ChevronRight size={14} />
                              </button>
                            ))}
                          <div className="form-divider" />
                          <Info size={19} />
                          <p className="small muted">
                            {tr(
                              'Marking a research task complete records progress. It does not turn an unknown university rule into a verified one. Test results need their actual new values. ',
                            )}
                          </p>
                          <button
                            className="btn secondary full"
                            onClick={() => {
                              const calendar = calendarExport(current, tr, facts);
                              if (!calendar.includes('BEGIN:VEVENT')) {
                                setNotice(
                                  'No verified dates to export. Save a university with published deadlines first.',
                                );
                                return;
                              }
                              downloadText(
                                calendar,
                                'pathshift-deadlines.ics',
                                'text/calendar;charset=utf-8',
                              );
                            }}
                          >
                            <CalendarDays size={15} />
                            {tr('Export calendar')}
                          </button>
                          <button className="btn secondary full" onClick={exportPlan}>
                            <Download size={15} />
                            {tr('Export my plan ')}
                          </button>
                        </aside>
                      </div>
                    )}
                    {view === 'sources' && (
                      <>
                        <section className="source-intro panel">
                          <ShieldCheck size={27} />
                          <div>
                            <h2>{tr('A clear boundary between facts and conclusions.')}</h2>
                            <p>
                              {tr(
                                'Official facts come from the frozen research and a new source check on 17 September 2026. PathShift compares those facts with your inputs. It does not predict admission. Cost references keep their original year. ',
                              )}
                            </p>
                            <div className="source-legend">
                              <span>
                                <i className="green-dot" />
                                {tr('Official fact ')}
                              </span>
                              <span>
                                <i className="blue-dot" />
                                {tr('PathShift reasoning ')}
                              </span>
                              <span>
                                <i className="amber-dot" />
                                {tr('Needs verification ')}
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
                                  {tr(r.program.initials)}
                                </span>
                                <strong>{tr(r.program.name)}</strong>
                                <span className="muted small">
                                  {tr(
                                    `Evidence records: ${facts.filter((f) => f.scope.program === r.program.id).length}`,
                                  )}
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
            <span>{tr('Better questions. Clearer choices.')}</span>
            <button onClick={() => navigate('sources')}>
              {tr('How decisions are made ')}
              <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      <Modal
        open={!!selected}
        onClose={() => setDetail(null)}
        title={tr(selected?.program.name || 'Program')}
        description={selected ? selected.program.degree + ' · ' + selected.program.city : ''}
        wide
      >
        {selected && (
          <div className="detail-content">
            <div className="detail-top">
              <Badge state={selected.admission_state} label={resultCaption(selected)} />
              <span className="mini-badge">
                <ShieldCheck size={13} />
                {tr(`Evidence status: ${friendly(selected.evidence_state)}`)}
              </span>
            </div>
            <p className="detail-structure">{tr(selected.program.structure)}</p>
            <div className="detail-dimensions">
              <div>
                <span>{tr('Requirements')}</span>
                <strong>
                  {selected.passed} / {selected.total} {tr(' satisfied ')}
                </strong>
              </div>
              <div>
                <span>{tr('Timeline')}</span>
                <strong>{tr(friendly(selected.timeline_state))}</strong>
              </div>
              <div>
                <span>
                  {tr('Published reference')} · {selected.program.cost?.year}
                </span>
                <strong>
                  {selected.program.cost
                    ? selected.program.cost.currency + ' ' + money(selected.program.cost.min)
                    : tr('Not yet verified')}
                </strong>
              </div>
            </div>
            <ResearchDetails program={selected.program} />
            <h3>{tr('Why this result?')}</h3>
            {selected.rules.map((r) => (
              <RuleRow key={r.id} rule={r} onProof={setProof} />
            ))}
            <section className="detail-section">
              <h3>{tr('What could change this path?')}</h3>
              {selected.recourse.length ? (
                selected.recourse.map((r, i) => (
                  <div className="recourse-card" key={i}>
                    <div className="between">
                      <strong>{tr(r.actions.map(friendly).join(' + '))}</strong>
                      <span className="mini-badge">{tr(friendly(r.feasibility))}</span>
                    </div>
                    <p>
                      {tr(`Requirement branches improved: ${r.improved_rules.length}.`)}{' '}
                      {tr(
                        r.unlocks
                          ? 'Removes the remaining direct-route blockers.'
                          : 'Other conditions may remain.',
                      )}
                    </p>
                    <p className="small muted">{tr(r.note)}</p>
                  </div>
                ))
              ) : (
                <p className="muted">
                  {tr(
                    selected.admission_state === 'READY_TO_APPLY'
                      ? 'No additional hard requirement change is needed in the evaluated branches. Review the application checklist.'
                      : 'Review the unsatisfied and unknown conditions above. No fully verified, feasible unlock has been established yet.',
                  )}
                </p>
              )}
            </section>
            {selected.program.conditional && (
              <div className="notice">
                <Route size={18} />
                <div>
                  <strong>{tr(selected.program.conditional.name)}</strong>
                  <p>{tr(selected.program.conditional.note)}</p>
                  <button
                    className="text-button"
                    onClick={() => setProof([selected.program.conditional!.fact])}
                  >
                    {tr('Check pathway source ')}
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            )}
            <section className="detail-section">
              <h3>{tr('Budget & deadlines')}</h3>
              <CostText result={selected} />
              {selected.program.cost && (
                <button
                  className="text-button"
                  onClick={() => setProof([selected.program.cost!.fact])}
                >
                  {tr('Cost source ')}
                  <ExternalLink size={13} />
                </button>
              )}
              {selected.program.deadlines
                .filter((d) =>
                  facts.some(
                    (f) =>
                      f.id === d.fact && f.intake === profile.intake && f.evidence === 'VERIFIED',
                  ),
                )
                .map((d) => (
                  <div className="deadline-row" key={d.type}>
                    <span>{tr(friendly(d.type))}</span>
                    <strong>{tr(dateLabel(d.date))}</strong>
                    <button className="text-button" onClick={() => setProof([d.fact])}>
                      {tr('Source ')}
                      <ArrowUpRight size={12} />
                    </button>
                    <small>
                      {tr(
                        d.time
                          ? `${d.time} · ${d.timezone === 'APPLICANT_LOCAL' ? tr('Your local timezone') : d.timezone || tr('Time / timezone not verified')}`
                          : 'Time / timezone not verified',
                      )}
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
                {tr('Compare this path ')}
              </button>
              <button
                className="btn primary"
                disabled={busy || !!simulation}
                onClick={() => shortlist(selected.program.id)}
              >
                <Bookmark size={16} />
                {tr(
                  profile.shortlist.includes(selected.program.id)
                    ? 'Remove from shortlist'
                    : 'Save to shortlist',
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        open={proof !== null}
        onClose={() => setProof(null)}
        title={tr('Source proof')}
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
                <h3>{tr('This is a planning inference.')}</h3>
                <p>
                  {tr(
                    'No complete claim-specific evidence is available for this step. It does not establish an admission fact. ',
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={diagnosis}
        wide
        onClose={() => setDiagnosis(false)}
        title={tr(`${profile.name}’s starting point`)}
        description={`${profile.curriculum} · ${profile.major} · ${friendly(profile.intake)}`}
      >
        <div className="diagnosis-content">
          {current && (
            <ApplicantSummary
              evaluation={current}
              onEdit={() => {
                setDiagnosis(false);
                edit();
              }}
              onOpen={(id) => {
                setDiagnosis(false);
                setDetail(id);
              }}
              onSave={shortlist}
              onPlan={() => {
                setDiagnosis(false);
                navigate('roadmap');
              }}
              busy={busy || !!simulation}
            />
          )}
          <div className="notice">
            {tr(
              demo
                ? 'Aruzhan is a synthetic demo applicant. Scores, dates and readiness declarations are illustrative profile inputs. The demo plans its next result / document completion for 20 November 2026.'
                : 'Your results use the values you provided. Update them as you make progress.',
            )}
          </div>
          <button
            className="btn primary full"
            onClick={() => {
              setDiagnosis(false);
              navigate('map');
            }}
          >
            {tr('Explore my paths ')}
            <ArrowRight size={16} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
function CostText({ result: r }: { result: Result }) {
  const { tr, money } = useLocale();

  return (
    <div className="cost-text">
      {r.program.cost ? (
        <>
          <strong>
            {tr(r.program.cost.currency)} {tr(money(r.program.cost.min))}
            {tr(r.program.cost.max !== r.program.cost.min ? '–' + money(r.program.cost.max) : '')}
          </strong>
          <p>
            {tr(r.program.cost.year)} {tr(' reference ·')}
            {tr(' ')}
            {tr(r.program.cost.complete ? 'annual estimate' : 'partial cost / subtotal')}
          </p>
          <span className={r.reference_cost_state === 'OVER_BUDGET' ? 'amber-text' : 'muted'}>
            {tr(
              r.reference_cost_state === 'UNKNOWN'
                ? 'Full annual affordability not established'
                : friendly(r.reference_cost_state) + ' against this reference',
            )}
          </span>
        </>
      ) : (
        <p>{tr('Annual cost needs verification.')}</p>
      )}
      <small>{tr('Fall 2027 total cost is not yet verified.')}</small>
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
  const { tr, dateLabel, money } = useLocale();

  const id = useId();
  return (
    <article className={`program-card ${changed ? 'changed' : ''}`} aria-labelledby={id}>
      {changed && (
        <span className="changed-label">
          <FlaskConical size={11} />
          {tr('Changed in scenario ')}
        </span>
      )}
      <div className="card-top">
        <span
          className="school-logo"
          style={{ color: r.program.color, background: r.program.color + '12' }}
        >
          {tr(r.program.initials)}
        </span>
        <span className="card-location">
          <Globe2 size={12} />
          {tr(r.program.city)}, {tr(r.program.country)}
        </span>
        <button
          className={`icon-button bookmark ${saved ? 'saved' : ''}`}
          aria-label={tr(
            `${saved ? 'Remove' : 'Save'} ${r.program.short} ${saved ? 'from' : 'to'} shortlist`,
          )}
          aria-pressed={saved}
          disabled={disabled}
          onClick={onSave}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <button className="card-title-button" onClick={onOpen}>
        <h3 id={id}>
          {tr(r.program.short)}
          <ArrowUpRight size={16} />
        </h3>
      </button>
      <p className="degree">{tr(r.program.degree)}</p>
      <Badge state={r.admission_state} label={resultCaption(r)} />
      {!r.in_scope && (
        <p className="scope-note">
          {tr(
            'Outside your study preferences. Update your profile to include this university in your task plan.',
          )}
        </p>
      )}
      <p className="why-fit">
        {tr(
          r.rules.some((rule) => rule.strength === 'HARD' && rule.result === 'PASS')
            ? `Already meets: ${r.rules.find((rule) => rule.strength === 'HARD' && rule.result === 'PASS')!.label}`
            : r.in_scope
              ? 'Matches your chosen field and country; requirements still need attention.'
              : 'Outside your current preferences; review before adding.',
        )}
      </p>
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
          {tr(
            r.blockers[0]?.label ||
              r.unknowns[0]?.label ||
              'Published requirements satisfied in evaluated branches.',
          )}
        </p>
      </div>
      <button className="text-button card-next" onClick={onOpen}>
        {tr('See requirements and next steps')} <ArrowUpRight size={14} />
      </button>
      <div className="card-metadata">
        <span>
          <CalendarDays size={13} />
          {tr(
            r.deadline
              ? dateLabel(r.deadline.date).replace(', 2027', '')
              : r.program.research?.some((row) => row.key === 'dates')
                ? 'See published dates'
                : 'Date unverified',
          )}
        </span>
        <span className={r.reference_cost_state === 'OVER_BUDGET' ? 'amber-text' : ''}>
          <Wallet size={13} />
          {tr(
            r.program.cost
              ? `${r.program.cost.currency} ${money(r.program.cost.min)} · ${r.program.cost.year}`
              : 'Cost unverified',
          )}
        </span>
      </div>
      <div className="card-footer">
        <label>
          <input type="checkbox" checked={comparing} onChange={onCompare} />
          {tr('Compare ')}
        </label>
        <button onClick={onOpen}>
          {tr('Explore path ')}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

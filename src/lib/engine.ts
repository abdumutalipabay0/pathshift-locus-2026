import raw from '../../data/dataset.json';
import { profileSchema } from './profile';
import type {
  CostState,
  Deadline,
  Diff,
  Evaluation,
  Fact,
  Profile,
  Program,
  Recourse,
  Result,
  Rule,
  RuleResult,
  Simulation,
  Task,
  Timeline,
  Verdict,
} from './types';
export const dataset = raw as { version: string; facts: Fact[]; programs: Program[] };
const valueAt = (obj: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      obj,
    );
export function resolveFacts(ids: string[], facts: Fact[], intake: string) {
  const selected = ids.flatMap((id) => facts.filter((f) => f.id === id));
  if (!ids.length || ids.some((id) => !selected.some((f) => f.id === id)))
    return { state: 'UNKNOWN' as const, facts: selected };
  if (selected.some((f) => f.intake !== intake))
    return { state: 'UNKNOWN' as const, facts: selected };
  const peers = selected.flatMap((f) =>
    facts.filter(
      (other) =>
        other.field === f.field &&
        JSON.stringify(other.scope) === JSON.stringify(f.scope) &&
        other.intake === f.intake,
    ),
  );
  if (
    selected.some((f) => f.evidence === 'CONFLICTING') ||
    peers.some((f, i) =>
      peers.some(
        (g, j) =>
          i !== j &&
          f.field === g.field &&
          JSON.stringify(f.scope) === JSON.stringify(g.scope) &&
          f.evidence === 'VERIFIED' &&
          g.evidence === 'VERIFIED' &&
          JSON.stringify(f.value) !== JSON.stringify(g.value),
      ),
    )
  )
    return {
      state: 'CONFLICTING' as const,
      facts: [...new Map([...selected, ...peers].map((f) => [f.id, f])).values()],
    };
  const bad = selected.find((f) => f.evidence !== 'VERIFIED' || f.provenance !== 'OFFICIAL_FACT');
  return {
    state:
      bad?.evidence === 'VERIFIED' ? ('UNKNOWN' as const) : bad?.evidence || ('VERIFIED' as const),
    facts: selected,
  };
}
function combine(results: Verdict[], any = false): Verdict {
  const applicable = results.filter((x) => x !== 'NOT_APPLICABLE');
  if (!applicable.length) return 'NOT_APPLICABLE';
  if (any) {
    if (applicable.includes('PASS')) return 'PASS';
    if (applicable.includes('UNKNOWN')) return 'UNKNOWN';
    return 'FAIL';
  }
  if (applicable.includes('FAIL')) return 'FAIL';
  if (applicable.includes('UNKNOWN')) return 'UNKNOWN';
  return 'PASS';
}
export function evaluateRule(
  rule: Rule,
  profile: Profile,
  facts = dataset.facts,
  now = '2026-09-17T12:00:00Z',
): RuleResult {
  const base: RuleResult = {
    id: rule.id,
    label: rule.label,
    result: 'UNKNOWN',
    strength: rule.strength,
    facts: rule.facts,
    reason: 'Evidence is not sufficient to evaluate this requirement.',
    field: rule.field,
    action: rule.action,
    immutable: rule.immutable,
    children: [],
  };
  if (rule.op === 'POST_ENROLMENT')
    return {
      ...base,
      result: 'NOT_APPLICABLE',
      reason: 'A later enrolment step, not a high-school application blocker.',
    };
  if (rule.unknown) return base;
  const ev = resolveFacts(rule.facts, facts, profile.intake);
  if (rule.facts.length && ev.state !== 'VERIFIED')
    return {
      ...base,
      facts: ev.facts.map((f) => f.id),
      reason: `Source evidence: ${ev.state.toLowerCase()}. No pass or failure inferred.`,
    };
  if (rule.op === 'ATOM') {
    if (rule.strength === 'INFO')
      return {
        ...base,
        result: 'NOT_APPLICABLE',
        reason: 'Informational only; not an application blocker.',
      };
    if (ev.state !== 'VERIFIED') return base;
    const input =
      rule.field === 'ib_subject_total'
        ? profile.ib_total == null || profile.ib_core_points == null
          ? null
          : profile.ib_total - profile.ib_core_points
        : valueAt(profile, rule.field || '');
    if (rule.field?.startsWith('ielts.')) {
      if (profile.ielts.status !== 'VALID')
        return {
          ...base,
          result: profile.ielts.status === 'MISSING' ? 'FAIL' : 'UNKNOWN',
          input_needed: profile.ielts.status !== 'MISSING',
          reason:
            profile.ielts.status === 'MISSING'
              ? 'No IELTS result supplied. Other routes may require verification.'
              : 'Planned scores do not satisfy published requirements.',
        };
      if (!profile.ielts.date || profile.ielts.date > now.slice(0, 10))
        return { ...base, input_needed: true, reason: 'A completed test date is required.' };
      if (
        (rule.id.startsWith('uw.') || rule.id.startsWith('cmu.')) &&
        Date.parse(now) - Date.parse(profile.ielts.date) > 2 * 365.25 * 86400000
      )
        return { ...base, result: 'FAIL', reason: 'This result is more than two years old.' };
    }
    if (rule.field?.endsWith('.status') && input === 'VALID') {
      const test = rule.field.startsWith('sat') ? profile.sat : profile.act;
      if (!test.score || !test.date || test.date > now.slice(0, 10))
        return {
          ...base,
          input_needed: true,
          reason: 'A valid score must have a completed test date.',
        };
    }
    if (input === null || input === undefined)
      return {
        ...base,
        input_needed: true,
        reason: 'The rule is known. Add the missing value in your profile.',
      };
    const expected =
      rule.value !== undefined
        ? rule.value
        : rule.valueKey
          ? valueAt(ev.facts[0]?.value, rule.valueKey)
          : ev.facts[0]?.value;
    if (expected === null || expected === undefined) return base;
    let pass: boolean;
    switch (rule.comparator) {
      case 'EQ':
        pass = input === expected;
        break;
      case 'NEQ':
        pass = input !== expected;
        break;
      case 'GTE':
        pass = Number(input) >= Number(expected);
        break;
      case 'LTE':
        pass = Number(input) <= Number(expected);
        break;
      case 'PRESENT':
        pass = input !== '';
        break;
      case 'IN':
        pass = Array.isArray(expected) && expected.includes(input);
        break;
      case 'BEFORE':
        pass = String(input) < String(expected);
        break;
      case 'AFTER':
        pass = String(input) > String(expected);
        break;
      default:
        return {
          ...base,
          reason: 'This predicate requires a verified normalization that is not available.',
        };
    }
    return {
      ...base,
      result: pass ? 'PASS' : 'FAIL',
      reason:
        typeof input === 'boolean'
          ? pass
            ? 'You have confirmed this step in your profile.'
            : 'This step is not confirmed yet. Complete it, then update your profile.'
          : `${String(input)} ${pass ? 'satisfies' : 'does not satisfy'} the published requirement (${String(expected)}).`,
    };
  }
  if (rule.op === 'EXEMPTION') {
    const children = [rule.requirement, rule.exemption]
      .filter(Boolean)
      .map((r) => evaluateRule(r!, profile, facts, now));
    return {
      ...base,
      children,
      input_needed:
        children.some((c) => c.result === 'UNKNOWN') &&
        children.filter((c) => c.result === 'UNKNOWN').every((c) => c.input_needed),
      result: combine(
        children.map((c) => c.result),
        true,
      ),
      reason: 'Requirement or a verified exemption must pass.',
    };
  }
  if (rule.op === 'CONDITIONAL_PATH') {
    const children = [rule.direct, rule.alternative]
      .filter(Boolean)
      .map((r) => evaluateRule(r!, profile, facts, now));
    const direct = children[0]?.result;
    const alternative = children[1]?.result;
    return {
      ...base,
      children,
      input_needed:
        children.some((c) => c.result === 'UNKNOWN') &&
        children.filter((c) => c.result === 'UNKNOWN').every((c) => c.input_needed),
      result:
        direct === 'PASS'
          ? 'PASS'
          : alternative === 'PASS'
            ? 'PASS'
            : combine(
                children.map((c) => c.result),
                true,
              ),
      conditional: direct !== 'PASS' && alternative === 'PASS',
      reason:
        direct === 'PASS'
          ? 'Direct route satisfied.'
          : alternative === 'PASS'
            ? 'Verified alternative route conditions satisfied.'
            : 'Alternative applicability has not been established.',
    };
  }
  const children = (rule.children || []).map((r) => evaluateRule(r, profile, facts, now));
  const result = combine(
    children.map((c) => c.result),
    rule.op === 'ANY_OF',
  );
  return {
    ...base,
    children,
    input_needed:
      children.some((c) => c.result === 'UNKNOWN') &&
      children.filter((c) => c.result === 'UNKNOWN').every((c) => c.input_needed),
    result,
    reason:
      result === 'PASS'
        ? 'Published conditions for this branch are satisfied.'
        : result === 'FAIL'
          ? 'One or more published conditions are not satisfied.'
          : 'Some required values or source predicates remain unknown.',
  };
}
export function timeline(deadline: Deadline | null, now: string): Timeline {
  if (!deadline) return 'UNKNOWN';
  const date = new Date(now);
  let day = now.slice(0, 10),
    time = now.slice(11, 19);
  if (deadline.timezone && deadline.timezone !== 'APPLICANT_LOCAL') {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: deadline.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const get = (k: string) => parts.find((p) => p.type === k)?.value;
    day = `${get('year')}-${get('month')}-${get('day')}`;
    time = `${get('hour')}:${get('minute')}:${get('second')}`;
  }
  // Without a frozen timezone (or applicant timezone input), retain a 1-day uncertainty boundary.
  if (!deadline.timezone || deadline.timezone === 'APPLICANT_LOCAL') {
    const distance = (Date.parse(deadline.date) - Date.parse(now)) / 86400000;
    if (Math.abs(distance) < 1) return 'UNKNOWN';
  }
  if (day > deadline.date || (day === deadline.date && deadline.time && time > deadline.time))
    return 'MISSED';
  if (day === deadline.date && !deadline.time) return 'UNKNOWN';
  return (Date.parse(deadline.date) - date.getTime()) / 86400000 < 14 ? 'TIGHT' : 'FEASIBLE';
}
export function referenceCost(program: Program, p: Profile, facts = dataset.facts): CostState {
  const c = program.cost;
  if (!c || resolveFacts([c.fact], facts, '2026_27').state !== 'VERIFIED') return 'UNKNOWN';
  const budget = p.budgets[c.currency];
  if (budget === null) return 'UNKNOWN';
  if (budget < c.min) return 'OVER_BUDGET';
  if (c.complete && budget >= c.max) return 'WITHIN_BUDGET';
  return 'UNKNOWN';
}
function flatten(rule: RuleResult): RuleResult[] {
  return [rule, ...rule.children.flatMap(flatten)];
}
function core(program: Program, p: Profile, facts: Fact[], now: string): Result {
  if (p.documents_by_program)
    p = { ...p, documents_ready: p.documents_by_program[program.id] === true };
  const supported =
    p.intake === 'FALL_2027' &&
    p.major === 'Computer Science' &&
    p.applicant_type === 'FIRST_YEAR_INTERNATIONAL';
  const rules = program.rules.map((r) => evaluateRule(r, p, facts, now));
  if (!supported)
    rules.unshift({
      id: `${program.id}.scope`,
      label: 'This audience or intake is outside the frozen dataset',
      result: 'UNKNOWN',
      strength: 'HARD',
      facts: [],
      reason: 'No verified rules are available for this scope.',
      children: [],
    });
  if (p.curriculum !== 'IB')
    rules.unshift({
      id: `${program.id}.curriculum`,
      label: 'Curriculum mapping needs verification',
      result: 'UNKNOWN',
      strength: 'HARD',
      facts: [],
      reason: 'No institution-specific equivalency inferred from citizenship.',
      children: [],
    });
  const blockers = rules.filter((r) => r.strength === 'HARD' && r.result === 'FAIL');
  const unknowns = rules.filter(
    (r) =>
      r.strength === 'HARD' &&
      (r.result === 'UNKNOWN' ||
        (r.result !== 'PASS' && flatten(r).some((x) => x.result === 'UNKNOWN'))),
  );
  const deadline = supported
    ? program.deadlines.find(
        (d) =>
          d.type === 'APPLICATION' && resolveFacts([d.fact], facts, p.intake).state === 'VERIFIED',
      ) || null
    : null;
  const t = timeline(deadline, now);
  const all = rules.flatMap(flatten);
  const evidence = all.some((r) => resolveFacts(r.facts, facts, p.intake).state === 'CONFLICTING')
    ? 'CONFLICTING'
    : unknowns.some((r) => !r.input_needed)
      ? 'PARTIAL'
      : all.some((r) => r.result === 'UNKNOWN' && !r.input_needed)
        ? 'PARTIAL'
        : 'VERIFIED';
  let state: Result['admission_state'] = 'INDETERMINATE';
  if (t === 'MISSED') state = 'BLOCKED';
  else if (supported && p.curriculum === 'IB') {
    if (
      blockers.some((r) => flatten(r).some((c) => c.result === 'FAIL' && c.immutable)) &&
      p.academics_completed
    )
      state = 'BLOCKED';
    else if (!unknowns.length && !blockers.length)
      state = rules.some((r) => r.conditional) ? 'CONDITIONAL_PATH' : 'READY_TO_APPLY';
  }
  const hard = rules.filter((r) => r.strength === 'HARD');
  return {
    program,
    admission_state: state,
    evidence_state: evidence,
    timeline_state: t,
    cost_state: 'UNKNOWN',
    reference_cost_state: referenceCost(program, p, facts),
    rules,
    blockers,
    unknowns,
    passed: hard.filter((r) => r.result === 'PASS').length,
    total: hard.length,
    recourse: [],
    in_scope:
      p.countries.includes(program.country) &&
      (!p.country_locks.length || p.country_locks.includes(program.country)) &&
      p.major === 'Computer Science',
    deadline,
  };
}
export function recourseMutations(
  r: Result,
  p: Profile,
  facts: Fact[],
): { id: string; mutation: Partial<Profile> }[] {
  const options: { id: string; mutation: Partial<Profile> }[] = [];
  for (const block of r.blockers) {
    if (block.action === 'english') {
      const children = flatten(block);
      const ielts = { ...p.ielts, status: 'VALID', date: p.expected_score_date || p.ielts.date };
      for (const c of children) {
        const f = facts.find((f) => c.facts.includes(f.id));
        const key = c.field?.split('.')[1];
        if (f && key && ['overall', 'reading', 'writing', 'speaking', 'listening'].includes(key)) {
          const value = Number(typeof f.value === 'number' ? f.value : valueAt(f.value, key));
          if (Number.isFinite(value))
            Object.assign(ielts, { [key]: Math.max(Number(valueAt(ielts, key)) || 0, value) });
        }
      }
      options.push({ id: 'english', mutation: { ielts } });
    }
    if (block.action === 'sat') {
      // Counterfactual presence uses a valid user-provided score only; never invent a target SAT score.
      if (p.sat.score !== null && p.sat.date)
        options.push({ id: 'sat', mutation: { sat: { ...p.sat, status: 'VALID' } } });
      if (p.act.score !== null && p.act.date)
        options.push({ id: 'act', mutation: { act: { ...p.act, status: 'VALID' } } });
    }
    if (block.action === 'aif') options.push({ id: 'aif', mutation: { aif: true } });
    if (block.action === 'documents')
      options.push({
        id: 'documents',
        mutation: {
          documents_ready: true,
          ...(p.documents_by_program
            ? { documents_by_program: { ...p.documents_by_program, [r.program.id]: true } }
            : {}),
        },
      });
  }
  return options;
}
function recourse(r: Result, p: Profile, facts: Fact[], now: string): Recourse[] {
  if (r.timeline_state === 'MISSED' || !r.in_scope) return [];
  const options = recourseMutations(r, p, facts).filter(
    (o) =>
      p.test_willingness?.[o.id === 'english' ? 'IELTS' : o.id === 'sat' ? 'SAT' : 'ACT'] !==
        false || !['english', 'sat', 'act'].includes(o.id),
  );
  const paths: Recourse[] = [];
  for (let mask = 1; mask < 1 << Math.min(options.length, 5); mask++) {
    const selected = options.filter((_, i) => mask & (1 << i));
    const mutation = Object.assign({}, ...selected.map((s) => s.mutation));
    const copy = { ...structuredClone(p), ...mutation };
    // Future expected scores are simulated at their delivery date; this is explicitly a hypothetical plan.
    const checkAt =
      p.expected_score_date && p.expected_score_date > now.slice(0, 10)
        ? `${p.expected_score_date}T12:00:00Z`
        : now;
    const after = core(r.program, copy, facts, checkAt);
    const improved = r.blockers
      .filter((b) => after.rules.find((c) => c.id === b.id)?.result === 'PASS')
      .map((b) => b.id);
    if (!improved.length) continue;
    const validDeadlines = r.program.deadlines.filter(
      (d) => resolveFacts([d.fact], facts, p.intake).state === 'VERIFIED',
    );
    const scoreDeadline =
      validDeadlines.find((d) => d.type === 'ENGLISH_SCORE' || d.type === 'TEST_SCORE') ||
      validDeadlines.find((d) => d.type === 'DOCUMENT') ||
      r.deadline;
    let feasibility: Timeline = 'UNKNOWN';
    if (p.expected_score_date && scoreDeadline) {
      feasibility = timeline(scoreDeadline, `${p.expected_score_date}T12:00:00Z`);
    }
    paths.push({
      actions: selected.map((x) => x.id),
      mutation,
      improved_rules: improved,
      feasibility,
      unlocks:
        after.admission_state === 'READY_TO_APPLY' && ['FEASIBLE', 'TIGHT'].includes(feasibility),
      note:
        feasibility === 'UNKNOWN'
          ? 'Score delivery / completion timing needs confirmation. This is a hypothetical change, not a verified feasible plan.'
          : feasibility === 'MISSED'
            ? 'Expected completion is after the available deadline.'
            : 'Feasible against the entered completion date; improvement and delivery are not guaranteed.',
    });
  }
  return paths
    .filter(
      (path) =>
        !paths.some(
          (other) =>
            other !== path &&
            other.actions.length < path.actions.length &&
            other.actions.every((a) => path.actions.includes(a)) &&
            other.improved_rules.length >= path.improved_rules.length,
        ),
    )
    .sort(
      (a, b) =>
        Number(b.unlocks) - Number(a.unlocks) ||
        a.actions.length - b.actions.length ||
        b.improved_rules.length - a.improved_rules.length,
    )
    .slice(0, 3);
}
function roadmap(results: Result[], p: Profile): Task[] {
  const chosen = results.filter((r) => r.in_scope && p.shortlist.includes(r.program.id));
  const tasks = new Map<string, Task>();
  const add = (
    id: string,
    title: string,
    description: string,
    type: Task['type'],
    r: Result,
    facts: string[],
    date: string | null,
    requires_value = false,
  ) => {
    const prev = tasks.get(id);
    if (prev) {
      prev.programs.push(r.program.id);
      prev.facts = [...new Set([...prev.facts, ...facts])];
      prev.impact++;
      if (date && (!prev.deadline || date < prev.deadline)) prev.deadline = date;
      return;
    }
    tasks.set(id, {
      id,
      title,
      description,
      type,
      programs: [r.program.id],
      facts,
      deadline: date,
      dependencies: [],
      complete: p.completed.includes(id),
      requires_value,
      impact: 1,
    });
  };
  for (const r of chosen) {
    if (r.timeline_state === 'MISSED') {
      add(
        `verify-intake-${r.program.id}`,
        'Review a later intake',
        `${r.program.short}: the published application deadline has passed. Future dates are not yet verified.`,
        'VERIFY',
        r,
        r.deadline ? [r.deadline.fact] : [],
        null,
      );
      continue;
    }
    for (const b of r.blockers) {
      if (b.action === 'english')
        add(
          'english',
          'Plan your next English result',
          'Check the component requirements and score-delivery date. Enter the actual new scores when received.',
          'SCORE',
          r,
          b.facts,
          r.program.deadlines.find((d) => d.type === 'ENGLISH_SCORE')?.date || null,
          true,
        );
      else if (b.action === 'sat')
        add(
          'sat',
          'Add a completed SAT or ACT result',
          'Required for the selected testing branches. A planned attempt is not a completed result.',
          'SCORE',
          r,
          b.facts,
          r.program.deadlines.find((d) => d.type === 'TEST_SCORE')?.date || null,
          true,
        );
      else if (b.action === 'aif')
        add(
          'aif',
          'Submit Waterloo’s Admission Information Form',
          'Record completion only after submitting the AIF to Waterloo.',
          'DOCUMENT',
          r,
          b.facts,
          r.program.deadlines.find((d) => d.type === 'DOCUMENT')?.date || null,
          true,
        );
      else if (b.action === 'documents')
        add(
          `documents-${r.program.id}`,
          'Prepare your application records',
          'Review each shortlisted institution’s checklist, official transcripts, translations and supplementary forms.',
          'DOCUMENT',
          r,
          b.facts,
          r.program.deadlines.find((d) => d.type === 'DOCUMENT')?.date || null,
          true,
        );
      else add(`resolve-${b.id}`, `Review ${b.label}`, b.reason, 'VERIFY', r, b.facts, null);
    }
    if (r.rules.some((rule) => rule.conditional))
      add(
        'english-direct',
        'Explore a direct English route',
        'Your current scores meet a published conditional English branch. Simulate stronger scores to see whether the direct branch changes.',
        'SCORE',
        r,
        r.rules.find((rule) => rule.conditional)!.facts,
        null,
        true,
      );
    for (const u of r.unknowns)
      add(
        `verify-${u.id}`,
        u.input_needed ? `Complete profile: ${u.label}` : `Verify: ${u.label}`,
        u.input_needed
          ? 'The rule is known. Add the missing value in your profile.'
          : `${r.program.short}: ${u.reason} Completing this task records your progress; source evidence still needs an update.`,
        'VERIFY',
        r,
        u.facts,
        null,
        u.input_needed === true,
      );
    if (r.reference_cost_state === 'OVER_BUDGET')
      add(
        `cost-${r.program.id}`,
        'Review the published cost estimate',
        `${r.program.short}: the dated reference exceeds your budget. Competitive aid is not guaranteed.`,
        'BUDGET',
        r,
        [r.program.cost!.fact],
        null,
      );
    if (p.interest !== 'Exploring CS')
      add(
        `interest-${r.program.id}-${p.interest.toLowerCase().replaceAll(' ', '-')}`,
        `Explore ${p.interest.toLowerCase()} at ${r.program.short}`,
        `Planning suggestion based on your stated interest: inspect the current course catalogue and save two relevant courses. This is not a verified program-fit claim.`,
        'VERIFY',
        r,
        [],
        null,
      );
    if (r.deadline) {
      const dep = `review-${r.program.id}`;
      add(
        dep,
        `Review ${r.program.short} application materials`,
        'Confirm the institution-specific document checklist on the official application portal.',
        'VERIFY',
        r,
        [r.deadline.fact],
        r.deadline.date,
      );
      add(
        `application-${r.program.id}`,
        `Complete ${r.program.short} application`,
        'Submit the initial application by this date. Documents and scores may have separate later deadlines below. PathShift does not submit applications.',
        'DOCUMENT',
        r,
        [r.deadline.fact],
        r.deadline.date,
      );
      tasks.get(`application-${r.program.id}`)!.dependencies = [dep];
    }
  }
  return [...tasks.values()].sort(
    (a, b) =>
      Number(a.complete) - Number(b.complete) ||
      (a.deadline || '9999').localeCompare(b.deadline || '9999') ||
      a.dependencies.length - b.dependencies.length ||
      b.impact - a.impact ||
      a.id.localeCompare(b.id),
  );
}
export function evaluate(
  profile: Profile,
  now = new Date().toISOString(),
  data = dataset,
): Evaluation {
  const p = structuredClone(profile);
  const results = data.programs.map((program) => core(program, p, data.facts, now));
  for (const r of results) {
    r.recourse = recourse(r, p, data.facts, now);
    if (
      r.admission_state === 'INDETERMINATE' &&
      !r.unknowns.length &&
      r.recourse.some((x) => x.unlocks)
    )
      r.admission_state = 'WITHIN_REACH';
  }
  const order = ['READY_TO_APPLY', 'CONDITIONAL_PATH', 'WITHIN_REACH', 'INDETERMINATE', 'BLOCKED'];
  results.sort(
    (a, b) =>
      Number(b.in_scope) - Number(a.in_scope) ||
      (p.budget_hard
        ? Number(a.reference_cost_state === 'OVER_BUDGET') -
          Number(b.reference_cost_state === 'OVER_BUDGET')
        : 0) ||
      order.indexOf(a.admission_state) - order.indexOf(b.admission_state) ||
      b.passed - a.passed ||
      Number(a.reference_cost_state === 'OVER_BUDGET') -
        Number(b.reference_cost_state === 'OVER_BUDGET') ||
      a.program.name.localeCompare(b.program.name),
  );
  const tasks = roadmap(results, p);
  const next =
    tasks.find(
      (t) => !t.complete && t.dependencies.every((id) => tasks.find((x) => x.id === id)?.complete),
    ) || null;
  return {
    profile: p,
    programs: results,
    roadmap: tasks,
    next_action: next,
    diagnosis: {
      strengths: [
        p.curriculum === 'IB'
          ? `IB profile${p.ib_total !== null ? `: ${p.ib_total}/45` : ''}; subject rules are evaluated separately.`
          : 'Original grades retained without GPA conversion.',
        `${results.filter((r) => r.in_scope).length} programs in your selected countries.`,
      ],
      constraints: [
        `${results.filter((r) => r.in_scope).reduce((n, r) => n + r.blockers.length, 0)} known requirement gaps across your selected countries.`,
        `${results.filter((r) => r.in_scope && r.reference_cost_state === 'OVER_BUDGET').length} dated cost references exceed your budget.`,
      ],
      gaps: [
        'Fall 2027 total costs are not frozen.',
        'Missing academic mappings and conditional-route predicates remain needs verification.',
      ],
    },
    evaluated_at: now,
    dataset_version: data.version,
  };
}
export function simulate(
  p: Profile,
  mutation: Partial<Profile>,
  now = new Date().toISOString(),
): Simulation {
  const allowed = new Set([
    'ielts',
    'sat',
    'act',
    'budgets',
    'countries',
    'interest',
    'intake',
    'expected_score_date',
    'test_willingness',
    'documents_by_program',
    'aif',
  ]);
  if (Object.keys(mutation).some((key) => !allowed.has(key)))
    throw new Error(
      'Scenarios can change future tests and preferences, not your identity or academic history.',
    );
  const afterProfile = profileSchema.parse({ ...structuredClone(p), ...mutation });
  for (const test of ['ielts', 'sat', 'act'] as const)
    if (
      mutation[test] &&
      JSON.stringify(mutation[test]) !== JSON.stringify(p[test]) &&
      afterProfile.test_willingness?.[
        test === 'ielts' ? 'IELTS' : test === 'sat' ? 'SAT' : 'ACT'
      ] === false
    )
      throw new Error('A score change conflicts with your test lock.');
  if (
    mutation.countries &&
    (!p.geography_flexible || p.country_locks.length) &&
    JSON.stringify(mutation.countries) !== JSON.stringify(p.countries)
  )
    throw new Error('Unlock geography in your profile before changing countries in a scenario.');
  if (
    mutation.budgets &&
    !p.financial_flexibility &&
    (['USD', 'CAD', 'GBP'] as const).some((c) => (mutation.budgets![c] || 0) > (p.budgets[c] || 0))
  )
    throw new Error('Enable financial flexibility before simulating a higher budget.');
  const before = evaluate(p, now),
    after = evaluate(afterProfile, now);
  return { before, after, diff: diffEvaluations(before, after) };
}
export function diffEvaluations(before: Evaluation, after: Evaluation): Diff {
  const diff: Diff = {
    changed_states: [],
    changed_rules: [],
    removed_blockers: [],
    added_blockers: [],
    changed_costs: [],
    changed_timelines: [],
    tasks_added: [],
    tasks_removed: [],
    next_before: before.next_action?.id || null,
    next_after: after.next_action?.id || null,
  };
  for (const a of after.programs) {
    const b = before.programs.find((r) => r.program.id === a.program.id)!;
    if (a.admission_state !== b.admission_state)
      diff.changed_states.push({
        id: a.program.id,
        before: b.admission_state,
        after: a.admission_state,
      });
    for (const ar of a.rules) {
      const br = b.rules.find((r) => r.id === ar.id);
      if (br && br.result !== ar.result)
        diff.changed_rules.push({
          program: a.program.id,
          rule: ar.id,
          label: ar.label,
          before: br.result,
          after: ar.result,
        });
    }
    diff.removed_blockers.push(
      ...b.blockers.filter((br) => !a.blockers.some((ar) => ar.id === br.id)).map((r) => r.id),
    );
    diff.added_blockers.push(
      ...a.blockers.filter((ar) => !b.blockers.some((br) => br.id === ar.id)).map((r) => r.id),
    );
    if (a.reference_cost_state !== b.reference_cost_state)
      diff.changed_costs.push({
        id: a.program.id,
        before: b.reference_cost_state,
        after: a.reference_cost_state,
      });
    if (a.timeline_state !== b.timeline_state) diff.changed_timelines.push(a.program.id);
  }
  diff.tasks_added = after.roadmap
    .filter((a) => !before.roadmap.some((b) => b.id === a.id))
    .map((t) => t.id);
  diff.tasks_removed = before.roadmap
    .filter((b) => !after.roadmap.some((a) => a.id === b.id))
    .map((t) => t.id);
  return diff;
}

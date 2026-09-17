import {
  dataset,
  evaluate,
  recourseMutations,
  resolveFacts,
  timeline,
  simulate,
  diffEvaluations,
} from './engine';
import { profileSchema } from './profile';
import type { Evaluation, Profile, Rule, RuleResult, Simulation, Timeline } from './types';
import type { SavedScenario } from './journey';
import type {
  DecisionGraph,
  DecisionQuestion,
  FutureAction,
  FuturePath,
  LabAnalysis,
  DecisionReceipt,
  ActionImpact,
} from './lab-types';

export const focusIds = ['uw', 'waterloo', 'gatech', 'purdue', 'rit', 'asu'];
export const at = (value: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined),
      value,
    );
export const flatResults = (rules: RuleResult[]): RuleResult[] =>
  rules.flatMap((r) => [r, ...flatResults(r.children)]);
const children = (r: Rule) => [
  ...(r.children || []),
  ...[r.requirement, r.exemption, r.direct, r.alternative].filter((v): v is Rule => !!v),
];
const flatRules = (rules: Rule[]): Rule[] => rules.flatMap((r) => [r, ...flatRules(children(r))]);
const unique = <T>(values: T[]) => [...new Set(values)];
const scope = (e: Evaluation) =>
  e.programs.filter(
    (r) =>
      r.in_scope && (focusIds.includes(r.program.id) || e.profile.shortlist.includes(r.program.id)),
  );
export function inputFields(r: RuleResult): string[] {
  if (!r.field) return [];
  if (r.field === 'ib_subject_total') return ['ib_total', 'ib_core_points'];
  if (r.field.startsWith('ielts.')) return unique([r.field, 'ielts.status', 'ielts.date']);
  if (r.field === 'sat.status' || r.field === 'act.status')
    return [r.field, r.field.replace('status', 'score'), r.field.replace('status', 'date')];
  return [r.field];
}
const numericBounds: Record<string, [number, number, number]> = {
  ib_total: [0, 45, 1],
  ib_core_points: [0, 3, 1],
  english_b_hl: [1, 7, 1],
  math_aa_hl: [0, 7, 1],
  ib_courses: [0, 10, 1],
  hl_courses: [0, 10, 1],
  'school.asu_gpa': [0, 4, 0.1],
  'school.competency_gpa': [0, 4, 0.1],
};
const boolFields = [
  'english_a',
  'ib_diploma',
  'senior_english',
  'school.math_sequence',
  'school.precalculus',
  'school.chemistry_physics',
  'school.non_english_country',
  'school.top_quarter',
  'school.purdue_english_evidence',
];
function bounds(field: string): [number, number, number] | undefined {
  if (numericBounds[field]) return numericBounds[field];
  if (/^school\.(english|math|science|natural_science|social|electives|language)$/.test(field))
    return [0, 12, 1];
  if (/^ielts\.(overall|reading|writing|speaking|listening)$/.test(field)) return [0, 9, 0.5];
}
export function answerQuestion(profile: Profile, field: string, value: unknown): Profile {
  if (!bounds(field) && !boolFields.includes(field)) throw new Error('Unsupported profile field.');
  const copy = structuredClone(profile) as unknown as Record<string, unknown>;
  const parts = field.split('.');
  if (parts.length === 2)
    copy[parts[0]] = { ...((copy[parts[0]] as object) || {}), [parts[1]]: value };
  else copy[field] = value;
  if (field === 'ib_total' && profile.raw_scale === '45') copy.raw_grade = String(value);
  return profileSchema.parse(copy);
}
export function rankQuestions(
  profile: Profile,
  now: string,
  current = evaluate(profile, now),
): DecisionQuestion[] {
  const candidates = new Map<string, { label: string; values: (number | boolean)[] }>();
  for (const result of scope(current)) {
    const definitions = flatRules(result.program.rules);
    // A passing ANY_OF branch does not need more evidence to settle its parent.
    for (const top of result.rules.filter((r) => r.result === 'UNKNOWN' || r.result === 'FAIL')) {
      for (const rule of flatResults([top]).filter(
        (r) => !r.children.length && r.result === 'UNKNOWN' && r.input_needed,
      )) {
        for (const field of inputFields(rule)) {
          if (at(profile, field) != null) continue;
          const range = bounds(field),
            boolean = boolFields.includes(field);
          if (!range && !boolean) continue;
          const definition = definitions.find((d) => d.id === rule.id);
          const fact = dataset.facts.find((f) => definition?.facts.includes(f.id));
          const expected =
            definition?.value ??
            (definition?.valueKey ? at(fact?.value, definition.valueKey) : fact?.value);
          const values = boolean
            ? [false, true]
            : unique([
                range![0],
                range![1],
                ...(typeof expected === 'number' ? [expected, expected - range![2]] : []),
              ]).filter((v) => typeof v === 'number' && v >= range![0] && v <= range![1]);
          const old = candidates.get(field);
          candidates.set(field, {
            label: old?.label || rule.label,
            values: unique([...(old?.values || []), ...values]),
          });
        }
      }
    }
  }
  const questions: DecisionQuestion[] = [];
  for (const [field, candidate] of candidates) {
    const branches: DecisionQuestion['branches'] = [];
    const states = new Set<string>();
    for (const value of candidate.values) {
      let future: Evaluation;
      try {
        future = evaluate(answerQuestion(profile, field, value), now);
      } catch {
        continue;
      }
      const changed: string[] = [],
        programs: string[] = [];
      for (const before of scope(current)) {
        const after = future.programs.find((r) => r.program.id === before.program.id)!;
        const ar = flatResults(after.rules);
        const resolved = flatResults(before.rules).filter(
          (r) =>
            !r.children.length &&
            r.result === 'UNKNOWN' &&
            ar.some((a) => a.id === r.id && ['PASS', 'FAIL'].includes(a.result)),
        );
        changed.push(...resolved.map((r) => r.id));
        if (resolved.length) programs.push(before.program.id);
        if (before.admission_state !== after.admission_state) states.add(before.program.id);
      }
      branches.push({ value, programs, rules: changed });
    }
    const rules = unique(branches.flatMap((b) => b.rules));
    if (!rules.length) continue;
    const range = bounds(field);
    questions.push({
      field,
      label: candidate.label,
      type: range ? 'number' : 'boolean',
      min: range?.[0],
      max: range?.[1],
      step: range?.[2],
      programs: unique(branches.flatMap((b) => b.programs)),
      rules,
      resolvedRules: rules.length,
      changedStates: states.size,
      branches,
    });
  }
  return questions.sort(
    (a, b) =>
      b.changedStates - a.changedStates ||
      b.programs.length - a.programs.length ||
      b.resolvedRules - a.resolvedRules ||
      a.field.localeCompare(b.field),
  );
}

export function buildGraph(e: Evaluation): DecisionGraph {
  const nodes = new Map<string, DecisionGraph['nodes'][number]>();
  const edges: DecisionGraph['edges'] = [];
  const edge = (from: string, to: string) => edges.push({ from, to });
  for (const result of scope(e)) {
    const program = result.program.id,
      pid = `program:${program}`;
    nodes.set(pid, {
      id: pid,
      kind: 'program',
      label: result.program.short,
      program,
      value: result.admission_state,
    });
    const visit = (r: RuleResult, parent: string) => {
      const rid = `rule:${r.id}`;
      nodes.set(rid, { id: rid, kind: 'rule', label: r.label, program, value: r.result });
      edge(rid, parent);
      for (const rawField of inputFields(r)) {
        const field =
          rawField === 'documents_ready' && e.profile.documents_by_program
            ? `documents_by_program.${program}`
            : rawField;
        const id = `input:${field}`;
        nodes.set(id, { id, kind: 'input', label: field, value: at(e.profile, field) ?? null });
        edge(id, rid);
      }
      for (const id of r.facts) {
        const fid = `fact:${id}`,
          fact = dataset.facts.find((f) => f.id === id);
        nodes.set(fid, {
          id: fid,
          kind: 'fact',
          label: fact?.statement || id,
          value: fact?.evidence,
        });
        edge(fid, rid);
      }
      r.children.forEach((c) => visit(c, rid));
    };
    result.rules.forEach((r) => visit(r, pid));
  }
  for (const task of e.roadmap) {
    const id = `task:${task.id}`;
    nodes.set(id, { id, kind: 'task', label: task.title, value: task.complete });
    // Only link rules that generate this task, not every rule of the university.
    for (const result of scope(e).filter((r) => task.programs.includes(r.program.id))) {
      for (const r of [...result.blockers, ...result.unknowns]) {
        if (
          task.id === `verify-${r.id}` ||
          task.id === `resolve-${r.id}` ||
          (r.action && (task.id === r.action || task.id === `${r.action}-${result.program.id}`))
        )
          edge(`rule:${r.id}`, id);
      }
      if (task.id === 'english-direct')
        result.rules.filter((r) => r.conditional).forEach((r) => edge(`rule:${r.id}`, id));
    }
    task.dependencies.forEach((d) => edge(`task:${d}`, id));
  }
  return {
    nodes: [...nodes.values()],
    edges: unique(edges.map((e) => JSON.stringify(e))).map((e) => JSON.parse(e)),
  };
}
export function descendants(graph: DecisionGraph, starts: string[]): string[] {
  const seen = new Set(starts),
    queue = [...starts];
  while (queue.length) {
    const current = queue.shift();
    for (const edge of graph.edges.filter((e) => e.from === current))
      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        queue.push(edge.to);
      }
  }
  return [...seen];
}

function englishBranches(rule: Rule): Rule[][] {
  if (rule.op === 'ATOM')
    return rule.field?.startsWith('ielts.') && rule.comparator === 'GTE' ? [[rule]] : [[]];
  const nested = children(rule).map(englishBranches);
  if (['ANY_OF', 'EXEMPTION', 'CONDITIONAL_PATH'].includes(rule.op))
    return nested.flat().filter((branch) => branch.length);
  return nested.reduce<Rule[][]>(
    (all, next) => all.flatMap((a) => next.map((b) => [...a, ...b])).slice(0, 12),
    [[]],
  );
}
export function candidateActions(p: Profile, now: string, e = evaluate(p, now)): FutureAction[] {
  const actions = new Map<string, FutureAction>();
  for (const result of scope(e)) {
    // Include a verified direct-English improvement even when a conditional branch passes.
    const directBlocks = result.rules.flatMap((r) =>
      r.conditional
        ? r.children.filter((c) => c.result === 'FAIL').map((c) => ({ ...c, action: 'english' }))
        : [],
    );
    const options = recourseMutations(
      { ...result, blockers: [...result.blockers, ...directBlocks] },
      p,
      dataset.facts,
    ).filter((o) => o.id !== 'english');
    if (result.blockers.some((b) => b.action === 'english') || directBlocks.length) {
      for (const branch of result.program.rules.flatMap(englishBranches).filter((b) => b.length)) {
        if (branch.some((r) => resolveFacts(r.facts, dataset.facts, p.intake).state !== 'VERIFIED'))
          continue;
        const ielts = { ...p.ielts, status: 'VALID' };
        for (const rule of branch) {
          const fact = dataset.facts.find((f) => rule.facts.includes(f.id));
          const expected =
            rule.value ?? (rule.valueKey ? at(fact?.value, rule.valueKey) : fact?.value);
          const key = rule.field!.split('.')[1] as
            'overall' | 'reading' | 'writing' | 'listening' | 'speaking';
          if (typeof expected === 'number') ielts[key] = Math.max(ielts[key] ?? 0, expected);
        }
        options.push({ id: 'english', mutation: { ielts } });
      }
    }
    for (const option of options) {
      const kind = option.id;
      if (
        ['english', 'sat', 'act'].includes(kind) &&
        p.test_willingness?.[kind === 'english' ? 'IELTS' : kind === 'sat' ? 'SAT' : 'ACT'] ===
          false
      )
        continue;
      let mutation = option.mutation;
      if (kind === 'english') {
        const ielts = { ...mutation.ielts! };
        // Targets for all bands are explicit assumptions, never actual scores.
        const bands = ['reading', 'writing', 'listening', 'speaking'] as const;
        for (const band of bands) if (ielts[band] == null) ielts[band] = ielts.overall;
        if (bands.some((b) => ielts[b] == null) || ielts.overall == null) continue;
        while (Math.round(bands.reduce((n, b) => n + ielts[b]!, 0) / 2) / 2 < ielts.overall) {
          const lowest = [...bands].sort((a, b) => ielts[a]! - ielts[b]!)[0];
          if (ielts[lowest]! >= 9) break;
          ielts[lowest] = ielts[lowest]! + 0.5;
        }
        ielts.overall = Math.round(bands.reduce((n, b) => n + ielts[b]!, 0) / 2) / 2;
        ielts.date = p.expected_score_date;
        if (!ielts.date) continue; // UI asks for explicit availability date first.
        mutation = { ielts };
      }
      if (kind === 'documents')
        mutation = {
          documents_by_program: { ...p.documents_by_program, [result.program.id]: true },
        };
      if (kind === 'sat' || kind === 'act')
        mutation = {
          [kind]: { ...p[kind], date: p.expected_score_date || p[kind].date, status: 'VALID' },
        };
      try {
        profileSchema.parse({ ...p, ...mutation });
      } catch {
        continue;
      }
      const fields = Object.entries(mutation).flatMap(([key, value]) =>
        value && typeof value === 'object'
          ? Object.keys(value)
              .filter((k) => at(p, `${key}.${k}`) !== at(mutation, `${key}.${k}`))
              .map((k) => `${key}.${k}`)
          : [key],
      );
      const id = `${kind}:${JSON.stringify(mutation)}`;
      const label =
        kind === 'english'
          ? 'Retake IELTS'
          : kind === 'sat'
            ? 'Take SAT'
            : kind === 'act'
              ? 'Take ACT'
              : kind === 'aif'
                ? 'Submit the AIF'
                : 'Prepare application documents';
      actions.set(id, {
        id,
        kind,
        label,
        fields,
        mutation,
        assumptions: fields.map((field) => ({ field, value: at(mutation, field) })),
      });
    }
  }
  return [...actions.values()].slice(0, 18);
}
function timing(
  action: FutureAction,
  result: Evaluation['programs'][number],
  p: Profile,
  now: string,
): { state: Timeline; facts: string[] } {
  if (!p.expected_score_date) return { state: 'UNKNOWN', facts: [] };
  if (p.expected_score_date < now.slice(0, 10) || result.timeline_state === 'MISSED')
    return { state: 'MISSED', facts: [] };
  const types =
    action.kind === 'english'
      ? ['ENGLISH_SCORE', 'DOCUMENT']
      : ['sat', 'act'].includes(action.kind)
        ? ['TEST_SCORE', 'DOCUMENT']
        : ['DOCUMENT'];
  const relevant = result.program.deadlines.filter(
    (d) =>
      types.includes(d.type) &&
      resolveFacts([d.fact], dataset.facts, p.intake).state === 'VERIFIED',
  );
  const selected = relevant.find((d) => d.type === types[0]) || relevant[0];
  if (!selected) return { state: 'UNKNOWN', facts: [] };
  return {
    state: timeline(selected, `${p.expected_score_date}T12:00:00Z`),
    facts: [selected.fact],
  };
}
export function simulateFuture(p: Profile, mutation: Partial<Profile>, now: string): Simulation {
  // Existing validator enforces immutable fields, budget and geography locks.
  const initial = simulate(p, mutation, now);
  const date = initial.after.profile.expected_score_date;
  const checkAt = date && date > now.slice(0, 10) ? `${date}T12:00:00Z` : now;
  const after = evaluate(initial.after.profile, checkAt);
  return { before: initial.before, after, diff: diffEvaluations(initial.before, after) };
}
const merged = (p: Profile, actions: FutureAction[]) => {
  let value: Partial<Profile> = {};
  for (const a of actions)
    value = {
      ...value,
      ...a.mutation,
      ...(a.mutation.documents_by_program
        ? {
            documents_by_program: {
              ...p.documents_by_program,
              ...value.documents_by_program,
              ...a.mutation.documents_by_program,
            },
          }
        : {}),
    };
  return value;
};
function improvements(before: Evaluation, after: Evaluation) {
  const programs: string[] = [],
    rules: string[] = [];
  for (const b of scope(before)) {
    const a = after.programs.find((r) => r.program.id === b.program.id)!;
    const ar = flatResults(a.rules);
    const changed = flatResults(b.rules).filter(
      (r) =>
        !r.children.length &&
        r.strength === 'HARD' &&
        r.result === 'FAIL' &&
        ar.some((v) => v.id === r.id && v.result === 'PASS') &&
        resolveFacts(r.facts, dataset.facts, before.profile.intake).state === 'VERIFIED',
    );
    if (changed.length) programs.push(b.program.id);
    rules.push(...changed.map((r) => r.id));
  }
  return { programs, rules };
}
export function futurePaths(
  p: Profile,
  target: string,
  now: string,
  actions = candidateActions(p, now),
): FuturePath[] {
  const current = evaluate(p, now),
    targetBefore = scope(current).find((r) => r.program.id === target);
  if (!targetBefore || targetBefore.timeline_state === 'MISSED') return [];
  // Prune actions unrelated to the selected goal before enumerating pairs.
  actions = actions.filter((action) => {
    const after = simulateFuture(p, action.mutation, now).after.programs.find(
      (r) => r.program.id === target,
    )!;
    return flatResults(targetBefore.rules).some(
      (r) =>
        r.result === 'FAIL' &&
        flatResults(after.rules).some((a) => a.id === r.id && a.result === 'PASS'),
    );
  });
  const candidates: FuturePath[] = [];
  const sequences = actions.map((a) => [a]);
  for (let i = 0; i < actions.length; i++)
    for (let j = i + 1; j < actions.length; j++)
      if (actions[i].kind !== actions[j].kind) sequences.push([actions[i], actions[j]]);
  for (const seq of sequences) {
    const times = seq.map((a) => timing(a, targetBefore, p, now));
    if (times.some((t) => t.state === 'MISSED')) continue;
    let simulation: Simulation;
    try {
      simulation = simulateFuture(p, merged(p, seq), now);
    } catch {
      continue;
    }
    const targetAfter = simulation.after.programs.find((r) => r.program.id === target)!;
    const leaves = flatResults(targetBefore.rules).filter((r) => !r.children.length);
    const after = flatResults(targetAfter.rules);
    const removed = leaves
      .filter((r) => r.result === 'FAIL' && after.some((a) => a.id === r.id && a.result === 'PASS'))
      .map((r) => r.id);
    if (!removed.length) continue;
    // Each action must contribute; otherwise a shorter equivalent path is clearer.
    if (
      seq.length === 2 &&
      seq.some((_, i) => {
        const only = simulateFuture(
          p,
          merged(
            p,
            seq.filter((_, j) => j !== i),
          ),
          now,
        ).after.programs.find((r) => r.program.id === target)!;
        return removed.every((id) =>
          flatResults(only.rules).some((r) => r.id === id && r.result === 'PASS'),
        );
      })
    )
      continue;
    candidates.push({
      id: seq.map((a) => a.id).join('|'),
      target,
      actions: seq,
      feasibility: times.some((t) => t.state === 'UNKNOWN')
        ? 'UNKNOWN'
        : times.some((t) => t.state === 'TIGHT')
          ? 'TIGHT'
          : 'FEASIBLE',
      deadlineFacts: unique(times.flatMap((t) => t.facts)),
      simulation,
      removed,
      remaining: unique([...targetAfter.blockers, ...targetAfter.unknowns].map((r) => r.id)),
    });
  }
  return candidates
    .sort(
      (a, b) =>
        Number(a.feasibility === 'UNKNOWN') - Number(b.feasibility === 'UNKNOWN') ||
        a.remaining.length - b.remaining.length ||
        Number(
          b.simulation.after.programs
            .find((r) => r.program.id === target)!
            .rules.some((r) => r.action === 'english' && r.result === 'PASS' && !r.conditional),
        ) -
          Number(
            a.simulation.after.programs
              .find((r) => r.program.id === target)!
              .rules.some((r) => r.action === 'english' && r.result === 'PASS' && !r.conditional),
          ) ||
        Number(a.simulation.after.profile.ielts.overall) -
          Number(b.simulation.after.profile.ielts.overall) ||
        b.removed.length - a.removed.length ||
        a.actions.length - b.actions.length,
    )
    .filter(
      (path, index, list) =>
        !list
          .slice(0, index)
          .some(
            (other) =>
              other.actions.length <= path.actions.length &&
              path.removed.every((id) => other.removed.includes(id)) &&
              other.feasibility === path.feasibility,
          ),
    )
    .slice(0, 3);
}
export function receipts(e: Evaluation, before?: Evaluation): DecisionReceipt[] {
  return scope(e).flatMap((result) => {
    const defs = flatRules(result.program.rules);
    return flatResults(result.rules)
      .filter((r) => !r.children.length)
      .map((rule) => {
        const def = defs.find((d) => d.id === rule.id),
          fact = dataset.facts.find((f) => def?.facts.includes(f.id));
        const expected =
          def?.value ?? (def?.valueKey ? at(fact?.value, def.valueKey) : fact?.value);
        return {
          program: result.program.id,
          rule,
          inputs: inputFields(rule).map((raw) => {
            const field =
              raw === 'documents_ready' && e.profile.documents_by_program
                ? `documents_by_program.${result.program.id}`
                : raw;
            return { field, value: at(e.profile, field) ?? null };
          }),
          expression: `${rule.field || def?.op || 'rule'} ${def?.comparator || ''} ${JSON.stringify(expected) ?? '?'}`,
          before: before
            ? flatResults(
                before.programs.find((r) => r.program.id === result.program.id)?.rules || [],
              ).find((r) => r.id === rule.id)?.result
            : undefined,
          state: result.admission_state,
          actions: unique(result.recourse.flatMap((r) => r.actions)),
        };
      });
  });
}
export function analyseLab(
  p: Profile,
  target: string,
  now: string,
  saved: SavedScenario[] = [],
): LabAnalysis {
  const evaluation = evaluate(p, now),
    actions = candidateActions(p, now, evaluation);
  const scenarios: { id: string; name: string; profile: Profile }[] = [];
  let omittedScenarios = 0;
  for (const s of saved.slice(0, 3))
    try {
      scenarios.push({
        id: s.id,
        name: s.name,
        profile: simulateFuture(p, s.mutation, now).after.profile,
      });
    } catch {
      omittedScenarios++;
    }
  const impacts: ActionImpact[] = actions
    .map((action): ActionImpact => {
      const simulated = simulateFuture(p, action.mutation, now),
        impact = improvements(evaluation, simulated.after);
      const useful = impact.programs.filter(
        (id) =>
          timing(
            action,
            evaluation.programs.find((r) => r.program.id === id)!,
            p,
            now,
          ).state !== 'MISSED',
      );
      const times = useful.map(
        (id) =>
          timing(
            action,
            evaluation.programs.find((r) => r.program.id === id)!,
            p,
            now,
          ).state,
      );
      return {
        action,
        programs: useful,
        blockers: impact.rules.filter((id) =>
          useful.some((pid) =>
            flatResults(evaluation.programs.find((r) => r.program.id === pid)!.rules).some(
              (r) => r.id === id,
            ),
          ),
        ),
        countries: unique(
          scope(evaluation)
            .filter((r) => useful.includes(r.program.id))
            .map((r) => r.program.country),
        ),
        scenarios: scenarios.flatMap((s) => {
          if (
            ['english', 'sat', 'act'].includes(action.kind) &&
            s.profile.test_willingness?.[
              action.kind === 'english' ? 'IELTS' : action.kind === 'sat' ? 'SAT' : 'ACT'
            ] === false
          )
            return [];
          try {
            const b = evaluate(
                s.profile,
                s.profile.expected_score_date && s.profile.expected_score_date > now.slice(0, 10)
                  ? `${s.profile.expected_score_date}T12:00:00Z`
                  : now,
              ),
              a = simulateFuture(s.profile, action.mutation, now).after;
            const improved = improvements(b, a).programs.filter(
              (id) =>
                timing(
                  action,
                  b.programs.find((r) => r.program.id === id)!,
                  s.profile,
                  now,
                ).state !== 'MISSED',
            );
            return improved.length ? [{ id: s.id, name: s.name, programs: improved }] : [];
          } catch {
            return [];
          }
        }),
        feasibility:
          !times.length || times.includes('UNKNOWN')
            ? 'UNKNOWN'
            : times.includes('TIGHT')
              ? 'TIGHT'
              : 'FEASIBLE',
        requiresRelaxation: false,
      };
    })
    .filter((i) => i.programs.length)
    .sort(
      (a, b) =>
        Number(a.feasibility === 'UNKNOWN') - Number(b.feasibility === 'UNKNOWN') ||
        b.scenarios.length - a.scenarios.length ||
        b.programs.length - a.programs.length ||
        b.blockers.length - a.blockers.length,
    );
  return {
    evaluation,
    questions: rankQuestions(p, now, evaluation),
    graph: buildGraph(evaluation),
    actions,
    paths: futurePaths(p, target, now, actions),
    impacts,
    receipts: receipts(evaluation),
    omittedScenarios,
  };
}

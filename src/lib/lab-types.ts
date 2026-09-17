import type { Evaluation, Profile, RuleResult, Simulation, Timeline } from './types';
export type DecisionQuestion = {
  field: string;
  label: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  programs: string[];
  rules: string[];
  changedStates: number;
  resolvedRules: number;
  branches: { value: number | boolean; programs: string[]; rules: string[] }[];
};
export type DecisionGraph = {
  nodes: {
    id: string;
    kind: 'input' | 'fact' | 'rule' | 'program' | 'task';
    label: string;
    program?: string;
    value?: unknown;
  }[];
  edges: { from: string; to: string }[];
};
export type FutureAction = {
  id: string;
  kind: string;
  label: string;
  fields: string[];
  mutation: Partial<Profile>;
  assumptions: { field: string; value: unknown }[];
};
export type FuturePath = {
  id: string;
  actions: FutureAction[];
  feasibility: Timeline;
  deadlineFacts: string[];
  simulation: Simulation;
  removed: string[];
  remaining: string[];
  target: string;
};
export type ActionImpact = {
  action: FutureAction;
  programs: string[];
  blockers: string[];
  countries: string[];
  scenarios: { id: string; name: string; programs: string[] }[];
  feasibility: Timeline;
  requiresRelaxation: boolean;
};
export type DecisionReceipt = {
  program: string;
  rule: RuleResult;
  inputs: { field: string; value: unknown }[];
  expression: string;
  before?: string;
  state: string;
  actions: string[];
};
export type LabAnalysis = {
  evaluation: Evaluation;
  graph: DecisionGraph;
  questions: DecisionQuestion[];
  actions: FutureAction[];
  paths: FuturePath[];
  impacts: ActionImpact[];
  receipts: DecisionReceipt[];
  omittedScenarios: number;
};

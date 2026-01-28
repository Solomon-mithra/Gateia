import { z } from 'zod';

export type GateOutcome = 'pass' | 'block' | 'warn' | 'rewrite';

export type PolicyAction = 'rewrite' | 'block' | 'log';

export interface Violation {
  policyId: string;
  message: string;
  severity: 'critical' | 'warn';
}

export interface PolicyContext {
  model: string;
  prompt: any;
  traceId: string;
}

export interface PolicyResult {
  outcome: GateOutcome;
  violations?: Violation[];
  rewriteFn?: (output: any) => any;
}

export interface Policy {
  id: string;
  version?: string;
  mode?: 'enforce' | 'audit';
  check: (output: any, context: PolicyContext) => PolicyResult | Promise<PolicyResult>;
}

export interface GateOptions {
  includeRawOutput?: boolean;
}

export interface GateBehavior {
  mode?: 'enforce' | 'audit';
  contract?: {
    repair?: 'off' | 'auto';
    maxRetries?: number;
    maxRepairAttempts?: number;
  };
  policy?: {
    rewrite?: 'off' | 'allowed';
  };
  onBlock?: 'throw' | 'return';
}

export interface GateParams<T extends z.ZodTypeAny> {
  model: string;
  prompt: string | { system?: string; user: string };
  contract: T;
  policies?: (string | Policy)[];
  behavior?: GateBehavior;
  options?: GateOptions;
}

export interface GateEnforcementReport {
  appliedPolicies: string[];
  contractOutcome: 'pass' | 'fail' | 'repaired';
  actions: string[];
  violations: Violation[];
}

export interface GateUsage {
  provider: string;
  model: string;
  latencyMs?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface GateResult<T> {
  safeOutput?: T;
  traceId: string;
  enforcement: GateEnforcementReport;
  usage: GateUsage;
  rawOutput?: any;
}

export class GateiaError extends Error {
  public traceId: string;
  public report?: GateEnforcementReport;
  public originalError?: unknown;

  constructor(message: string, traceId: string, report?: GateEnforcementReport, originalError?: unknown) {
    super(message);
    this.name = 'GateiaError';
    this.traceId = traceId;
    this.report = report;
    this.originalError = originalError;
  }
}

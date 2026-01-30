import { z } from 'zod';

// --- Policies ---
export type GateOutcome = 'pass' | 'block' | 'warn' | 'rewrite';

export interface PolicyAction {
  type: 'rewrite' | 'block' | 'log';
  policyId: string;
  note?: string;
}

export interface Violation {
  policyId: string;
  code: string;
  message: string;
  severity: 'low' | 'med' | 'high';
  evidence?: { snippet: string };
}

export interface PolicyContext {
  traceId: string;
  // Metadata about where the output came from, purely for logging/audit
  metadata?: Record<string, any>; 
}

export interface PolicyResult<T = any> {
  outcome: GateOutcome;
  violations?: Violation[];
  rewriteFn?: (output: T) => T;
}

export interface Policy<T = any> {
  id: string;
  version?: string;
  mode?: 'enforce' | 'audit';
  check: (output: T, context: PolicyContext) => PolicyResult<T> | Promise<PolicyResult<T>>;
}

export interface AppliedPolicyRec {
    id: string;
    version?: string;
    mode: 'enforce' | 'audit';
    outcome: GateOutcome;
    reasons?: string[];
}

// --- Contract ---
export interface ContractEnforcement {
    outcome: 'pass' | 'fail';
    errors?: { path: string; message: string }[];
}

// --- Verification ---

export interface VerifyParams<T extends z.ZodTypeAny> {
  output: unknown; // The raw output to verify (string or object)
  contract: T;
  policies?: (string | Policy<z.infer<T>>)[];
  mode?: 'enforce' | 'audit'; // Default: enforce
  options?: {
      includeRawOutput?: boolean;
  };
}

export interface EnforcementReport {
  appliedPolicies: AppliedPolicyRec[];
  contract: ContractEnforcement;
  actions: PolicyAction[];
  violations: Violation[];
}

export interface VerifyResult<T> {
  allowed: boolean;        // Main decision: true if no high-severity violations and valid contract
  safeOutput?: T;          // The validated (and possibly rewritten) output. Undefined if !allowed.
  traceId: string;
  enforcement: EnforcementReport;
  rawOutput?: any;
}

export class GateiaError extends Error {
  public traceId: string;
  public report?: EnforcementReport;
  public originalError?: unknown;

  constructor(message: string, traceId: string, report?: EnforcementReport, originalError?: unknown) {
    super(message);
    this.name = 'GateiaError';
    this.traceId = traceId;
    this.report = report;
    this.originalError = originalError;
  }
}

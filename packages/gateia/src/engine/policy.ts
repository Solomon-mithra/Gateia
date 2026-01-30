import { z } from 'zod';
import { Policy, PolicyResult, GateOutcome, Violation, PolicyContext, GateiaError } from '../types';

// Runtime schema to validate Policy returns (Defense against bad JS)
const ViolationSchema = z.object({
    policyId: z.string(),
    code: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'med', 'high']),
    evidence: z.object({ snippet: z.string() }).optional()
});

const PolicyResultSchema = z.object({
    outcome: z.enum(['pass', 'block', 'warn', 'rewrite']),
    violations: z.array(ViolationSchema).optional(),
    rewriteFn: z.function().optional()
});

export class PolicyEngine {
  async evaluate(
    policies: Policy[],
    output: any,
    context: PolicyContext
  ): Promise<{ outcome: GateOutcome; violations: Violation[]; rewrittenOutput?: any }> {
    const violations: Violation[] = [];
    let currentOutput = output;
    let finalOutcome: GateOutcome = 'pass';
    let hasRewrite = false;

    // Policies are applied in order
    for (const policy of policies) {
      // Execute Policy
      const rawResult = await policy.check(currentOutput, context);
      
      // FATAL: Runtime Validation of Policy Result
      // If the user made a typo (e.g. 'outcomee') or forgot severity, we MUST crash/alert.
      const parse = PolicyResultSchema.safeParse(rawResult);
      if (!parse.success) {
          throw new GateiaError(
              `Invalid Policy Result from '${policy.id}': ${parse.error.issues.map(i => i.path.join('.') + ' ' + i.message).join(', ')}`, 
              context.traceId
          );
      }

      const result = parse.data as PolicyResult; // safe now
      
      // If violations, add them
      if (result.violations) {
          violations.push(...result.violations);
      }

      // Determine outcome
      if (result.outcome === 'block') {
         if (policy.mode === 'audit') {
             // In audit mode, we just record violation but don't block
             // But we do NOT change the final outcome to block
         } else {
             finalOutcome = 'block';
             // If we block, we stop processing rewrites? Maybe continue to find all violations?
             // Usually best to fail fast OR collect all.
             // Let's collect all violations but stop rewrites.
         }
      } else if (result.outcome === 'rewrite') {
         // Re-attach the function from raw result because Zod strips functions sometimes or we just want the original reference
         // Actually Zod schema above allows function pass-through if configured, but let's be safe:
         if (rawResult.rewriteFn && policy.mode !== 'audit') {
             currentOutput = rawResult.rewriteFn(currentOutput);
             hasRewrite = true;
         }
      }
    }
    
    return {
      outcome: finalOutcome,
      violations,
      rewrittenOutput: hasRewrite ? currentOutput : undefined
    };
  }
}

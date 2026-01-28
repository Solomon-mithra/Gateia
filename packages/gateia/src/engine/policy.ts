import { Policy, PolicyResult, GateOutcome, Violation, PolicyContext } from '../types';

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
      if (policy.mode === 'audit' || (policy.mode !== 'enforce' && policy.mode !== 'audit')) {
        // Default to audit if not specified? Or enforce? 
        // User requirements say "Policy interface: mode: enforce|audit"
        // Let's assume default is 'enforce' if not present in policy object, 
        // BUT the policy object itself has a mode.
        // Actually, the `gate` call has behavior.mode too.
        // We will respect policies' own mode property.
      }

      const result = await policy.check(currentOutput, context);
      
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
         if (result.rewriteFn && policy.mode !== 'audit') {
             currentOutput = result.rewriteFn(currentOutput);
             hasRewrite = true;
             // If it was pass but now rewrite, outcome is pass (with rewrite)
         } else if (policy.mode === 'audit') {
            // record that it WOULD have rewritten
         }
      }
    }

    // If any blocking violation occurred (non-audit), result is block
    // We need to filter violations to check if any critical/enforced ones exist
    // Actually simplicity: if `finalOutcome` was set to 'block', return block.
    
    return {
      outcome: finalOutcome,
      violations,
      rewrittenOutput: hasRewrite ? currentOutput : undefined
    };
  }
}

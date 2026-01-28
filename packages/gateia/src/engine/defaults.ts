import { Policy, GateOutcome } from '../types';

export const predefinedPolicies: Record<string, Policy> = {
  'finance-safe': {
    id: 'finance-safe',
    mode: 'enforce',
    check: (output: any) => {
      const text = typeof output === 'string' ? output : JSON.stringify(output);
      if (text.toLowerCase().includes('guaranteed returns')) {
        // block "guaranteed returns"
        return {
           outcome: 'block', 
           violations: [{ policyId: 'finance-safe', message: 'Contains forbidden phrase: "guaranteed returns"', severity: 'critical' }]
        };
      }
      return { outcome: 'pass' };
    }
  },
  'no-hallucinations': {
      id: 'no-hallucinations',
      mode: 'audit',
      check: () => ({ outcome: 'pass' }) // Placeholder
  }
};

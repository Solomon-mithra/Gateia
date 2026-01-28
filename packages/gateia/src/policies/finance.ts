import { Policy, Violation } from '../types';

export const financeSafe: Policy = {
    id: 'finance-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        const lower = text.toLowerCase();
        
        // Block guarantees
        const forbidden = [
            'guaranteed refund',
            'guaranteed return', 
            'guaranteed approval',
            'no risk',
            '100% guaranteed'
        ];

        const match = forbidden.find(phrase => lower.includes(phrase));
        if (match) {
            return {
                outcome: 'block',
                violations: [{
                    policyId: 'finance-safe',
                    code: 'FIN_GUARANTEE',
                    message: `Contains forbidden guarantee language: "${match}"`,
                    severity: 'high',
                    evidence: { snippet: match }
                }]
            };
        }
        return { outcome: 'pass' };
    }
};

// Delegate alias
export const supportSafe = { ...financeSafe, id: 'support-safe' };

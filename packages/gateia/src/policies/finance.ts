import { Policy, Violation } from '../types';

export const financeSafe: Policy = {
    id: 'finance-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        const lower = text.toLowerCase();

        // Block guarantees and absolute assurances (expanded patterns)
        const forbiddenPhrases = [
            'guaranteed refund',
            'guaranteed return',
            'guaranteed approval',
            'guaranteed payout',
            'guaranteed profit',
            'guaranteed results',
            'risk free',
            'risk-free',
            'no risk',
            'zero risk',
            '100% guaranteed',
            'one hundred percent guaranteed',
            'we will always refund',
            'we always refund',
            'instant refund',
            'automatic refund',
            'refund assured',
            'money back guaranteed',
            'guaranteed money back'
        ];

        const forbiddenRegexes = [
            /\bguarantee(?:d|s|ing)?\b.{0,24}\b(refund|return|approval|payout|profit|results)\b/i,
            /\b(refund|return|approval|payout|profit|results)\b.{0,24}\bguarantee(?:d|s|ing)?\b/i,
            /\b100\s*%|\b100\s*percent|\b100\s*per\s*cent/i,
            /\bno\s+risk\b|\bzero\s+risk\b|\brisk[-\s]?free\b/i,
            /\b(always|never)\b.{0,24}\brefund\b/i
        ];

        const phraseMatch = forbiddenPhrases.find(phrase => lower.includes(phrase));
        const regexMatch = forbiddenRegexes.find(regex => regex.test(text));

        if (phraseMatch || regexMatch) {
            return {
                outcome: 'block',
                violations: [{
                    policyId: 'finance-safe',
                    code: 'FIN_GUARANTEE',
                    message: `Contains forbidden guarantee language: "${phraseMatch ?? 'regex-match'}"`,
                    severity: 'high',
                    evidence: { snippet: phraseMatch ?? 'regex-match' }
                }]
            };
        }
        return { outcome: 'pass' };
    }
};

// Delegate alias
export const supportSafe = { ...financeSafe, id: 'support-safe' };

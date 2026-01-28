import { Policy } from '../types';

export const markupSafe: Policy = {
    id: 'markup-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        const lower = text.toLowerCase();
        
        // Dangerous HTML/Script patterns
        const patterns = [
            { name: 'Script Tag', regex: /<script[\s\S]*?>/i },
            { name: 'Iframe Tag', regex: /<iframe[\s\S]*?>/i },
            { name: 'Object Tag', regex: /<object[\s\S]*?>/i },
            { name: 'Javascript Protocol', regex: /javascript:/i }
        ];

        const violations = [];
        
        for (const pattern of patterns) {
            if (pattern.regex.test(text)) {
                violations.push({
                    policyId: 'markup-safe',
                    code: 'UNSAFE_MARKUP',
                    message: `Unsafe markup detected: ${pattern.name}`,
                    severity: 'high' as const,
                    evidence: { snippet: pattern.regex.source }
                });
            }
        }

        if (violations.length > 0) {
            return { outcome: 'block', violations };
        }
        return { outcome: 'pass' };
    }
};

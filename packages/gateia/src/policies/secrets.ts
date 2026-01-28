import { Policy } from '../types';

export const secretsSafe: Policy = {
    id: 'secrets-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        
        // Common patterns for API keys and secrets
        const patterns = [
            { name: 'OpenAI Key', regex: /sk-[a-zA-Z0-9]{20,}/ },
            { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
            { name: 'Generic Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
            { name: 'GitHub Token', regex: /ghp_[a-zA-Z0-9]{36}/ }
        ];

        const violations = [];
        
        for (const pattern of patterns) {
            if (pattern.regex.test(text)) {
                violations.push({
                    policyId: 'secrets-safe',
                    code: 'SECRET_DETECTED',
                    message: `Potential ${pattern.name} detected`,
                    severity: 'high' as const,
                    evidence: { snippet: 'REDACTED_SECRET' } // Never show the secret
                });
            }
        }

        if (violations.length > 0) {
            return { outcome: 'block', violations };
        }
        return { outcome: 'pass' };
    }
};

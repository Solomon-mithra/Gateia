import { Policy } from '../types';

export const secretsSafe: Policy = {
    id: 'secrets-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        
        // Common patterns for API keys and secrets
        const patterns = [
            { name: 'OpenAI Key', regex: /\bsk-[a-zA-Z0-9]{20,}\b/ },
            { name: 'AWS Access Key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
            { name: 'AWS Secret Key', regex: /\b(?:aws|amazon)?[_-]?secret[_-]?access[_-]?key\b.{0,20}[A-Za-z0-9\/+=]{40}\b/i },
            { name: 'Generic Private Key', regex: /-----BEGIN (?:RSA|EC|DSA|PGP)? ?PRIVATE KEY-----/ },
            { name: 'GitHub Token', regex: /\bghp_[a-zA-Z0-9]{36}\b/ },
            { name: 'GitHub Fine-grained Token', regex: /\bgithub_pat_[a-zA-Z0-9_]{82}\b/ },
            { name: 'Slack Token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
            { name: 'Stripe Secret Key', regex: /\bsk_live_[A-Za-z0-9]{24}\b/ },
            { name: 'Stripe Restricted Key', regex: /\brk_live_[A-Za-z0-9]{24}\b/ },
            { name: 'Twilio API Key', regex: /\bSK[0-9a-fA-F]{32}\b/ },
            { name: 'Mailgun API Key', regex: /\bkey-[0-9a-fA-F]{32}\b/ },
            { name: 'Google API Key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
            { name: 'JWT', regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ }
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

import { Policy } from '../types';

export const piiSafe: Policy = {
    id: 'pii-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        
        // Simple regex patterns (for MVP)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/; // US-centric simple

        const violations = [];
        
        if (emailRegex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_EMAIL',
                message: 'Email address detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'email-detected-redacted' }
            });
        }

        if (phoneRegex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_PHONE',
                message: 'Phone number detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'phone-detected-redacted' }
            });
        }

        if (violations.length > 0) {
            return { outcome: 'block', violations };
        }
        return { outcome: 'pass' };
    }
};

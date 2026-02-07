import { Policy } from '../types';

export const piiSafe: Policy = {
    id: 'pii-safe',
    mode: 'enforce',
    check: (output: any) => {
        const text = typeof output === 'string' ? output : JSON.stringify(output);
        
        // Expanded regex patterns (still heuristic)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegexUS = /\b(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/;
        const phoneRegexIntl = /\b\+?\d{1,3}[\s.-]?(?:\d{1,4}[\s.-]?){2,4}\d\b/;
        const ssnRegex = /\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/;
        const creditCardRegex = /\b(?:\d[ -]*?){13,19}\b/;
        const ipV4Regex = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/;
        const ipV6Regex = /\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\b/;
        const dobRegex = /\b(?:19|20)\d{2}[-\/](?:0?[1-9]|1[0-2])[-\/](?:0?[1-9]|[12]\d|3[01])\b/; // YYYY-MM-DD or YYYY/MM/DD

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

        if (phoneRegexUS.test(text) || phoneRegexIntl.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_PHONE',
                message: 'Phone number detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'phone-detected-redacted' }
            });
        }
        
        if (ssnRegex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_SSN',
                message: 'SSN detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'ssn-detected-redacted' }
            });
        }

        if (creditCardRegex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_CREDIT_CARD',
                message: 'Credit card number detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'cc-detected-redacted' }
            });
        }

        if (ipV4Regex.test(text) || ipV6Regex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_IP',
                message: 'IP address detected in output',
                severity: 'med' as const,
                evidence: { snippet: 'ip-detected-redacted' }
            });
        }

        if (dobRegex.test(text)) {
            violations.push({
                policyId: 'pii-safe',
                code: 'PII_DOB',
                message: 'Date of birth detected in output',
                severity: 'high' as const,
                evidence: { snippet: 'dob-detected-redacted' }
            });
        }

        if (violations.length > 0) {
            return { outcome: 'block', violations };
        }
        return { outcome: 'pass' };
    }
};

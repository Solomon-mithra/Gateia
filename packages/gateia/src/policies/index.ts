import { financeSafe, supportSafe } from './finance';
import { piiSafe } from './pii';
import { secretsSafe } from './secrets';
import { markupSafe } from './markup';
import { Policy } from '../types';

// Registry of all built-in policies
export const policyLibrary: Record<string, Policy> = {
    'finance-safe': financeSafe,
    'support-safe': supportSafe,
    'pii-safe': piiSafe,
    'secrets-safe': secretsSafe,
    'markup-safe': markupSafe
};

export * from './finance';
export * from './pii';
export * from './secrets';
export * from './markup';

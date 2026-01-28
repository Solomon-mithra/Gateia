import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gate } from '../src/index';
import { z } from 'zod';
import { GateiaError } from '../src/types';

describe('gate() integration', () => {
    beforeEach(() => {
        process.env.GATEIA_MOCK_ADAPTERS = 'true';
        process.env.OPENAI_API_KEY = 'mock'; // needed to pass "missing creds" check
    });

    it('validates contract successfully (mock)', async () => {
        // Mock adapter returns { mock: 'output' } by default in my stub
        // Let's use a schema that matches it
        const schema = z.object({ mock: z.string() });
        
        const result = await gate({
            model: 'gpt-4',
            prompt: 'test',
            contract: schema
        });
        
        expect(result.safeOutput).toEqual({ mock: 'output' });
        expect(result.traceId).toBeDefined();
        expect(result.enforcement.contractOutcome).toBe('pass');
    });

    it('blocks on policy violation', async () => {
        // We need the adapter to return "guaranteed returns"
        // Since my stub is hardcoded, I can't easily change the return value without better mocking.
        // I should have made the AdapterRegistry mockable or the adapter itself more flexible.
        // But for this MVP step, I can just rely on the fact that I can't easily force the mock adapter to fail policy 
        // UNLESS I change the stub to return strictly what I want via some side channel, 
        // OR I mock the 'registry.getAdapter' call.
        
        // I will rely on Vitest capabilities to mock the module if I can, but integration tests usually mock boundaries.
        // Let's define a custom policy that fails on the *default* mock output "mock: output".
        
        const failPolicy = {
            id: 'no-mock',
            mode: 'enforce' as const,
            check: (out: any) => JSON.stringify(out).includes('mock') ? { outcome: 'block' as const, violations: [{ policyId: 'no-mock', message: 'no mocks allowed', severity: 'critical' as const }] } : { outcome: 'pass' as const }
        };

        await expect(gate({
            model: 'gpt-4',
            prompt: 'test',
            contract: z.any(),
            policies: [failPolicy]
        })).rejects.toThrow("Policy Blocked Response");
    });
});

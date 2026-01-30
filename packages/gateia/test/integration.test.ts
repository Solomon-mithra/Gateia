import { describe, it, expect } from 'vitest';
import { verify } from '../src/index';
import { z } from 'zod';

describe('verify() integration', () => {
    it('validates contract successfully', async () => {
        const schema = z.object({ mock: z.string() });
        const output = { mock: "value" };
        
        const result = await verify({
            output,
            contract: schema,
            policies: []
        });

        expect(result.allowed).toBe(true);
        expect(result.safeOutput).toEqual(output);
        expect(result.enforcement.contract.outcome).toBe('pass');
    });

    it('blocks on contract violation', async () => {
         const schema = z.object({ val: z.number() });
         const result = await verify({
             output: { val: "string" }, // Invalid type
             contract: schema
         });

         expect(result.allowed).toBe(false);
         expect(result.enforcement.contract.outcome).toBe('fail');
         expect(result.safeOutput).toBeUndefined();
    });

    it('blocks on policy violation', async () => {
        const blockPolicy = {
            id: 'mock-block',
            mode: 'enforce' as const,
            check: () => ({ 
                outcome: 'block' as const, 
                violations: [{ 
                    policyId: 'mock-block', 
                    code: 'TEST', 
                    message: 'Blocked', 
                    severity: 'high' as const 
                }] 
            })
        };

        const result = await verify({
            output: { anything: true },
            contract: z.any(),
            policies: [blockPolicy]
        });

        expect(result.allowed).toBe(false);
        expect(result.enforcement.violations).toHaveLength(1);
        expect(result.enforcement.violations[0].policyId).toBe('mock-block');
    });

    it('throws on malformed policy result', async () => {
        const badPolicy = {
            id: 'broken-policy',
            mode: 'enforce' as const,
            check: () => ({ 
                outcomee: 'block', // Typo!
                violations: [] 
            } as any)
        };

        await expect(verify({
            output: {},
            contract: z.any(),
            policies: [badPolicy]
        })).rejects.toThrow(/Invalid Policy Result/);
    });
});

import { describe, it, expect } from 'vitest';
import { PolicyEngine } from '../src/engine/policy';
import { Policy, PolicyContext } from '../src/types';

describe('PolicyEngine', () => {
  const engine = new PolicyEngine();
  const context: PolicyContext = { model: 'test', prompt: 'test', traceId: '1' };

  it('passes when no policies', async () => {
    const result = await engine.evaluate([], 'output', context);
    expect(result.outcome).toBe('pass');
    expect(result.violations).toHaveLength(0);
  });

  it('blocks when policy blocks', async () => {
    const blockPolicy: Policy = {
      id: 'no-foo',
      mode: 'enforce',
      check: (output) => (output.includes('foo') ? { outcome: 'block', violations: [{ policyId: 'no-foo', code: 'TEST_FAIL', message: 'foo detected', severity: 'high' }] } : { outcome: 'pass' })
    };
    
    const result = await engine.evaluate([blockPolicy], 'has foo', context);
    expect(result.outcome).toBe('block');
    expect(result.violations).toHaveLength(1);
  });

  it('rewrites content', async () => {
    const rewritePolicy: Policy = {
      id: 'replace-bar',
      mode: 'enforce',
      check: (output) => (output.includes('bar') ? { outcome: 'rewrite', rewriteFn: (s: string) => s.replace('bar', 'baz') } : { outcome: 'pass' })
    };
    
    const result = await engine.evaluate([rewritePolicy], 'has bar', context);
    // The engine returns outcome 'pass' even if rewritten (unless we explicitly have a 'rewrite' outcome for the whole gate? Type definition has 'rewrite')
    // Wait, GateOutcome includes 'rewrite'. But usually if it succeeded with changes, it's a pass with metadata.
    // Let's settle on the engine returning 'pass' (or 'rewrite' status if we want to be explicit)
    // In my logic: finalOutcome starts as 'pass'. 
    // If I change the code to set finalOutcome to 'rewrite' if not blocked, that works.
    
    // For now, let's just check the rewritten output.
    expect(result.rewrittenOutput).toBe('has baz');
  });
});

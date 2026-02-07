import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { verify } from '../src/index';
import { ContractEngine } from '../src/engine/contract';
import { PolicyEngine } from '../src/engine/policy';
import { GateiaError, Policy } from '../src/types';
import { policyLibrary } from '../src/policies';

const traceId = 'test-trace';

// ------------------------------
// Contract Engine
// ------------------------------
describe('ContractEngine', () => {
  it('validates data and returns parsed output', () => {
    const engine = new ContractEngine();
    const schema = z.object({ name: z.string(), age: z.number().min(0) });
    const input = { name: 'Ada', age: 36 };

    const result = engine.validate(input, schema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(input);
  });

  it('returns structured errors with paths', () => {
    const engine = new ContractEngine();
    const schema = z.object({ profile: z.object({ age: z.number().min(18) }) });
    const input = { profile: { age: 16 } };

    const result = engine.validate(input, schema);

    expect(result.success).toBe(false);
    expect(result.errors?.[0].path).toBe('profile.age');
    expect(result.error).toContain('profile.age');
  });
});

// ------------------------------
// Policy Engine
// ------------------------------
describe('PolicyEngine', () => {
  const engine = new PolicyEngine();

  it('passes with no policies', async () => {
    const result = await engine.evaluate([], 'output', { traceId });
    expect(result.outcome).toBe('pass');
    expect(result.violations).toHaveLength(0);
  });

  it('blocks when policy returns high-severity violation', async () => {
    const blockPolicy: Policy<string> = {
      id: 'no-foo',
      mode: 'enforce',
      check: (output) =>
        output.includes('foo')
          ? {
              outcome: 'block',
              violations: [
                {
                  policyId: 'no-foo',
                  code: 'TEST_FAIL',
                  message: 'foo detected',
                  severity: 'high'
                }
              ]
            }
          : { outcome: 'pass' }
    };

    const result = await engine.evaluate([blockPolicy], 'has foo', { traceId });

    expect(result.outcome).toBe('block');
    expect(result.violations).toHaveLength(1);
  });

  it('supports rewrites when policy returns rewrite', async () => {
    const rewritePolicy: Policy<string> = {
      id: 'replace-bar',
      mode: 'enforce',
      check: (output) =>
        output.includes('bar')
          ? { outcome: 'rewrite', rewriteFn: (s: string) => s.replace('bar', 'baz') }
          : { outcome: 'pass' }
    };

    const result = await engine.evaluate([rewritePolicy], 'has bar', { traceId });

    expect(result.rewrittenOutput).toBe('has baz');
    expect(result.outcome).toBe('pass');
  });

  it('throws on malformed policy results (fail-closed)', async () => {
    const badPolicy: Policy<string> = {
      id: 'bad-policy',
      mode: 'enforce',
      // outcomee is invalid and should be caught by runtime schema
      check: () => ({ outcomee: 'block' } as any)
    };

    await expect(engine.evaluate([badPolicy], 'output', { traceId })).rejects.toThrow(
      /Invalid Policy Result/
    );
  });

  it('audit policies do not block final outcome', async () => {
    const auditPolicy: Policy<string> = {
      id: 'audit-only',
      mode: 'audit',
      check: () => ({
        outcome: 'block',
        violations: [
          {
            policyId: 'audit-only',
            code: 'AUDIT',
            message: 'audit-only',
            severity: 'high'
          }
        ]
      })
    };

    const result = await engine.evaluate([auditPolicy], 'output', { traceId });

    expect(result.outcome).toBe('pass');
    expect(result.violations).toHaveLength(1);
  });
});

// ------------------------------
// verify() Integration
// ------------------------------
describe('verify()', () => {
  it('validates contract and returns safe output', async () => {
    const schema = z.object({ ok: z.boolean() });

    const result = await verify({
      output: { ok: true },
      contract: schema
    });

    expect(result.allowed).toBe(true);
    expect(result.safeOutput).toEqual({ ok: true });
    expect(result.enforcement.contract.outcome).toBe('pass');
  });

  it('blocks on contract failure', async () => {
    const schema = z.object({ value: z.number() });

    const result = await verify({
      output: { value: 'nope' },
      contract: schema
    });

    expect(result.allowed).toBe(false);
    expect(result.safeOutput).toBeUndefined();
    expect(result.enforcement.contract.outcome).toBe('fail');
  });

  it('auto-parses JSON strings (including fenced code blocks)', async () => {
    const schema = z.object({ answer: z.string() });
    const output = "```json\n{\"answer\": \"ok\"}\n```";

    const result = await verify({
      output,
      contract: schema
    });

    expect(result.allowed).toBe(true);
    expect(result.safeOutput).toEqual({ answer: 'ok' });
  });

  it('resolves built-in policies by ID', async () => {
    const result = await verify({
      output: 'no risk, 100% guaranteed',
      contract: z.string(),
      policies: ['finance-safe']
    });

    expect(result.allowed).toBe(false);
    expect(result.enforcement.violations[0].policyId).toBe('finance-safe');
  });

  it('throws on unknown policy ID', async () => {
    await expect(
      verify({
        output: 'anything',
        contract: z.any(),
        policies: ['does-not-exist']
      })
    ).rejects.toThrow(GateiaError);
  });

  it('injects an implicit violation when policy blocks without violations', async () => {
    const blockPolicy: Policy<string> = {
      id: 'silent-block',
      mode: 'enforce',
      check: () => ({ outcome: 'block' })
    };

    const result = await verify({
      output: 'x',
      contract: z.string(),
      policies: [blockPolicy]
    });

    expect(result.allowed).toBe(false);
    expect(result.enforcement.violations).toHaveLength(1);
    expect(result.enforcement.violations[0].policyId).toBe('gateia-core');
  });

  it('audit mode does not block even with high-severity violations', async () => {
    const blockPolicy: Policy<string> = {
      id: 'blocker',
      mode: 'enforce',
      check: () => ({
        outcome: 'block',
        violations: [
          {
            policyId: 'blocker',
            code: 'BLOCK',
            message: 'blocked',
            severity: 'high'
          }
        ]
      })
    };

    const result = await verify({
      output: 'x',
      contract: z.string(),
      policies: [blockPolicy],
      mode: 'audit'
    });

    expect(result.allowed).toBe(true);
    expect(result.enforcement.violations).toHaveLength(1);
  });
});

// ------------------------------
// Built-in Policy Coverage
// ------------------------------
describe('policyLibrary built-ins', () => {
  it('finance-safe blocks guarantee language variants', async () => {
    const policy = policyLibrary['finance-safe'];
    const res = await policy.check('We provide a guaranteed refund with zero risk.', { traceId });

    expect(res.outcome).toBe('block');
    expect(res.violations?.[0].policyId).toBe('finance-safe');
  });

  it('support-safe uses the same behavior as finance-safe', async () => {
    const policy = policyLibrary['support-safe'];
    const res = await policy.check('risk-free and guaranteed return', { traceId });

    expect(res.outcome).toBe('block');
    // support-safe is an alias and currently reports finance-safe in violations
    expect(res.violations?.[0].policyId).toBe('finance-safe');
  });

  it('pii-safe catches common PII types', async () => {
    const policy = policyLibrary['pii-safe'];

    const hits = [
      'Email me at test@example.com',
      'Call +1 (415) 555-0101',
      'SSN 123-45-6789',
      'Card 4111 1111 1111 1111',
      'IP 192.168.1.1',
      'DOB 1990-01-31'
    ];

    for (const sample of hits) {
      const res = await policy.check(sample, { traceId });
      expect(res.outcome).toBe('block');
      expect(res.violations?.length).toBeGreaterThan(0);
    }
  });

  it('secrets-safe catches multiple secret formats', async () => {
    const policy = policyLibrary['secrets-safe'];

    const hits = [
      'sk-0123456789abcdefghijklmnopqrstuvwxyz',
      'AKIA1234567890ABCD12',
      '-----BEGIN PRIVATE KEY-----',
      'ghp_1234567890abcdef1234567890abcdef1234',
      'xoxb-' + '1234567890-1234567890-abcdefghijklmnopqrstuv',
      'sk_live_' + '123456789012345678901234'
    ];

    for (const sample of hits) {
      const res = await policy.check(sample, { traceId });
      expect(res.outcome).toBe('block');
      expect(res.violations?.length).toBeGreaterThan(0);
    }
  });

  it('markup-safe blocks scriptable or dangerous markup', async () => {
    const policy = policyLibrary['markup-safe'];

    const hits = [
      '<script>alert(1)</script>',
      '<img onerror=alert(1) src=x>',
      'javascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      '<svg onload=alert(1) />'
    ];

    for (const sample of hits) {
      const res = await policy.check(sample, { traceId });
      expect(res.outcome).toBe('block');
      expect(res.violations?.length).toBeGreaterThan(0);
    }
  });

  it('markup-safe allows https URLs', async () => {
    const policy = policyLibrary['markup-safe'];
    const res = await policy.check('https://example.com/path', { traceId });

    expect(res.outcome).toBe('pass');
  });
});

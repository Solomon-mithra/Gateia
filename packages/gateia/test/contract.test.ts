import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ContractEngine } from '../src/engine/contract';

describe('ContractEngine', () => {
  const engine = new ContractEngine();
  const schema = z.object({
    name: z.string(),
    age: z.number().min(0),
  });

  it('validates correct data', () => {
    const data = { name: 'Alice', age: 30 };
    const result = engine.validate(data, schema);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('fails on invalid data', () => {
    const data = { name: 'Bob', age: -5 };
    const result = engine.validate(data, schema);
    expect(result.success).toBe(false);
    expect(result.error).toContain('age: Number must be greater than or equal to 0');
  });

  it('fails on type mismatch', () => {
    const data = { name: 123, age: 30 };
    const result = engine.validate(data, schema);
    expect(result.success).toBe(false);
    expect(result.error).toContain('name: Expected string, received number');
  });
});

# Gateia

**The Trust Layer for AI in Production.**

Gateia is a TypeScript-first SDK that sits between your application and LLMs. It enforces structured contracts (Zod), applies compliance policies, and provides detailed enforcement reports.

It is NOT an orchestration framework. It is a trust middleware.

## Features

- **Model Routing**: Unified API for OpenAI, Gemini, and others.
- **Contract Enforcement**: Validators ensures outputs match your Zod schemas. Auto-repair loop included.
- **Policy Engine**: Deterministic rules to block or rewrite unsafe content.
- **Enforcement Reporting**: Every call returns a traceId and a full report of what happened.

## Quickstart

```bash
npm install gateia zod
```

```typescript
import { gate } from "gateia";
import { z } from "zod";

const RefundSchema = z.object({
  valid: z.boolean(),
  reason: z.string(),
  refund_amount: z.number().max(500)
});

const result = await gate({
  model: "gpt-4.1",
  prompt: "Analyze this refund request against policy...", 
  contract: RefundSchema,
  policies: ["support-safe"]
});

console.log(result.safeOutput);
// { valid: true, reason: "Item damaged in transit", refund_amount: 49.99 }

console.log(result.enforcement.appliedPolicies); 
// [{ id: 'finance-safe', outcome: 'pass' }]

console.log(result.traceId);
// "uuid..."
```

## Configuration

Set environment variables for providers:
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

To test without real keys (Mock Mode):
```env
GATEIA_MOCK_ADAPTERS=true
```

## API Reference

### `gate(params)`

- `model`: Model identifier (e.g., `gpt-4`, `gemini-pro`).
- `prompt`: String or chat object.
- `contract`: Zod schema.
- `policies`: Array of policy IDs (strings) or Policy objects.
- `behavior`: Logic for repair, retries, and blocking.

**Returns:** `Promise<GateResult<T>>`

```typescript
type GateResult<T> = {
  safeOutput?: T;                 // Type-safe validated output
  traceId: string;                // Unique ID for this request
  
  enforcement: {
    appliedPolicies: Array<{
      id: string;
      mode: "enforce" | "audit";
      outcome: "pass" | "warn" | "block";
      reasons?: string[];
    }>;
    
    contract: {
      outcome: "pass" | "fail" | "repaired";
      errors?: Array<{ path: string; message: string }>;
    };
    
    actions: Array<{ type: "rewrite" | "block"; policyId?: string; }>;
    violations: Array<{ 
      policyId: string; 
      code: string; 
      severity: "low"|"med"|"high"; 
      message: string; 
    }>;
  };

  usage: {
    model: string;
    provider: string;
    latencyMs: number;
    tokens?: { prompt: number; completion: number; total: number };
    costUsd?: number;
  };
};
```

### Policies

## Policy Library

Gateia comes with a set of built-in policies you can use immediately.

| Policy ID | Function | Checks For | Outcome |
|-----------|----------|------------|---------|
| **`finance-safe`** | Financial Compliance | "Guaranteed returns", "No risk", "Guaranteed approval", "100% guaranteed" | `BLOCK` |
| **`support-safe`** | Support Safety (Alias) | Same as above. Useful for refund processing agents. | `BLOCK` |
| **`pii-safe`** | Data Privacy | Email addresses (`x@y.com`), Phone numbers (Format: `123-456-7890`) | `BLOCK` |
| **`secrets-safe`** | Security | API Keys (OpenAI, AWS, GitHub), Private Keys | `BLOCK` |
| **`markup-safe`** | XSS Prevention | `<script>`, `<iframe>`, `javascript:` URIs | `BLOCK` |

### Custom Policies
```typescript
import { gate, Policy } from 'gateia';

// 1. Define your custom policy
const noCompetitors: Policy = {
  id: 'no-competitors',
  mode: 'enforce', // 'audit' to just warn
  check: (output) => {
    // output is strict typed from your Contract (or string if simple)
    const text = JSON.stringify(output).toLowerCase();
    
    if (text.includes('acme corp')) {
        return {
           outcome: 'block',
           violations: [{
               policyId: 'no-competitors',
               code: 'COMPETITOR_MENTION',
               message: 'Mentioned competitor Acme Corp',
               severity: 'high',
               evidence: { snippet: 'acme corp' }
           }]
        };
    }
    return { outcome: 'pass' };
  }
};

// 2. Use it in the gate
await gate({
  model: 'gpt-4',
  prompt: 'Who is the best provider?',
  contract: z.string(),
  policies: ['finance-safe', noCompetitors] // Mix built-in ID strings and custom objects
});
```

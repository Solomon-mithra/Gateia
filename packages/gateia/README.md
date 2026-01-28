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

const LoanSchema = z.object({
  approved: z.boolean(),
  reason: z.string(),
  risk_score: z.number()
});

const result = await gate({
  model: "gpt-4.1",
  prompt: "Evaluate this loan application... [App Data]",
  contract: LoanSchema,
  policies: ["finance-safe", "no-hallucinations"]
});

console.log(result.safeOutput);
// { approved: true, reason: "...", risk_score: 10 }

console.log(result.enforcement.appliedPolicies); 
// ['finance-safe', 'no-hallucinations']

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

### Policies

Gateia includes built-in policies:
- `finance-safe`: Blocks "guaranteed returns".
- `no-hallucinations`: (Audit only) Placeholder for hallucination checks.

You can define custom policies:
```typescript
{
  id: "my-policy",
  mode: "enforce",
  check: (output) => {
    if (output.includes("bad word")) {
      return { outcome: "block", violations: [...] };
    }
    return { outcome: "pass" };
  }
}
```

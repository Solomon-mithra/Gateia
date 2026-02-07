# Gateia

<div align="center">


**The Deterministic Verification Layer for Enterprise AI.**

[![npm version](https://img.shields.io/npm/v/gateia.svg?style=flat-square)](https://www.npmjs.com/package/gateia)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg?style=flat-square)]()
[![Type Safety](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square)]()

</div>

---

**Gateia** is a deterministic verification layer for AI applications. It acts as a final, immutable security gate between your models and your customers.

Unlike "AI-judging-AI" solutions, Gateia enforces **strict, code-based contracts** and deterministic policies that block known unsafe patterns—regardless of the underlying model (OpenAI, Anthropic, or Llama).

## 🚀 Why Gateia?

In production, **probability is a liability.** Gateia restores deterministic control.

*   **🛡️ Deterministic Verification**: Gateia does not use LLMs to verify. It uses deterministic logic and regex engines to validate outputs.
*   **🏗️ Contract-First Architecture**: Define your data requirements with Zod schemas. If the output doesn't match, it doesn't ship.
*   **📋 Audit-Ready Logging**: Every decision is traced, logged, and categorized by severity, making compliance (SOC2, HIPAA) audits straightforward.
*   **🔒 Fail-Closed Security**: If a policy returns a block signal (even with malformed data), Gateia defaults to blocking.

---

## 📦 Installation

```bash
npm install gateia zod
```

---

## ⚡️ Quick Start

**Scenario:** You have an AI Customer Support Agent. You need to block refund guarantees and PII.

```typescript
import { verify } from "gateia";
import { z } from "zod";

const Reply = z.object({ reply: z.string() });

const res = await verify({
  output: { reply: "Refund guaranteed. Email me at test@example.com" }, // pretend this came from an LLM
  contract: Reply,
  policies: ["finance-safe", "pii-safe"]
});

console.log(res.allowed ? "ALLOWED" : "BLOCKED");
```


---

## 🛡️ Policy Library

Gateia ships with battle-tested policies for common enterprise risks.

| Policy ID | Risk Category | Description | Severity |
|-----------|---------------|-------------|----------|
| `finance-safe` | **Compliance** | Blocks non-compliant guarantee language (e.g., "100% no risk", "guaranteed return"). | High |
| `pii-safe` | **Privacy** | Blocks personally identifiable information (emails, phone numbers, etc.). | High |
| `secrets-safe` | **Security** | Detects leaked API keys (AWS, Stripe, OpenAI, Slack) and private keys. | High |
| `markup-safe` | **Security** | Prevents XSS by blocking `<script>`, `iframe`, and other HTML injection vectors. | High |

---

## 🧩 Advanced Usage

### Type-Safe Custom Policies
Gateia leverages TypeScript generics to ensure your security policies are strictly typed against your contracts.

```typescript
// Your contract expects { score: number }
const Contract = z.object({ score: z.number() });

// TypeScript knows 'output' is { score: number }
const result = await verify({
  output: data,
  contract: Contract,
  policies: [{
     id: 'check-score',
     mode: 'enforce',
     // Compile Error if you access invalid properties
     check: (output) => { 
        if (output.score < 0) return { outcome: 'block', violations: [...] }
        return { outcome: 'pass' }
     }
  }]
});
```

### Audit Mode (Passive Monitoring)
Deploy policies without disrupting user flow. Violations are recorded but `allowed` remains `true`.
```typescript
const result = await verify({
  output: output,
  contract: z.any(),
  policies: ['finance-safe'],
  mode: 'audit' // Logs violations, does not block.
});
```

---

## 📊 The Enforcement Report

Every call to `verify()` returns a comprehensive `EnforcementReport`. Use this for your internal dashboards and compliance logs.

**Note:** `safeOutput` is always included on the response, but it will be `undefined` when `allowed === false` (contract failure or policy block).

```json
{
  "allowed": false,
  "safeOutput": null,
  "traceId": "123e4567-e89b-12d3-a456-426614174000",
  "enforcement": {
    "contract": { "outcome": "pass" },
    "appliedPolicies": [
      { "id": "finance-safe", "outcome": "block" },
      { "id": "pii-safe", "outcome": "pass" }
    ],
    "violations": [
      {
        "policyId": "finance-safe",
        "code": "FIN_GUARANTEE",
        "message": "Contains forbidden guarantee language: 'no risk'",
        "severity": "high"
      }
    ]
  }
}
```

---

## License

MIT

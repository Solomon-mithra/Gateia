# Gateia

<div align="center">


**The Deterministic Verification Layer for Enterprise AI.**

[![npm version](https://img.shields.io/npm/v/gateia.svg?style=flat-square)](https://www.npmjs.com/package/gateia)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/Tests-Passing-green.svg?style=flat-square)]()
[![Type Safety](https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square)]()

</div>

---

**Gateia** is the standard for implementing **Deterministic Guardrails** in AI applications. It acts as a final, immutable security layer between your AI models and your customers.

Unlike "AI-judging-AI" solutions, Gateia enables you to enforce **strict, code-based contracts**, ensuring that your application never halluncinates, leaks PII, or violates business rules—regardless of the underlying model (OpenAI, Anthropic, or Llama).

## 🚀 Why Gateia?

In production, **probability is a liability.** Gateia restores deterministic control.

*   **🛡️ Zero Hallucination Policy**: Gateia does not use LLMs to verify. It uses deterministic logic and regex engines. It is impossible for the verifier to hallucinate.
*   **🏗️ Contract-First Architecture**: Define your data requirements with Zod schemas. If the output doesn't match, it doesn't ship.
*   **📋 Audit-Ready Logging**: Every decision is traced, logged, and categorized by severity, making compliance (SOC2, HIPAA) audits straightforward.
*   **🔒 Fail-Closed Security**: If a policy returns a block signal (even with malformed data), Gateia defaults to blocking. Security is never compromised by runtime errors.

---

## 📦 Installation

```bash
npm install gateia zod
```

---

## ⚡️ Quick Start

Secure a loan processing agent in 30 seconds.

```typescript
import { verify } from 'gateia';
import { z } from 'zod';

// 1. Define the Business Contract
// The AI *must* return data in this shape.
const LoanDecisionContract = z.object({
  approved: z.boolean(),
  rate: z.number().min(2.5).max(10.0), // Business Logic
  reason: z.string(),
  risk_level: z.enum(['low', 'medium', 'high'])
});

// 2. The Verification Step
// Run this *after* your LLM generates content.
const result = await verify({
  output: llmResponse, 
  contract: LoanDecisionContract,
  policies: ['finance-safe', 'pii-safe', 'secrets-safe'],
  mode: 'enforce'
});

// 3. Deterministic Decision
if (!result.allowed) {
  // Blocked. Do not show to user.
  console.error("Security Violation:", result.enforcement.violations);
} else {
  // Safe. Proceed to database/frontend.
  console.log("Verified Data:", result.safeOutput);
}
```

---

## 🛡️ Policy Library

Gateia ships with battle-tested policies for common enterprise risks.

| Policy ID | Risk Category | Description | Severity |
|-----------|---------------|-------------|----------|
| `finance-safe` | **Compliance** | Blocks non-compliant guarantee language (e.g., "100% no risk", "guaranteed return"). | High |
| `pii-safe` | **Privacy** | Redacts or blocks Personally Identifiable Information (Emails, Phone Numbers). | High |
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

```json
{
  "allowed": false,
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

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

**Scenario:** You have an AI Customer Support Agent. You need to ensure it **never** promises refunds it can't deliver, and **never** leaks customer PII.

```typescript
import { verify } from 'gateia';
import { z } from 'zod';

// 1. Define the "Safe Reply" Contract
// The AI must generate a Draft Reply that fits this structure.
const CustomerSupportContract = z.object({
  sentiment: z.enum(['happy', 'neutral', 'angry']),
  reply_text: z.string(),
  ticket_status: z.enum(['open', 'resolved', 'escalated']),
  requires_human_review: z.boolean()
});

// 2. The Verification Step
// Call this *after* obtaining the LLM response, but *before* sending it to the user.
const result = await verify({
  output: llmResponse, 
  contract: CustomerSupportContract,
  policies: [
      'finance-safe', // Block any unauthorized refund promises
      'pii-safe',     // Redact any leaked phone numbers/emails
  ],
  mode: 'enforce'
});

// 3. Deterministic Decision
if (!result.allowed) {
  // 🛑 BLOCKED: The AI tried to say something unsafe.
  // Action: Fallback to a canned response or route to human agent.
  console.warn("Safety Violation:", result.enforcement.violations);
  sendToUser("I'm having trouble retrieving that info. A human will be with you shortly.");
} else {
  // ✅ SAFE: The output adheres to your contract and policies.
  // Action: Send the validated reply to the customer.
  console.log("Verified Reply:", result.safeOutput.reply_text);
  sendToUser(result.safeOutput.reply_text);
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

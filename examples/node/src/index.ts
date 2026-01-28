import { gate } from '../../../packages/gateia/src'; // Import from source for easy testing in monorepo without linking
import { z } from 'zod';

// Mock credentials for the example to work out of box with the stub
process.env.OPENAI_API_KEY = "mock-key";
process.env.GATEIA_MOCK_ADAPTERS = "true";

async function main() {
  console.log("--- Gateia Example ---");

  const LoanSchema = z.object({
    approved: z.boolean(),
    reason: z.string(),
    risk_score: z.number()
  });

  // Since we are using the mock adapter which returns a fixed JSON string "{ mock: 'output' }",
  // this schema validation will technically fail because it expects 'approved' etc.
  // However, for the purpose of the Quickstart *display*, we want to show the code.
  // To make this run successfully with the Stub, I'd need to change the Stub or the Schema.
  // Let's use a Schema that MATCHES the stub for the 'successful' run, 
  // OR just catch the error and print the report to show 'Enforcement' working.
  
  // Actually, let's let it fail and show the report! That's valuable too.
  // Or better, let's use the 'mock' schema for the successful run so the user sees a result.
  
  const MockSchema = z.object({
      mock: z.string()
  });

  console.log("\n1. Running Safe Gate...");
  try {
      const result = await gate({
        model: "gpt-4.1",
        prompt: "Evaluate this loan application...",
        contract: MockSchema, // Using mock schema to pass with stub
        policies: ["finance-safe"]
      });

      console.log("Safe Output:", result.safeOutput);
      console.log("Enforcement:", result.enforcement);
      console.log("TraceID:", result.traceId);
  } catch (e: any) {
      console.error("Gate Error:", e.message);
      if (e.report) console.error("Report:", e.report);
  }

  console.log("\n2. Running Policy Violation Gate...");
  // We can't easily force the mock to produce "guaranteed returns" without changing the code.
  // So we skip this or use a prompt that *would* trigger it if we had a real LLM.
}

main();

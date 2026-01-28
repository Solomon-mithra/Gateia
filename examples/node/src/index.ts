import { gate } from '../../../packages/gateia/src'; // Import from source for easy testing in monorepo without linking
import { z } from 'zod';

// Mock credentials for the example to work out of box with the stub
process.env.OPENAI_API_KEY = "mock-key";
process.env.GATEIA_MOCK_ADAPTERS = "true";

async function main() {
  console.log("--- Gateia Example ---");

  const RefundSchema = z.object({
    valid: z.boolean(),
    reason: z.string(),
    refund_amount: z.number().max(500)
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
        policies: ["support-safe"]
      });

    //   console.log("Safe Output:", result.safeOutput);
    //   console.log("Enforcement:", result.enforcement);
    //   console.log("TraceID:", result.traceId);
      // console.log("result:", result);
      console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e: any) {
      console.error("Gate Error:", e.message);
      if (e.report) console.error("Report:", e.report);
  }

  // 2. Running Policy Violation Gate...
  console.log("\n2. Running Policy Violation Gate...");
  
  // Custom policy to force a block on the mock output
  const blockMockPolicy = {
      id: 'no-mock-data',
      mode: 'enforce' as const,
      check: (output: any) => {
          const text = JSON.stringify(output);
          if (text.includes('mock')) {
              return {
                  outcome: 'block' as const,
                  violations: [{
                      policyId: 'no-mock-data',
                      code: 'MOCK_DETECTED',
                      message: 'Mock data is not allowed in production!',
                      severity: 'high' as const,
                      evidence: { snippet: 'mock' }
                  }]
              };
          }
          return { outcome: 'pass' as const };
      }
  };

  try {
    const result = await gate({
      model: "gpt-4.1",
      prompt: "Generate output...",
      contract: MockSchema,
      policies: [blockMockPolicy]
    });
    console.log("Result:", result);
  } catch (e: any) {
    if (e.name === 'GateiaError' && e.report) {
         console.log("✅ Successfully Blocked!");
         console.log("Violations:", JSON.stringify(e.report.violations, null, 2));
    } else {
        console.error("Unexpected Error:", e);
    }
  }

}

main();

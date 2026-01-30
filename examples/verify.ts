import { verify, Policy } from '../packages/gateia/src';
import { z } from 'zod';

async function main() {
    console.log("--- Gateia Verify SDK Stress Test ---");

    const Contract = z.object({
        message: z.string(),
        score: z.number().min(0).max(10)
    });

    // 1. Safe Case
    console.log("\n1. Verifying Safe Output...");
    const safeRes = await verify({
        output: { message: "Hello World", score: 9 },
        contract: Contract,
        policies: ["finance-safe"]
    });
    console.log(`Allowed: ${safeRes.allowed} ${safeRes.allowed ? '✅' : '❌'}`);


    // 2. Policy Violation (Finance) - Blocking
    console.log("\n2. Verifying Violation (Finance) - Enforce Mode...");
    const badRes = await verify({
        output: { message: "Guaranteed 100% returns with no risk!", score: 5 },
        contract: Contract,
        policies: ["finance-safe"]
    });
    console.log(`Allowed: ${badRes.allowed} ${!badRes.allowed ? '✅ (Blocked)' : '❌ (Failed to Block)'}`);
    if (!badRes.allowed) {
        console.log("Violations:", badRes.enforcement.violations.map(v => v.code));
    }


    // 3. Audit Mode (Should Record Validation but ALLOW)
    console.log("\n3. Verifying Violation in AUDIT Mode...");
    const auditRes = await verify({
        output: { message: "Result is 100% guaranteed!", score: 5 },
        contract: Contract,
        policies: ["finance-safe"],
        mode: 'audit'
    });
    console.log(`Allowed: ${auditRes.allowed} ${auditRes.allowed ? '✅ (Audit Passed)' : '❌ (Blocked unexpected)'}`);
    console.log("Violations Found (Non-blocking):", auditRes.enforcement.violations.length);


    // 4. Broken JSON / Markdown Wrapping
    console.log("\n4. Verifying Markdown Wrapped JSON String...");
    const markdownOutput = "Here is the response:\n```json\n{ \"message\": \"Clean parse\", \"score\": 10 }\n```";
    const jsonRes = await verify({
        output: markdownOutput,
        contract: Contract,
        policies: []
    });
    console.log(`Allowed: ${jsonRes.allowed} ${jsonRes.allowed ? '✅' : '❌'}`);
    if (jsonRes.allowed) {
         console.log("Parsed Output:", jsonRes.safeOutput);
    } else {
        console.log("Errors:", jsonRes.enforcement.contract.errors);
    }


    // 5. Multiple Violations
    console.log("\n5. Verifying Multiple Violations (Finance + PII + Secrets)...");
    const multiRes = await verify({
        output: { message: "Guaranteed returns! Email me at test@example.com with key sk-123456", score: 0 },
        contract: Contract,
        policies: ["finance-safe", "pii-safe", "secrets-safe"]
    });
    console.log(`Allowed: ${multiRes.allowed} ${!multiRes.allowed ? '✅ (Blocked)' : '❌'}`);
    console.log("Violation Codes:", multiRes.enforcement.violations.map(v => v.policyId));


    // 6. Custom Rewrite Policy
    console.log("\n6. Verifying Custom Rewrite Policy...");
    const censorPolicy: Policy = {
        id: 'censor-bad-words',
        mode: 'enforce',
        check: (output) => {
            let str = JSON.stringify(output);
            if (str.includes('darn')) {
                const rewritten = JSON.parse(str.replace('darn', '****'));
                return { outcome: 'rewrite', rewriteFn: () => rewritten };
            }
            return { outcome: 'pass' };
        }
    };
    
    const rewriteRes = await verify({
        output: { message: "That implies darn risk!", score: 2 },
        contract: Contract,
        policies: [censorPolicy]
    });
    
    console.log(`Allowed: ${rewriteRes.allowed} ${rewriteRes.allowed ? '✅' : '❌'}`);
    console.log("Original:", { message: "That implies darn risk!", score: 2 });
    console.log("Safe Output:", rewriteRes.safeOutput);
}

main();

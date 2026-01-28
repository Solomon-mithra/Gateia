import { z } from 'zod';
import { GateParams, GateResult, GateiaError, Policy, Violation, GateEnforcementReport, AppliedPolicyRec, PolicyAction, GateOutcome, GateUsage } from './types';
import { v4 as uuidv4 } from 'uuid';
import { ModelRegistry } from './adapters/registry';
import { ContractEngine } from './engine/contract';
import { PolicyEngine } from './engine/policy';
import { policyLibrary } from './policies';

// Global instances
const registry = new ModelRegistry();
const contractEngine = new ContractEngine();
const policyEngine = new PolicyEngine();

export async function gate<T extends z.ZodTypeAny>(params: GateParams<T>): Promise<GateResult<z.infer<T>>> {
  const traceId = uuidv4();
  const { model, prompt, contract, policies = [], behavior, options } = params;

  try {
    // 1. Resolve Adapter
    const adapter = registry.getAdapter(model);

    // 2. Resolve Policies
    const activePolicies: Policy[] = policies.map(p => {
      if (typeof p === 'string') {
        const found = policyLibrary[p];
        if (!found) throw new GateiaError(`Unknown policy: ${p}`, traceId);
        return found;
      }
      return p;
    });

    // 3. Execution Loop (Simple Retry Logic for Contract)
    let attempts = 0;
    let maxRetries = behavior?.contract?.maxRetries ?? 0;
    // Bounded auto repair
    if (behavior?.contract?.repair === 'auto' && maxRetries === 0) {
        maxRetries = 3; // Default
    } else if (behavior?.contract?.repair === 'off') {
        maxRetries = 0;
    }

    let currentPrompt = prompt;
    let lastError: string | undefined;
    let finalSafeOutput: any;
    let contractOutcome: 'pass' | 'fail' | 'repaired' = 'fail';

    // Track usage
    let totalTokens = { prompt: 0, completion: 0, total: 0 };
    let finalLatency = 0;
    let rawResult: any;

    while (attempts <= maxRetries) {
      attempts++;
      
      // Call Model
      const result = await adapter.generate(currentPrompt, { 
          // If contract is object/schema, hint json mode if supported by adapter?
          // For now, adapter ignores options in stub
          modelName: params.model // Pass explicit model name to adapter
      });
      
      if (result.tokens) {
          totalTokens.prompt += result.tokens.prompt;
          totalTokens.completion += result.tokens.completion;
          totalTokens.total += result.tokens.total;
      }
      finalLatency = result.latencyMs || 0;
      
      // Parse Output (assume text for now, try to parse JSON if schema expects object)
      // Usually LLM returns string. If Schema is object, we try JSON.parse
      let outputToValidate = result.text;
      let isJsonSchema = contract instanceof z.ZodObject || contract instanceof z.ZodArray;
      
      if (result.structured) {
          outputToValidate = result.structured;
      } else if (isJsonSchema) {
          try {
              // Simple extraction of JSON if wrapped in markdown
              const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                  outputToValidate = JSON.parse(jsonMatch[0].replace(/```json|```/g, ''));
              } else {
                 outputToValidate = JSON.parse(result.text); 
              }
          } catch (e) {
              // Parsing failed
          }
      }

      rawResult = outputToValidate;

      // Validate Contract
      const contractRes = contractEngine.validate(outputToValidate, contract);
      
      if (contractRes.success) {
          finalSafeOutput = contractRes.data;
          contractOutcome = attempts === 1 ? 'pass' : 'repaired';
          break; // Success!
      } else {
          lastError = contractRes.error;
          if (attempts <= maxRetries) {
              // Prepare repair prompt
              const repairMsg = contractEngine.formatRepairInstruction(lastError || "Invalid Format");
              // Append to prompt? Or new message?
              // Simple "chat" append if prompt is array-like?
              // For MVP, if prompt is string, we append.
              if (typeof currentPrompt === 'string') {
                  currentPrompt = `${currentPrompt}\n\nUser: ${repairMsg}`; // Very naive chat history
              } else {
                  // If it's object, assumes single turn. We can't easily extend without a chat structure.
                  // For MVP assume simple string prompt works best for repair loop.
                  // Or just append to user message.
                  currentPrompt = {
                      ...currentPrompt,
                      user: `${currentPrompt.user}\n\n(System: Previous output invalid: ${lastError}. Fix it.)`
                  };
              }
          }
      }
    }

    // Construct usage object
    const finalUsage: GateUsage = {
        provider: registry.getAdapter(model).constructor.name,
        model: params.model,
        latencyMs: finalLatency,
        tokens: {
            prompt: totalTokens.prompt,
            completion: totalTokens.completion,
            total: totalTokens.total
        }
        // costUsd: ... // TODO: Add cost calculation logic based on provider/model
    };

    if (!finalSafeOutput) {
        // Block/Throw
        // Construct report
        const report: GateEnforcementReport = {
            appliedPolicies: [], // Policies not applied due to contract failure
            contract: {
                outcome: 'fail',
                errors: contractEngine.validate(rawResult, contract).errors // re-running valid logic or grabbing from lastError
            },
            actions: [],
            violations: [{ policyId: 'contract', code: 'CONTRACT_FAIL', message: lastError || "Contract Validation Failed", severity: 'high' }]
        };
        // For accurate errors we might want to capture them better above instead of re-running or assuming lastError string
        // But for now this matches structure.
        
        throw new GateiaError("Contract Check Failed", traceId, report);
    }

    // 4. Apply Policies
    // Note: Policies applied on safeOutput? Or raw text?
    // Usually policies check content. If we have safe object, we check that.
    const policyCtx = { model: params.model, prompt: params.prompt, traceId };
    const policyResult = await policyEngine.evaluate(activePolicies, finalSafeOutput, policyCtx);

    let finalViolations = policyResult.violations || [];
    let enforcementActions: PolicyAction[] = [];
    
    // Detailed policy reporting
    const appliedRecs: AppliedPolicyRec[] = activePolicies.map(p => {
        const policyViolations = finalViolations.filter(v => v.policyId === p.id);
        let outcome: GateOutcome = 'pass';
        if (policyViolations.length > 0) {
            const isBlock = policyViolations.some(v => v.severity === 'high'); 
            outcome = isBlock ? 'block' : 'warn'; 
        }
        return { 
            id: p.id, 
            version: p.version,
            mode: p.mode || 'enforce',
            outcome,
            reasons: policyViolations.map(v => v.message)
        };
    });

    if (policyResult.rewrittenOutput) {
        finalSafeOutput = policyResult.rewrittenOutput;
        enforcementActions.push({ type: 'rewrite', policyId: 'policy-engine', note: 'Content rewritten by policy' });
    }

    const report: GateEnforcementReport = {
        appliedPolicies: appliedRecs,
        contract: {
            outcome: contractOutcome,
            // If repaired, we could list repairs here if we tracked them detailly
        },
        actions: enforcementActions,
        violations: finalViolations
    };

    if (policyResult.outcome === 'block') {
         const onBlock = behavior?.onBlock || 'throw'; // Default throw?
         if (onBlock === 'throw') {
             throw new GateiaError("Policy Blocked Response", traceId, report);
         }
         // Return with no safeOutput? Or just raw?
         return {
             safeOutput: undefined,
             traceId,
             enforcement: report,
             usage: finalUsage,
             rawOutput: options?.includeRawOutput ? rawResult : undefined
         };
    }

    return {
        safeOutput: finalSafeOutput,
        traceId,
        enforcement: report,
        usage: finalUsage,
        rawOutput: options?.includeRawOutput ? rawResult : undefined
    };

  } catch (error) {
      if (error instanceof GateiaError) throw error;
      throw new GateiaError((error as Error).message, traceId, undefined, error);
  }
}

export * from './types';

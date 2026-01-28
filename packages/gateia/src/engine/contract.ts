import { z } from 'zod';
import { GateEnforcementReport } from '../types';

export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ContractEngine {
  validate<T>(data: any, schema: z.ZodType<T>): ContractResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMsg = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return { success: false, error: errorMsg };
    }
  }
  
  // Helper to format error for the LLM repair prompt
  formatRepairInstruction(error: string): string {
    return `The previous response failed schema validation:\n${error}\nPlease fix the JSON to match the schema. Return ONLY valid JSON.`;
  }
}

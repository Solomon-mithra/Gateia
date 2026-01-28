import { z } from 'zod';
import { GateEnforcementReport } from '../types';

export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string; // Legacy simple string
  errors?: { path: string; message: string }[]; // Structured errors
}

export class ContractEngine {
  validate<T>(data: any, schema: z.ZodType<T>): ContractResult<T> {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const formattedErrors = result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
      }));
      
      const errorMsg = formattedErrors
        .map((e) => `${e.path}: ${e.message}`)
        .join('; ');
        
      return { success: false, error: errorMsg, errors: formattedErrors };
    }
  }
  
  // Helper to format error for the LLM repair prompt
  formatRepairInstruction(error: string): string {
    return `The previous response failed schema validation:\n${error}\nPlease fix the JSON to match the schema. Return ONLY valid JSON.`;
  }
}

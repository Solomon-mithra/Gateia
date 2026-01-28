import { ModelAdapter, GenerationResult, AdapterOptions } from './base';
import { GateiaError } from '../types';

export class GeminiAdapter implements ModelAdapter {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  async generate(prompt: string | { system?: string; user: string }, options?: AdapterOptions): Promise<GenerationResult> {
    const apiKey = this.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GateiaError("Missing Gemini Credentials", "no-trace-id", undefined, new Error("GEMINI_API_KEY not found"));
    }

    const isMock = process.env.GATEIA_MOCK_ADAPTERS === 'true';
    if (isMock) {
       return {
           text: JSON.stringify({ mock: 'gemini output' }),
           tokens: { prompt: 10, completion: 10, total: 20 },
           latencyMs: 150
       };
    }

    throw new Error("Real Gemini calls not enabled in MVP stub. Set GATEIA_MOCK_ADAPTERS=true to test.");
  }
}

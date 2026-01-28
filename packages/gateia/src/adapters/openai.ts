import { ModelAdapter, GenerationResult, AdapterOptions } from './base';
import { GateiaError } from '../types';

export class OpenAIAdapter implements ModelAdapter {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async generate(prompt: string | { system?: string; user: string }, options?: AdapterOptions): Promise<GenerationResult> {
    const apiKey = this.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new GateiaError("Missing OpenAI Credentials", "no-trace-id", undefined, new Error("OPENAI_API_KEY not found"));
    }

    // Stub implementation to satisfy requirements without extra deps for now
    // In a real scenario, use 'openai' package. 
    // "Implement OpenAI adapter... behind common interface"
    const isMock = process.env.GATEIA_MOCK_ADAPTERS === 'true';
    if (isMock) {
       return {
           text: JSON.stringify({ mock: 'output' }),
           tokens: { prompt: 10, completion: 5, total: 15 },
           latencyMs: 100
       };
    }

    // TODO: Real implementation would go here using fetch or SDK
    throw new Error("Real OpenAI calls not enabled in MVP stub. Set GATEIA_MOCK_ADAPTERS=true to test.");
  }
}

import { ModelAdapter, GenerationResult, AdapterOptions } from './base';
import { GateiaError } from '../types';

export class OllamaAdapter implements ModelAdapter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async generate(prompt: string | { system?: string; user: string }, options?: AdapterOptions & { modelName?: string }): Promise<GenerationResult> {
    // Real implementation using fetch to Ollama API
    try {
        // Use model name from options if provided (stripped of 'ollama/' prefix usually), 
        // fallback to 'tinyllama' for this specific test environment requirement.
        let modelName = 'tinyllama';
        if (options?.modelName) {
            modelName = options.modelName.replace('ollama/', '');
        }
        
        let promptText = '';
        if (typeof prompt === 'string') {
            promptText = prompt;
        } else {
            promptText = `${prompt.system || ''}\n${prompt.user}`;
        }

        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                prompt: promptText,
                stream: false
                // format: 'json' // Removed to allow text output for stress testing 
            })
        });

        if (!response.ok) {
             throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data: any = await response.json();
        
        return {
            text: data.response,
            tokens: {
                prompt: data.prompt_eval_count || 0,
                completion: data.eval_count || 0,
                total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            },
            latencyMs: data.total_duration ? Math.round(data.total_duration / 1000000) : 0 
        };
    } catch (e: any) {
        throw new GateiaError("Ollama Adapter Failed", "no-trace", undefined, e);
    }
  }
}

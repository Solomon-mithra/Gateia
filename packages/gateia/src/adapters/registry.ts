import { ModelAdapter } from './base';
import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';

export class ModelRegistry {
    private adapters: Map<string, ModelAdapter> = new Map();
    private overrides: Map<string, ModelAdapter> = new Map();

    constructor() {
        // Initialize default adapters
        const openai = new OpenAIAdapter();
        const gemini = new GeminiAdapter();
        
        this.adapters.set('openai', openai);
        this.adapters.set('gemini', gemini);
    }

    // Register a specific override for a model name
    registerOverride(model: string, adapter: ModelAdapter) {
        this.overrides.set(model, adapter);
    }

    getAdapter(model: string): ModelAdapter {
        if (this.overrides.has(model)) {
            return this.overrides.get(model)!;
        }

        if (model.startsWith('gpt-') || model.startsWith('openai/')) {
            return this.adapters.get('openai')!;
        }
        if (model.startsWith('gemini-') || model.startsWith('google/')) {
            return this.adapters.get('gemini')!;
        }

        throw new Error(`Unknown model provider for: ${model}`);
    }
}

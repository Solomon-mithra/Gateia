import { ModelAdapter } from './base';
import { OpenAIAdapter } from './openai';
import { GeminiAdapter } from './gemini';
import { OllamaAdapter } from './ollama';

export class ModelRegistry {
    private adapters: Map<string, ModelAdapter> = new Map();
    private overrides: Map<string, ModelAdapter> = new Map();

    constructor() {
        // Initialize default adapters
        const openai = new OpenAIAdapter();
        const gemini = new GeminiAdapter();
        const ollama = new OllamaAdapter();
        
        this.adapters.set('openai', openai);
        this.adapters.set('gemini', gemini);
        this.adapters.set('ollama', ollama);
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
        if (model.startsWith('ollama/') || model.startsWith('llama')) {
            return this.adapters.get('ollama')!;
        }

        throw new Error(`Unknown model provider for: ${model}`);
    }
}

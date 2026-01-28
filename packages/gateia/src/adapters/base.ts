export interface GenerationResult {
  text: string;
  structured?: any; // Only if JSON mode was requested/parsed
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs?: number;
}

export interface AdapterOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean; // If true, provider should enforce JSON output if supported
}

export interface ModelAdapter {
  generate(
    prompt: string | { system?: string; user: string },
    options?: AdapterOptions
  ): Promise<GenerationResult>;
}

export type AvailableModel = {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  requires: string;
  vision: boolean;
};

export const MODEL_CATALOG: readonly AvailableModel[] = Object.freeze([
  {
    id: 'gpt-4o',
    provider: 'openai',
    requires: 'OPENAI_API_KEY',
    vision: true,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    requires: 'OPENAI_API_KEY',
    vision: true,
  },
]);

export function availableModels(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): AvailableModel[] {
  return MODEL_CATALOG.filter((m) => Boolean(env[m.requires]));
}

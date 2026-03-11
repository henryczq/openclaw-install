export interface DefaultOpenClawConfig {
  agents: {
    list: Array<{
      id: string;
      provider: string;
      model: string;
    }>;
    defaults: {
      provider: string;
      model: string;
    };
  };
}

export function createDefaultOpenClawConfig(): DefaultOpenClawConfig {
  return {
    agents: {
      list: [
        {
          id: 'main',
          provider: 'anthropic',
          model: 'claude-3-7-sonnet-20250219'
        }
      ],
      defaults: {
        provider: 'anthropic',
        model: 'claude-3-7-sonnet-20250219'
      }
    }
  };
}

import { create } from 'zustand';

interface AIState {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useAIStore = create<AIState>((set) => ({
  selectedModel: 'doubao-seed-2.0-code',
  setSelectedModel: (model) => set({ selectedModel: model }),
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),
}));

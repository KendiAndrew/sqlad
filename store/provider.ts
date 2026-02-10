import { provider } from "@prisma/client";
import { create } from "zustand";

interface State {
  provider: provider[];
  setProviders: (categories: provider[]) => void;
  clearProviders: () => void;
}

export const useProvidersStore = create<State>((set) => ({
  provider: [],
  setProviders: (provider) => set({ provider }),
  clearProviders: () => set({ provider: [] }),
}));

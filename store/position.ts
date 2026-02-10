import { position } from "@prisma/client";
import { create } from "zustand";

interface State {
  position: position[];
  setPosition: (categories: position[]) => void;
  clearPosition: () => void;
}

export const usePositionStore = create<State>((set) => ({
  position: [],
  setPosition: (position) => set({ position }),
  clearPosition: () => set({ position: [] }),
}));

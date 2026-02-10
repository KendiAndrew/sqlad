import { create } from "zustand";
import { categories } from "@prisma/client";

interface State {
  categories: categories[];
  setCategories: (categories: categories[]) => void;
  clearCategories: () => void;
}

export const useCategoryStore = create<State>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  clearCategories: () => set({ categories: [] }),
}));

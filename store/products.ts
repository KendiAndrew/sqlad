import { create } from "zustand";
import { products } from "@prisma/client";
export interface ProductWithCategory extends products {
  category_name: string;
}

interface State {
  products: ProductWithCategory[];
  setProducts: (products: ProductWithCategory[]) => void;
  clearProducts: () => void;
}

export const useProductsStore = create<State>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  clearProducts: () => set({ products: [] }),
}));

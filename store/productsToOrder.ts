import { products_to_order } from "@prisma/client";
import { create } from "zustand";

export interface ProductToOrderWithName extends products_to_order {
  product_name: string;
}

interface State {
  productsToOrder: ProductToOrderWithName[];
  setProductsToOrder: (productsToOrder: ProductToOrderWithName[]) => void;
  clearProductsToOrder: () => void;
}

export const useProductsToOrderStore = create<State>((set) => ({
  productsToOrder: [],
  setProductsToOrder: (productsToOrder) => set({ productsToOrder }),
  clearProductsToOrder: () => set({ productsToOrder: [] }),
}));

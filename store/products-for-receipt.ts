import { products_for_receipt } from "@prisma/client";
import { create } from "zustand";

export interface pfrName extends products_for_receipt {
  product_name: string;
  price: number;
  first_name: string;
  last_name: string;
}
interface State {
  productsForReceipt: pfrName[];
  setProductsForReceipt: (categories: pfrName[]) => void;
  clearProductsForReceipt: () => void;
}

export const useProductsForReceiptStore = create<State>((set) => ({
  productsForReceipt: [],
  setProductsForReceipt: (productsForReceipt) => set({ productsForReceipt }),
  clearProductsForReceipt: () => set({ productsForReceipt: [] }),
}));

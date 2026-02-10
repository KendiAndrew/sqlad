import { products_for_receipt } from "@prisma/client";
import { create } from "zustand";

export interface pfrWith extends products_for_receipt {
  receipt_create_date: string;
  receipt_type: string;
  first_name: string;
  last_name: string;
  product_name: string;
  price: number;
}
interface State {
  pfr: pfrWith[];
  setPfr: (categories: pfrWith[]) => void;
  clearPfr: () => void;
}

export const usePFRStore = create<State>((set) => ({
  pfr: [],
  setPfr: (pfr) => set({ pfr }),
  clearPfr: () => set({ pfr: [] }),
}));

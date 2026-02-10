import { receipt } from "@prisma/client";
import { create } from "zustand";

interface ReceiptWithEmp extends receipt {
  total_price: number;
  first_name: string;
  last_name: string;
}
interface State {
  receipts: ReceiptWithEmp[];
  setReceipts: (categories: ReceiptWithEmp[]) => void;
  clearReceipts: () => void;
}

export const useReceiptStore = create<State>((set) => ({
  receipts: [],
  setReceipts: (receipts) => set({ receipts }),
  clearReceipts: () => set({ receipts: [] }),
}));

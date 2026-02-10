import { invoice } from "@prisma/client";
import { create } from "zustand";

export interface invoiceWithNames extends invoice {
  provider_first_name: string;
  provider_last_name: string;
  employee_first_name: string;
  employee_last_name: string;
}
interface State {
  invoice: invoiceWithNames[];
  setInvoice: (categories: invoiceWithNames[]) => void;
  clearInvoice: () => void;
}

export const useInvoiceStore = create<State>((set) => ({
  invoice: [],
  setInvoice: (invoice) => set({ invoice }),
  clearInvoice: () => set({ invoice: [] }),
}));

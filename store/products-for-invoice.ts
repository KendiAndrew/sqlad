import { invoice, products, products_for_invoice } from "@prisma/client";
import { create } from "zustand";

export interface pfiWaithName
  extends Omit<products_for_invoice, "product_price"> {
  product_name: string;
  product_price: number;
  products: products;
  invoice: invoice;
}
interface State {
  productsForInvoice: pfiWaithName[];
  setProductsForInvoice: (categories: pfiWaithName[]) => void;
  clearProductsForInvoice: () => void;
}

export const useProductsForInvoiceStore = create<State>((set) => ({
  productsForInvoice: [],
  setProductsForInvoice: (productsForInvoice) => set({ productsForInvoice }),
  clearProductsForInvoice: () => set({ productsForInvoice: [] }),
}));

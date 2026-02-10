import { create } from "zustand";

export type ProductsInStock = {
  product_id: number;
  products_name: string;
  quantity: number;
  product_price: string;
};
interface State {
  productsInStock: ProductsInStock[];
  setProductsInStock: (productsInStock: ProductsInStock[]) => void;
  clearProductsInStock: () => void;
}

export const useProductsInStockStore = create<State>((set) => ({
  productsInStock: [],
  setProductsInStock: (productsInStock) => set({ productsInStock }),
  clearProductsInStock: () => set({ productsInStock: [] }),
}));

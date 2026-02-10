"use client";

import React, { useState } from "react";
import { Button } from "../ui";
import { ProductsList } from "./products-list";
import { ProductsForOrder } from "./products-for-order";

const menuItems = [
  { label: "Список продуктів", value: "products" },
  { label: "Продукти для замовлення", value: "productsForOrder" },
];
interface Props {
  className?: string;
}

export const Products: React.FC<Props> = ({ className }) => {
  const [activeItems, setActiveItems] = useState(menuItems[0].value);

  return (
    <div className="mt-4">
      {menuItems.map((item) => (
        <Button
          key={item.value}
          onClick={() => setActiveItems(item.value)}
          className={`text-base cursor-pointer mr-2 ${
            activeItems === item.value
              ? "bg-white border border-primary text-primary hover:bg-amber-0"
              : "bg-primary"
          }`}
        >
          {item.label}
        </Button>
      ))}
      {activeItems === "products" ? <ProductsList /> : <ProductsForOrder />}
    </div>
  );
};

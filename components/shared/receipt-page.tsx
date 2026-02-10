"use client";

import React, { useState } from "react";
import { Button } from "../ui";
import { Receipts } from "./receipts";
import { ProductsForReceipt } from "./products-for-receipt";
import { ReceiptCreate } from "./receipt-create";

interface Props {
  className?: string;
}
const menuItems = [
  { label: "Чеки", value: "all" },
  { label: "Продукти для чеків", value: "received" },
  { label: "Створити чек", value: "create" },
];
export const ReceiptPage: React.FC<Props> = ({ className }) => {
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

      {(() => {
        switch (activeItems) {
          case "all":
            return <Receipts />; //< />;
          case "received":
            return <ProductsForReceipt />; //< />;
          case "create":
            return <ReceiptCreate />; //< />;
          default:
            return "asdasasd"; //< />; // fallback
        }
      })()}
    </div>
  );
};

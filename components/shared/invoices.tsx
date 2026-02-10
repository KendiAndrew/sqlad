"use client";

import React, { useState } from "react";
import { Button } from "../ui";
import { InvoicePage, ProductsForInvoice } from "./";

interface Props {
  className?: string;
}

const menuItems = [
  { label: "Накладні", value: "all" },
  { label: "Продукти для накладних", value: "received" },
];

export const Invoices: React.FC<Props> = ({ className }) => {
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
            return <InvoicePage />; //<AllInvoices />;
          case "received":
            return <ProductsForInvoice />; //<ReceivedProducts />;
          default:
            return <InvoicePage />; //<AllInvoices />; // fallback
        }
      })()}
    </div>
  );
};

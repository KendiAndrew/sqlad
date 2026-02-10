"use client";

import React, { useState } from "react";
import { Button } from "../ui";
import { WeekSales } from "./week-sales";
import { SellStat } from "./sell-stat";

interface Props {
  className?: string;
}
const menuItems = [
  { label: "Продажі", value: "sells" },
  { label: "Топ продаж", value: "employee" },
];

export const StatisticMain: React.FC<Props> = ({ className }) => {
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
          case "sells":
            return <WeekSales />; //<Position />; //<AllInvoices />;
          case "employee":
            return <SellStat />; //<EmployeePage />; //<ReceivedProducts />;
          case "provider":
            return "mbn,nfsl"; //<Provider />; //<ReceivedProducts />;
          default:
            return ""; //<Position />; //<AllInvoices />; // fallback
        }
      })()}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { Button } from "../ui";
import { ItemContainer } from "./item-container";
import { EmployeePage } from "./employee-page";
import { Position } from "./position";
import { Provider } from "./provider";

interface Props {
  className?: string;
}

const menuItems = [
  { label: "Посади", value: "position" },
  { label: "Працівники", value: "employee" },
  { label: "Постачальники", value: "provider" },
];

export const Personal: React.FC<Props> = ({ className }) => {
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
          case "position":
            return <Position />; //<AllInvoices />;
          case "employee":
            return <EmployeePage />; //<ReceivedProducts />;
          case "provider":
            return <Provider />; //<ReceivedProducts />;
          default:
            return <Position />; //<AllInvoices />; // fallback
        }
      })()}
    </div>
  );
};

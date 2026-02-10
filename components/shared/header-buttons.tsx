"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui";
import { useSession } from "next-auth/react";

interface Props {
  className?: string;
  menuItems: {
    label: string;
    value: string;
  }[];
  activeItems: string;
  setActiveItems: (s: string) => void;
}

export const HeaderButtons: React.FC<Props> = ({
  className,
  menuItems,
  activeItems,
  setActiveItems,
}) => {
  const position = useSession().data?.user.role;
  return (
    <div className=" flex gap-4">
      {position === "admin_role"
        ? menuItems.map((category) => (
            <Button
              key={category.value}
              onClick={() => setActiveItems(category.value)}
              className={`text-base cursor-pointer ${
                activeItems === category.value
                  ? "bg-white border border-primary text-primary hover:bg-amber-0"
                  : ""
              }`}
            >
              {category.label}
            </Button>
          ))
        : ""}
    </div>
  );
};

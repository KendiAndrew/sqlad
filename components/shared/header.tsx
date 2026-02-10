"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { signOut } from "next-auth/react";
import { Logo } from "./logo";
import { Button } from "../ui";
import { HeaderButtons } from "./header-buttons";

interface Props {
  className?: string;
  menuItems: {
    label: string;
    value: string;
  }[];
  activeItems: string;
  setActiveItems: (s: string) => void;
}

export const Header: React.FC<Props> = ({
  className,
  menuItems,
  activeItems,
  setActiveItems,
}) => {
  return (
    <header
      className={cn("bg-white rounded-2xl p-3 flex justify-between", className)}
    >
      <Logo />
      <HeaderButtons
        menuItems={menuItems}
        activeItems={activeItems}
        setActiveItems={setActiveItems}
      />
      <Button
        className="text-base"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Вийти
      </Button>
    </header>
  );
};

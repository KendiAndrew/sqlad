import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const ItemContainer: React.FC<Props> = ({ className, children }) => {
  return (
    <div
      className={`w-[100%] h-[400px] overflow-auto border rounded p-4 ${className}`}
    >
      {children}
    </div>
  );
};

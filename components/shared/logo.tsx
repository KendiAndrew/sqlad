import React from "react";
import { Title } from "./title";

interface Props {
  className?: string;
}

export const Logo: React.FC<Props> = ({ className }) => {
  return (
    <div className="flex gap-3 items-center">
      <img
        src="/assets/logo_mini.jpg"
        height={32}
        width={32}
        className="rounded-[4px]"
      />

      <Title text="QSLад" />
    </div>
  );
};

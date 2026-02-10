import React from "react";

interface Props {
  className?: string;
}

export const Denided: React.FC<Props> = ({ className }) => {
  return (
    <div className="px-40 mt-40 flex flex-col items-center justify-center text-center bg-red-100 border border-red-400 rounded-lg py-8 shadow-md">
      <span className="text-6xl mb-4">🚫🙅‍♂️</span>
      <h2 className="text-2xl font-bold text-red-700 mb-2">
        Недостатньо прав доступу
      </h2>
      <p className="text-red-600 max-w-md">
        Вибачте, але у вас немає дозволу на перегляд цього вмісту. Можливо,
        спробуйте попросити адміністратора надати вам доступ.
      </p>
    </div>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ItemContainer } from "./item-container";
import { Skeleton, Table } from "../ui";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Props {
  className?: string;
}
type Sales = {
  category_name: string;
  product_name: string;
  total_sold: number;
};
export const SellStat: React.FC<Props> = ({ className }) => {
  const [sales, setSales] = useState<Sales[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fetchWeekSales = async () => {
    try {
      const res = await fetch(`/api/sell-stat`, {
        method: "GET",
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.error("Недостатньо прав доступу");
          toast.error("У вас немає прав для перегляду категорій");
          return;
        }

        if (res.status === 401) {
          console.error("Неавторизований доступ");
          toast.error("Будь ласка, увійдіть у систему");
          return;
        }

        const errorData = await res.json();
        throw new Error(errorData.message || "Невідома помилка");
      }
      const data = await res.json();
      setSales([]);

      setSales(data);
    } catch (error) {
      console.error("Не вдалося завантажити посади:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch("");
    }, 200);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    fetchWeekSales();
  }, [debouncedSearch]);
  return (
    <div className="mt-10">
      <ItemContainer>
        <div className="flex flex-col items-end">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-center">№</TableHead>
                <TableHead className="font-medium text-center">
                  Категорія
                </TableHead>
                <TableHead className="font-medium text-center">
                  Продукт
                </TableHead>
                <TableHead className="font-medium text-center">
                  Продано
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <Skeleton className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8" />
                      </TableCell>
                    </TableRow>
                  ))
                : sales.map((position, _i) => (
                    <TableRow key={_i} className="transition-transform">
                      <TableCell className="text-center">{_i}</TableCell>
                      <TableCell className="text-center">
                        {position.category_name}
                      </TableCell>
                      <TableCell className=" text-center">
                        {position.product_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {position.total_sold}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </ItemContainer>
    </div>
  );
};

"use client";

import React, { useEffect, useState } from "react";
import { ItemContainer } from "./item-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui";
import toast from "react-hot-toast";

interface Props {
  className?: string;
}

type Sales = {
  week_start: Date;
  avg_receipt_total: number;
  difference_with_previous_week: number;
};

export const WeekSales: React.FC<Props> = ({ className }) => {
  const [sales, setSales] = useState<Sales[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fetchWeekSales = async () => {
    try {
      const res = await fetch(`/api/week-sales`, {
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
                  Дата початку тижня
                </TableHead>
                <TableHead className="font-medium text-center">
                  Сума за тиждень
                </TableHead>
                <TableHead className="font-medium text-center">
                  Різниця з попереднім
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
                        {String(position.week_start)}
                      </TableCell>
                      <TableCell className=" text-center">
                        {position.avg_receipt_total}
                      </TableCell>
                      <TableCell className="text-center">
                        {position.difference_with_previous_week}
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

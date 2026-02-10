"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Title } from "./title";
import { useProductsForReceiptStore } from "@/store/products-for-receipt";
import { useEmployeeStore } from "@/store/employee";
import { ItemContainer } from "./item-container";
import { Button, Skeleton } from "../ui";
import toast from "react-hot-toast";
import { Denided } from "./denided";
interface Props {
  className?: string;
}

export const ProductsForReceipt: React.FC<Props> = ({ className }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("receipt_id"); // або "product_name"
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [invoiceType, setInvoiceType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { productsForReceipt, setProductsForReceipt, clearProductsForReceipt } =
    useProductsForReceiptStore();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { employee, setEmployee, clearEmployee } = useEmployeeStore();
  const [isOk, setIsOk] = useState(true);

  const fetchProductsForReceipt = async () => {
    try {
      const params = new URLSearchParams();

      const isDateOrEmployeeFilter = dateFrom || dateTo || employeeId;
      const isSearchFilter = searchValue.trim();

      if (isSearchFilter && !isDateOrEmployeeFilter) {
        params.append("searchValue", searchValue.trim());
        params.append("searchType", searchType);
      } else if (!isSearchFilter && isDateOrEmployeeFilter) {
        if (dateFrom) params.append("dateFrom", dateFrom);
        if (dateTo) params.append("dateTo", dateTo);
        if (employeeId) params.append("employeeId", employeeId);
      }

      if (invoiceType) {
        params.append("receipt_type", invoiceType);
      }

      const res = await fetch(`/api/pfr?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          toast.error("У вас немає прав для зміни категорій");

          setTimeout(() => {
            setIsOk(true);
          }, 3000); // 3000 мс = 3 секунди

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

      setIsOk(true);

      const data = await res.json();

      setProductsForReceipt(data);
    } catch (error) {
      console.error("Помилка при завантаженні продуктів:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      let url = "/api/employee";

      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          toast.error("У вас немає прав для зміни категорій");

          setTimeout(() => {
            setIsOk(true);
          }, 3000); // 3000 мс = 3 секунди

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

      setIsOk(true);
      const data = await res.json();
      clearEmployee();
      setEmployee(data);
    } catch (error) {
      console.error("Не вдалося завантажити працівників:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // виклик fetch при зміні введення
  useEffect(() => {
    clearProductsForReceipt();
    fetchProductsForReceipt();
    fetchUsers();
  }, [debouncedSearch, searchType, invoiceType, employeeId, dateFrom, dateTo]);

  return (
    <div>
      {isOk === true ? (
        <div className="mt-10">
          <div className="w-full flex justify-start">
            <Title
              text="Продукти для чеків"
              size="lg"
              className="mb-4 font-bold text-left"
            />
          </div>

          <div className="flex flex-col gap-3 mb-4 w-full">
            <div className="flex gap-3 w-full">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setSearchValue(""); // очищаємо значення пошуку
                }}
                className="border px-2 py-1 rounded-sm border-primary w-full"
                placeholder="Від дати"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setSearchValue("");
                }}
                className="border px-2 py-1 rounded-sm border-primary w-full"
                placeholder="До дати"
              />
            </div>

            <div className="flex gap-3 w-full">
              <select
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setSearchValue("");
                }}
                className="border px-2 py-1 rounded-sm border-primary w-full"
              >
                <option value="">Усі працівники</option>
                {employee.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>

              <select
                value={invoiceType}
                onChange={(e) => {
                  setInvoiceType(e.target.value);
                  setEmployeeId(""); // очищаємо працівника
                  setDateFrom(""); // очищаємо дату від
                  setDateTo("");
                  fetchProductsForReceipt();
                }}
                className="border px-2 py-1 rounded-sm border-primary w-full"
              >
                <option value="">Всі типи</option>
                <option value="Продаж">Продажа</option>
                <option value="Повернення">Повернення</option>
              </select>
            </div>

            <div className="flex gap-3 w-full">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setDateFrom("");
                  setDateTo("");
                  setEmployeeId("");
                  fetchProductsForReceipt();
                }}
                className="border px-3 py-1 rounded-md w-full border-primary"
                placeholder="Пошук..."
              />
              {(searchValue || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setSearchValue("");
                    setDateFrom("");
                    setDateTo("");
                    setEmployeeId("");
                    fetchProductsForReceipt();
                  }}
                  className="text-red-500 px-2 py-1 border border-red-500 rounded-sm hover:bg-red-100 transition"
                >
                  Очистити
                </button>
              )}

              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setDateFrom("");
                  setDateTo("");
                  setEmployeeId("");
                }}
                className="border px-2 py-1 rounded-sm border-primary w-1/3"
              >
                <option value="receipt_id">ID чека</option>
                <option value="product_name">Назва продукту</option>
              </select>
            </div>
          </div>

          <ItemContainer className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">Номер чека</TableHead>
                  <TableHead className="text-center">Продукт</TableHead>
                  <TableHead className="text-center">Кількість</TableHead>
                  <TableHead className="text-center">Ціна</TableHead>
                  <TableHead className="text-center">Продав</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 11 }).map((_, cellIndex) => (
                          <TableCell
                            key={cellIndex}
                            className={
                              cellIndex === 0 ? "font-medium" : "text-right"
                            }
                          >
                            <Skeleton className="h-8" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <>
                    {productsForReceipt.length === 0 ? (
                      <TableRow></TableRow>
                    ) : (
                      productsForReceipt.map((emp) => (
                        <TableRow
                          key={emp.products_for_receipt_id}
                          className="transition-transform"
                        >
                          <TableCell className="text-center">
                            {emp.receipt_id}
                          </TableCell>
                          <TableCell className="text-center">
                            {emp.product_name}
                          </TableCell>
                          <TableCell className="text-center">
                            {Number(emp.quantity)}
                          </TableCell>
                          <TableCell className="text-center">
                            {Number(emp.quantity) * emp.price + " грн"}
                          </TableCell>
                          <TableCell className="text-center">
                            {emp.last_name + " " + emp.first_name}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </ItemContainer>

          <div className="text-lg m-4 text-right font-bold">
            Загальна сума:{" "}
            {productsForReceipt.length > 0
              ? productsForReceipt
                  .reduce(
                    (acc, item) =>
                      acc + Number(item.quantity) * Number(item.price),
                    0
                  )
                  .toFixed(2) + " грн"
              : "0 грн"}
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

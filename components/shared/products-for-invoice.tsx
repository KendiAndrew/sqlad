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
import { ItemContainer } from "./item-container";
import { Title } from "./title";
import { Button, Skeleton } from "../ui";
import {
  pfiWaithName,
  useProductsForInvoiceStore,
} from "@/store/products-for-invoice";
import { useInvoiceStore } from "@/store/invoice";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
interface Props {
  className?: string;
}

export const ProductsForInvoice: React.FC<Props> = ({ className }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("invoice_id");
  const [invoiceType, setInvoiceType] = useState("RECEIVING");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { productsForInvoice, setProductsForInvoice, clearProductsForInvoice } =
    useProductsForInvoiceStore();
  const { invoice, setInvoice, clearInvoice } = useInvoiceStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<pfiWaithName | null>(
    null
  );

  const fetchProductForinvoice = async () => {
    try {
      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.append("searchValue", searchValue);
        params.append("searchType", searchType); // обиране поле
      }

      if (invoiceType) {
        params.append("invoiceType", invoiceType);
      }

      const res = await fetch(`/api/pfi?${params.toString()}`);
      const data = await res.json();
      clearProductsForInvoice();
      setProductsForInvoice(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Помилка при завантаженні продуктів:", error);
    }
  };

  const fetchInvoice = async (searchType = "", searchValue = "") => {
    try {
      setIsLoading(true);
      let url = "/api/invoice";
      if (searchType && searchValue) {
        url += `?type=${searchType}&search=${encodeURIComponent(searchValue)}`;
      }

      const res = await fetch(url, { method: "GET" });
      const data = await res.json();
      clearInvoice();
      setInvoice(data);
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
    fetchProductForinvoice();
    fetchInvoice();
  }, [debouncedSearch, searchType, invoiceType]);

  type FormValues = {
    invoice_id: number;
    quantity: number;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const openModal = (product: pfiWaithName) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProduct(null);
    reset();
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedProduct) return;

    const res = await fetch("/api/pfi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct.product_id,
        ...data,
        needMinus: false,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      toast.success("Додано до накладної");
      closeModal();
      fetchProductForinvoice();
    } else {
      toast.error(result.message || "Помилка");
    }
  };

  return (
    <div className="mt-10">
      <div className="w-full flex justify-start">
        <Title
          text="Продукти для накладних"
          size="lg"
          className="mb-4 font-bold text-left"
        />
      </div>
      <div className="flex flex-col gap-3 mb-4 w-full">
        <div className="flex gap-3 items-center w-full">
          <div className="flex items-center gap-2 w-full">
            {["date_of_manufacture", "use_by_date"].includes(searchType) ? (
              <input
                type="date"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="border px-3 py-1 rounded-md w-full border-primary"
              />
            ) : (
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="border px-3 py-1 rounded-md w-full border-primary"
                placeholder="Введіть значення для пошуку"
              />
            )}

            {searchValue && (
              <button
                onClick={() => setSearchValue("")}
                className="text-red-500 px-2 py-1 border border-red-500 rounded-sm hover:bg-red-100 transition"
              >
                Очистити
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className="border px-2 py-1 rounded-sm border-primary w-full"
          >
            <option value="">Всі типи</option>
            <option value="RECEIVING">Отримання</option>
            <option value="RETURNING">Повернення</option>
            <option value="WRITEOFF">Списання</option>
          </select>

          <select
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              setSearchValue(""); // очищаємо значення при зміні типу пошуку
            }}
            className="border px-2 py-1 rounded-sm border-primary w-full"
          >
            <option value="invoice_id">Id накладної</option>
            <option value="product_name">Назва продукту</option>
            <option value="date_of_manufacture">Дата виготовлення</option>
            <option value="use_by_date">Дата вжити до</option>
          </select>
        </div>
      </div>
      <ItemContainer className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">Номер</TableHead>
              <TableHead className="text-center">Номер накладної</TableHead>
              <TableHead>Продукт</TableHead>
              <TableHead>Кількість</TableHead>
              <TableHead>Ціна</TableHead>
              <TableHead>Дата виготовлення</TableHead>
              <TableHead>Дата вжити до</TableHead>
              <TableHead className="text-center">Повенути/списати</TableHead>
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
                {productsForInvoice.length === 0 ? (
                  <TableRow></TableRow>
                ) : (
                  productsForInvoice.map((emp) => (
                    <TableRow
                      key={emp.products_for_invoice_id}
                      className="transition-transform"
                    >
                      <TableCell className="font-medium text-center">
                        {emp.products_for_invoice_id}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.invoice_id}
                      </TableCell>
                      <TableCell>{emp.product_name}</TableCell>
                      <TableCell>{emp.quantity}</TableCell>
                      <TableCell>{emp.product_price}</TableCell>
                      <TableCell>
                        {String(emp.date_of_manufacture).slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        {String(emp.use_by_date).slice(0, 10)}
                      </TableCell>

                      <TableCell className="text-center">
                        {(() => {
                          const inv = invoice.find(
                            (inv) => inv.invoice_id === emp.invoice_id
                          );
                          if (
                            inv?.status === "Завершено" &&
                            inv.invoice_type.toString() !== "Повернення"
                          ) {
                            return (
                              <Button
                                onClick={() => openModal(emp)}
                                className="p-3 bg-primary text-white hover:bg-primary/90"
                              >
                                Додати
                              </Button>
                            );
                          } else {
                            return "";
                          }
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </>
            )}
          </TableBody>
        </Table>
        {isOpen && selectedProduct && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                Додати "{selectedProduct.product_name}" до накладної
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label>Накладна</label>
                  <select
                    {...register("invoice_id", { required: true })}
                    className="w-full border p-2"
                  >
                    <option value="">Оберіть накладну</option>
                    {invoice
                      .filter((inv) => inv.status != "Завершено")
                      .map((inv) => (
                        <option key={inv.invoice_id} value={inv.invoice_id}>
                          #{inv.invoice_id}
                        </option>
                      ))}
                  </select>

                  {errors.invoice_id && (
                    <p className="text-red-500 text-sm">Оберіть накладну</p>
                  )}
                </div>

                <div>
                  <label>Кількість</label>
                  <input
                    type="number"
                    {...register("quantity", {
                      required: true,
                      min: 1,
                      max: selectedProduct.quantity,
                    })}
                    className="w-full border p-2"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm">Невірна кількість</p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-sm bg-primary text-white"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-sm"
                  >
                    Додати
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ItemContainer>
    </div>
  );
};

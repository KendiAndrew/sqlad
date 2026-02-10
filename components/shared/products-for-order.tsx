"use client";

import React, { useEffect, useState } from "react";
import { Title } from "./title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Skeleton } from "../ui";
import { Trash2Icon } from "lucide-react";
import {
  ProductToOrderWithName,
  useProductsToOrderStore,
} from "@/store/productsToOrder";
import toast from "react-hot-toast";
import { ItemContainer } from "./item-container";
import { useInvoiceStore } from "@/store/invoice";
import { useForm } from "react-hook-form";
import { Denided } from "./denided";

interface Props {
  className?: string;
}
type FormValues = {
  invoice_id: number;
  quantity: number;
  product_price: number;
};

export const ProductsForOrder: React.FC<Props> = ({ className }) => {
  const { productsToOrder, setProductsToOrder, clearProductsToOrder } =
    useProductsToOrderStore();
  const { invoice, setInvoice, clearInvoice } = useInvoiceStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductToOrderWithName | null>(null);
  const [isOk, setIsOk] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();
  const fetchProductsToOrder = async () => {
    try {
      const res = await fetch(`/api/productsOrder?search=${debouncedSearch}`, {
        method: "GET",
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.error("Недостатньо прав доступу");
          setIsOk(false);
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

      setIsOk(true);
      clearProductsToOrder();
      setProductsToOrder(data);
    } catch (error) {
      console.error("Не вдалося завантажити продукт:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      let url = "/api/invoice";

      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        if (res.status === 403) {
          console.error("Недостатньо прав доступу");
          setIsOk(false);
          toast.error("У вас немає прав для перегляду накладних");
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
      clearInvoice();
      setInvoice(data);
    } catch (error) {
      console.error("Не вдалося завантажити накладні:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchProductsToOrder();
    fetchInvoice();
    productsToOrder;
  }, [debouncedSearch]);

  const openModal = (product: ProductToOrderWithName) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProduct(null);
    reset();
  };

  const [isLoading, setIsLoading] = useState(true);
  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/productsOrder/${id}`, {
        method: "DELETE",
      });

      if (res.status === 403) {
        setIsOk(false);

        setTimeout(() => {
          setIsOk(true);
        }, 3000); // 3000 мс = 3 секунди

        toast.error("Недостатньо прав для видалення категорії", { icon: "⛔" });
        return;
      }

      if (!res.ok) {
        throw new Error(`Помилка: ${res.status}`);
      }

      fetchProductsToOrder();
      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити продукт:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!selectedProduct) return;

    const res = await fetch("/api/pfi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct.product_id,
        ...data,
        needMinus: true,
      }),
    });

    if (!res.ok) {
      if (res.status === 403) {
        console.error("Недостатньо прав доступу");
        setIsOk(false);
        toast.error("У вас немає прав для перегляду");
        return;
      }

      if (res.status === 401) {
        console.error("Неавторизований доступ");
        toast.error("Будь ласка, увійдіть у систему");
        return;
      }

      const errorData = await res.json();
      toast.error(errorData.message);
    }
    const result = await res.json();

    if (res.ok) {
      setIsOk(true);
      toast.success("Додано до накладної");
      closeModal();
      fetchProductsToOrder();
    } else {
      toast.error(result.message || "Помилка");
    }
  };

  return (
    <div>
      {isOk === true ? (
        <div className="mt-6">
          <Title
            text="Продукти для замовлення"
            size="lg"
            className="font-bold mb-4"
          />
          <div className="flex items-center gap-2 w-full mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-1 rounded-sm w-full border-primary"
              placeholder="Введіть значення для пошуку"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-red-500 px-2 py-1 border border-red-500 rounded-sm hover:bg-red-100 transition"
              >
                Очистити
              </button>
            )}
          </div>
          <div className="flex flex-col items-end">
            <ItemContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Номер</TableHead>
                    <TableHead className="w-[180px]">Назва</TableHead>
                    <TableHead>Кількість</TableHead>
                    <TableHead>Дата створення</TableHead>
                    <TableHead className="text-center">
                      Додати до накладної
                    </TableHead>
                    <TableHead className="text-right">Видалити</TableHead>
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
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8" />
                          </TableCell>
                        </TableRow>
                      ))
                    : productsToOrder.map((product) => (
                        <TableRow
                          key={product.products_to_order_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {product.products_to_order_id}
                          </TableCell>
                          <TableCell>{product.product_name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            {String(product.order_date).slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => openModal(product)}
                              className="p-3"
                            >
                              Додати
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                handleDeleteProduct(
                                  product.products_to_order_id
                                )
                              }
                              className="p-3"
                            >
                              <Trash2Icon size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </ItemContainer>
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
                          .filter(
                            (inv) =>
                              inv.status === "Виконується" &&
                              inv.invoice_type === "Отримання"
                          )
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
                        })}
                        className="w-full border p-2"
                      />
                      {errors.quantity && (
                        <p className="text-red-500 text-sm">
                          Невірна кількість
                        </p>
                      )}
                    </div>

                    <div>
                      <label>Ціна</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("product_price", {
                          required: true,
                          min: 0,
                        })}
                        className="w-full border p-2"
                      />
                      {errors.product_price && (
                        <p className="text-red-500 text-sm">Ціна ≥ 0</p>
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
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

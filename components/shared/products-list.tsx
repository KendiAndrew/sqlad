"use client";

import React, { useEffect, useState } from "react";
import { Title } from "./title";
import { useProductsStore } from "@/store/products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, Skeleton } from "../ui";
import toast from "react-hot-toast";
import { Trash2Icon } from "lucide-react";
import { AddProductForm } from "./add-product-form";
import { ItemContainer } from "./item-container";
import { Denided } from "./denided";

interface Props {
  className?: string;
}
export const ProductsList: React.FC<Props> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { products, setProducts, clearProducts } = useProductsStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOk, setIsOk] = useState(true);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/products?search=${debouncedSearch}`, {
        method: "GET",
      });
      if (!res.ok) {
        if (res.status === 403) {
          console.error("Недостатньо прав доступу");
          setIsOk(false);
          toast.error("У вас немає прав для перегляду продуктів");
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
      clearProducts();
      setProducts(data);
      setIsOk(true);
    } catch (error) {
      console.error("Не вдалося завантажити продукти:", error);
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
    fetchProducts();
  }, [debouncedSearch]);

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.status === 403) {
        setIsOk(false);

        setTimeout(() => {
          setIsOk(true);
        }, 3000); // 3000 мс = 3 секунди

        toast.error("Недостатньо прав для видалення продукту", { icon: "⛔" });
        return;
      }

      if (!res.ok) {
        throw new Error(`Помилка: ${res.status}`);
      }

      fetchProducts();

      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити продукт:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
    }
  };
  const handleAddToOrder = async (productId: number) => {
    const quantity = prompt("Введіть кількість:");

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      toast.error("Некоректна кількість!", { icon: "❌" });
      return;
    }

    try {
      const res = await fetch("/api/productsOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          quantity: Number(quantity),
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          toast.error("У вас немає прав для зміни продуктів");

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
      fetchProducts();

      toast.success("Успішно додано до замовлення", { icon: "✅" });
    } catch (error) {
      console.error(error);
      toast.error("Не вдалося додати до замовлення", { icon: "❌" });
    }
  };

  return (
    <div>
      {isOk === true ? (
        <div className="mt-6">
          <Title text="Продукти" size="lg" className="font-bold mb-4" />

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
                    <TableHead className="w-[30px]">Номер</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead>Одиниця вимірювання</TableHead>
                    <TableHead>Компанія</TableHead>
                    <TableHead>Зберігати при:</TableHead>
                    <TableHead className="text-center">Додати</TableHead>
                    <TableHead className="text-right">Видалити</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[...Array(5)].map((_, index) => (
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
                      ))}
                    </>
                  ) : (
                    <>
                      {products.map((products) => (
                        <TableRow
                          key={products.product_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {products.product_id}
                          </TableCell>
                          <TableCell>{products.product_name}</TableCell>
                          <TableCell>{products.category_name}</TableCell>
                          <TableCell>{products.unit}</TableCell>
                          <TableCell>{products.company}</TableCell>
                          <TableCell>
                            {products.storage_temperature === null
                              ? "Відсутнє"
                              : products.storage_temperature}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() =>
                                handleAddToOrder(products.product_id)
                              }
                              className="p-3 bg-primary text-white hover:bg-primary/90"
                            >
                              Додати
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                handleDeleteProduct(products.product_id)
                              }
                              className="p-3"
                            >
                              <Trash2Icon size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </ItemContainer>

            <AddProductForm
              fetchProducts={fetchProducts}
              isOk={isOk}
              setIsOk={setIsOk}
            />
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

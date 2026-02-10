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
import {
  ProductsInStock,
  useProductsInStockStore,
} from "@/store/products-in-stock";
import { ItemContainer } from "./item-container";
import { Button, Skeleton } from "../ui";
import { Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Spinner } from "./spinner";
import { usePFRStore } from "@/store/pfr";

interface Props {
  className?: string;
}

export const ReceiptCreate: React.FC<Props> = ({ className }) => {
  const { productsInStock, setProductsInStock, clearProductsInStock } =
    useProductsInStockStore();
  const [searchValue, setSearchValue] = useState("");
  const [quan, setQuan] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | string>(
    ""
  );
  const { pfr, setPfr, clearPfr } = usePFRStore();
  const emplo = useSession();
  const [isOk, setIsOk] = useState(true);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [isLoading2, setIsLoading2] = useState(true);
  const fetchOrCreateDraft = async () => {
    try {
      setIsLoading2(true);

      const employeeId = emplo.data?.user.id;
      const res = await fetch("/api/receipt/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Не вдалося отримати чернетку");
      }

      setReceiptId(data.receiptId);
    } catch (err: any) {
      console.error("Помилка отримання чернетки:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [haveCheck, setHaveCheck] = useState(false);

  const handleAddProduct = async () => {
    if (!selectedProductId || !quan) {
      toast.error("Будь ласка, заповніть всі поля перед додаванням продукту.");
      return;
    }

    try {
      const res = await fetch("/api/pfr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_id: receiptId,
          employee_id: emplo.data?.user.id,
          product_id: Number(selectedProductId),
          quantity: Number(quan),
          price: productsInStock.find(
            (p) => p.product_id === Number(selectedProductId)
          )?.product_price,
          // <-- статична ціна на момент продажу
        }),
      });

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
      toast.success("Продукт успішно додано до чека");
      setQuan("");
      setSearchValue("");
      fetchAvailablePFR(Number(receiptId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchAvailableProducts = async (searchValue = "") => {
    try {
      setIsLoading(true);

      let url = "/api/getall";
      if (searchValue) {
        url += `?search=${encodeURIComponent(searchValue)}`;
      }

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

      const data = await res.json();
      clearProductsInStock();
      setProductsInStock(data);
      setIsLoading2(false);
    } catch (error) {
      console.error("Не вдалося завантажити продукти:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePFR = async (receiptId: number) => {
    try {
      setIsLoading(true);

      if (!receiptId) {
        throw new Error("receiptId обов'язковий");
      }

      const url = `/api/pfr?searchValue=${receiptId}&searchType=receipt_id`;

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

      const data = await res.json();
      clearPfr();
      setPfr(data);
      setIsLoading2(false);
    } catch (error) {
      console.error("Не вдалося завантажити продукти:", error);
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
    fetchOrCreateDraft();

    fetchAvailableProducts(searchValue);
  }, [debouncedSearch, searchValue]);

  const handleDeleteProduct = async (productForReceiptId: number) => {
    if (!confirm("Ви впевнені, що хочете видалити цей продукт?")) return;

    try {
      const res = await fetch(`/api/pfr/${productForReceiptId}`, {
        method: "DELETE",
      });

      const data = await res.json();

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

      // 🔁 Оновлення даних після видалення
      await fetchAvailablePFR(Number(receiptId)); // або будь-яка функція для оновлення списку
    } catch (error) {
      console.error("Помилка при видаленні продукту:", error);
      alert("Не вдалося видалити продукт");
    }
  };

  const handleSellProducts = async (receiptId: number) => {
    try {
      const res = await fetch("/api/receipt/sales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiptId }),
      });

      const data = await res.json();

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

      toast.success("Чек оновлено до 'Продаж'");
      setHaveCheck(false);
    } catch (error) {
      console.error("Помилка:", error);
      toast.error("Не вдалося оновити чек");
    }
  };

  if (isLoading2)
    return (
      <div>
        <Spinner />
      </div>
    );

  return (
    <div className={cn("mt-10", className)}>
      <div>
        {haveCheck === true ? (
          <div className="w-full flex justify-start flex-col">
            <Title
              text="Заповніть чек"
              size="lg"
              className="mb-4 font-bold text-left"
            />

            <div className=" flex items-center gap-4 w-full px-5">
              <div className="flex items-center gap-2 w-[300px] mt-5">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="border px-3 py-1 rounded-md w-full border-primary"
                  placeholder="Введіть значення для пошуку"
                />

                {searchValue && (
                  <button
                    onClick={() => setSearchValue("")}
                    className="text-red-500 px-2 py-1 border border-red-500 rounded-sm hover:bg-red-100 transition"
                  >
                    Очистити
                  </button>
                )}
              </div>
              <div className="flex gap-3 mt-5 w-[300px]">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSearchValue("");
                  }}
                  className="border px-2 py-1 rounded-sm border-primary w-full"
                >
                  <option value="">Оберіть продукт</option>
                  {productsInStock.map((emp, _ind) => (
                    <option key={_ind} value={emp.product_id}>
                      {emp.products_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 w-[300px] mt-5">
                <input
                  type="text"
                  value={quan}
                  onChange={(e) => setQuan(e.target.value)}
                  className="border px-3 py-1 rounded-md w-full border-primary"
                  placeholder="Введіть кількість"
                />

                {quan && (
                  <button
                    onClick={() => setQuan("")}
                    className="text-red-500 px-2 py-1 border border-red-500 rounded-sm hover:bg-red-100 transition"
                  >
                    Очистити
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <Button onClick={handleAddProduct} className="p-3 m-4 text-md">
                Додати продукт
              </Button>
            </div>

            <ItemContainer className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Продукт</TableHead>
                    <TableHead className="text-center">Кількість</TableHead>
                    <TableHead className="text-center">Ціна</TableHead>
                    <TableHead className="text-center">Продавець</TableHead>
                    <TableHead className="text-center">Видалити</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[...Array(5)].map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: 5 }).map((_, cellIndex) => (
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
                      {pfr.length === 0 ? (
                        <TableRow></TableRow>
                      ) : (
                        pfr.map((emp, _i) => (
                          <TableRow key={_i} className="transition-transform">
                            <TableCell className="text-center">
                              {emp.product_name}
                            </TableCell>
                            <TableCell className="text-center">
                              {Number(emp.quantity)}
                            </TableCell>
                            <TableCell className="text-center">
                              {Number(emp.quantity) * Number(emp.price) +
                                " грн"}
                            </TableCell>
                            <TableCell className="text-center">
                              {emp.last_name + " " + emp.first_name}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                onClick={() =>
                                  handleDeleteProduct(
                                    emp.products_for_receipt_id
                                  )
                                }
                                className="p-3"
                              >
                                <Trash2Icon size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </ItemContainer>

            <div className="flex gap-3 mt-5 w-full items-center justify-between">
              {pfr.length !== 0 ? (
                <Button
                  onClick={() => handleSellProducts(Number(receiptId))}
                  className="p-3 m-4 text-md"
                >
                  Продати
                </Button>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <Button
              onClick={() => {
                setHaveCheck(true);

                fetchAvailablePFR(Number(receiptId));
              }}
              className="text-lg p-10 "
            >
              Створити чек
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

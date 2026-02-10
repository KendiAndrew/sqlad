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
import { ItemContainer } from "./item-container";
import { Button, Skeleton } from "../ui";
import { useReceiptStore } from "@/store/receipt";
import { useProductsForReceiptStore } from "@/store/products-for-receipt";
import { useEmployeeStore } from "@/store/employee";
import toast from "react-hot-toast";
import { Denided } from "./denided";
import { useSession } from "next-auth/react";

interface Props {
  className?: string;
}

export const Receipts: React.FC<Props> = ({ className }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("receipt_id");
  const [isLoading, setIsLoading] = useState(true);
  const { receipts, setReceipts, clearReceipts } = useReceiptStore();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | string>(
    ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const { productsForReceipt, setProductsForReceipt, clearProductsForReceipt } =
    useProductsForReceiptStore();
  const [isOk, setIsOk] = useState(true);

  const fetchReceipt = async (searchType = "", searchValue = "") => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (searchType && searchValue) {
        params.append("searchType", searchType);
        params.append("searchValue", searchValue);
      }

      const url = `/api/receipt${params.toString() ? `?${params}` : ""}`;

      const res = await fetch(url);
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
      setIsOk(true);
      clearReceipts();
      setReceipts(data);
    } catch (error) {
      console.error("Не вдалося завантажити чеки:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProducts = async (invoiceId: number) => {
    setSelectedReceiptId(invoiceId);
    try {
      const res = await fetch(
        `/api/pfr?searchType=receipt_id&searchValue=${invoiceId}`
      );
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
      clearProductsForReceipt();
      setProductsForReceipt(data); // отриманий список продуктів
      setIsModalOpen(true);
    } catch (error) {
      console.error("Помилка при завантаженні продуктів:", error);
    }
  };

  const handleReturnProducts = async (invoiceId: number) => {
    setSelectedReceiptId(invoiceId);
    try {
      const res = await fetch(
        `/api/pfr?searchType=receipt_id&searchValue=${invoiceId}`
      );

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
      clearProductsForReceipt();
      setProductsForReceipt(data); // отриманий список продуктів
      setIsReturnModalOpen(true);
    } catch (error) {
      console.error("Помилка при завантаженні продуктів:", error);
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
    fetchReceipt(searchType, searchValue);
  }, [debouncedSearch, searchType, searchValue]);

  type SelectedProduct = {
    quantity: number;
    isChecked: boolean;
  };

  type SelectedProducts = {
    [products_for_receipt_id: number]: SelectedProduct;
  };

  const [returnAll, setReturnAll] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>(
    {}
  );

  const handleCheckboxChange = (id: number, quantity: number) => {
    setSelectedProducts((prev) => {
      const isCurrentlyChecked = prev[id]?.isChecked ?? false;
      return {
        ...prev,
        [id]: {
          quantity: prev[id]?.quantity ?? 1,
          isChecked: !isCurrentlyChecked,
        },
      };
    });
  };

  const handleQuantityChange = (id: number, value: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: value },
    }));
  };

  const user = useSession();

  const handleSubmitReturn = async () => {
    const payload = {
      receiptId: selectedReceiptId,
      returnAll,
      employeeId: user.data?.user.id,
      selectedProducts,
    };

    try {
      const res = await fetch("/api/receipt", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
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
      toast.success(data.message);
      setIsReturnModalOpen(false);
      fetchReceipt();
    } catch (error) {
      console.error(error);
      toast.error("Помилка при поверненні чека");
    }
  };

  return (
    <div>
      {isOk === true ? (
        <div className="mt-10">
          <div className="w-full flex justify-start">
            <Title text="Чеки" size="lg" className="mb-4 font-bold text-left" />
          </div>
          <div className="flex gap-3 items-center mb-4 w-full">
            <div className="flex items-center gap-2 w-[80%]">
              {searchType === "receipt_create_date" ? (
                <input
                  type="date"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="border px-3 py-1 rounded-md w-full border-primary"
                  placeholder="Введіть значення для пошуку"
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

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="border px-2 py-1 rounded-sm border-primary"
            >
              <option value="receipt_id">Id чека</option>
              <option value="last_name">Ім'я працівника</option>
              <option value="receipt_create_date">За датою створення</option>
            </select>
          </div>
          <ItemContainer className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">Номер чека</TableHead>
                  <TableHead>Працівник</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Створений</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead className="text-center">Переглянути</TableHead>
                  <TableHead className="text-center">Повернути</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 8 }).map((_, cellIndex) => (
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
                    {receipts.length === 0 ? (
                      <TableRow></TableRow>
                    ) : (
                      receipts.map((emp) => (
                        <TableRow
                          key={emp.receipt_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {emp.receipt_id}
                          </TableCell>
                          <TableCell>
                            {emp.last_name + " " + emp.first_name}
                          </TableCell>
                          <TableCell>{emp.receipt_type}</TableCell>
                          <TableCell>
                            {String(emp.receipt_create_date).slice(0, 10) +
                              " " +
                              String(emp.receipt_create_date).slice(11, 16)}
                          </TableCell>
                          <TableCell>{emp.total_price + " грн"}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => {
                                handleViewProducts(emp.receipt_id);
                              }}
                              className="p-3 bg-primary text-white hover:bg-primary/90"
                            >
                              Переглянути
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            {emp.receipt_type !== "Повернення" && (
                              <Button
                                onClick={() =>
                                  handleReturnProducts(emp.receipt_id)
                                }
                                className="p-3 bg-primary text-white hover:bg-primary/90"
                              >
                                Повернути
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </ItemContainer>
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded w-[1100px] flex flex-col ">
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Продукти для чека #{selectedReceiptId}
                  </h2>

                  {productsForReceipt.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Продукт</TableHead>
                          <TableHead>Кількість</TableHead>
                          <TableHead>Ціна</TableHead>
                          <TableHead>Сума</TableHead>
                          <TableHead>Продавець</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <>
                            {[...Array(5)].map((_, index) => (
                              <TableRow key={index}>
                                {Array.from({ length: 10 }).map(
                                  (_, cellIndex) => (
                                    <TableCell
                                      key={cellIndex}
                                      className={
                                        cellIndex === 0
                                          ? "font-medium"
                                          : "text-right"
                                      }
                                    >
                                      <Skeleton className="h-8" />
                                    </TableCell>
                                  )
                                )}
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
                                  <TableCell>{emp.product_name}</TableCell>
                                  <TableCell>{Number(emp.quantity)}</TableCell>
                                  <TableCell>
                                    {String(emp.price).slice(0, 10) + " грн"}
                                  </TableCell>
                                  <TableCell>
                                    {String(
                                      emp.price * Number(emp.quantity)
                                    ).slice(0, 5) + " грн"}
                                  </TableCell>
                                  <TableCell>
                                    {emp.last_name + " " + emp.first_name}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>Продукти не знайдено.</p>
                  )}
                </div>
                <div className="my-5 mr-3 text-right">
                  {(() => {
                    const receipt = receipts.find(
                      (r) => r.receipt_id === selectedReceiptId
                    );
                    return receipt
                      ? `Чек створив: ${receipt.last_name} ${receipt.first_name}`
                      : "";
                  })()}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-sm w-[100px]"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------------------------------------------ */}

          {isReturnModalOpen && (
            <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded w-[1100px] flex flex-col ">
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Продукти на повернення для чека #{selectedReceiptId}
                  </h2>

                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={returnAll}
                      onChange={() => {
                        setReturnAll(!returnAll);
                        setSelectedProducts({}); // очищення вибору продуктів
                      }}
                    />
                    <span className="font-medium">Повернути весь чек</span>
                  </label>

                  {productsForReceipt.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Обрати</TableHead>
                          <TableHead>Продукт</TableHead>
                          <TableHead>Кількість</TableHead>
                          <TableHead>Ціна</TableHead>
                          <TableHead>Сума</TableHead>
                          <TableHead>Продавець</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {isLoading ? (
                          <>
                            {[...Array(5)].map((_, index) => (
                              <TableRow key={index}>
                                {Array.from({ length: 10 }).map(
                                  (_, cellIndex) => (
                                    <TableCell
                                      key={cellIndex}
                                      className={
                                        cellIndex === 0
                                          ? "font-medium"
                                          : "text-right"
                                      }
                                    >
                                      <Skeleton className="h-8" />
                                    </TableCell>
                                  )
                                )}
                              </TableRow>
                            ))}
                          </>
                        ) : (
                          <>
                            {productsForReceipt.length === 0 ? (
                              <TableRow></TableRow>
                            ) : (
                              productsForReceipt.map((emp) => (
                                <TableRow key={emp.products_for_receipt_id}>
                                  <TableCell>
                                    {!returnAll && (
                                      <input
                                        type="checkbox"
                                        checked={
                                          selectedProducts[
                                            emp.products_for_receipt_id
                                          ]?.isChecked || false
                                        }
                                        onChange={() =>
                                          handleCheckboxChange(
                                            emp.products_for_receipt_id,
                                            Number(emp.quantity)
                                          )
                                        }
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>{emp.product_name}</TableCell>
                                  <TableCell>
                                    {!returnAll &&
                                    selectedProducts[
                                      emp.products_for_receipt_id
                                    ]?.isChecked &&
                                    Number(emp.quantity) > 1 ? (
                                      <input
                                        type="number"
                                        min={1}
                                        max={Number(emp.quantity)}
                                        value={
                                          selectedProducts[
                                            emp.products_for_receipt_id
                                          ]?.quantity || 1
                                        }
                                        onChange={(e) =>
                                          handleQuantityChange(
                                            emp.products_for_receipt_id,
                                            Number(e.target.value)
                                          )
                                        }
                                        className="border px-1 py-1 w-16"
                                      />
                                    ) : (
                                      Number(emp.quantity)
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {String(emp.price).slice(0, 5)} грн
                                  </TableCell>
                                  <TableCell>
                                    {String(
                                      Number(emp.quantity) * emp.price
                                    ).slice(0, 5)}
                                    грн
                                  </TableCell>
                                  <TableCell>
                                    {emp.last_name + " " + emp.first_name}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>Продукти не знайдено.</p>
                  )}
                </div>
                <div className="my-5 mr-3 text-right">
                  {(() => {
                    const receipt = receipts.find(
                      (r) => r.receipt_id === selectedReceiptId
                    );
                    return receipt
                      ? `Чек створив: ${receipt.last_name} ${receipt.first_name}`
                      : "";
                  })()}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsReturnModalOpen(false)}
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-sm w-[100px]"
                  >
                    Закрити
                  </button>
                  <button
                    onClick={handleSubmitReturn}
                    className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-sm w-[100px]"
                  >
                    Повернути
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

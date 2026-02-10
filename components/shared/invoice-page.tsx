"use client";

import React, { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button, Skeleton } from "../ui";
import { Title } from "./title";
import { invoiceWithNames, useInvoiceStore } from "@/store/invoice";
import { ItemContainer } from "./item-container";
import toast from "react-hot-toast";
import { useProvidersStore } from "@/store/provider";
import {
  pfiWaithName,
  useProductsForInvoiceStore,
} from "@/store/products-for-invoice";
import { Denided } from "./denided";
interface Props {
  className?: string;
}

export const InvoicePage: React.FC<Props> = ({ className }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("invoice_id");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { invoice, setInvoice, clearInvoice } = useInvoiceStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedinvoice, setSelectedInvoice] = useState<invoiceWithNames>();
  const { provider, setProviders } = useProvidersStore();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { productsForInvoice, setProductsForInvoice, clearProductsForInvoice } =
    useProductsForInvoiceStore();
  const [selectedProduct, setSelectedProduct] = useState<pfiWaithName | null>();
  const [isOk, setIsOk] = useState(true);

  const handleViewProducts = async (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    try {
      const res = await fetch(
        `/api/pfi?searchType=invoice_id&searchValue=${invoiceId}`
      );

      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          setIsModalOpen(false);
          setSelectedProduct(null);
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
      clearProductsForInvoice();
      setProductsForInvoice(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Помилка при завантаженні продуктів:", error);
    }
  };

  const fetchProviders = async () => {
    const res = await fetch("/api/provider");
    if (!res.ok) {
      if (res.status === 403) {
        setIsOk(false);

        setIsModalOpen(false);
        setSelectedProduct(null);
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
    setProviders(data);
  };
  const fetchInvoice = async (searchType = "", searchValue = "") => {
    try {
      setIsLoading(true);
      let url = "/api/invoice";
      if (searchType && searchValue) {
        url += `?type=${searchType}&search=${encodeURIComponent(searchValue)}`;
      }

      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          setIsModalOpen(false);
          setSelectedProduct(null);
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
      clearInvoice();
      setInvoice(data);
    } catch (error) {
      console.error("Не вдалося завантажити працівників:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditInvoice = (employee: invoiceWithNames) => {
    setSelectedInvoice(employee);
    setIsEditModalOpen(true);
  };
  const handleDeleteInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/invoice/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (res.status === 403) {
          setIsOk(false);
          setIsModalOpen(false);
          setSelectedProduct(null);
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

      fetchInvoice();
      setIsOk(true);
      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити продукт:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
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
    fetchInvoice(searchType, debouncedSearch);
    fetchProviders();
  }, [debouncedSearch, searchType]);

  const [newInvoice, setNewInvoice] = useState({
    provider_id: "",
    invoice_type: "",
  });

  const handleUpdateProduct = async (product: pfiWaithName) => {
    if (!product.date_of_manufacture || !product.use_by_date) {
      toast.error("Всі поля мають бути заповнені.");
      return;
    }

    const dateOfManufacture = new Date(product.date_of_manufacture);
    const useByDate = new Date(product.use_by_date);

    if (dateOfManufacture >= useByDate) {
      toast.error("Дата виготовлення повинна бути меншою за дату вжити до.");
      return;
    }

    const res = await fetch(`/api/pfi/${product.products_for_invoice_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date_of_manufacture: product.date_of_manufacture,
        use_by_date: product.use_by_date,
        product_price: product.product_price,
      }),
    });

    if (!res.ok) {
      if (res.status === 403) {
        setIsOk(false);
        setIsModalOpen(false);
        setSelectedProduct(null);
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

    if (res.ok) {
      toast.success("Продукт успішно оновлено!");
      setSelectedProduct(null);
      setIsOk(true);
      handleViewProducts(product.invoice_id);
      // Оновити список або закрити модальне вікно
    } else {
      toast.error("Помилка при оновленні продукту.");
    }
  };

  const deleteProductFromInvoice = async (id: number, id2: number) => {
    const res = await fetch(`/api/pfi/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      if (res.status === 403) {
        setIsOk(false);
        setIsModalOpen(false);
        setSelectedProduct(null);
        setSelectedInvoiceId(null);
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
      throw new Error(data.error || "Помилка при видаленні");
    }
    setIsOk(true);
    handleViewProducts(id2);
    return data;
  };

  return (
    <div>
      {isOk === true ? (
        <div className="mt-10">
          <div className="w-full flex justify-start">
            <Title
              text="Накладні"
              size="lg"
              className="mb-4 font-bold text-left"
            />
          </div>
          <div className="flex gap-3 items-center mb-4 w-full">
            <div className="flex items-center gap-2 w-[80%]">
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

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="border px-2 py-1 rounded-sm border-primary"
            >
              <option value="invoice_id">Id накладної</option>
              <option value="provider_name">Ім’я постачальника</option>
              <option value="employee_name">Ім'я працівника</option>
              <option value="created_at">За датою створення</option>
              <option value="invoice_type">За типом накладної</option>
            </select>
          </div>
          <ItemContainer className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">Номер</TableHead>
                  <TableHead>Працівник</TableHead>
                  <TableHead>Постачальник</TableHead>
                  <TableHead>Створена</TableHead>
                  <TableHead>Завершена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead className="text-center">Продукти</TableHead>
                  <TableHead className="text-center">Редагувати</TableHead>
                  <TableHead className="text-right">Видалити</TableHead>
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
                    {invoice.length === 0 ? (
                      <TableRow></TableRow>
                    ) : (
                      invoice.map((emp) => (
                        <TableRow
                          key={emp.invoice_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {emp.invoice_id}
                          </TableCell>
                          <TableCell>
                            {emp.employee_last_name +
                              " " +
                              emp.employee_first_name}
                          </TableCell>
                          <TableCell>
                            {emp.provider_last_name +
                              " " +
                              emp.provider_first_name}
                          </TableCell>
                          <TableCell>
                            {String(emp.created_at).slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            {String(emp.completed_at).slice(0, 10)}
                          </TableCell>
                          <TableCell>{emp.status}</TableCell>
                          <TableCell>{emp.invoice_type}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => handleViewProducts(emp.invoice_id)}
                              className="p-3 bg-primary text-white hover:bg-primary/90"
                            >
                              Переглянути
                            </Button>
                          </TableCell>
                          <TableCell className="text-center">
                            {emp.status === "Завершено" ? (
                              ""
                            ) : (
                              <Button
                                onClick={() => handleEditInvoice(emp)}
                                className="p-3 bg-primary text-white hover:bg-primary/90"
                              >
                                Редагувати
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                handleDeleteInvoice(emp.invoice_id)
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
            {isEditModalOpen && selectedinvoice && (
              <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded shadow w-[700px] relative">
                  <h2 className="text-xl font-bold mb-4">
                    Редагування накладної
                  </h2>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      const { invoice_id, created_at, completed_at, status } =
                        selectedinvoice;

                      // Перевірка, що всі обов'язкові поля не пусті (null, undefined, пустий рядок)
                      if (
                        !completed_at ||
                        !status ||
                        String(completed_at).trim() === "" ||
                        String(status).trim() === ""
                      ) {
                        toast.error("Будь ласка, заповніть усі поля.");
                        return;
                      }

                      const createdAtDate = new Date(created_at);
                      const completedAtDate = new Date(completed_at);

                      // Перевірка: дата створення не може бути після дати завершення
                      if (createdAtDate > completedAtDate) {
                        toast.error(
                          "Дата створення не може бути пізніше за дату завершення накладної."
                        );
                        return;
                      }

                      // Готуємо тіло запиту
                      const updatedData = {
                        ...selectedinvoice,
                      };

                      const res = await fetch(`/api/invoice/${invoice_id}`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updatedData),
                      });
                      if (!res.ok) {
                        if (res.status === 403) {
                          setIsOk(false);
                          setIsModalOpen(false);
                          setSelectedProduct(null);
                          setSelectedInvoiceId(null);
                          setIsEditModalOpen(false);
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
                        throw new Error(
                          errorData.message || "Невідома помилка"
                        );
                      }

                      if (res.ok) {
                        toast.success("Накладну оновлено!");
                        setIsEditModalOpen(false);
                        fetchInvoice();
                      } else {
                        toast.error("Помилка при оновленні");
                      }
                    }}
                    className="space-y-4"
                  >
                    <input
                      className="w-full border px-2 py-1"
                      type="date"
                      value={
                        selectedinvoice.completed_at
                          ? new Date(selectedinvoice.completed_at)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedInvoice({
                          ...selectedinvoice,
                          completed_at: new Date(e.target.value),
                        })
                      }
                    />

                    <select
                      className="w-full border px-2 py-1"
                      value={selectedinvoice.status}
                      onChange={(e) =>
                        setSelectedInvoice({
                          ...selectedinvoice,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="">Виберіть статус</option>
                      <option value="Виконується">Виконується</option>
                      <option value="Завершено">Завершено</option>
                    </select>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 bg-gray-400 text-white rounded"
                      >
                        Скасувати
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded"
                      >
                        Зберегти
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}{" "}
          </ItemContainer>

          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded w-[1100px] flex flex-col ">
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Продукти для накладної #{selectedInvoiceId}
                  </h2>

                  {productsForInvoice.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30px]">Id</TableHead>
                          <TableHead>Номер накладної</TableHead>
                          <TableHead>Продукт</TableHead>
                          <TableHead>Кількість</TableHead>
                          <TableHead>Ціна</TableHead>
                          <TableHead>Дата виготовлення</TableHead>
                          <TableHead>Дата вжити до</TableHead>
                          <TableHead className="text-center">
                            Редагувати
                          </TableHead>
                          <TableHead className="text-center">
                            Видалити
                          </TableHead>
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
                            {invoice.length === 0 ? (
                              <TableRow></TableRow>
                            ) : (
                              productsForInvoice.map((emp) => (
                                <TableRow
                                  key={emp.products_for_invoice_id}
                                  className="transition-transform"
                                >
                                  <TableCell className="font-medium">
                                    {emp.products_for_invoice_id}
                                  </TableCell>
                                  <TableCell>{emp.invoice_id}</TableCell>
                                  <TableCell>{emp.product_name}</TableCell>
                                  <TableCell>{emp.quantity}</TableCell>
                                  <TableCell>
                                    {String(emp.product_price).slice(0, 10) +
                                      " грн"}
                                  </TableCell>
                                  <TableCell>
                                    {String(emp.date_of_manufacture).slice(
                                      0,
                                      10
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {String(emp.use_by_date).slice(0, 10)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {invoice.find(
                                      (inv) => inv.invoice_id === emp.invoice_id
                                    )?.status === "Завершено" ? (
                                      " "
                                    ) : (
                                      <Button
                                        onClick={() => setSelectedProduct(emp)}
                                        className="p-3 bg-primary text-white hover:bg-primary/90"
                                      >
                                        Редагувати продукт
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {invoice.find(
                                      (inv) => inv.invoice_id === emp.invoice_id
                                    )?.status === "Завершено" ? (
                                      " "
                                    ) : (
                                      <Button
                                        onClick={async () => {
                                          try {
                                            await deleteProductFromInvoice(
                                              emp.products_for_invoice_id,
                                              emp.invoice_id
                                            );
                                            toast.success("Продукт видалено");
                                          } catch (e: any) {
                                            toast.error(e.message);
                                          }
                                        }}
                                        className="p-3 bg-primary text-white hover:bg-primary/90"
                                      >
                                        Видалити продукт
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
                  ) : (
                    <p>Продукти не знайдено.</p>
                  )}
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

          {selectedProduct && (
            <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex justify-center items-center z-50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedProduct) {
                    handleUpdateProduct(selectedProduct);
                  }
                }}
                className="bg-white p-6 rounded w-full max-w-md space-y-4"
              >
                <h2 className="text-lg font-semibold">Редагування продукту</h2>

                <label className="block">
                  Дата виготовлення:
                  <input
                    type="date"
                    className="w-full border px-2 py-1"
                    value={
                      selectedProduct.date_of_manufacture
                        ? new Date(selectedProduct.date_of_manufacture)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        date_of_manufacture: new Date(e.target.value),
                      })
                    }
                    required
                  />
                </label>

                <label className="block">
                  Використати до:
                  <input
                    type="date"
                    className="w-full border px-2 py-1"
                    value={
                      selectedProduct.use_by_date
                        ? new Date(selectedProduct.use_by_date)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        use_by_date: new Date(e.target.value),
                      })
                    }
                    required
                  />
                </label>

                <label className="block">
                  Ціна:
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border px-2 py-1"
                    value={selectedProduct.product_price || ""}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        product_price: Number(e.target.value), // зберігаємо як string
                      })
                    }
                    required
                  />
                </label>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="bg-gray-300 px-4 py-2 rounded"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Зберегти
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="flex items-center justify-center">
            <div className="mt-5 w-[50%]">
              <Title
                text="Форма для створення накладної"
                size="lg"
                className="mb-4"
              />
              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  // Якщо тип "Списання", не передаємо provider_id
                  const payload = {
                    invoice_type: newInvoice.invoice_type,
                    provider_id:
                      newInvoice.invoice_type === "Списання"
                        ? null
                        : Number(newInvoice.provider_id),
                  };

                  const response = await fetch("/api/invoice", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                  });

                  if (response.ok) {
                    toast.success("Успішно створено", { icon: "✅" });
                    setNewInvoice({
                      provider_id: "",
                      invoice_type: "",
                    });
                    fetchInvoice();
                  } else {
                    toast.error("Помилка при створенні накладної");
                  }
                }}
                className="flex flex-col items-end space-y-4"
              >
                <select
                  className="w-full border px-2 py-1 rounded-sm border-primary"
                  value={newInvoice.invoice_type}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewInvoice({
                      ...newInvoice,
                      invoice_type: value,
                      // якщо Списання — прибираємо постачальника
                      provider_id:
                        value === "Списання" ? "" : newInvoice.provider_id,
                    });
                  }}
                >
                  <option value="">Оберіть тип накладної</option>
                  <option value="Отримання">Отримання</option>
                  <option value="Списання">Списання</option>
                  <option value="Повернення">Повернення</option>
                </select>

                {newInvoice.invoice_type === "Списання" ? (
                  <></>
                ) : (
                  <select
                    className="w-full border px-2 py-1 rounded-sm border-primary"
                    value={newInvoice.provider_id}
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        provider_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Оберіть постачальника</option>
                    {provider.map((prov) => (
                      <option key={prov.provider_id} value={prov.provider_id}>
                        {prov.last_name} {prov.first_name}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex justify-end gap-2 rounded-sm border-primary">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-sm"
                  >
                    Створити
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

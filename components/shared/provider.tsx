"use client";
import React, { useEffect, useState } from "react";
import { Trash2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Title } from "./title";
import { ItemContainer } from "./item-container";
import { Button, Skeleton } from "../ui";
import { useProvidersStore } from "@/store/provider";
import toast from "react-hot-toast";
import { Denided } from "./denided";

interface Props {
  className?: string;
}

export const Provider: React.FC<Props> = ({ className }) => {
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("last_name");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { provider, setProviders, clearProviders } = useProvidersStore();
  const [newProvider, setNewProvider] = useState({
    last_name: "",
    first_name: "",
    company_name: "",
    phone_number: "",
    email: "",
  });
  const [isOk, setIsOk] = useState(true);

  const fetchProviders = async (searchType = "", searchValue = "") => {
    try {
      setIsLoading(true);
      let url = "/api/provider";
      if (searchType && searchValue) {
        url += `?type=${searchType}&search=${encodeURIComponent(searchValue)}`;
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
      clearProviders();
      setIsOk(true);
      setProviders(data);
    } catch (error) {
      console.error("Не вдалося завантажити працівників:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    try {
      const res = await fetch(`/api/provider/${id}`, {
        method: "DELETE",
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
      fetchProviders();

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
    fetchProviders(searchType, debouncedSearch);
  }, [debouncedSearch, searchType]);

  return (
    <div>
      {isOk === true ? (
        <div className="flex flex-col items-center mt-10">
          <div className="w-full flex justify-start">
            <Title
              text="Постачальники"
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
              <option value="last_name">Прізвище</option>
              <option value="first_name">Ім’я</option>
              <option value="phone_number">Телефон</option>
              <option value="email">Email</option>
              <option value="company_name">Компанія</option>
            </select>
          </div>

          <ItemContainer className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px] text-center">Номер</TableHead>
                  <TableHead>Прізвище</TableHead>
                  <TableHead>Ім'я</TableHead>
                  <TableHead>Номер телефону</TableHead>
                  <TableHead>Пошта</TableHead>
                  <TableHead>Компанія</TableHead>
                  <TableHead className="text-right">Видалити</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 7 }).map((_, cellIndex) => (
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
                    {provider.length === 0 ? (
                      <TableRow></TableRow>
                    ) : (
                      provider.map((emp) => (
                        <TableRow
                          key={emp.provider_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {emp.provider_id}
                          </TableCell>
                          <TableCell>{emp.last_name}</TableCell>
                          <TableCell>{emp.first_name}</TableCell>
                          <TableCell>{emp.phone_number}</TableCell>
                          <TableCell>{emp.email}</TableCell>
                          <TableCell>{emp.company_name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                handleDeleteProvider(emp.provider_id)
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

          <div className="mt-5">
            <Title
              text="Форма для створення постачальника"
              size="lg"
              className="mb-4"
            />
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Перевірка на порожні поля
                const isEmpty = Object.values(newProvider).some(
                  (value) => value.trim() === ""
                );

                if (isEmpty) {
                  toast.error(
                    "Будь ласка, заповніть усі поля перед створенням постачальника."
                  );
                  return;
                }

                // Формування даних для відправки
                const payload = { ...newProvider };

                const res = await fetch("/api/provider", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
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

                if (res.ok) {
                  toast.success("Постачальника створено!");
                  // Очистити форму або оновити список користувачів
                  setNewProvider({
                    last_name: "",
                    first_name: "",
                    phone_number: "",
                    email: "",
                    company_name: "",
                  });
                  fetchProviders();
                } else {
                  toast.error("Помилка при створенні постачальника");
                }
              }}
              className="flex flex-col items-end space-y-4"
            >
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newProvider.last_name}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, last_name: e.target.value })
                }
                placeholder="Прізвище"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newProvider.first_name}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, first_name: e.target.value })
                }
                placeholder="Ім'я"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newProvider.company_name}
                onChange={(e) =>
                  setNewProvider({
                    ...newProvider,
                    company_name: e.target.value,
                  })
                }
                placeholder="Назва компанії"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newProvider.phone_number}
                onChange={(e) =>
                  setNewProvider({
                    ...newProvider,
                    phone_number: e.target.value,
                  })
                }
                placeholder="Телефон"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="email"
                value={newProvider.email}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, email: e.target.value })
                }
                placeholder="Email"
              />

              <div className="flex justify-end gap-2 rounded-sm border-primary">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Створити
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

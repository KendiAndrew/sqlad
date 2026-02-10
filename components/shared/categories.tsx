"use client";

import React, { useEffect, useState } from "react";
import { Title } from "./title";
import { Button, Input, Skeleton } from "../ui";
import { Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { useCategoryStore } from "@/store/category";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemContainer } from "./item-container";
import { Denided } from "./denided";

interface Props {
  className?: string;
}

export const Categories: React.FC<Props> = ({ className }) => {
  const { categories, setCategories, clearCategories } = useCategoryStore();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOk, setIsOk] = useState(true);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`/api/categories?search=${debouncedSearch}`);
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
      clearCategories();
      setIsOk(true);
      setCategories(data);
    } catch (error) {
      console.error("Не вдалося завантажити категорії:", error);
      toast.error("Помилка при завантаженні категорій");
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

  // Завантаження категорій при зміні debouncedSearch
  useEffect(() => {
    fetchCategories();
  }, [debouncedSearch]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName }),
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

      // ✅ Після успішного додавання — оновлюємо список з сервера
      await fetchCategories();

      setNewCategoryName("");

      toast.success("Успішно додано", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося додати категорію:", error);
      toast.error("Не вдалося додати", { icon: "❌" });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
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

      fetchCategories();
      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити категорію:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
    }
  };

  return (
    <div>
      {isOk === true ? (
        <div className="px-40 mt-10">
          <Title text="Категорії" size="lg" className="font-bold mb-4" />
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

          <ItemContainer>
            <div className="flex flex-col items-end">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] mr-4">
                      Номер категорії
                    </TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead className="text-right">Видалити</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, index) => (
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
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {Array.isArray(categories) ? (
                        categories.map((category) => (
                          <TableRow
                            key={category.category_id}
                            className="transition-transform"
                          >
                            <TableCell className="text-center">
                              {category.category_id}
                            </TableCell>
                            <TableCell>{category.category_name}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() =>
                                  handleDeleteCategory(category.category_id)
                                }
                                className="p-3"
                              >
                                <Trash2Icon size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </ItemContainer>

          <div className="flex gap-2 mt-6 items-end w-full justify-end">
            <Input
              type="text"
              placeholder="Нова категорія"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="border p-2 rounded border-primary w-[300px]"
            />

            <Button onClick={handleAddCategory}>Додати</Button>
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

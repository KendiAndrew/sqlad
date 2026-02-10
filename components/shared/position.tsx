"use client";

import React, { useEffect, useState } from "react";
import { Title } from "./title";
import { Button, Input, Skeleton } from "../ui";
import { Trash2Icon } from "lucide-react";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemContainer } from "./item-container";
import { usePositionStore } from "@/store/position";
import { useSession } from "next-auth/react";
import { Denided } from "./denided";

interface Props {
  className?: string;
}

export const Position: React.FC<Props> = ({ className }) => {
  const { position, setPosition, clearPosition } = usePositionStore();
  const [newPosition, setNewPosition] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const user = useSession();
  const [isOk, setIsOk] = useState(true);

  const fetchPosition = async () => {
    try {
      const res = await fetch(`/api/position?search=${debouncedSearch}`, {
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
      clearPosition();
      setIsOk(true);
      setPosition(data);
    } catch (error) {
      console.error("Не вдалося завантажити посади:", error);
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
    fetchPosition();
  }, [debouncedSearch]);

  const handleAddPosition = async () => {
    if (!newPosition.trim()) return;

    try {
      const res = await fetch("/api/position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newPosition }),
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

      // ✅ Після успішного додавання — оновлюємо список з сервера
      await fetchPosition();

      setNewPosition("");
      toast.success("Успішно додано", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося додати посаду:", error);
      toast.error("Не вдалося додати", { icon: "❌" });
    }
  };

  const handleDeletePositon = async (id: number) => {
    try {
      const res = await fetch(`/api/position/${id}`, {
        method: "DELETE",
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

      fetchPosition();
      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити посаду:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
    }
  };

  return (
    <div>
      {isOk === true ? (
        <div className="px-40 mt-10">
          <Title text="Посади" size="lg" className="font-bold mb-4" />

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
                    <TableHead className="w-[100px] text-center">
                      Номер
                    </TableHead>
                    <TableHead>Назва</TableHead>
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
                        </TableRow>
                      ))
                    : position.map((position) => (
                        <TableRow
                          key={position.position_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {position.position_id}
                          </TableCell>
                          <TableCell>{position.position_name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() =>
                                handleDeletePositon(position.position_id)
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
            </div>
          </ItemContainer>

          <div className="flex gap-2 mt-6 items-end w-full justify-end">
            <Input
              type="text"
              placeholder="Нова посада"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              className="border p-2 rounded border-primary w-[300px]"
            />
            <Button onClick={handleAddPosition}>Додати</Button>
          </div>
        </div>
      ) : (
        <Denided />
      )}
    </div>
  );
};

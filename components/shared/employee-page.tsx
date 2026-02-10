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
import { Button, Skeleton } from "../ui";
import { EmployeeWithRole, useEmployeeStore } from "@/store/employee";
import toast from "react-hot-toast";
import { ItemContainer } from "./item-container";
import { Title } from "./title";
import { usePositionStore } from "@/store/position";
import { Denided } from "./denided";

interface Props {
  className?: string;
}

export const EmployeePage: React.FC<Props> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { employee, setEmployee, clearEmployee } = useEmployeeStore();
  const position = usePositionStore((state) => state.position);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRole>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOk, setIsOk] = useState(true);

  const handleEditEmployee = (employee: EmployeeWithRole) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const fetchUsers = async (searchType = "", searchValue = "") => {
    try {
      setIsLoading(true);
      let url = "/api/employee";
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
      setIsOk(true);
      clearEmployee();
      setEmployee(data);
    } catch (error) {
      console.error("Не вдалося завантажити працівників:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const res = await fetch(`/api/employee/${id}`, {
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
      fetchUsers();

      toast.success("Успішно видалено", { icon: "✅" });
    } catch (error) {
      console.error("Не вдалося видалити продукт:", error);
      toast.error("Не вдалося видалити", { icon: "❌" });
    }
  };

  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("last_name");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // виклик fetch при зміні введення
  useEffect(() => {
    fetchUsers(searchType, debouncedSearch);
  }, [debouncedSearch, searchType]);

  const [newEmployee, setNewEmployee] = useState({
    last_name: "",
    first_name: "",
    middle_name: "",
    phone_number: "",
    email: "",
    hire_date: "",
    position_id: "",
    position_name: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password1, setPassword1] = useState("");
  const [confirmPassword1, setConfirmPassword1] = useState("");

  return (
    <div>
      {isOk === true ? (
        <div className="flex flex-col items-center mt-10">
          <div className="w-full flex justify-start">
            <Title
              text="Працівники"
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
              <option value="position_name">Посада</option>
            </select>
          </div>

          <ItemContainer className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px] text-center">Номер</TableHead>
                  <TableHead>Прізвище</TableHead>
                  <TableHead>Ім'я</TableHead>
                  <TableHead>По батькові</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Пошта</TableHead>
                  <TableHead>Дата початку</TableHead>
                  <TableHead>Дата завершення</TableHead>
                  <TableHead>Посада</TableHead>
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
                    {employee.length === 0 ? (
                      <TableRow></TableRow>
                    ) : (
                      employee.map((emp) => (
                        <TableRow
                          key={emp.employee_id}
                          className="transition-transform"
                        >
                          <TableCell className="font-medium text-center">
                            {emp.employee_id}
                          </TableCell>
                          <TableCell>{emp.last_name}</TableCell>
                          <TableCell>{emp.first_name}</TableCell>
                          <TableCell>{emp.middle_name}</TableCell>
                          <TableCell>{emp.phone_number}</TableCell>
                          <TableCell>{emp.email}</TableCell>
                          <TableCell>
                            {String(emp.hire_date).slice(0, 10)}
                          </TableCell>
                          <TableCell>
                            {String(emp.dismissal_date).slice(0, 10)}
                          </TableCell>
                          <TableCell>{emp.position_name}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => handleEditEmployee(emp)}
                              className="p-3 bg-primary text-white hover:bg-primary/90"
                            >
                              Редагувати
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleDeleteUser(emp.employee_id)}
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
            {isEditModalOpen && selectedEmployee && (
              <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded shadow w-[500px] relative">
                  <h2 className="text-xl font-bold mb-4">
                    Редагування працівника
                  </h2>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (
                        (password || confirmPassword) &&
                        password !== confirmPassword
                      ) {
                        toast.error(
                          "Паролі не співпадають або одне з полів не заповнене!"
                        );
                        return;
                      }

                      // Готуємо тіло запиту
                      const updatedData = {
                        ...selectedEmployee,
                      };

                      // Якщо пароль введено — додаємо до об'єкта
                      if (password) {
                        updatedData.password = password;
                      }

                      const res = await fetch(
                        `/api/employee/${selectedEmployee.employee_id}`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(updatedData),
                        }
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
                        throw new Error(
                          errorData.message || "Невідома помилка"
                        );
                      }

                      if (res.ok) {
                        toast.error("Працівника оновлено!");
                        setIsEditModalOpen(false);
                        fetchUsers();
                      } else {
                        toast.error("Помилка при оновленні");
                      }
                    }}
                    className="space-y-4"
                  >
                    <input
                      className="w-full border px-2 py-1"
                      type="text"
                      value={selectedEmployee.last_name}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          last_name: e.target.value,
                        })
                      }
                      placeholder="Прізвище"
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="text"
                      value={selectedEmployee.first_name}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="Ім'я"
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="text"
                      value={selectedEmployee.middle_name}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          middle_name: e.target.value,
                        })
                      }
                      placeholder="По батькові"
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="text"
                      value={selectedEmployee.phone_number}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          phone_number: e.target.value,
                        })
                      }
                      placeholder="Телефон"
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="email"
                      value={selectedEmployee.email}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          email: e.target.value,
                        })
                      }
                      placeholder="Email"
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Новий пароль"
                    />

                    {/* Поле для підтвердження паролю */}
                    <input
                      className="w-full border px-2 py-1"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Підтвердження паролю"
                    />

                    <input
                      className="w-full border px-2 py-1"
                      type="date"
                      value={
                        selectedEmployee.hire_date
                          ? new Date(selectedEmployee.hire_date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          hire_date: new Date(e.target.value),
                        })
                      }
                    />
                    <input
                      className="w-full border px-2 py-1"
                      type="date"
                      value={
                        selectedEmployee.dismissal_date
                          ? new Date(selectedEmployee.dismissal_date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          dismissal_date: new Date(e.target.value),
                        })
                      }
                    />

                    <input
                      className="w-full border px-2 py-1"
                      type="text"
                      value={selectedEmployee.position_name}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                        })
                      }
                      placeholder="Посада"
                    />

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
            )}
          </ItemContainer>

          <div className="mt-5">
            <Title
              text="Форма для створення користувача"
              size="lg"
              className="mb-4"
            />
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Перевірка паролів
                if (
                  (password1 || confirmPassword1) &&
                  password1 !== confirmPassword1
                ) {
                  toast.error(
                    "Паролі не співпадають або одне з полів не заповнене!"
                  );
                  return;
                }

                // Знаходимо position_name по position_id
                const selectedPosition = position.find(
                  (pos) =>
                    pos.position_id.toString() === newEmployee.position_id
                );

                const position_name = selectedPosition?.position_name || "";

                // Формування даних для відправки
                const payload = {
                  ...newEmployee,
                  hire_date: newEmployee.hire_date
                    ? new Date(newEmployee.hire_date)
                    : null,
                  password: password1 || undefined,
                  position_name, // додаємо сюди назву посади
                };

                const response = await fetch("/api/employee", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                });

                if (response.ok) {
                  toast.success("Користувач успішео створений", { icon: "✅" });
                  setNewEmployee({
                    last_name: "",
                    first_name: "",
                    middle_name: "",
                    phone_number: "",
                    email: "",
                    hire_date: "",
                    position_id: "",
                    position_name: "",
                  });
                  setPassword1("");
                  setConfirmPassword1("");
                  fetchUsers();
                } else {
                  toast.error("Помилка при створенні користувача");
                }
              }}
              className="flex flex-col items-end space-y-4"
            >
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newEmployee.last_name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, last_name: e.target.value })
                }
                placeholder="Прізвище"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newEmployee.first_name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, first_name: e.target.value })
                }
                placeholder="Ім'я"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newEmployee.middle_name}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    middle_name: e.target.value,
                  })
                }
                placeholder="По батькові"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="text"
                value={newEmployee.phone_number}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    phone_number: e.target.value,
                  })
                }
                placeholder="Телефон"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                placeholder="Email"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="password"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                placeholder="Пароль"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="password"
                value={confirmPassword1}
                onChange={(e) => setConfirmPassword1(e.target.value)}
                placeholder="Підтвердження паролю"
              />
              <input
                className="w-full border px-2 py-1 rounded-sm border-primary"
                type="date"
                value={newEmployee.hire_date}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, hire_date: e.target.value })
                }
              />

              <select
                className="w-full border px-2 py-1 rounded-sm border-primary"
                value={newEmployee.position_id || ""}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    position_id: e.target.value, // конвертуємо в число
                  })
                }
              >
                <option value="" disabled>
                  Оберіть посаду
                </option>
                {position.map((pos) => (
                  <option key={pos.position_id} value={pos.position_id}>
                    {pos.position_name}
                  </option>
                ))}
              </select>

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
      ) : (
        <Denided />
      )}
    </div>
  );
};

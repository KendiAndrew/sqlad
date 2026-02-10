"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { toast } from "react-hot-toast";
import { useCategoryStore } from "@/store/category";

interface AddProductFormProps {
  fetchProducts: () => void;
  isOk: boolean;
  setIsOk: (a: boolean) => void;
}

// 1. Схема валідації
const formSchema = z.object({
  products_name: z.string().min(1, "Назва обов'язкова"),
  category_id: z.string().min(1, "Категорія обов'язкова"),
  unit: z.string().min(1, "Одиниця виміру обов'язкова"),
  company: z.string().min(1, "Компанія обов'язкова"),
  storage_temperature: z.string().optional(),
});

type ProductFormData = z.infer<typeof formSchema>;

export const AddProductForm = ({
  fetchProducts,
  isOk,
  setIsOk,
}: AddProductFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      products_name: "",
      category_id: "",
      unit: "",
      company: "",
      storage_temperature: "",
    },
  });

  const categories = useCategoryStore((state) => state.categories);

  const onSubmit = async (data: ProductFormData) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
      toast.success("Успішно додано ✅");
      reset();
    } catch (error) {
      console.error("Не вдалося додати продукт:", error);
      toast.error("Не вдалося додати ❌");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-wrap gap-4 mt-5 max-w-full"
    >
      <div className="flex flex-col">
        <Input placeholder="Назва продукту" {...register("products_name")} />
        {errors.products_name && (
          <span className="text-red-500 text-sm">
            {errors.products_name.message}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <select
          {...register("category_id")}
          className="border border-gray rounded-[20px] p-2"
        >
          <option value="">Оберіть категорію</option>
          {categories.map((cat) => (
            <option
              key={cat.category_name}
              value={cat.category_id}
              className="rounded-sm"
            >
              {cat.category_name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <span className="text-red-500 text-sm">
            {errors.category_id.message}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <Input placeholder="Одиниця виміру" {...register("unit")} />
        {errors.unit && (
          <span className="text-red-500 text-sm">{errors.unit.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <Input placeholder="Компанія" {...register("company")} />
        {errors.company && (
          <span className="text-red-500 text-sm">{errors.company.message}</span>
        )}
      </div>

      <div className="flex flex-col">
        <Input
          placeholder="Температура зберігання"
          {...register("storage_temperature")}
        />
      </div>

      <div className="flex items-end">
        <Button type="submit">Додати продукт</Button>
      </div>
    </form>
  );
};

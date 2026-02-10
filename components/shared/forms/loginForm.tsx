"use client";

import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { formLoginSchema, TFormLoginValues } from "./schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Title } from "../title";
import { FormInput } from "../form-input";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { Container } from "../container";

interface Props {
  className?: string;
}

export const LoginForm: React.FC<Props> = ({ className }) => {
  const form = useForm<TFormLoginValues>({
    resolver: zodResolver(formLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const onSubmit = async (data: TFormLoginValues) => {
    try {
      setIsLoggingIn(true);
      console.log("1231312412");
      const res = await signIn("credentials", {
        ...data,
        redirect: false,
      });

      if (!res) return null;

      if (!res.ok) {
        if (res.status === 403) {
          console.error("Недостатньо прав доступу");
          toast.error("У вас немає прав для перегляду категорій");
          return;
        }

        if (res.status === 401) {
          console.error("Неавторизований доступ");
          toast.error("Не правильний логін або пароль");
          setIsLoggingIn(false);
          return;
        }
      }

      toast.success("Успішний вхід", { icon: "✅" });
      setTimeout(async () => {
        const response = await fetch("/api/auth/session");
        const updatedSession = await response.json();

        const role = updatedSession?.user?.role;

        if (role === "admin_role") {
          window.location.replace("/admin"); // Використовуємо window.location.replace()
        }
        if (role === "seller_role") {
          window.location.replace("/employee"); // Використовуємо window.location.replace()
        }

        setIsLoggingIn(false);
      }, 500); // невелика затримка для оновлення сесії
    } catch (error) {
      toast.error("Не вдалося увійти в акаунт", { icon: "❌" });
      console.error("Error [LOGIN]", error);
      setIsLoggingIn(false);
    }
  };

  return (
    <Container>
      <div className="relative h-screen">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] bg-white rounded-sm border border-primary p-10">
          <FormProvider {...form}>
            <form
              className={`flex flex-col gap-5 ${className}`}
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex justify-between items-center">
                <div className="mr-2">
                  <Title text="Увійти" size="md" className="font-bold" />
                  <p className="text-gray-400">
                    Введіть свою пошту, щоб увійти
                  </p>
                </div>
              </div>

              <FormInput name="email" label="E-Mail" required />
              <FormInput
                name="password"
                label="Пароль"
                type="password"
                required
              />

              <Button
                type="submit"
                loading={isLoggingIn}
                className="h-12 text-base"
              >
                Увійти
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </Container>
  );
};

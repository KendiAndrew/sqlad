"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useEffect, useState } from "react";
import { Container, Logo, ReceiptCreate, Spinner } from "@/components/shared";
import { cn } from "@/lib/utils";

export default function Employee() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Стан для контролю завантаження

  useEffect(() => {
    // Якщо сесія ще завантажується, нічого не робимо
    if (status === "loading") {
      return;
    }

    // Якщо сесії немає або роль користувача не "Адміністратор", редирект на головну
    if (!session || session.user.role !== "seller_role") {
      router.push("/"); // Перенаправляємо на головну сторінку або іншу сторінку
    } else {
      setIsLoading(false); // Якщо роль правильна, дозволяємо рендерити сторінку
    }
  }, [session, status, router]);

  if (isLoading) {
    return <Spinner />; // Показуємо спіннер до завершення перевірки сесії
  }

  return (
    <div>
      <Container>
        <header className={cn("bg-white rounded-2xl p-3 flex justify-between")}>
          <Logo />
          <Button
            className="text-base"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Вийти
          </Button>
        </header>

        <ReceiptCreate className="mb-10" />
      </Container>
    </div>
  );
}

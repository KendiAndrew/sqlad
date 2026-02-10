"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Categories,
  Container,
  Header,
  Invoices,
  Personal,
  Products,
  ReceiptPage,
  Spinner,
  StatisticMain,
} from "@/components/shared";

const menuItems = [
  { label: "Категорії", value: "categories" },
  { label: "Продукти", value: "products" },
  { label: "Накладні", value: "invoice" },
  { label: "Персонал", value: "personal" },
  { label: "Чеки", value: "receipt" },
  { label: "Статистика", value: "statistic" },
];

export default function AdminPage() {
  const [activeItem, setActiveItem] = useState("categories");
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Стан для контролю завантаження

  useEffect(() => {
    // Якщо сесія ще завантажується, нічого не робимо
    if (status === "loading") {
      return;
    }

    // Якщо сесії немає або роль користувача не "Адміністратор", редирект на головну
    if (!session || session.user.role !== "admin_role") {
      router.push("/"); // Перенаправляємо на головну сторінку або іншу сторінку
    } else {
      setIsLoading(false); // Якщо роль правильна, дозволяємо рендерити сторінку
    }
  }, [session, status, router]);

  if (isLoading) {
    return <Spinner />; // Показуємо спіннер до завершення перевірки сесії
  }

  const renderCategoriesComponents = () => {
    switch (activeItem) {
      case "categories":
        return <Categories />;
      case "products":
        return <Products />;
      case "invoice":
        return <Invoices />;
      case "personal":
        return <Personal />;
      case "receipt":
        return <ReceiptPage />;
      case "statistic":
        return <StatisticMain />;
      default:
        return null;
    }
  };
  return (
    <Container className="p-5">
      <Header
        menuItems={menuItems}
        activeItems={activeItem}
        setActiveItems={setActiveItem}
      />
      <div className="flex gap-6 p-4 rounded-[10px] mb-8">
        <div className="w-full">{renderCategoriesComponents()}</div>
      </div>
    </Container>
  );
}

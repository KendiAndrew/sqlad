import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!id) {
    return NextResponse.json(
      { error: "Не передано ID продукту для видалення" },
      { status: 400 }
    );
  }

  // 🔐 Перевірка ролі
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { message: "Неавторизований доступ" },
      { status: 401 }
    );
  }

  const prisma = getPrismaByRole(session.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Недостатньо прав" }, { status: 403 });
  }

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM products_for_invoice WHERE products_for_invoice_id = ${id}
    `;

    return NextResponse.json({
      message: "Накладну успішно видалено",
      rowsAffected: result,
    });
  } catch (error) {
    console.error("DELETE /categories error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2010") {
        const message = error.message || "";
        if (
          message.includes("42501") ||
          (error.meta && JSON.stringify(error.meta).includes("42501"))
        ) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      }
    }

    return NextResponse.json(
      { message: "Помилка при видаленні категорії" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { message: "Неавторизований доступ" },
      { status: 401 }
    );
  }

  const prisma = getPrismaByRole(session.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Недостатньо прав" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { date_of_manufacture, use_by_date, product_price } = body;
    const id = Number(params.id);

    if (!date_of_manufacture || !use_by_date || product_price === undefined) {
      return NextResponse.json(
        { message: "Усі поля є обов'язковими" },
        { status: 400 }
      );
    }

    if (new Date(date_of_manufacture) > new Date(use_by_date)) {
      return NextResponse.json(
        {
          message:
            "Дата виготовлення не може бути пізніше за дату використання",
        },
        { status: 400 }
      );
    }

    // Оновлюємо ціну, дату виготовлення і дату використання для одного запису
    await prisma.$executeRaw`
      UPDATE products_for_invoice
      SET
        product_price = ${Number(product_price)},
        date_of_manufacture = TO_DATE(${date_of_manufacture}, 'YYYY-MM-DD'),
        use_by_date = TO_DATE(${use_by_date}, 'YYYY-MM-DD')
      WHERE products_for_invoice_id = ${id}
    `;

    // Тригер у БД автоматично оновить інші ціни цього продукту (якщо є)

    return NextResponse.json({ message: "Оновлено успішно" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /categories error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2010") {
        const message = error.message || "";
        if (
          message.includes("42501") ||
          (error.meta && JSON.stringify(error.meta).includes("42501"))
        ) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      }
    }

    return NextResponse.json(
      { message: "Помилка при видаленні категорії" },
      { status: 500 }
    );
  }
}

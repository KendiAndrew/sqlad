import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaByRole(session.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const searchValue = searchParams.get("searchValue") || "";
  const invoiceType = searchParams.get("invoiceType"); // RECEIVING, RETURNING, WRITEOFF
  const searchType = searchParams.get("searchType"); // invoice_id, product_name, etc.

  const invoiceTypeMap: Record<string, string> = {
    RECEIVING: "Отримання",
    RETURNING: "Повернення",
    WRITEOFF: "Списання",
  };

  const values: any[] = [];
  let sql = `
    SELECT pfi.*, p.product_name, i.invoice_type
    FROM products_for_invoice pfi
    JOIN products p ON pfi.product_id = p.product_id
    JOIN invoice i ON pfi.invoice_id = i.invoice_id
    WHERE 1 = 1
  `;

  if (invoiceType && invoiceTypeMap[invoiceType]) {
    values.push(invoiceTypeMap[invoiceType]);
    sql += ` AND i.invoice_type = $${values.length}::invoice_type_enum`;
  }

  if (searchValue) {
    switch (searchType) {
      case "invoice_id":
        values.push(Number(searchValue));
        sql += ` AND pfi.invoice_id = $${values.length}`;
        break;

      case "product_name":
        values.push(`%${searchValue}%`);
        sql += ` AND LOWER(p.product_name) LIKE LOWER($${values.length})`;
        break;

      case "date_of_manufacture":
        values.push(searchValue);
        sql += ` AND pfi.date_of_manufacture = $${values.length}`;
        break;

      case "use_by_date":
        values.push(searchValue);
        sql += ` AND pfi.use_by_date = $${values.length}`;
        break;
    }
  }

  sql += ` ORDER BY pfi.date_of_manufacture DESC`;

  try {
    const result = await prisma.$queryRawUnsafe(sql, ...values);
    return NextResponse.json(result);
  } catch (error) {
    console.error("SQL GET /products_for_invoice error:", error);

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
      { message: "Помилка при виконанні SQL-запиту" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(session.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { product_id, invoice_id, quantity, product_price } = body;

    if (
      isNaN(product_id) ||
      isNaN(invoice_id) ||
      isNaN(quantity) ||
      isNaN(product_price)
    ) {
      return NextResponse.json(
        { message: "Некоректні дані для створення запису" },
        { status: 400 }
      );
    }

    // Виконуємо чистий SQL INSERT
    // Логіка оновлення кількості і перевірки наявності в тригері!
    await prisma.$executeRaw`
      INSERT INTO products_for_invoice (product_id, invoice_id, quantity, product_price)
      VALUES (${Number(product_id)}, ${Number(invoice_id)}, ${Number(
      quantity
    )}, ${Number(product_price)})
    `;

    return NextResponse.json(
      { message: "Товар додано до накладної" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/products_for_invoice error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const msg = error.message.toLowerCase();

      // Помилка з тригера про недостатню кількість
      if (msg.includes("недостатня кількість товару")) {
        return NextResponse.json(
          { message: "Недостатня кількість товару" },
          { status: 400 }
        );
      }

      // Помилка доступу
      if (error.code === "P2010") {
        const meta = error.meta ? JSON.stringify(error.meta) : "";
        if (msg.includes("42501") || meta.includes("42501")) {
          return NextResponse.json(
            { message: "Доступ заборонено" },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json({ message: "Серверна помилка" }, { status: 500 });
  }
}

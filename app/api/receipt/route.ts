import { prisma } from "@/prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function GET(req: Request) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const searchType = searchParams.get("searchType");
    const searchValue = searchParams.get("searchValue");

    // Формуємо фільтр WHERE у вигляді SQL умови
    let whereClause = `WHERE 1=1`; // базовий фільтр

    const params: (string | number | Date)[] = [];

    if (searchType && searchValue) {
      switch (searchType) {
        case "receipt_id":
          whereClause += ` AND receipt_id = $1`;
          params.push(Number(searchValue));
          break;

        case "receipt_create_date":
          const dateStart = new Date(searchValue);
          const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
          whereClause += ` AND receipt_create_date >= $1 AND receipt_create_date < $2`;
          params.push(dateStart, dateEnd);
          break;

        case "last_name":
          whereClause += ` AND last_name ILIKE '%' || $1 || '%'`;
          params.push(searchValue);
          break;
      }
    }

    // Запит до представлення
    const query = `
      SELECT *
      FROM receipt_with_total
      ${whereClause}
      ORDER BY receipt_create_date DESC
    `;

    // Виконуємо SQL запит через prisma.$queryRaw
    const receipts = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(receipts);
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
      { message: "Не достатньо продуктів в наявності" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { employeeId, receiptId, returnAll, selectedProducts } =
      await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: "Не вказано працівника" },
        { status: 400 }
      );
    }

    // ✅ 1. Якщо є returnAll або selectedProducts → ПОВЕРНЕННЯ
    if (
      returnAll ||
      (selectedProducts && Object.keys(selectedProducts).length > 0)
    ) {
      // 1.1 Створити новий чек типу "Повернення"
      const newReturnReceipt: any[] = await prisma.$queryRaw`
        INSERT INTO receipt (receipt_type, receipt_create_date, employee_id)
        VALUES ('Повернення', NOW(), ${Number(employeeId)})
        RETURNING receipt_id;
      `;
      const newReceiptId = newReturnReceipt[0].receipt_id;

      // 1.2 Отримати продукти з оригінального чека
      const originalProducts: any[] = await prisma.$queryRaw`
        SELECT * FROM products_for_receipt
        WHERE receipt_id = ${Number(receiptId)};
      `;

      // 1.3 Визначити, які продукти повертати
      const productsToReturn = returnAll
        ? originalProducts
        : originalProducts.filter(
            (product) =>
              selectedProducts[product.products_for_receipt_id]?.isChecked
          );

      // 1.4 Підготувати масив для вставки
      const valuesSQL = productsToReturn
        .map((product) => {
          const quantity = returnAll
            ? product.quantity
            : selectedProducts[product.products_for_receipt_id].quantity;

          return `(${newReceiptId}, ${product.product_id}, ${quantity}, ${product.price}, ${product.employee_id})`;
        })
        .join(",");

      if (valuesSQL.length > 0) {
        // 1.5 Додати продукти до нового чека
        await prisma.$executeRawUnsafe(`
          INSERT INTO products_for_receipt (receipt_id, product_id, quantity, price, employee_id)
          VALUES ${valuesSQL};
        `);
      }

      return NextResponse.json({
        message: "Повернення успішно створено",
        receiptId: newReceiptId,
      });
    }

    // ✅ 2. Інакше — логіка чернетки
    const existingDraft: any[] = await prisma.$queryRaw`
      SELECT receipt_id FROM receipt
      WHERE employee_id = ${Number(employeeId)} AND receipt_type = 'Чернетка'
      ORDER BY receipt_create_date DESC
      LIMIT 1;
    `;

    if (existingDraft.length > 0) {
      return NextResponse.json({
        receiptId: existingDraft[0].receipt_id,
        message: "Знайдено існуючу чернетку",
      });
    }

    const newDraft: any[] = await prisma.$queryRaw`
      INSERT INTO receipt (receipt_type, receipt_create_date, employee_id)
      VALUES ('Чернетка', NOW(), ${Number(employeeId)})
      RETURNING receipt_id;
    `;

    return NextResponse.json({
      receiptId: newDraft[0].receipt_id,
      message: "Створено нову чернетку",
    });
  } catch (error) {
    console.error("POST /receipt error:", error);

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
      { message: "Не достатньо продуктів в наявності" },
      { status: 500 }
    );
  }
}

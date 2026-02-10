import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

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
    const searchValue = searchParams.get("searchValue") || "";
    const searchType = searchParams.get("searchType") || "";
    const employeeId = searchParams.get("employeeId") || "";
    const receiptType = searchParams.get("receipt_type") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // 🧱 Побудова умов WHERE
    const conditions: string[] = [];
    const params: any[] = [];

    let paramIdx = 1;

    if (searchValue.trim()) {
      if (searchType === "receipt_id") {
        conditions.push(`pfr.receipt_id = $${paramIdx++}`);
        params.push(Number(searchValue));
      } else if (searchType === "product_name") {
        conditions.push(`
          pfr.product_id IN (
            SELECT product_id FROM products 
            WHERE product_name ILIKE $${paramIdx++}
          )
        `);
        params.push(`%${searchValue}%`);
      }
    }

    if (employeeId) {
      conditions.push(`pfr.employee_id = $${paramIdx++}`);
      params.push(Number(employeeId));
    }

    if (receiptType) {
      conditions.push(`r.receipt_type = $${paramIdx++}`);
      params.push(receiptType);
    }

    if (dateFrom) {
      conditions.push(`r.receipt_create_date >= $${paramIdx++}`);
      params.push(new Date(dateFrom));
    }

    if (dateTo) {
      conditions.push(`r.receipt_create_date <= $${paramIdx++}`);
      params.push(new Date(dateTo));
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const query = `
  SELECT 
    pfr.products_for_receipt_id,
    pfr.receipt_id,
    pfr.product_id,
    pfr.quantity,
    pfr.employee_id,
    pfr.price,
    r.receipt_create_date,
    r.receipt_type,
    e.first_name,
    e.last_name,
    p.product_name,
    (
      pfr.quantity * (
        SELECT pfi.product_price
        FROM products_for_invoice pfi
        WHERE pfi.product_id = pfr.product_id
        ORDER BY pfi.products_for_invoice_id DESC
        LIMIT 1
      )
    ) AS total_price
  FROM products_for_receipt pfr
  JOIN receipt r ON r.receipt_id = pfr.receipt_id
  JOIN employee e ON e.employee_id = pfr.employee_id
  JOIN products p ON p.product_id = pfr.product_id
  ${whereClause}
  ORDER BY pfr.products_for_receipt_id DESC
`;

    const result = await prisma.$queryRawUnsafe(query, ...params);

    return NextResponse.json(result);
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

export async function POST(req: Request) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { receipt_id, employee_id, product_id, quantity, price } = body;

    if (!receipt_id || !employee_id || !product_id || !quantity || !price) {
      return NextResponse.json(
        { message: "Усі поля (включно з price) обов'язкові" },
        { status: 400 }
      );
    }

    // Ціна тепер фіксується під час продажу
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO products_for_receipt (receipt_id, employee_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4, $5)
      `,
      receipt_id,
      Number(employee_id),
      product_id,
      quantity,
      Number(price)
    );

    return NextResponse.json({ message: "Продукт успішно додано до чека" });
  } catch (error: any) {
    console.error("POST /products-for-receipt error:", error);

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

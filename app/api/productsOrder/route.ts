import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
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
    const search = searchParams.get("search")?.trim() ?? "";

    const productsWithNames = search
      ? await prisma.$queryRaw`
          SELECT 
            pto.products_to_order_id,
            pto.product_id,
            pto.quantity,
            pto.order_date,
            p.product_name
          FROM products_to_order pto
          JOIN products p ON p.product_id = pto.product_id
          WHERE LOWER(p.products_name) LIKE LOWER(${`%${search}%`})
        `
      : await prisma.$queryRaw`
          SELECT 
            pto.products_to_order_id,
            pto.product_id,
            pto.quantity,
            pto.order_date,
            p.product_name
          FROM products_to_order pto
          JOIN products p ON p.product_id = pto.product_id
        `;

    return NextResponse.json(productsWithNames);
  } catch (error) {
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
      { message: "Помилка при пошуку продукту" },
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

    const body = await req.json();
    const { product_id, quantity } = body;

    const newProductForOrder = await prisma.$queryRaw`
      INSERT INTO products_to_order (product_id, quantity, order_date)
      VALUES (${product_id}, ${quantity}, CURRENT_DATE)
      RETURNING *;
    `;

    return NextResponse.json(newProductForOrder);
  } catch (error) {
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
      { message: "Помилка при додаванні продукту" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await getServerSession(authOptions);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(user.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";

    const searchCondition = search
      ? `WHERE LOWER(p."products_name") LIKE LOWER('%${search}%')`
      : "";

    const query = `
      SELECT 
        p."product_id",
        p."product_name",
        p."category_id",
        p."unit",
        p."company",
        p."storage_temperature",
        c."category_name"
      FROM "products" p
      JOIN "categories" c ON p."category_id" = c."category_id"
      ${searchCondition}
      ORDER BY p."product_id" ASC
    `;

    const productsWithCategory = await prisma.$queryRawUnsafe(query);

    return NextResponse.json(productsWithCategory);
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
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerSession(authOptions);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(user.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { products_name, category_id, unit, company, storage_temperature } =
      body;

    const result = await prisma.$queryRaw`
    INSERT INTO products (product_name, category_id, unit, company, storage_temperature)
    VALUES (${products_name}, ${Number(category_id)}, ${unit}, ${company}, ${
      "Температура за цельсієм " + storage_temperature
    })
    RETURNING *;
    `;

    return NextResponse.json(result);
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
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

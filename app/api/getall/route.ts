// app/api/products-in-stock/route.ts
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function GET(req: NextRequest) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search");

    const products = await prisma.$queryRawUnsafe<
      {
        product_id: number;
        products_name: string;
        quantity: number;
        product_price: number;
      }[]
    >(
      `
      SELECT * FROM products_in_stock
      ${search ? `where LOWER(products_name) LIKE '%' || $1 || '%'` : ""}
      ORDER BY product_id DESC
      `,
      ...(search ? [search.toLowerCase()] : [])
    );

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        quantity: Number(p.quantity), // або p.product_id.toString()
      }))
    );
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
      { message: "Не отримані продукти" },
      { status: 500 }
    );
  }
}

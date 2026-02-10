import { getPrismaByRole } from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
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
    const search = searchParams.get("search");

    let categories;
    if (search) {
      categories = await prisma.$queryRaw`
        SELECT * FROM "categories"
        WHERE LOWER("category_name") LIKE ${"%" + search.toLowerCase() + "%"}
      `;
    } else {
      categories = await prisma.$queryRaw`SELECT * FROM "categories"`;
    }

    return NextResponse.json(categories);
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
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name } = body;

    const newCategory = await prisma.$queryRaw`
      INSERT INTO categories (category_name)
      VALUES (${name})
      RETURNING *;
    `;

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("POST /categories error:", error);

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
      { message: "Помилка при створенні категорії" },
      { status: 500 }
    );
  }
}

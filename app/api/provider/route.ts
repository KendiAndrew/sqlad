import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const userSession = await getServerSession(authOptions);

  if (!userSession) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaByRole(userSession.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "last_name";
  const search = searchParams.get("search")?.trim() ?? "";

  const validTypes = [
    "last_name",
    "phone_number",
    "email",
    "company_name",
    "first_name",
  ];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { message: "Некоректний тип пошуку" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT * FROM provider WHERE "${type}" ILIKE $1`,
      `%${search}%`
    );
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

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { first_name, last_name, company_name, phone_number, email } =
      await req.json();

    // Виконуємо SQL-запит
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO provider 
        (first_name, last_name,company_name, phone_number, email)
      VALUES 
        ($1, $2, $3, $4, $5)
      `,
      first_name,
      last_name,
      company_name,
      phone_number,
      email
    );

    return NextResponse.json({ message: "Постачальника додано успішно" });
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

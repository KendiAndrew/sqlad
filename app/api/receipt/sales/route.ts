import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function PUT(req: Request) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { receiptId } = await req.json();

    if (!receiptId) {
      return NextResponse.json(
        { message: "Не вказано ID чека" },
        { status: 400 }
      );
    }

    // SQL-запит через Prisma
    await prisma.$executeRawUnsafe(
      `UPDATE receipt SET receipt_type = 'Продаж' WHERE receipt_id = $1`,
      receiptId
    );

    return NextResponse.json({ message: "Чек успішно оновлено до 'Продаж'" });
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

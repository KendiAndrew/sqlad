import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

export async function DELETE(
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

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Некоректний ID" }, { status: 400 });
  }

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM invoice WHERE invoice_id = ${id}
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

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Некоректний ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { completed_at, status } = body;

    if (!completed_at || !status || String(status).trim() === "") {
      return NextResponse.json(
        { message: "Обов’язкові поля: completed_at, status" },
        { status: 400 }
      );
    }

    const result = await prisma.$executeRaw`
      UPDATE invoice
      SET completed_at = ${new Date(completed_at)}, status = ${status}
      WHERE invoice_id = ${id}
    `;

    if (result === 0) {
      return NextResponse.json(
        { message: "Накладну не знайдено" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Накладну оновлено успішно" },
      { status: 200 }
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
      { message: "Помилка при видаленні категорії" },
      { status: 500 }
    );
  }
}

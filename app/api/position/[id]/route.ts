import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const position = parseInt(id);

    // Видаляємо лише саму категорію
    await prisma.$executeRaw`
      DELETE FROM "position"
      WHERE "position_id" = ${position}
    `;

    return NextResponse.json({
      message: "Посаду успішно видалено",
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

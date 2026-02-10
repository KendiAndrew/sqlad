import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userSession = await getServerSession(authOptions);

  if (!userSession) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaByRole(userSession.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Некоректний ID" }, { status: 400 });
  }

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM provider WHERE provider_id = ${id}
    `;

    return NextResponse.json({
      message: "Постачальника успішно видалено",
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

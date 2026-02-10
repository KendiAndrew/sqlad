import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userSession = await getServerSession(authOptions);

    if (!userSession) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(userSession.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ message: "Невірний ID" }, { status: 400 });
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM products_for_receipt WHERE products_for_receipt_id = $1`,
      id
    );

    return NextResponse.json({ message: "Продукт успішно видалено" });
  } catch (error) {
    console.error("DELETE /pfr/[id] error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2010") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(
      { message: "Помилка при видаленні продукту" },
      { status: 500 }
    );
  }
}

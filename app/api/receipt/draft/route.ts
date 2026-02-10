import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

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

    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { message: "Не вказано employee_id" },
        { status: 400 }
      );
    }

    // Шукаємо існуючу чернетку за допомогою SQL
    const draftReceipt: any[] = await prisma.$queryRaw`
      SELECT * FROM receipt 
      WHERE receipt_type = 'Чернетка' AND employee_id = ${Number(employeeId)}
      LIMIT 1;
    `;

    let receiptId;

    if (draftReceipt.length > 0) {
      // Якщо знайшли — беремо її ID
      receiptId = draftReceipt[0].receipt_id;
    } else {
      // Інакше створюємо новий запис
      const newReceipt: any[] = await prisma.$queryRaw`
        INSERT INTO receipt (receipt_type, receipt_create_date, employee_id)
        VALUES ('Чернетка', NOW(), ${Number(employeeId)})
        RETURNING receipt_id;
      `;
      receiptId = newReceipt[0].receipt_id;
    }

    return NextResponse.json({
      receiptId,
      message: "Чернетку знайдено або створено",
    });
  } catch (error) {
    console.error("POST /receipt error:", error);

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
      { message: "Помилка при додаванні чека" },
      { status: 500 }
    );
  }
}

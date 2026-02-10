// app/api/employee/[id]/route.ts
import { prisma } from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Некоректний ID" }, { status: 400 });
  }

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM employee WHERE employee_id = ${id}
    `;

    return NextResponse.json({
      message: "Працівника успішно видалено",
      rowsAffected: result,
    });
  } catch (error) {
    console.error("Помилка при видаленні працівника:", error);
    return NextResponse.json(
      { message: "Не вдалося видалити працівника" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: "Некоректний ID" }, { status: 400 });
  }

  const body = await req.json();
  const {
    last_name,
    first_name,
    middle_name,
    phone_number,
    email,
    hire_date,
    dismissal_date,
    position_name,
    password,
  } = body;

  try {
    // Знайти position_id
    const position: any = await prisma.$queryRawUnsafe(
      `
      SELECT position_id FROM position
      WHERE position_name = $1
      LIMIT 1
    `,
      position_name
    );

    if (!position || position.length === 0) {
      return NextResponse.json(
        { message: "Посаду не знайдено" },
        { status: 400 }
      );
    }

    const position_id = position[0].position_id;

    // Оновити працівника
    await prisma.$executeRawUnsafe(
      `
      UPDATE employee
      SET
        last_name = $1,
        first_name = $2,
        middle_name = $3,
        phone_number = $4,
        email = $5,
        hire_date = $6,
        dismissal_date = $7,
        position_id = $8,
        password = $10
      WHERE employee_id = $9
    `,
      last_name,
      first_name,
      middle_name,
      phone_number,
      email,
      new Date(hire_date),
      dismissal_date ? new Date(dismissal_date) : null,
      position_id,
      id,
      password
    );

    return NextResponse.json({ message: "Працівника оновлено успішно" });
  } catch (error) {
    console.error("Помилка при оновленні працівника:", error);
    return NextResponse.json({ message: "Помилка сервера" }, { status: 500 });
  }
}

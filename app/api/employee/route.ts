import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

import { getPrismaByRole, prismaDefault } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";

// 🔁 Вибір Prisma-клієнта залежно від ролі

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaByRole(session.user.role);
  if (!prisma) {
    return NextResponse.json({ message: "Invalid DB role" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "last_name";
  const search = searchParams.get("search")?.trim() ?? "";

  const validTypes = [
    "last_name",
    "phone_number",
    "email",
    "position_name",
    "first_name",
  ];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { message: "Некоректний тип пошуку" },
      { status: 400 }
    );
  }

  const query = `
    SELECT 
      e.employee_id,
      e.first_name,
      e.last_name,
      e.middle_name,
      e.phone_number,
      e.email,
      e.hire_date,
      e.dismissal_date,
      e.position_id,
      e.db_role,
      p.position_name
    FROM employee e
    JOIN position p ON e.position_id = p.position_id
    WHERE LOWER(${
      type === "position_name" ? "p.position_name" : `e.${type}`
    }) LIKE LOWER($1)
    ORDER BY e.employee_id ASC
  `;

  try {
    const result = await prisma.$queryRawUnsafe(query, `%${search}%`);
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
    const {
      first_name,
      last_name,
      middle_name,
      phone_number,
      password,
      email,
      hire_date,
      position_id,
      position_name, // наприклад, "Адміністратор" або "Касир"
    } = await req.json();

    // Визначаємо роль за назвою посади
    const role =
      position_name === "Адміністратор" ? "admin_role" : "seller_role";

    // 🔐 Використовуємо суперкористувача для створення нового працівника
    await prismaDefault.$executeRawUnsafe(
      `
      INSERT INTO employee 
        (first_name, last_name, middle_name, phone_number, email, password, hire_date, position_id, db_role)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      first_name,
      last_name,
      middle_name,
      phone_number,
      email,
      password,
      new Date(hire_date),
      Number(position_id),
      role
    );

    // 🧑‍💻 Створення PostgreSQL-юзера
    await prismaDefault.$executeRawUnsafe(`
    DO $$
    DECLARE 
      user_email text := '${email}';
      user_password text := '${password}';
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = user_email) THEN
        EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L;', user_email, user_password);
      END IF;
    END
    $$;
  `);

    // 🎓 Призначення рольової групи (admin_role або seller_role)
    await prismaDefault.$executeRawUnsafe(`GRANT ${role} TO "${email}";`);

    return NextResponse.json({
      message: "Працівника та роль створено успішно",
    });
  } catch (error) {
    console.error("POST /employee error:", error);

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
      { message: "Помилка при створенні працівника" },
      { status: 500 }
    );
  }
}

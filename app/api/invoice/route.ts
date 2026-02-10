import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPrismaByRole } from "@/lib/prismaClient";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(session.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "invoice_id";
    const search = searchParams.get("search")?.trim() ?? "";

    const validTypes = [
      "invoice_id",
      "provider_name",
      "employee_name",
      "created_at",
      "invoice_type",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: "Некоректний тип пошуку" },
        { status: 400 }
      );
    }

    let condition = "";
    let param = `%${search}%`;

    switch (type) {
      case "provider_name":
        condition = `LOWER(CONCAT(COALESCE(pr.first_name, ''), ' ', COALESCE(pr.last_name, ''))) LIKE LOWER($1)`;
        break;
      case "employee_name":
        condition = `LOWER(CONCAT(e.first_name, ' ', e.last_name)) LIKE LOWER($1)`;
        break;
      case "created_at":
        condition = `TO_CHAR(i.created_at, 'YYYY-MM-DD') LIKE $1`;
        break;
      case "invoice_type":
        condition = `LOWER(i.invoice_type::text) LIKE LOWER($1)`;
        break;
      default:
        condition = `CAST(i.${type} AS TEXT) LIKE $1`;
    }

    const query = `
      SELECT 
        i.invoice_id,
        i.provider_id,
        i.employee_id,
        i.created_at,
        i.completed_at,
        i.status,
        i.invoice_type,
        pr.first_name AS provider_first_name,
        pr.last_name AS provider_last_name,
        e.first_name AS employee_first_name,
        e.last_name AS employee_last_name
      FROM invoice i
      LEFT JOIN provider pr ON i.provider_id = pr.provider_id
      JOIN employee e ON i.employee_id = e.employee_id
      WHERE ${condition}
      ORDER BY i.invoice_id ASC
    `;

    const result = await prisma.$queryRawUnsafe(query, param);
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
      { message: "Помилка при видаленні накладної" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaByRole(session.user.role);
    if (!prisma) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { provider_id, invoice_type } = body;

    if (!invoice_type) {
      return NextResponse.json(
        { message: "Тип накладної є обов'язковим" },
        { status: 400 }
      );
    }

    // Отримуємо ID працівника із сесії
    const employee_id = Number(session.user.id);
    if (!employee_id) {
      return NextResponse.json(
        { message: "Не знайдено ID працівника в сесії" },
        { status: 400 }
      );
    }

    let query: string;
    let params: any[];

    if (provider_id !== null && provider_id !== "") {
      query = `
        INSERT INTO invoice (employee_id, provider_id, invoice_type, created_at, completed_at, status)
        VALUES ($1, $2, $3::invoice_type_enum, NOW(), NULL, 'Виконується')
      `;
      params = [employee_id, provider_id, invoice_type];
    } else {
      query = `
        INSERT INTO invoice (employee_id, invoice_type, created_at, completed_at, status)
        VALUES ($1, $2::invoice_type_enum, NOW(), NULL, 'Виконується')
      `;
      params = [employee_id, invoice_type];
    }

    await prisma.$executeRawUnsafe(query, ...params);

    return NextResponse.json(
      { message: "Накладну створено успішно" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /invoice error:", error);

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
      { message: "Помилка при створенні накладної" },
      { status: 500 }
    );
  }
}

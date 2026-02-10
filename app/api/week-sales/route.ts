import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { getPrismaByRole } from "@/lib/prismaClient";
import { Prisma } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

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

    const results = await prisma.$queryRaw<
      Array<{
        week_start: Date;
        avg_receipt_total: number;
        difference_with_previous_week: number | null;
      }>
    >(Prisma.sql`
      WITH weekly_data AS (
        SELECT 
          DATE_TRUNC('week', r.receipt_create_date) AS week_start,
          ROUND(SUM(pfr.quantity * pfi.product_price) / COUNT(DISTINCT r.receipt_id), 2) AS avg_receipt_total
        FROM receipt r
        JOIN products_for_receipt pfr ON r.receipt_id = pfr.receipt_id
        JOIN products_for_invoice pfi ON pfr.product_id = pfi.product_id
        WHERE r.receipt_create_date >= '2025-04-01'
        GROUP BY week_start
      )
      SELECT 
        week_start,
        avg_receipt_total,
        ROUND(avg_receipt_total - LAG(avg_receipt_total) OVER (ORDER BY week_start), 2) AS difference_with_previous_week
      FROM weekly_data
      ORDER BY week_start;
    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /weekly-avg-receipts error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

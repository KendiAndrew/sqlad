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
      
        WITH product_sales AS (
            SELECT 
                p.product_id,
                p.product_name,
                p.category_id,
                SUM(pfr.quantity) AS total_sold
            FROM products p
            JOIN products_for_receipt pfr ON p.product_id = pfr.product_id
            GROUP BY p.product_id, p.product_name, p.category_id
        ),
        category_max_sales AS (
            SELECT 
                category_id,
                MAX(total_sold) AS max_sold
            FROM product_sales
            GROUP BY category_id
        )
        SELECT 
            c.category_name,
            ps.product_name,
            ps.total_sold
        FROM product_sales ps
        JOIN category_max_sales cms ON 
            ps.category_id = cms.category_id AND ps.total_sold = cms.max_sold
        JOIN categories c ON ps.category_id = c.category_id
        ORDER BY c.category_name;

    `);

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /weekly-avg-receipts error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

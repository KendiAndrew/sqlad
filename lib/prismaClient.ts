import { PrismaClient } from "@prisma/client";

export const prismaDefault = new PrismaClient(); // для авторизації

export const prismaSeller = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_SELLER,
    },
  },
});

export const prismaAdmin = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_ADMIN,
    },
  },
});

export const getPrismaByRole = (db_role: string) => {
  console.log(db_role);
  console.log("role from from");
  switch (db_role) {
    case "admin_role":
      return prismaAdmin;
    case "seller_role":
      return prismaSeller;
    default:
      return null;
  }
};

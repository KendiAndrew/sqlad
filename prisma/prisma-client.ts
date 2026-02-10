import { PrismaClient } from "@prisma/client";

const prismaClientnSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientnSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientnSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

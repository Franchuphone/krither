import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Single client for the whole app - dev hot reload would otherwise pile up pools. */
const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

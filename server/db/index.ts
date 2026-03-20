import { PrismaClient } from "../../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

/**
 * Creates a new Prisma client with Neon adapter
 * Only called at runtime — never at build time
 */
function createPrismaClient(): PrismaClient {
    const adapter = new PrismaNeon({
        connectionString: process.env.DATABASE_URL!,
    });
    return new PrismaClient({ adapter });
}

/**
 * Singleton Prisma client
 * Lazy proxy — client only created on first actual DB call
 * Safe at Vercel build time — no connection attempted on import
 *
 * @example
 * import { prisma } from "@/server/db"
 * const user = await prisma.user.findUnique(...)
 */
export const prisma = new Proxy({} as PrismaClient, {
    get(_, prop: string | symbol) {
        if (!global.prisma) {
            global.prisma = createPrismaClient();
        }
        const value = global.prisma[prop as keyof PrismaClient];
        if (typeof value === "function") {
            return value.bind(global.prisma);
        }
        return value;
    },
});
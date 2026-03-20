import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

/**
 * Seeds the database with initial data
 * Run with: npm run db:seed
 *
 * Seeds:
 * - 4 plans (free, pro, growth, enterprise)
 */
async function main() {
    console.log("🌱 Seeding database...");

    // ── Seed Plans ──
    const plans = [
        {
            name: "free" as const,
            features: {
                "ai.assistant": false,
                "audit.log": false,
                "api.keys": false,
                "custom.domain": false,
            },
            limits: {
                seats: 3,
                "api.keys": 0,
            },
            quotas: {
                "ai.queries": 0,
                exports: 5,
            },
        },
        {
            name: "pro" as const,
            features: {
                "ai.assistant": true,
                "audit.log": true,
                "api.keys": true,
                "custom.domain": false,
            },
            limits: {
                seats: 10,
                "api.keys": 5,
            },
            quotas: {
                "ai.queries": 500,
                exports: 50,
            },
        },
        {
            name: "growth" as const,
            features: {
                "ai.assistant": true,
                "audit.log": true,
                "api.keys": true,
                "custom.domain": true,
            },
            limits: {
                seats: 50,
                "api.keys": 20,
            },
            quotas: {
                "ai.queries": 2000,
                exports: 200,
            },
        },
        {
            name: "enterprise" as const,
            features: {
                "ai.assistant": true,
                "audit.log": true,
                "api.keys": true,
                "custom.domain": true,
            },
            limits: {
                seats: 999,
                "api.keys": 999,
            },
            quotas: {
                "ai.queries": 999999,
                exports: 999999,
            },
        },
    ];

    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
        console.log(`  ✅ Plan: ${plan.name}`);
    }

    console.log("\n✅ Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// ============================================
// HELPERS
// ============================================

async function hash(password: string) {
    return bcrypt.hash(password, 12);
}

// ============================================
// SEED DATA
// ============================================

/**
 * Seeds the database with initial data for development and Vercel testing.
 * Run with: npm run db:seed
 *
 * Seeds (all idempotent via upsert):
 * - 4 plans (free, pro, growth, enterprise)
 * - 1 org: Acme Inc (slug: "acme")
 * - 2 roles: admin (full permissions), viewer (dashboard.view only)
 * - 1 admin user:  admin@acme.com  / Admin1234!
 * - 1 viewer user: viewer@acme.com / Viewer1234!
 * - 2 org memberships (active)
 * - 1 Pro subscription for the org
 */
async function main() {
    console.log("🌱 Seeding database...");

    // ── Plans ──────────────────────────────────────────────────────────────
    const planData = [
        {
            name: "free" as const,
            features: {
                "ai.assistant": false,
                "audit.log": false,
                "api.keys": false,
                "custom.domain": false,
            },
            limits: { seats: 3, "api.keys": 0 },
            quotas: { "ai.queries": 0, exports: 5 },
        },
        {
            name: "pro" as const,
            features: {
                "ai.assistant": true,
                "audit.log": true,
                "api.keys": true,
                "custom.domain": false,
            },
            limits: { seats: 10, "api.keys": 5 },
            quotas: { "ai.queries": 500, exports: 50 },
        },
        quotas: {},
    },
    {
        name: "pro" as const,
        features: {
            scanning:  { multiScanner: { enabled: true }, scanSchedule: { enabled: true } },
            reporting: { evidenceCapturing: { enabled: true } },
            ai:        { chat: { enabled: true } },
            audit:     { export: { enabled: true } },
        },
        limits: {
            entitlements: { maxUsers: 10, maxScansPerDay: 50, retentionDays: 30, maxWorkers: 5 },
            limits:       { aiQueriesPerMonth: 100, exportFormats: ["csv", "pdf"] },
            access:       {
                scanners:     { mode: "all", exclude: [] },
                integrations: { mode: "all", exclude: [] },
            },
            limits: { seats: 50, "api.keys": 20 },
            quotas: { "ai.queries": 2000, exports: 200 },
        },
        quotas: {},
    },
];

// ============================================
// MAIN
// ============================================

async function main() {
    console.log("🌱 Seeding database...\n");

    // ── 1. Plans ──────────────────────────────────────────────────────────
    console.log("📦 Seeding plans...");

    const planMap: Record<string, string> = {};
    for (const plan of PLAN_SEED_DATA) {
        const created = await prisma.plan.upsert({
            where:  { name: plan.name },
            update: { features: plan.features, limits: plan.limits, quotas: plan.quotas },
            create: { name: plan.name, features: plan.features, limits: plan.limits, quotas: plan.quotas },
        });
        planMap[plan.name] = created.id;
        console.log(`  ✅ Plan: ${plan.name}`);
    }

    // ── 2. Orgs ───────────────────────────────────────────────────────────
    console.log("\n🏢 Seeding organisations...");

    const SEED_ORGS = [
        { name: "Acme Corp",  slug: "acme",    domain: "acme.com",   timezone: "America/New_York",    plan: "pro"    as const },
        { name: "Globex Inc", slug: "globex",  domain: "globex.com", timezone: "America/Los_Angeles", plan: "growth" as const },
        { name: "Initech",    slug: "initech", domain: null,         timezone: "UTC",                 plan: "free"   as const },
    ];

    // ── 3. Users ─────────────────────────────────────────────────────────
    console.log("\n👤 Seeding users...");

    const hashedPassword = await hash("Password123!");
    const userMap: Record<string, string> = {};

    for (const userData of SEED_USERS) {
        const user = await prisma.user.upsert({
            where:  { email: userData.email },
            update: { name: userData.name, isVerified: true },
            create: {
                name:       userData.name,
                email:      userData.email,
                password:   hashedPassword,
                isVerified: true,
                lastLogin:  new Date(),
            },
            limits: { seats: 999, "api.keys": 999 },
            quotas: { "ai.queries": 999999, exports: 999999 },
        },
    ];

    const plans: Record<string, { id: string }> = {};
    for (const plan of planData) {
        const p = await prisma.plan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
        plans[plan.name] = p;
        console.log(`  ✅ Plan: ${plan.name}`);
    }

    // ── Org ────────────────────────────────────────────────────────────────
    // We need a placeholder createdById — create admin user first, then link.
    // Use a two-pass approach inside a transaction to avoid circular dependency.

    const adminPassword = await bcrypt.hash("Admin1234!", 12);
    const viewerPassword = await bcrypt.hash("Viewer1234!", 12);

    // Upsert admin user (isVerified: true so they can log in immediately)
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@acme.com" },
        update: {
            name: "Acme Admin",
            password: adminPassword,
            isVerified: true,
        },
        create: {
            name: "Acme Admin",
            email: "admin@acme.com",
            password: adminPassword,
            isVerified: true,
        },
    });
    console.log(`  ✅ User: admin@acme.com`);

    // Upsert viewer user
    const viewerUser = await prisma.user.upsert({
        where: { email: "viewer@acme.com" },
        update: {
            name: "Acme Viewer",
            password: viewerPassword,
            isVerified: true,
        },
        create: {
            name: "Acme Viewer",
            email: "viewer@acme.com",
            password: viewerPassword,
            isVerified: true,
        },
    });
    console.log(`  ✅ User: viewer@acme.com`);

    // Upsert org (slug must be unique)
    const org = await prisma.org.upsert({
        where: { slug: "acme" },
        update: { name: "Acme Inc", timezone: "UTC" },
        create: {
            name: "Acme Inc",
            slug: "acme",
            timezone: "UTC",
            createdById: adminUser.id,
        },
    });
    console.log(`  ✅ Org: ${org.name} (slug: ${org.slug})`);

    // ── Roles ──────────────────────────────────────────────────────────────
    const adminPermissions = [
        "dashboard.view",
        "dashboard.edit",
        "iam.view",
        "iam.invite",
        "iam.remove",
        "iam.role.assign",
        "billing.view",
        "billing.manage",
        "settings.view",
        "settings.edit",
    ];

    const viewerPermissions = ["dashboard.view"];

    const adminRole = await prisma.role.upsert({
        where: { orgId_name: { orgId: org.id, name: "admin" } },
        update: { permissions: adminPermissions },
        create: {
            name: "admin",
            orgId: org.id,
            permissions: adminPermissions,
            isDefault: false,
        },
    });
    console.log(`  ✅ Role: admin`);

    const viewerRole = await prisma.role.upsert({
        where: { orgId_name: { orgId: org.id, name: "viewer" } },
        update: { permissions: viewerPermissions },
        create: {
            name: "viewer",
            orgId: org.id,
            permissions: viewerPermissions,
            isDefault: true,
        },
    });
    console.log(`  ✅ Role: viewer`);

    // ── Memberships ────────────────────────────────────────────────────────
    await prisma.orgMember.upsert({
        where: { userId_orgId: { userId: adminUser.id, orgId: org.id } },
        update: { status: "active", roleId: adminRole.id },
        create: {
            userId: adminUser.id,
            orgId: org.id,
            roleId: adminRole.id,
            status: "active",
        },
    });
    console.log(`  ✅ Membership: admin@acme.com → admin role`);

    await prisma.orgMember.upsert({
        where: { userId_orgId: { userId: viewerUser.id, orgId: org.id } },
        update: { status: "active", roleId: viewerRole.id },
        create: {
            userId: viewerUser.id,
            orgId: org.id,
            roleId: viewerRole.id,
            status: "active",
        },
    });
    console.log(`  ✅ Membership: viewer@acme.com → viewer role`);

    // ── Subscription ───────────────────────────────────────────────────────
    // Org is on Pro plan
    await prisma.subscription.upsert({
        where: { orgId: org.id },
        update: { planId: plans["pro"].id, status: "active" },
        create: {
            orgId: org.id,
            planId: plans["pro"].id,
            status: "active",
        },
    });
    console.log(`  ✅ Subscription: Acme Inc → Pro plan`);

    console.log("\n✅ Database seeded successfully!");
    console.log("\nTest credentials:");
    console.log("  Admin:  admin@acme.com  / Admin1234!");
    console.log("  Viewer: viewer@acme.com / Viewer1234!");
    console.log("  Org slug: acme");
    console.log("  Dashboard: /acme/dashboard");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

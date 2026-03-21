import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

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
 * Demo users — each user belongs to one or more orgs.
 * All passwords are: Password123!
 */
const SEED_USERS = [
    {
        name: "Alice Admin",
        email: "alice@acme.com",
        role: "super_admin",
    },
    {
        name: "Bob Member",
        email: "bob@acme.com",
        role: "member",
    },
    {
        name: "Carol Viewer",
        email: "carol@acme.com",
        role: "viewer",
    },
    {
        // Multi-org user — belongs to both Acme and Globex
        name: "Dave Multi",
        email: "dave@multi.com",
        role: "admin",
    },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [
        "dashboard.view",
        "dashboard.edit",
        "iam.view",
        "iam.manage",
        "iam.invite",
        "iam.remove",
        "iam.role.assign",
        "billing.view",
        "billing.manage",
        "settings.view",
        "settings.edit",
        "settings.manage",
        "audit.view",
    ],
    admin: [
        "dashboard.view",
        "dashboard.edit",
        "iam.view",
        "iam.manage",
        "iam.invite",
        "iam.remove",
        "iam.role.assign",
        "billing.view",
        "settings.view",
        "settings.edit",
        "settings.manage",
        "audit.view",
    ],
    member: [
        "dashboard.view",
        "settings.view",
    ],
    viewer: [
        "dashboard.view",
    ],
};

// ============================================
// MAIN
// ============================================

async function main() {
    console.log("🌱 Seeding database...\n");

    // ── 1. Plans ──────────────────────────────────────────────────────────
    console.log("📦 Seeding plans...");

    const plans = [
        {
            name: "free" as const,
            features: { "ai.assistant": false, "audit.log": false, "api.keys": false, "custom.domain": false },
            limits: { seats: 3, "api.keys": 0 },
            quotas: { "ai.queries": 0, exports: 5 },
        },
        {
            name: "pro" as const,
            features: { "ai.assistant": true, "audit.log": true, "api.keys": true, "custom.domain": false },
            limits: { seats: 10, "api.keys": 5 },
            quotas: { "ai.queries": 500, exports: 50 },
        },
        {
            name: "growth" as const,
            features: { "ai.assistant": true, "audit.log": true, "api.keys": true, "custom.domain": true },
            limits: { seats: 50, "api.keys": 20 },
            quotas: { "ai.queries": 2000, exports: 200 },
        },
        {
            name: "enterprise" as const,
            features: { "ai.assistant": true, "audit.log": true, "api.keys": true, "custom.domain": true },
            limits: { seats: 999, "api.keys": 999 },
            quotas: { "ai.queries": 999999, exports: 999999 },
        },
    ];

    const planMap: Record<string, string> = {};
    for (const plan of plans) {
        const created = await prisma.plan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
        planMap[plan.name] = created.id;
        console.log(`  ✅ Plan: ${plan.name}`);
    }

    // ── 2. Orgs ───────────────────────────────────────────────────────────
    console.log("\n🏢 Seeding organisations...");

    const SEED_ORGS = [
        {
            name: "Acme Corp",
            slug: "acme",
            domain: "acme.com",
            timezone: "America/New_York",
            plan: "pro" as const,
        },
        {
            name: "Globex Inc",
            slug: "globex",
            domain: "globex.com",
            timezone: "America/Los_Angeles",
            plan: "growth" as const,
        },
        {
            name: "Initech",
            slug: "initech",
            domain: null,
            timezone: "UTC",
            plan: "free" as const,
        },
    ];

    // We need a placeholder createdById — will be updated when users are created
    // First create a system user if needed, or create orgs after users
    // Strategy: create users first, then orgs, then link them

    // ── 3. Users ─────────────────────────────────────────────────────────
    console.log("\n👤 Seeding users...");

    const hashedPassword = await hash("Password123!");
    const userMap: Record<string, string> = {};

    for (const userData of SEED_USERS) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                name: userData.name,
                isVerified: true,
            },
            create: {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                isVerified: true,
                lastLogin: new Date(),
            },
        });
        userMap[userData.email] = user.id;
        console.log(`  ✅ User: ${userData.name} <${userData.email}>`);
    }

    // Alice is the creator for all orgs
    const aliceId = userMap["alice@acme.com"];

    // ── 4. Create Orgs ────────────────────────────────────────────────────
    console.log("\n🏢 Creating orgs...");

    const orgMap: Record<string, string> = {};

    for (const orgData of SEED_ORGS) {
        const org = await prisma.org.upsert({
            where: { slug: orgData.slug },
            update: {
                name: orgData.name,
                domain: orgData.domain,
                timezone: orgData.timezone,
            },
            create: {
                name: orgData.name,
                slug: orgData.slug,
                domain: orgData.domain,
                timezone: orgData.timezone,
                createdById: aliceId,
            },
        });
        orgMap[orgData.slug] = org.id;
        console.log(`  ✅ Org: ${orgData.name} (/${orgData.slug})`);

        // Create subscription for this org
        await prisma.subscription.upsert({
            where: { orgId: org.id },
            update: { status: "active" },
            create: {
                orgId: org.id,
                planId: planMap[orgData.plan],
                status: "active",
            },
        });
        console.log(`     💳 Subscription: ${orgData.plan}`);
    }

    // ── 5. Roles + Memberships ────────────────────────────────────────────
    console.log("\n🔐 Seeding roles and memberships...");

    /**
     * Membership map:
     * Acme Corp   → Alice (super_admin), Bob (member), Carol (viewer), Dave (admin)
     * Globex Inc  → Dave (admin)
     * Initech     → Alice (super_admin), Bob (member)
     */
    const MEMBERSHIPS: Array<{
        orgSlug: string;
        userEmail: string;
        role: keyof typeof ROLE_PERMISSIONS;
    }> = [
        // Acme Corp
        { orgSlug: "acme", userEmail: "alice@acme.com",  role: "super_admin" },
        { orgSlug: "acme", userEmail: "bob@acme.com",    role: "member"      },
        { orgSlug: "acme", userEmail: "carol@acme.com",  role: "viewer"      },
        { orgSlug: "acme", userEmail: "dave@multi.com",  role: "admin"       },
        // Globex Inc — Dave belongs here too (multi-org demo)
        { orgSlug: "globex", userEmail: "dave@multi.com",  role: "admin"     },
        { orgSlug: "globex", userEmail: "alice@acme.com",  role: "super_admin"},
        // Initech
        { orgSlug: "initech", userEmail: "alice@acme.com", role: "super_admin"},
        { orgSlug: "initech", userEmail: "bob@acme.com",   role: "member"    },
    ];

    for (const m of MEMBERSHIPS) {
        const orgId = orgMap[m.orgSlug];
        const userId = userMap[m.userEmail];

        // Upsert role for this org+name combo
        const role = await prisma.role.upsert({
            where: { orgId_name: { orgId, name: m.role } },
            update: { permissions: ROLE_PERMISSIONS[m.role] },
            create: {
                name: m.role,
                orgId,
                permissions: ROLE_PERMISSIONS[m.role],
                isDefault: m.role === "member",
            },
        });

        // Upsert org membership
        await prisma.orgMember.upsert({
            where: { userId_orgId: { userId, orgId } },
            update: { roleId: role.id, status: "active" },
            create: {
                userId,
                orgId,
                roleId: role.id,
                status: "active",
            },
        });

        console.log(`  ✅ ${m.userEmail} → ${m.orgSlug} as ${m.role}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log(`
╔════════════════════════════════════════════╗
║           🌱 Seed complete!                ║
╠════════════════════════════════════════════╣
║  All passwords: Password123!               ║
╠════════════════════════════════════════════╣
║  alice@acme.com   → acme, globex, initech  ║
║  bob@acme.com     → acme, initech          ║
║  carol@acme.com   → acme (viewer)          ║
║  dave@multi.com   → acme, globex (admin)   ║
╠════════════════════════════════════════════╣
║  Orgs                                      ║
║  /acme    → Pro plan                       ║
║  /globex  → Growth plan                    ║
║  /initech → Free plan                      ║
╚════════════════════════════════════════════╝
`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

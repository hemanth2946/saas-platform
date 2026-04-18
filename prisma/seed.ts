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
        name:  "Alice Admin",
        email: "alice@acme.com",
        role:  "super_admin",
    },
    {
        name:  "Bob Member",
        email: "bob@acme.com",
        role:  "member",
    },
    {
        name:  "Carol Viewer",
        email: "carol@acme.com",
        role:  "viewer",
    },
    {
        // Multi-org user — belongs to both Acme and Globex
        name:  "Dave Multi",
        email: "dave@multi.com",
        role:  "admin",
    },
] as const;

// ── Quick Role permissions ─────────────────────────────────────────────────────

const QUICK_ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [
        "dashboard.view", "dashboard.edit",
        "iam.view", "iam.manage", "iam.invite", "iam.remove", "iam.role.assign",
        "billing.view", "billing.manage",
        "settings.view", "settings.edit", "settings.manage",
        "audit.view",
        "scan.view", "scan.create",
    ],
    admin: [
        "dashboard.view", "dashboard.edit",
        "iam.view", "iam.manage", "iam.invite", "iam.remove", "iam.role.assign",
        "billing.view",
        "settings.view", "settings.edit", "settings.manage",
        "audit.view",
        "scan.view", "scan.create",
    ],
    member: [
        "dashboard.view",
        "scan.view", "scan.create",
    ],
    viewer: [
        "dashboard.view",
        "scan.view",
    ],
};

// ── Service-based role definitions ────────────────────────────────────────────

interface ServiceRoleDef {
    name:        string;
    serviceKey:  string;
    description: string;
    permissions: string[];
}

const SERVICE_ROLES: ServiceRoleDef[] = [
    // Risk Overview
    {
        name:        "Risk Overview - View",
        serviceKey:  "risk-overview",
        description: "View risk overview dashboard",
        permissions: ["dashboard.view"],
    },
    {
        name:        "Risk Overview - Export",
        serviceKey:  "risk-overview",
        description: "View and export risk overview data",
        permissions: ["dashboard.view", "audit.view"],
    },
    // Network Perimeter
    {
        name:        "Network Perimeter - View",
        serviceKey:  "network-perimeter",
        description: "View network perimeter scans",
        permissions: ["scan.view"],
    },
    {
        name:        "Network Perimeter - Manage",
        serviceKey:  "network-perimeter",
        description: "View and manage network perimeter scans",
        permissions: ["scan.view", "scan.create"],
    },
    // Cloud Workload
    {
        name:        "Cloud Workload - View",
        serviceKey:  "cloud-workload",
        description: "View cloud workload scans",
        permissions: ["scan.view"],
    },
    {
        name:        "Cloud Workload - Manage",
        serviceKey:  "cloud-workload",
        description: "View and manage cloud workload scans",
        permissions: ["scan.view", "scan.create"],
    },
    // Code Security
    {
        name:        "Code Security - View",
        serviceKey:  "code-security",
        description: "View code security scans",
        permissions: ["scan.view"],
    },
    {
        name:        "Code Security - Manage",
        serviceKey:  "code-security",
        description: "View and manage code security scans",
        permissions: ["scan.view", "scan.create"],
    },
    // Cloud Security Posture
    {
        name:        "Cloud Security Posture - View",
        serviceKey:  "cloud-security-posture",
        description: "View cloud security posture",
        permissions: ["scan.view"],
    },
    {
        name:        "Cloud Security Posture - Export",
        serviceKey:  "cloud-security-posture",
        description: "View and export cloud security posture data",
        permissions: ["scan.view", "audit.view"],
    },
    {
        name:        "Cloud Security Posture - Manage",
        serviceKey:  "cloud-security-posture",
        description: "View, export, and manage cloud security posture",
        permissions: ["scan.view", "scan.create", "audit.view"],
    },
];

// ── Plan values ──────────────────────────────────────────────────────────────

const PLAN_SEED_DATA = [
    {
        name: "free" as const,
        features: {
            scanning:  { multiScanner: { enabled: false }, scanSchedule: { enabled: false } },
            reporting: { evidenceCapturing: { enabled: false } },
            ai:        { chat: { enabled: false } },
            audit:     { export: { enabled: false } },
        },
        limits: {
            entitlements: { maxUsers: 2, maxScansPerDay: 5, retentionDays: 7, maxWorkers: 1 },
            limits:       { aiQueriesPerMonth: 0, exportFormats: ["csv"] },
            access:       {
                scanners:     { mode: "limited", exclude: [] },
                integrations: { mode: "limited", exclude: [] },
            },
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
        },
        quotas: {},
    },
    {
        name: "growth" as const,
        features: {
            scanning:  { multiScanner: { enabled: true }, scanSchedule: { enabled: true } },
            reporting: { evidenceCapturing: { enabled: true } },
            ai:        { chat: { enabled: true } },
            audit:     { export: { enabled: true } },
        },
        limits: {
            entitlements: { maxUsers: null, maxScansPerDay: null, retentionDays: 90, maxWorkers: 20 },
            limits:       { aiQueriesPerMonth: null, exportFormats: ["csv", "pdf", "json"] },
            access:       {
                scanners:     { mode: "all", exclude: [] },
                integrations: { mode: "all", exclude: [] },
            },
        },
        quotas: {},
    },
    {
        name: "enterprise" as const,
        features: {
            scanning:  { multiScanner: { enabled: true }, scanSchedule: { enabled: true } },
            reporting: { evidenceCapturing: { enabled: true } },
            ai:        { chat: { enabled: true } },
            audit:     { export: { enabled: true } },
        },
        limits: {
            entitlements: { maxUsers: null, maxScansPerDay: null, retentionDays: 365, maxWorkers: 100 },
            limits:       { aiQueriesPerMonth: null, exportFormats: ["csv", "pdf", "json"] },
            access:       {
                scanners:     { mode: "all", exclude: [] },
                integrations: { mode: "all", exclude: [] },
            },
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
        });
        userMap[userData.email] = user.id;
        console.log(`  ✅ User: ${userData.name} <${userData.email}>`);
    }

    // Alice is the creator for all orgs
    const aliceId = userMap["alice@acme.com"]!;

    // ── 4. Create Orgs ────────────────────────────────────────────────────
    console.log("\n🏢 Creating orgs...");

    const orgMap: Record<string, string> = {};

    for (const orgData of SEED_ORGS) {
        const org = await prisma.org.upsert({
            where:  { slug: orgData.slug },
            update: { name: orgData.name, domain: orgData.domain, timezone: orgData.timezone },
            create: {
                name:        orgData.name,
                slug:        orgData.slug,
                domain:      orgData.domain,
                timezone:    orgData.timezone,
                createdById: aliceId,
            },
        });
        orgMap[orgData.slug] = org.id;
        console.log(`  ✅ Org: ${orgData.name} (/${orgData.slug})`);

        await prisma.subscription.upsert({
            where:  { orgId: org.id },
            update: { status: "active" },
            create: { orgId: org.id, planId: planMap[orgData.plan]!, status: "active" },
        });
        console.log(`     💳 Subscription: ${orgData.plan}`);
    }

    // ── 5. Quick Roles + Memberships ──────────────────────────────────────
    console.log("\n🔐 Seeding quick roles and memberships...");

    /**
     * Membership map:
     * Acme Corp   → Alice (super_admin), Bob (member), Carol (viewer), Dave (admin)
     * Globex Inc  → Dave (admin), Alice (super_admin)
     * Initech     → Alice (super_admin), Bob (member)
     */
    const MEMBERSHIPS: Array<{
        orgSlug:   string;
        userEmail: string;
        role:      keyof typeof QUICK_ROLE_PERMISSIONS;
    }> = [
        { orgSlug: "acme",    userEmail: "alice@acme.com",  role: "super_admin" },
        { orgSlug: "acme",    userEmail: "bob@acme.com",    role: "member"      },
        { orgSlug: "acme",    userEmail: "carol@acme.com",  role: "viewer"      },
        { orgSlug: "acme",    userEmail: "dave@multi.com",  role: "admin"       },
        { orgSlug: "globex",  userEmail: "dave@multi.com",  role: "admin"       },
        { orgSlug: "globex",  userEmail: "alice@acme.com",  role: "super_admin" },
        { orgSlug: "initech", userEmail: "alice@acme.com",  role: "super_admin" },
        { orgSlug: "initech", userEmail: "bob@acme.com",    role: "member"      },
    ];

    // Track created quick roles: orgSlug+roleName → roleId
    const quickRoleMap: Record<string, string> = {};

    for (const m of MEMBERSHIPS) {
        const orgId  = orgMap[m.orgSlug]!;
        const userId = userMap[m.userEmail]!;

        // Upsert Quick Role
        const role = await prisma.role.upsert({
            where:  { orgId_name: { orgId, name: m.role } },
            update: { permissions: QUICK_ROLE_PERMISSIONS[m.role], type: "QUICK" },
            create: {
                name:        m.role,
                orgId,
                permissions: QUICK_ROLE_PERMISSIONS[m.role],
                isDefault:   m.role === "member",
                type:        "QUICK",
            },
        });
        quickRoleMap[`${m.orgSlug}:${m.role}`] = role.id;

        // Upsert OrgMember (for status tracking)
        await prisma.orgMember.upsert({
            where:  { userId_orgId: { userId, orgId } },
            update: { roleId: role.id, status: "active" },
            create: { userId, orgId, roleId: role.id, status: "active" },
        });

        // Upsert UserRole (many-to-many)
        await prisma.userRole.upsert({
            where:  { userId_roleId: { userId, roleId: role.id } },
            update: {},
            create: { userId, roleId: role.id },
        });

        console.log(`  ✅ ${m.userEmail} → ${m.orgSlug} as ${m.role}`);
    }

    // ── 6. Service-Based Roles (for each org) ────────────────────────────
    console.log("\n🔧 Seeding service-based roles...");

    // Track service roles: orgSlug+roleName → roleId
    const serviceRoleMap: Record<string, string> = {};

    for (const orgSlug of ["acme", "globex", "initech"]) {
        const orgId = orgMap[orgSlug]!;

        for (const srDef of SERVICE_ROLES) {
            const role = await prisma.role.upsert({
                where:  { orgId_name: { orgId, name: srDef.name } },
                update: {
                    permissions: srDef.permissions,
                    type:        "SERVICE_BASED",
                    serviceKey:  srDef.serviceKey,
                    description: srDef.description,
                },
                create: {
                    name:        srDef.name,
                    orgId,
                    permissions: srDef.permissions,
                    type:        "SERVICE_BASED",
                    serviceKey:  srDef.serviceKey,
                    description: srDef.description,
                },
            });
            serviceRoleMap[`${orgSlug}:${srDef.name}`] = role.id;
        }
        console.log(`  ✅ Service roles for ${orgSlug}`);
    }

    // ── 7. Extra UserRole assignments (multi-role demo) ──────────────────
    console.log("\n👥 Adding extra UserRole assignments...");

    // Carol (viewer in acme) also gets Risk Overview - View service role
    const carolId          = userMap["carol@acme.com"]!;
    const acmeRiskViewRole = serviceRoleMap["acme:Risk Overview - View"];

    if (carolId && acmeRiskViewRole) {
        await prisma.userRole.upsert({
            where:  { userId_roleId: { userId: carolId, roleId: acmeRiskViewRole } },
            update: {},
            create: { userId: carolId, roleId: acmeRiskViewRole },
        });
        console.log("  ✅ carol@acme.com → Risk Overview - View (multi-role demo)");
    }

    // ── 8. Feature Flags ──────────────────────────────────────────────────
    console.log("\n🚩 Seeding feature flags...");

    const FLAG_SEEDS: Array<{
        orgSlug:        string;
        key:            string;
        enabled:        boolean;
        rolloutPercent: number;
    }> = [
        { orgSlug: "acme", key: "new-dashboard",      enabled: false, rolloutPercent: 0   },
        { orgSlug: "acme", key: "beta-scanner",       enabled: true,  rolloutPercent: 100 },
        { orgSlug: "acme", key: "ai-suggestions",     enabled: false, rolloutPercent: 0   },
        { orgSlug: "acme", key: "advanced-reporting", enabled: false, rolloutPercent: 0   },
        { orgSlug: "acme", key: "bulk-actions",       enabled: true,  rolloutPercent: 100 },

        { orgSlug: "globex", key: "new-dashboard",      enabled: false, rolloutPercent: 0   },
        { orgSlug: "globex", key: "beta-scanner",       enabled: true,  rolloutPercent: 100 },
        { orgSlug: "globex", key: "ai-suggestions",     enabled: false, rolloutPercent: 0   },
        { orgSlug: "globex", key: "advanced-reporting", enabled: false, rolloutPercent: 0   },
        { orgSlug: "globex", key: "bulk-actions",       enabled: true,  rolloutPercent: 100 },

        { orgSlug: "initech", key: "new-dashboard",      enabled: false, rolloutPercent: 0 },
        { orgSlug: "initech", key: "beta-scanner",       enabled: false, rolloutPercent: 0 },
        { orgSlug: "initech", key: "ai-suggestions",     enabled: false, rolloutPercent: 0 },
        { orgSlug: "initech", key: "advanced-reporting", enabled: false, rolloutPercent: 0 },
        { orgSlug: "initech", key: "bulk-actions",       enabled: false, rolloutPercent: 0 },
    ];

    for (const flag of FLAG_SEEDS) {
        const orgId = orgMap[flag.orgSlug]!;
        await prisma.featureFlag.upsert({
            where:  { orgId_key: { orgId, key: flag.key } },
            update: { enabled: flag.enabled, rolloutPercent: flag.rolloutPercent },
            create: { orgId, key: flag.key, enabled: flag.enabled, rolloutPercent: flag.rolloutPercent },
        });
        const status = flag.enabled ? "✅ ON " : "⭕ OFF";
        console.log(`  ${status} ${flag.orgSlug}/${flag.key}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                  🌱 Seed complete!                       ║
╠══════════════════════════════════════════════════════════╣
║  All passwords: Password123!                             ║
╠══════════════════════════════════════════════════════════╣
║  alice@acme.com   → acme, globex, initech (super_admin) ║
║  bob@acme.com     → acme, initech (member)              ║
║  carol@acme.com   → acme (viewer + risk-overview view)  ║
║  dave@multi.com   → acme, globex (admin)                ║
╠══════════════════════════════════════════════════════════╣
║  Quick roles: super_admin, admin, member, viewer         ║
║  Service roles: 11 roles across 5 services               ║
║  UserRole table: populated for all memberships           ║
╠══════════════════════════════════════════════════════════╣
║  Orgs                                                    ║
║  /acme    → Pro plan                                     ║
║  /globex  → Growth plan                                  ║
║  /initech → Free plan                                    ║
╠══════════════════════════════════════════════════════════╣
║  Feature Flags (acme/globex)                             ║
║  beta-scanner  → ON  (rollout: 100%)                    ║
║  bulk-actions  → ON  (rollout: 100%)                    ║
║  all others    → OFF                                     ║
╚══════════════════════════════════════════════════════════╝
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

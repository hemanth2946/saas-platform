import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lightweight liveness check polled by HealthPoller every 30 seconds.
 * Returns 200 as long as the Next.js server is reachable.
 * No auth, no DB — intentionally minimal.
 */
export async function GET() {
    return NextResponse.json(
        { status: "ok", ts: Date.now() },
        { status: 200 }
    );
}

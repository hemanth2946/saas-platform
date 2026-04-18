/**
 * lib/query/keys/iam.keys.ts
 *
 * TanStack Query key factory for the IAM domain.
 */

import type { GetUsersParams } from "@/lib/api/iam.service";

export const iamKeys = {
    /** Root key for all IAM queries. */
    all: ["iam"] as const,

    /** Users list — optionally scoped to filter params. */
    users:  (params?: GetUsersParams) =>
        params ? (["iam", "users", params] as const) : (["iam", "users"] as const),

    /** Roles list. */
    roles:  () => ["iam", "roles"] as const,

    /** A single invite by token. */
    invite: (token: string) => ["iam", "invite", token] as const,
};

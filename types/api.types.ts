// ============================================
// API RESPONSE TYPES
// Enterprise standard — used by Stripe, GitHub, Twilio
// Every backend route returns one of these shapes
// ============================================

// Success response
export type ApiResponse<T = unknown> = {
    success: true;
    message: string;
    data: T;
};

// Error response
export type ApiErrorResponse = {
    success: false;
    message: string;
    data: null;
    error: {
        code: string;                          // e.g. "UNAUTHORIZED", "VALIDATION_ERROR"
        fieldErrors?: Record<string, string[]>; // per-field validation errors
    };
};

// Union — what Axios actually returns
export type ApiResult<T = unknown> = ApiResponse<T> | ApiErrorResponse;

// Pagination wrapper — for list endpoints
export type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}>;

// Standard error codes — backend must use these exactly
export type ApiErrorCode =
    | "UNAUTHORIZED"          // 401 — not logged in
    | "FORBIDDEN"             // 403 — logged in but no permission
    | "NOT_FOUND"             // 404
    | "VALIDATION_ERROR"      // 422 — bad input
    | "CONFLICT"              // 409 — duplicate resource
    | "RATE_LIMITED"          // 429
    | "INTERNAL_ERROR"        // 500
    | "PLAN_LIMIT_EXCEEDED"   // 403 — feature gated by plan
    | "SEAT_LIMIT_EXCEEDED";  // 403 — org seat quota hit
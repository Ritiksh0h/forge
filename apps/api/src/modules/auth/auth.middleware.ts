// Auth-specific middleware for the auth module.
// Re-exports from global auth middleware for convenience,
// plus any auth-module-specific middleware.

export { requireAuth, signToken } from "../../middleware/auth.js";
export type { AuthPayload } from "../../middleware/auth.js";

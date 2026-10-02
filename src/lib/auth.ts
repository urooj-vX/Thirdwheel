import { AuthUser } from '@/types';

// Default demo user for development/testing when no session provider is configured
const DEFAULT_DEMO_USER: AuthUser = {
  user_id: 'usr_demo_default',
  email: 'demo@thirdwheel.app',
  name: 'Demo User',
};

let currentOverrideUser: AuthUser | null = null;

/**
 * Server-side authentication context abstraction.
 * Derived server-side; client payload user_id arguments must NEVER be trusted.
 */
export async function getAuthUser(): Promise<AuthUser> {
  if (currentOverrideUser) {
    return currentOverrideUser;
  }
  
  // Future auth integration (e.g. NextAuth, Clerk, custom session cookies) goes here
  return DEFAULT_DEMO_USER;
}

/**
 * Test/Demo helper to set active context in test suites.
 * MUST NOT be exposed to client payloads.
 */
export function setAuthUserOverride(user: AuthUser | null): void {
  currentOverrideUser = user;
}
